#!/usr/bin/env node
/* Monitor di Nuova Cassa.
   Legge le fonti elencate in fonti.json, aggiorna data/news.json, data/status.json e data/feed.xml
   e, se le notifiche sono configurate, avvisa chi ha installato l'app.
   Gira da solo sei volte al giorno con GitHub Actions (.github/workflows/monitor.yml).
   A mano:  node monitor/monitor.mjs [--prova]     (--prova non scrive e non invia nulla) */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const QUI = dirname(fileURLToPath(import.meta.url));
const RADICE = process.env.MONITOR_RADICE || join(QUI, '..');
const AGENTE = 'NuovaCassa-Monitor';
const MAX_VOCI = 400;
const GIORNI_NOTIFICA = 10; // una voce più vecchia di così entra nell'elenco ma non genera notifiche
const GIORNI_ARCHIVIO = 365; // al primo passaggio su una fonte, ciò che è più vecchio di così (o non ha data) è archivio del sito, non una novità

/* ---------- testo ---------- */
const ENTITA = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', laquo: '«', raquo: '»', euro: '€', deg: '°',
  agrave: 'à', egrave: 'è', eacute: 'é', igrave: 'ì', ograve: 'ò', ugrave: 'ù', Agrave: 'À', Egrave: 'È', Eacute: 'É' };
export function decodifica(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-zA-Z]+);/g, (tutto, n) => (n in ENTITA ? ENTITA[n] : tutto));
}
export function pulisci(s) {
  const senzaCdata = String(s).replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decodifica(decodifica(senzaCdata).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}
export function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").replace(/\s+/g, ' ');
}
/* Parole che compaiono nel testo. "=fas" cerca la parola intera, "fondi sanitari" cerca la frase. */
export function trova(parole, testo) {
  const t = norm(testo);
  return (parole || []).filter((p) => {
    if (p.startsWith('=')) {
      const w = norm(p.slice(1)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('(^|[^a-z0-9])' + w + '([^a-z0-9]|$)').test(t);
    }
    return t.includes(norm(p));
  });
}
function dataIso(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d.toISOString();
}

/* ---------- lettori ---------- */
export function leggiRss(xml) {
  const voci = [];
  for (const m of String(xml).matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)) {
    const b = m[0];
    const campo = (nome) => {
      const r = b.match(new RegExp('<' + nome + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + nome + '>', 'i'));
      return r ? pulisci(r[1]) : '';
    };
    let url = campo('link');
    if (!url) {
      const a = b.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i) || b.match(/<link\b[^>]*href=["']([^"']+)["']/i);
      if (a) url = decodifica(a[1]);
    }
    const categorie = [...b.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)].map((c) => pulisci(c[1]))
      .concat([...b.matchAll(/<category\b[^>]*term=["']([^"']+)["']/gi)].map((c) => decodifica(c[1])));
    voci.push({
      titolo: campo('title'), url: url.trim(),
      data: dataIso(campo('pubDate') || campo('dc:date') || campo('published') || campo('updated')),
      testo: (campo('description') || campo('summary') || campo('content:encoded') || campo('content')).slice(0, 800), categorie,
    });
  }
  return voci;
}
export function leggiWp(json) {
  const lista = typeof json === 'string' ? JSON.parse(json) : json;
  if (!Array.isArray(lista)) throw new Error('risposta inattesa');
  return lista.map((p) => ({
    titolo: pulisci((p.title && p.title.rendered) || ''), url: p.link || '',
    data: dataIso(p.date_gmt ? p.date_gmt + 'Z' : p.date), testo: pulisci((p.excerpt && p.excerpt.rendered) || '').slice(0, 800), categorie: [],
  }));
}
export function leggiHtml(html, base, modello) {
  const pagina = String(html), re = new RegExp(modello, 'i'), visti = new Set(), trovati = [];
  for (const m of pagina.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const h = m[1].match(/\bhref=["']([^"'#]+)["']/i);
    if (!h) continue;
    let url;
    try { url = new URL(decodifica(h[1]), base).href; } catch { continue; }
    if (!re.test(url) || visti.has(url)) continue;
    const attr = m[1].match(/\btitle=["']([^"']+)["']/i);
    const titolo = pulisci(m[2]) || (attr ? pulisci(attr[1]) : '');
    if (titolo.length < 6) continue;
    visti.add(url);
    trovati.push({ titolo, url, da: m.index, a: m.index + m[0].length });
  }
  /* La data di una voce sta nello spazio tra il suo titolo e quello accanto: prima o dopo, secondo il sito.
     Lo dicono gli estremi dell'elenco: se c'è una data subito prima del primo titolo le date precedono i titoli,
     altrimenti li seguono. Così a nessuna voce tocca la data della vicina. */
  const VICINO = 220;
  const date = (da, a) => [...pagina.slice(Math.max(0, da), Math.max(0, a)).replace(/<[^>]*>/g, ' ').matchAll(/\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d{2})\b/g)];
  const precede = trovati.length > 0 && date(trovati[0].da - VICINO, trovati[0].da).length > 0;
  return trovati.map((t, i) => {
    let d = [...t.titolo.matchAll(/\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d{2})\b/g)][0];
    if (!d && precede) d = date(Math.max(i ? trovati[i - 1].a : 0, t.da - VICINO), t.da).pop();
    if (!d && !precede) d = date(t.a, Math.min(i + 1 < trovati.length ? trovati[i + 1].da : pagina.length, t.a + VICINO))[0];
    return { titolo: t.titolo, url: t.url, data: d ? new Date(Date.UTC(+d[3], +d[2] - 1, +d[1], 12)).toISOString() : null, testo: '', categorie: [] };
  });
}

