/* Servizio delle iscrizioni alle notifiche della guida Cassa Assistenza, per Cloudflare Workers (piano gratuito).
   Custodisce solo l'indirizzo tecnico a cui spedire le notifiche e due preferenze: niente nomi, niente numeri.

   Collegamenti richiesti nelle impostazioni del Worker:
     ISCRIZIONI  spazio KV dove si salvano le iscrizioni
     GETTONE     segreto: lo stesso valore del segreto PUSH_TOKEN su GitHub
     ORIGINE     (facoltativo) l'indirizzo del sito, es. https://tuonome.github.io : accetta iscrizioni solo da lì
   Va pubblicato da solo, senza i file dell'app: aprendo il suo indirizzo nel browser deve comparire lo stato del servizio. */

const SERVIZI_PUSH = [/^fcm\.googleapis\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

function intestazioni(req, env) {
  const origine = req.headers.get('Origin') || '';
  const ammessa = !env.ORIGINE || env.ORIGINE.split(',').map((s) => s.trim()).includes(origine);
  return {
    'Access-Control-Allow-Origin': ammessa && origine ? origine : (env.ORIGINE ? env.ORIGINE.split(',')[0].trim() : '*'),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
function rispondi(req, env, corpo, stato = 200) {
  return new Response(JSON.stringify(corpo), { status: stato, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...intestazioni(req, env) } });
}
async function impronta(testo) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testo));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function uguali(a, b) { // confronto a tempo costante
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
const gettone = (env) => String(env.GETTONE || '').trim(); // uno spazio copiato per sbaglio non deve contare
function autorizzato(req, env) {
  const m = (req.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  return !!gettone(env) && !!m && uguali(m[1].trim(), gettone(env));
}
function iscrizioneValida(i) {
  if (!i || typeof i.endpoint !== 'string' || i.endpoint.length > 1000 || !i.keys) return false;
  let u;
  try { u = new URL(i.endpoint); } catch { return false; }
  if (u.protocol !== 'https:' || !SERVIZI_PUSH.some((r) => r.test(u.hostname))) return false;
  const b64 = /^[A-Za-z0-9_-]{16,200}$/;
  return b64.test(i.keys.p256dh || '') && b64.test(i.keys.auth || '');
}
async function corpoJson(req) {
  const testo = await req.text();
  if (testo.length > 4000) throw new Error('troppo grande');
  return JSON.parse(testo);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), via = url.pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: intestazioni(req, env) });
    try {
      // Stato del servizio: dice se è tutto collegato, senza mostrare alcun valore.
      if (req.method === 'GET' && via === '/') {
        return rispondi(req, env, { ok: !!env.ISCRIZIONI && !!gettone(env), servizio: 'cassa-assistenza-push', spazio_iscrizioni: !!env.ISCRIZIONI, gettone: !!gettone(env), origine: env.ORIGINE || null });
      }
      if (!env.ISCRIZIONI) return rispondi(req, env, { errore: 'spazio ISCRIZIONI non collegato al servizio' }, 503);

      if (req.method === 'POST' && via === '/iscrivi') {
        const origine = req.headers.get('Origin');
        if (env.ORIGINE && origine && !env.ORIGINE.split(',').map((s) => s.trim()).includes(origine)) return rispondi(req, env, { errore: 'origine non ammessa' }, 403);
        const d = await corpoJson(req);
        if (!iscrizioneValida(d.iscrizione)) return rispondi(req, env, { errore: 'iscrizione non valida' }, 400);
        const p = d.preferenze || {};
        const id = await impronta(d.iscrizione.endpoint);
        await env.ISCRIZIONI.put('i:' + id, JSON.stringify({
          iscrizione: { endpoint: d.iscrizione.endpoint, keys: { p256dh: d.iscrizione.keys.p256dh, auth: d.iscrizione.keys.auth } },
          preferenze: { tutte: !!p.tutte, norme: p.norme !== false },
          dal: new Date().toISOString().slice(0, 10),
        }));
        if (typeof d.sostituisce === 'string' && d.sostituisce !== d.iscrizione.endpoint) await env.ISCRIZIONI.delete('i:' + (await impronta(d.sostituisce)));
        return rispondi(req, env, { ok: true });
      }

      if (req.method === 'POST' && via === '/disiscrivi') {
        const d = await corpoJson(req);
        if (typeof d.endpoint === 'string') await env.ISCRIZIONI.delete('i:' + (await impronta(d.endpoint)));
        return rispondi(req, env, { ok: true });
      }

      if (via === '/iscritti' || via === '/pulisci') {
        if (!gettone(env)) return rispondi(req, env, { errore: 'segreto GETTONE non impostato nel servizio' }, 503);
        if (!autorizzato(req, env)) return rispondi(req, env, { errore: 'gettone diverso da quello del servizio' }, 401);
        if (req.method === 'GET' && via === '/iscritti') {
          const iscritti = [];
          let cursore;
          do {
            const pagina = await env.ISCRIZIONI.list({ prefix: 'i:', cursor: cursore });
            for (const k of pagina.keys) {
              const v = await env.ISCRIZIONI.get(k.name);
              if (v) iscritti.push({ id: k.name.slice(2), ...JSON.parse(v) });
            }
            cursore = pagina.list_complete ? null : pagina.cursor;
          } while (cursore);
          return rispondi(req, env, { iscritti });
        }
        if (req.method === 'POST' && via === '/pulisci') {
          const d = await corpoJson(req);
          const ids = (Array.isArray(d.ids) ? d.ids : []).filter((x) => /^[0-9a-f]{64}$/.test(x)).slice(0, 500);
          for (const id of ids) await env.ISCRIZIONI.delete('i:' + id);
          return rispondi(req, env, { ok: true, rimosse: ids.length });
        }
      }
      return rispondi(req, env, { errore: 'non trovato' }, 404);
    } catch (e) {
      return rispondi(req, env, { errore: 'richiesta non valida' }, 400);
    }
  },
};
