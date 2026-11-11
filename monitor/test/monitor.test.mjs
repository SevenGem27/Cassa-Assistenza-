// Prove del monitor: lettori, filtri, robots.txt e un giro completo su pagine finte.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createECDH, randomBytes } from 'node:crypto';

const QUI = dirname(fileURLToPath(import.meta.url));
const PROVE = join(QUI, 'prove');
const radice = await mkdtemp(join(tmpdir(), 'cassa-'));
await mkdir(join(radice, 'data'));
await copyFile(join(QUI, '../../data/news.json'), join(radice, 'data/news.json'));
await copyFile(join(QUI, '../../data/status.json'), join(radice, 'data/status.json'));
await copyFile(join(QUI, '../../config.js'), join(radice, 'config.js'));
const copiaProve = await mkdtemp(join(tmpdir(), 'cassa-prove-'));
for (const f of ['mappa.json', 'fisac.xml', 'fabi.xml', 'cma.html', 'robots-vieta.txt', 'robots-libero.txt']) await copyFile(join(PROVE, f), join(copiaProve, f));
process.env.MONITOR_RADICE = radice;
process.env.MONITOR_PROVE = copiaProve;
process.env.SITE_URL = 'https://esempio.github.io/cassa/';
const M = await import('../monitor.mjs');
const cfg = JSON.parse(await readFile(join(QUI, '../fonti.json'), 'utf8'));
const fonte = (id) => cfg.fonti.find((f) => f.id === id);

test('RSS di WordPress: titoli, entità, CDATA, categorie, date', async () => {
  const v = M.leggiRss(await readFile(join(PROVE, 'fisac.xml'), 'utf8'));
  assert.equal(v.length, 2);
  assert.equal(v[0].titolo, 'Banco BPM: welfare e novità dall’incontro sindacale');
  assert.equal(v[0].data, '2026-11-11T08:50:38.000Z');
  assert.deepEqual(v[0].categorie, ['Banco BPM', '000 - Telegram']);
  assert.match(v[0].testo, /armonizzazione dell’assistenza sanitaria/);
  assert.doesNotMatch(v[0].testo, /<p>/);
});

test('Atom: collegamento nell’attributo href', () => {
  const v = M.leggiRss('<feed><entry><title>Decreto sui fondi sanitari</title><link rel="alternate" href="https://esempio.it/a?x=1&amp;y=2"/><updated>2026-12-01T10:00:00Z</updated><category term="Sanità"/></entry></feed>');
  assert.equal(v[0].url, 'https://esempio.it/a?x=1&y=2');
  assert.deepEqual(v[0].categorie, ['Sanità']);
});

test('API di WordPress', () => {
  const v = M.leggiWp([{ link: 'https://www.uilca.it/x/', date_gmt: '2026-11-10T14:55:00', title: { rendered: 'Uilca su Banco Bpm: bene gli accordi' }, excerpt: { rendered: '<p>Assistenza sanitaria integrativa</p>' } }]);
  assert.equal(v[0].data, '2026-11-10T14:55:00.000Z');
  assert.equal(v[0].testo, 'Assistenza sanitaria integrativa');
  assert.throws(() => M.leggiWp('{"code":"rest_disabled"}'));
});

test('pagina HTML: solo i collegamenti del modello, senza doppioni, con la data vicina', async () => {
  const v = M.leggiHtml(await readFile(join(PROVE, 'cma.html'), 'utf8'), 'https://www.cassamutuadiassistenza.it/', 'news\\.php\\?id=\\d+');
  assert.deepEqual(v.map((x) => x.url), ['https://www.cassamutuadiassistenza.it/news.php?id=31', 'https://www.cassamutuadiassistenza.it/news.php?id=30']);
  assert.equal(v[0].titolo, 'Convocazione Assemblea Ordinaria 2026');
  assert.equal(v[0].data.slice(0, 10), '2026-04-28');
});

test('parole chiave: frasi, parole intere, accenti', () => {
  assert.deepEqual(M.trova(['=fas'], 'La fase transitoria'), []);
  assert.deepEqual(M.trova(['=fas'], 'Il FAS, la CMA e il FIAM'), ['=fas']);
  assert.deepEqual(M.trova(['sanita integrativa'], 'Riforma della SANITÀ   integrativa'), ['sanita integrativa']);
  assert.deepEqual(M.trova(['=asa'], 'la casa'), []);
  assert.deepEqual(M.trova(['=bpm'], 'Gruppo BPM: accordo'), ['=bpm']);
});