/* ---------- robots.txt ---------- */
export function robotsConsente(txt, percorso, agente = AGENTE) {
  const gruppi = []; let cur = null, ultimaUa = false;
  for (const riga of String(txt).split(/\r?\n/)) {
    const r = riga.replace(/#.*/, '').trim();
    const m = r.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const k = m[1].toLowerCase(), v = m[2].trim();
    if (k === 'user-agent') {
      if (!ultimaUa) { cur = { agenti: [], regole: [] }; gruppi.push(cur); }
      cur.agenti.push(v.toLowerCase()); ultimaUa = true;
    } else if ((k === 'allow' || k === 'disallow') && cur) { cur.regole.push({ consenti: k === 'allow', p: v }); ultimaUa = false; }
    else ultimaUa = false;
  }
  const a = agente.toLowerCase();
  const scelto = gruppi.filter((g) => g.agenti.some((x) => x !== '*' && a.includes(x)))[0] || gruppi.filter((g) => g.agenti.includes('*'))[0];
  if (!scelto) return true;
  let migliore = null;
  for (const r of scelto.regole) {
    if (!r.p) continue; // "Disallow:" vuoto non vieta nulla
    const re = new RegExp('^' + r.p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
    if (re.test(percorso) && (!migliore || r.p.length > migliore.p.length || (r.p.length === migliore.p.length && r.consenti))) migliore = r;
  }
  return migliore ? migliore.consenti : true;
}

/* ---------- rete ---------- */
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let mappaProve = null;
async function scarica(url, sito) {
  if (process.env.MONITOR_PROVE) { // nei test le pagine arrivano da file locali
    mappaProve ||= JSON.parse(await readFile(join(process.env.MONITOR_PROVE, 'mappa.json'), 'utf8'));
    if (!(url in mappaProve)) throw new Error('HTTP 404');
    return readFile(join(process.env.MONITOR_PROVE, mappaProve[url]), 'utf8');
  }
  let ultimo;
  for (let i = 0; i < 2; i++) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
    try {
      const r = await fetch(url, {
        redirect: 'follow', signal: ctl.signal,
        headers: { 'User-Agent': `${AGENTE}/1.0 (+${sito})`, Accept: 'application/rss+xml, application/atom+xml, application/json, text/html;q=0.8, */*;q=0.5', 'Accept-Language': 'it' },
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      ultimo = e.name === 'AbortError' ? new Error('tempo scaduto') : e;
      if (i === 0) await pausa(2000);
    } finally { clearTimeout(t); }
  }
  throw ultimo;
}
const robots = new Map();
async function consentito(url, sito) {
  const u = new URL(url);
  if (!robots.has(u.origin)) {
    let txt = '';
    try { txt = await scarica(u.origin + '/robots.txt', sito); } catch { txt = ''; } // senza robots.txt la lettura è libera
    robots.set(u.origin, txt);
  }
  return robotsConsente(robots.get(u.origin), u.pathname + u.search);
}

/* ---------- classificazione ---------- */
export function idDi(url) { return createHash('sha1').update(url).digest('hex').slice(0, 12); }
export function urlPulito(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    for (const k of [...u.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/i.test(k)) u.searchParams.delete(k);
    return u.href;
  } catch { return ''; }
}
/* Decide se una voce interessa e se riguarda la Cassa. Ritorna null se va scartata. */
export function classifica(voce, fonte, parole) {
  const testo = [voce.titolo, voce.testo, (voce.categorie || []).join(' '), voce.url].join(' ');
  if (fonte.ambito === 'bpm' && !trova(parole.bpm, testo).length) return null;
  const temi = fonte.tema === 'sempre' ? [] : trova(parole[fonte.tema], testo);
  if (fonte.ambito === 'tema' && !temi.length) return null;
  return { pertinente: fonte.tema === 'sempre' || temi.length > 0, temi: temi.map((t) => t.replace(/^=/, '')).slice(0, 3) };
}

async function leggiFonte(fonte, sito) {
  const raccolte = new Map(), errori = [];
  let riuscite = 0;
  for (const p of fonte.leggi) {
    try {
      if (!(await consentito(p.url, sito))) throw new Error('lettura non consentita dal sito');
      const corpo = await scarica(p.url, sito);
      const voci = p.tipo === 'rss' ? leggiRss(corpo) : p.tipo === 'wp' ? leggiWp(corpo) : leggiHtml(corpo, p.url, p.link);
      riuscite++;
      for (const v of voci) {
        v.url = urlPulito(v.url);
        if (v.url && v.titolo && /^https?:/.test(v.url) && !raccolte.has(v.url)) raccolte.set(v.url, v);
      }
    } catch (e) { errori.push(String(e.message || e).slice(0, 80)); }
    await pausa(process.env.MONITOR_PROVE ? 0 : 800); // con garbo: una richiesta alla volta
  }
  return { voci: [...raccolte.values()], ok: riuscite > 0, errore: riuscite > 0 ? null : errori[0] || 'nessuna risposta' };
}

/* ---------- notifiche ---------- */
/* Quali novità mandare a un iscritto, secondo le sue preferenze. */
export function perIscritto(nuove, preferenze = {}) {
  return nuove.filter((v) => {
    if (v.categoria === 'avvisi') return true;
    if (v.categoria === 'norme') return preferenze.norme !== false;
    return v.pertinente || !!preferenze.tutte;
  });
}
export function messaggio(voci, sito, adesso = Date.now()) {
  const uno = voci.length === 1;
  return {
    titolo: uno ? voci[0].nomeFonte : `${voci.length} novità sulla Cassa`,
    testo: uno ? voci[0].titolo : voci.slice(0, 3).map((v) => `${v.nomeFonte}: ${v.titolo}`).join('\n').slice(0, 300),
    url: sito + '#novita', tag: 'novita', conta: voci.length, ts: adesso,
  };
}
async function configurazionePush() {
  let cfg = '';
  try { cfg = await readFile(join(RADICE, 'config.js'), 'utf8'); } catch { /* senza config.js niente notifiche */ }
  const prendi = (nome) => (cfg.match(new RegExp(nome + ":\\s*'([^']*)'")) || [])[1] || '';
  return { pubblica: process.env.VAPID_PUBLIC_KEY || prendi('chiavePubblica'), servizio: (process.env.PUSH_SERVIZIO || prendi('servizio')).replace(/\/$/, ''),
    privata: process.env.VAPID_PRIVATE_KEY || '', gettone: process.env.PUSH_TOKEN || '' };
}
async function inviaNotifiche(nuove, sito, log) {
  const c = await configurazionePush();
  if (!c.pubblica || !c.servizio || !c.privata || !c.gettone) { log('notifiche: non configurate, salto'); return { inviate: 0, configurate: false }; }
  const { default: webpush } = await import('web-push');
  webpush.setVapidDetails(sito, c.pubblica, c.privata);
  const r = await fetch(c.servizio + '/iscritti', { headers: { Authorization: 'Bearer ' + c.gettone } });
  if (!r.ok) throw new Error('servizio iscrizioni: HTTP ' + r.status);
  const iscritti = (await r.json()).iscritti || [];
  let inviate = 0; const scaduti = [];
  for (const i of iscritti) {
    const scelte = perIscritto(nuove, i.preferenze);
    if (!scelte.length) continue;
    try {
      await webpush.sendNotification(i.iscrizione, JSON.stringify(messaggio(scelte, sito)), { TTL: 86400, urgency: 'normal' });
      inviate++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) scaduti.push(i.id); // l'app è stata disinstallata
      else log(`notifiche: invio fallito (${e.statusCode || e.message})`);
    }
  }
  if (scaduti.length) await fetch(c.servizio + '/pulisci', { method: 'POST', headers: { Authorization: 'Bearer ' + c.gettone, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: scaduti }) }).catch(() => null);
  log(`notifiche: ${inviate} inviate su ${iscritti.length} iscritti, ${scaduti.length} iscrizioni scadute rimosse`);
  return { inviate, configurate: true };
}

/* ---------- uscita ---------- */
export function feedXml(voci, sito) {
  const x = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const corpo = voci.filter((v) => v.pertinente).slice(0, 50).map((v) =>
    `<item><title>${x(v.nomeFonte + ': ' + v.titolo)}</title><link>${x(v.url)}</link><guid isPermaLink="false">${v.id}</guid><pubDate>${new Date(v.data || v.trovato).toUTCString()}</pubDate></item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>Nuova Cassa, novità</title><link>${x(sito)}</link><description>Novità sulla Cassa Assistenza del Gruppo Banco BPM</description><language>it</language>\n${corpo}\n</channel></rss>\n`;
}
async function leggiJson(p, predefinito) {
  try { return JSON.parse(await readFile(join(RADICE, p), 'utf8')); } catch { return predefinito; }
}

/* ---------- giro completo ---------- */
export async function esegui({ prova = false, adesso = new Date(), log = console.log } = {}) {
  const cfg = JSON.parse(await readFile(join(QUI, 'fonti.json'), 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY || '';
  const sito = (process.env.SITE_URL || (repo ? `https://${repo.split('/')[0].toLowerCase()}.github.io/${repo.split('/')[1]}/` : 'https://example.org/')).replace(/\/?$/, '/');
  const archivio = await leggiJson('data/news.json', { voci: [] });
  const statoPrima = await leggiJson('data/status.json', { fonti: [] });
  const note = new Map(archivio.voci.map((v) => [v.id, v]));
  // Indirizzi già incontrati che non stanno nell'elenco: servono solo a non scambiarli per novità.
  const viste = new Set(archivio.giaViste || []);
  const nuove = [], statoFonti = [];

  for (const fonte of cfg.fonti) {
    const prima = (statoPrima.fonti || []).find((f) => f.id === fonte.id) || {};
    const esito = await leggiFonte(fonte, sito);
    let tenute = 0, aggiunte = 0;
    // Al primo passaggio riuscito su una fonte si prende nota di ciò che c'è già, senza notificarlo:
    // le pubblicazioni dell'ultimo anno entrano nell'elenco con la loro data, il resto (documenti senza data,
    // avvisi di anni fa) viene solo annotato tra gli indirizzi già visti.
    const primaVolta = !prima.avviata;
    for (const v of esito.voci) {
      const c = classifica(v, fonte, cfg.parole);
      if (!c) continue;
      tenute++;
      const id = idDi(v.url);
      if (note.has(id) || viste.has(id)) continue;
      if (primaVolta && (!v.data || adesso - new Date(v.data) > GIORNI_ARCHIVIO * 864e5)) { viste.add(id); continue; }
      const voce = { id, fonte: fonte.id, nomeFonte: fonte.nome, categoria: fonte.categoria, titolo: v.titolo.slice(0, 220), url: v.url, data: v.data,
        trovato: primaVolta && v.data ? v.data : adesso.toISOString(), pertinente: c.pertinente, temi: c.temi };
      note.set(id, voce); aggiunte++;
      const recente = !v.data || adesso - new Date(v.data) < GIORNI_NOTIFICA * 864e5;
      if (!primaVolta && recente) nuove.push(voce);
    }
    statoFonti.push({ id: fonte.id, ok: esito.ok, errore: esito.errore, controllato: adesso.toISOString(), ultimoOk: esito.ok ? adesso.toISOString() : prima.ultimoOk || null,
      lette: esito.voci.length, tenute, aggiunte, avviata: !!prima.avviata || esito.ok });
    log(`${fonte.id.padEnd(15)} ${esito.ok ? 'ok ' : 'NO '} lette ${String(esito.voci.length).padStart(3)}  tenute ${String(tenute).padStart(3)}  nuove ${aggiunte}${esito.errore ? '  (' + esito.errore + ')' : ''}`);
  }

  // Avviso scritto a mano da chi gestisce l'app (Actions, "Run workflow").
  if (process.env.AVVISO_TITOLO) {
    const url = /^https?:\/\//.test(process.env.AVVISO_URL || '') ? process.env.AVVISO_URL : sito + '#novita';
    const voce = { id: idDi('avviso:' + adesso.toISOString()), fonte: 'avviso', nomeFonte: 'Avviso', categoria: 'avvisi', titolo: process.env.AVVISO_TITOLO.slice(0, 220), url, data: adesso.toISOString(), trovato: adesso.toISOString(), pertinente: true, temi: [] };
    note.set(voce.id, voce); nuove.push(voce);
  }

  const ordinate = [...note.values()].sort((a, b) => ((b.data || b.trovato) > (a.data || a.trovato) ? 1 : -1));
  const voci = ordinate.slice(0, MAX_VOCI);
  for (const v of ordinate.slice(MAX_VOCI)) viste.add(v.id); // ciò che esce dall'elenco non deve tornare come novità
  const giaViste = [...viste].filter((id) => !voci.some((v) => v.id === id)).sort();
  const stato = { ultimoControllo: adesso.toISOString(), fonti: statoFonti };
  let notifiche = { inviate: 0 };
  if (!prova) {
    await writeFile(join(RADICE, 'data/news.json'), JSON.stringify({ aggiornato: adesso.toISOString(), voci, giaViste }, null, 1) + '\n');
    await writeFile(join(RADICE, 'data/status.json'), JSON.stringify(stato, null, 1) + '\n');
    await writeFile(join(RADICE, 'data/feed.xml'), feedXml(voci, sito));
    if (nuove.length) {
      try { notifiche = await inviaNotifiche(nuove, sito, log); } catch (e) { log('notifiche: ' + e.message); }
    }
  }
  log(`totale: ${voci.length} voci in archivio, ${nuove.length} da notificare, ${statoFonti.filter((f) => f.ok).length}/${statoFonti.length} fonti lette`);
  return { voci, nuove, stato, notifiche, giaViste };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  esegui({ prova: process.argv.includes('--prova') }).catch((e) => { console.error('monitor interrotto:', e); process.exit(1); });
}
