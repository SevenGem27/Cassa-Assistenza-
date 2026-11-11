// Prove del servizio delle iscrizioni (push-worker/worker.js) con uno spazio KV finto.
import test from 'node:test';
import assert from 'node:assert/strict';
import servizio from '../../push-worker/worker.js';

function kvFinto() {
  const m = new Map();
  return {
    m,
    async get(k) { return m.has(k) ? m.get(k) : null; },
    async put(k, v) { m.set(k, v); },
    async delete(k) { m.delete(k); },
    async list({ prefix, cursor }) { // due chiavi per pagina, per provare la paginazione
      const tutte = [...m.keys()].filter((k) => k.startsWith(prefix)).sort();
      const da = cursor ? Number(cursor) : 0, pagina = tutte.slice(da, da + 2);
      return { keys: pagina.map((name) => ({ name })), list_complete: da + 2 >= tutte.length, cursor: String(da + 2) };
    },
  };
}
const env = () => ({ ISCRIZIONI: kvFinto(), GETTONE: 'segreto-di-prova-123', ORIGINE: 'https://esempio.github.io' });
const iscrizione = (n) => ({ endpoint: 'https://web.push.apple.com/Q' + String(n).padStart(40, 'a'), keys: { p256dh: 'B'.repeat(87), auth: 'c'.repeat(22) } });
const chiama = (e, metodo, via, corpo, intest = {}) => servizio.fetch(new Request('https://push.esempio.dev' + via, {
  method: metodo, headers: { Origin: 'https://esempio.github.io', 'Content-Type': 'application/json', ...intest }, body: corpo ? JSON.stringify(corpo) : undefined }), e);

test('iscrizione, preferenze e intestazioni CORS', async () => {
  const e = env();
  const r = await chiama(e, 'POST', '/iscrivi', { iscrizione: iscrizione(1), preferenze: { tutte: true } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), 'https://esempio.github.io');
  const salvata = JSON.parse([...e.ISCRIZIONI.m.values()][0]);
  assert.deepEqual(salvata.preferenze, { tutte: true, norme: true });
  assert.equal(Object.keys(salvata).sort().join(), 'dal,iscrizione,preferenze');   // nient'altro viene conservato
  const pre = await chiama(e, 'OPTIONS', '/iscrivi');
  assert.equal(pre.status, 204);
});

test('rifiuta iscrizioni finte, origini estranee e richieste malformate', async () => {
  const e = env();
  assert.equal((await chiama(e, 'POST', '/iscrivi', { iscrizione: { endpoint: 'https://malintenzionato.example/x', keys: { p256dh: 'B'.repeat(87), auth: 'c'.repeat(22) } } })).status, 400);
  assert.equal((await chiama(e, 'POST', '/iscrivi', { iscrizione: { endpoint: 'http://fcm.googleapis.com/x', keys: { p256dh: 'B'.repeat(87), auth: 'c'.repeat(22) } } })).status, 400);
  assert.equal((await chiama(e, 'POST', '/iscrivi', { iscrizione: iscrizione(1) }, { Origin: 'https://altro.example' })).status, 403);
  assert.equal((await chiama(e, 'POST', '/iscrivi', { iscrizione: { ...iscrizione(1), keys: {} } })).status, 400);
  const sporca = await servizio.fetch(new Request('https://push.esempio.dev/iscrivi', { method: 'POST', body: '{non json' }), e);
  assert.equal(sporca.status, 400);
  assert.equal(e.ISCRIZIONI.m.size, 0);
});

test('l’elenco degli iscritti si legge solo con il gettone', async () => {
  const e = env();
  for (const n of [1, 2, 3]) await chiama(e, 'POST', '/iscrivi', { iscrizione: iscrizione(n) });
  assert.equal((await chiama(e, 'GET', '/iscritti')).status, 401);
  assert.equal((await chiama(e, 'GET', '/iscritti', null, { Authorization: 'Bearer sbagliato-sbagliato-1' })).status, 401);
  const r = await chiama(e, 'GET', '/iscritti', null, { Authorization: 'Bearer segreto-di-prova-123' });
  const d = await r.json();
  assert.equal(d.iscritti.length, 3);                       // tre voci su due pagine
  assert.match(d.iscritti[0].id, /^[0-9a-f]{64}$/);
  assert.equal(d.iscritti[0].iscrizione.keys.auth, 'c'.repeat(22));
});

test('disiscrizione, pulizia delle iscrizioni scadute e rinnovo', async () => {
  const e = env();
  for (const n of [1, 2, 3]) await chiama(e, 'POST', '/iscrivi', { iscrizione: iscrizione(n) });
  await chiama(e, 'POST', '/disiscrivi', { endpoint: iscrizione(1).endpoint });
  assert.equal(e.ISCRIZIONI.m.size, 2);
  const lista = await (await chiama(e, 'GET', '/iscritti', null, { Authorization: 'Bearer segreto-di-prova-123' })).json();
  assert.equal((await chiama(e, 'POST', '/pulisci', { ids: [lista.iscritti[0].id] })).status, 401);
  const p = await chiama(e, 'POST', '/pulisci', { ids: [lista.iscritti[0].id, 'non-un-id'] }, { Authorization: 'Bearer segreto-di-prova-123' });
  assert.equal((await p.json()).rimosse, 1);
  assert.equal(e.ISCRIZIONI.m.size, 1);
  await chiama(e, 'POST', '/iscrivi', { iscrizione: iscrizione(9), sostituisce: lista.iscritti[1].iscrizione.endpoint });
  assert.equal(e.ISCRIZIONI.m.size, 1);                     // la vecchia è stata sostituita dalla nuova
});

test('senza gettone configurato nessuno legge l’elenco', async () => {
  const e = { ...env(), GETTONE: '' };
  assert.equal((await chiama(e, 'GET', '/iscritti', null, { Authorization: 'Bearer ' })).status, 401);
  assert.equal((await chiama(e, 'GET', '/')).status, 200);
  assert.equal((await chiama(e, 'GET', '/altro')).status, 404);
});