test('classificazione: ambito e pertinenza', () => {
  const p = cfg.parole;
  // sito nazionale: senza Banco BPM la voce si scarta, anche se parla di sanità
  assert.equal(M.classifica({ titolo: 'Contratto bancari', testo: 'welfare sanitario e assistenza sanitaria', url: 'https://www.fabi.it/x' }, fonte('fabi'), p), null);
  assert.deepEqual(M.classifica({ titolo: 'IN BANCO BPM ACCORDO SU CASSA SANITARIA UNICA', testo: '', url: 'https://www.fabi.it/y' }, fonte('fabi'), p), { pertinente: true, temi: ['cassa sanitaria'] });
  assert.equal(M.classifica({ titolo: 'Banco BPM, rientro da Gardant', testo: '', url: 'https://www.fabi.it/z' }, fonte('fabi'), p).pertinente, false);
  // pagina di gruppo: si tiene tutto, la pertinenza si vede anche dal riassunto
  assert.equal(M.classifica({ titolo: 'Continua la trattativa', testo: 'confronto sulla nuova cassa sanitaria unica', url: 'https://x' }, fonte('first'), p).pertinente, true);
  // fonti di legge: solo se parlano di fondi e casse
  assert.equal(M.classifica({ titolo: 'Decreto flussi', testo: '', url: 'https://x' }, fonte('gazzetta'), p), null);
  assert.equal(M.classifica({ titolo: 'Disposizioni sui fondi sanitari integrativi', testo: '', url: 'https://x' }, fonte('gazzetta'), p).pertinente, true);
  // casse di oggi: tutto è pertinente
  assert.equal(M.classifica({ titolo: 'Convocazione Assemblea Straordinaria', testo: '', url: 'https://x' }, fonte('cma'), p).pertinente, true);
});

test('robots.txt: divieti, eccezioni, gruppo più specifico', () => {
  assert.equal(M.robotsConsente('User-agent: *\nDisallow: /', '/news'), false);
  assert.equal(M.robotsConsente('User-agent: *\nDisallow:', '/news'), true);
  assert.equal(M.robotsConsente('', '/news'), true);
  assert.equal(M.robotsConsente('User-agent: *\nDisallow: /wp-admin/\nAllow: /wp-admin/admin-ajax.php', '/wp-admin/admin-ajax.php'), true);
  assert.equal(M.robotsConsente('User-agent: *\nDisallow: /rss/search', '/rss/search?q=x'), false);
  assert.equal(M.robotsConsente('User-agent: *\nDisallow: /*.pdf$', '/doc/statuto.pdf'), false);
  assert.equal(M.robotsConsente('User-agent: *\nDisallow: /\n\nUser-agent: NuovaCassa-Monitor\nAllow: /', '/feed'), true);
  assert.equal(M.robotsConsente('User-agent: Googlebot\nDisallow: /', '/feed'), true);
});

test('indirizzi: parametri di tracciamento rimossi, stesso id per lo stesso articolo', () => {
  assert.equal(M.urlPulito('https://www.fisac-cgil.it/163194/x?utm_source=rss#top'), 'https://www.fisac-cgil.it/163194/x');
  assert.equal(M.idDi(M.urlPulito('https://a.it/x?utm_medium=y')), M.idDi('https://a.it/x'));
});

test('primo giro: prende nota di ciò che c’è senza notificare, e non duplica le novità iniziali', async () => {
  const righe = [];
  const r = await M.esegui({ adesso: new Date('2026-11-12T06:07:00Z'), log: (s) => righe.push(s) });
  assert.equal(r.nuove.length, 0);
  const ids = r.voci.map((v) => v.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(r.voci.filter((v) => v.url.includes('163316')).length, 1);
  const st = Object.fromEntries(r.stato.fonti.map((f) => [f.id, f]));
  assert.equal(st.fisac.ok, true);
  assert.equal(st.fabi.ok, true);
  assert.equal(st.fabi.tenute, 2);          // la notizia sul contratto nazionale è scartata
  assert.equal(st.cma.ok, true);
  assert.equal(st.mefop.ok, false);
  assert.match(st.mefop.errore, /non consentita/);
  assert.equal(st.first.ok, false);         // pagina non raggiungibile nella prova
  assert.equal(st.first.avviata, false);
  const salvato = JSON.parse(await readFile(join(radice, 'data/news.json'), 'utf8'));
  assert.equal(salvato.voci.length, r.voci.length);
  assert.match(await readFile(join(radice, 'data/feed.xml'), 'utf8'), /<rss version="2.0">/);
});

test('secondo giro: una pubblicazione nuova viene trovata e segnalata una volta sola', async () => {
  const feed = (await readFile(join(copiaProve, 'fisac.xml'), 'utf8')).replace('<item>', `<item>
  <title>Banco BPM: lo Statuto della nuova Cassa</title><link>https://www.fisac-cgil.it/164000/banco-bpm-statuto-nuova-cassa</link>
  <pubDate>Thu, 12 Nov 2026 09:00:00 +0000</pubDate><category><![CDATA[Banco BPM]]></category><description><![CDATA[Condiviso lo statuto]]></description></item>
<item>
  <title>Banco BPM: chiusure di filiali</title><link>https://www.fisac-cgil.it/164001/banco-bpm-chiusure-filiali</link>
  <pubDate>Thu, 12 Nov 2026 09:30:00 +0000</pubDate><category><![CDATA[Banco BPM]]></category><description><![CDATA[Il piano sportelli]]></description></item>
<item>`);
  await writeFile(join(copiaProve, 'fisac.xml'), feed);
  const r = await M.esegui({ adesso: new Date('2026-11-12T11:07:00Z'), log: () => {} });
  assert.deepEqual(r.nuove.map((v) => v.titolo), ['Banco BPM: lo Statuto della nuova Cassa', 'Banco BPM: chiusure di filiali']);
  assert.deepEqual(r.nuove.map((v) => v.pertinente), [true, false]);
  assert.equal(r.voci[0].trovato, '2026-11-12T11:07:00.000Z');
  const r2 = await M.esegui({ adesso: new Date('2026-11-12T14:07:00Z'), log: () => {} });
  assert.equal(r2.nuove.length, 0);
});

test('avviso scritto a mano', async () => {
  process.env.AVVISO_TITOLO = 'Assemblea CMA: si vota il 20 ottobre';
  const r = await M.esegui({ adesso: new Date('2026-11-13T08:00:00Z'), log: () => {} });
  delete process.env.AVVISO_TITOLO;
  assert.equal(r.nuove.length, 1);
  assert.equal(r.nuove[0].categoria, 'avvisi');
  assert.equal(r.nuove[0].url, 'https://esempio.github.io/cassa/#novita');
});

test('a chi va che cosa: preferenze degli iscritti', () => {
  const nuove = [
    { categoria: 'sindacati', pertinente: true, titolo: 'a', nomeFonte: 'FISAC CGIL' },
    { categoria: 'sindacati', pertinente: false, titolo: 'b', nomeFonte: 'FABI' },
    { categoria: 'norme', pertinente: true, titolo: 'c', nomeFonte: 'Mefop' },
    { categoria: 'casse', pertinente: true, titolo: 'd', nomeFonte: 'CMA' },
  ];
  assert.deepEqual(M.perIscritto(nuove, {}).map((v) => v.titolo), ['a', 'c', 'd']);
  assert.deepEqual(M.perIscritto(nuove, { norme: false }).map((v) => v.titolo), ['a', 'd']);
  assert.deepEqual(M.perIscritto(nuove, { tutte: true }).map((v) => v.titolo), ['a', 'b', 'c', 'd']);
  const uno = M.messaggio([nuove[0]], 'https://s.it/', 1);
  assert.deepEqual(uno, { titolo: 'FISAC CGIL', testo: 'a', url: 'https://s.it/#novita', tag: 'novita', conta: 1, ts: 1 });
  assert.equal(M.messaggio(nuove, 'https://s.it/').titolo, '4 novità sulla Cassa');
});

test('web-push: con chiavi VAPID vere il messaggio viene cifrato e firmato', async () => {
  const { default: webpush } = await import('web-push');
  const chiavi = webpush.generateVAPIDKeys();
  const telefono = createECDH('prime256v1'); telefono.generateKeys();
  const iscrizione = { endpoint: 'https://fcm.googleapis.com/fcm/send/prova', keys: { p256dh: telefono.getPublicKey('base64url'), auth: randomBytes(16).toString('base64url') } };
  const d = webpush.generateRequestDetails(iscrizione, JSON.stringify(M.messaggio([{ nomeFonte: 'FABI', titolo: 'x' }], 'https://s.it/')), {
    vapidDetails: { subject: 'https://s.it/', publicKey: chiavi.publicKey, privateKey: chiavi.privateKey }, TTL: 60 });
  assert.equal(d.method, 'POST');
  assert.match(d.headers.Authorization, /^vapid t=.+, k=.+/);
  assert.equal(d.headers['Content-Encoding'], 'aes128gcm');
  assert.ok(d.body.length > 50);
});
