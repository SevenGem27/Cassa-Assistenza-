#!/usr/bin/env node
/* Controlla i file dati della guida e rigenera ciò che ne deriva.
   Uso:  node redazione/costruisci.mjs [--semina] [--anteprima percorso.html]
   - controlla che i file in contenuti/ siano JSON validi e coerenti tra loro (articoli, tappe, testi usati dall'app);
   - rigenera data/scadenze.ics dalle tappe, la pagina installa.html e la versione del service worker;
   --semina     riscrive data/news.json e data/status.json con le novità iniziali
   --anteprima  crea anche una pagina unica, senza file esterni, per mostrarla fuori dal sito
   Se qualcosa non va, elenca i problemi in italiano ed esce con errore (su GitHub l'azione diventa rossa). */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { paginaInstalla, ICONE } from './pagina-installa.mjs';

const qui = dirname(fileURLToPath(import.meta.url));
const radice = join(qui, '..');
const leggi = (p) => readFileSync(join(radice, p), 'utf8');
const scrivi = (p, s) => { mkdirSync(dirname(join(radice, p)), { recursive: true }); writeFileSync(join(radice, p), s); };
const arg = process.argv.slice(2);

export const FILE_DATI = ['testi', 'accordo', 'sintesi', 'documenti', 'tappe', 'casse', 'normativa', 'glossario', 'contributi'];

/* ---------- lettura ---------- */
// Trova il punto in cui un testo smette di essere JSON valido (i messaggi di JSON.parse non sempre lo dicono).
export function dovSiRompe(t) {
  let i = 0;
  const spazi = () => { while (/\s/.test(t[i] || '')) i++; };
  const errore = () => { throw i; };
  const valore = () => {
    spazi();
    const c = t[i];
    if (c === '{') { i++; spazi(); if (t[i] === '}') { i++; return; } for (;;) { spazi(); if (t[i] !== '"') errore(); stringa(); spazi(); if (t[i] !== ':') errore(); i++; valore(); spazi(); if (t[i] === ',') { i++; continue; } if (t[i] === '}') { i++; return; } errore(); } }
    if (c === '[') { i++; spazi(); if (t[i] === ']') { i++; return; } for (;;) { valore(); spazi(); if (t[i] === ',') { i++; continue; } if (t[i] === ']') { i++; return; } errore(); } }
    if (c === '"') return stringa();
    const m = /^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/.exec(t.slice(i));
    if (!m) errore();
    i += m[0].length;
  };
  const stringa = () => { i++; while (i < t.length && t[i] !== '"') { if (t[i] === '\n') errore(); i += t[i] === '\\' ? 2 : 1; } if (t[i] !== '"') errore(); i++; };
  try { valore(); spazi(); if (i < t.length) errore(); return t.length; } catch (p) { return typeof p === 'number' ? p : 0; }
}
export function leggiDati(base = radice) {
  const problemi = [], dati = {};
  const json = (percorso) => {
    let testo;
    try { testo = readFileSync(join(base, percorso), 'utf8'); } catch { problemi.push(`${percorso}: file mancante`); return null; }
    try { return JSON.parse(testo); } catch (e) {
      const pos = dovSiRompe(testo), riga = testo.slice(0, pos).split('\n').length;
      const vicino = testo.slice(Math.max(0, pos - 30), pos + 10).replace(/\s+/g, ' ').trim();
      problemi.push(`${percorso}: non è un JSON valido (riga ${riga}, vicino a «${vicino}»). Controlla virgole, virgolette e parentesi.`);
      return null;
    }
  };
  for (const n of FILE_DATI) dati[n] = json(`contenuti/${n}.json`);
  dati.fonti = json('monitor/fonti.json');
  dati.installa = json('contenuti/installa.json');
  return { dati, problemi };
}

/* ---------- controlli di coerenza ---------- */
export function controlla(d, codice = {}) {
  const P = [];
  const err = (s) => P.push(s);
  const isoOk = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z'));
  const A = d.accordo, S = d.sintesi, TP = d.tappe, N = d.normativa, TX = d.testi, K = d.contributi;
  const numeri = new Set((A?.articoli || []).map((a) => a.n));
  const rifOk = (r) => (typeof r === 'number' ? numeri.has(r) : ['premesse', 'lettera', 'tabella-a', 'tabella-b'].includes(r));
  const controllaRif = (dove, lista) => { if (lista != null && !Array.isArray(lista)) err(`${dove}: "rif" deve essere un elenco tra parentesi quadre`); else for (const r of lista || []) if (!rifOk(r)) err(`${dove}: riferimento "${r}" inesistente`); };

  if (A) {
    (A.articoli || []).forEach((a, i) => { if (a.n !== i + 1) err(`accordo.json: gli articoli devono essere numerati di seguito (trovato ${a.n} al posto ${i + 1})`); });
  }
  if (S && A) {
    if (!isoOk(S.firmato) || !isoOk(S.aggiornato)) err('sintesi.json: "firmato" e "aggiornato" devono essere date nel formato AAAA-MM-GG');
    for (const a of A.articoli) {
      const s = S.articoli?.[a.n];
      if (!s || typeof s.breve !== 'string' || !Array.isArray(s.punti)) err(`sintesi.json: manca la sintesi dell'articolo ${a.n} (servono "breve" e "punti")`);
    }
    const usati = (S.sezioni || []).flatMap((s) => s.articoli || []).sort((x, y) => x - y);
    if (usati.join() !== A.articoli.map((a) => a.n).join()) err('sintesi.json: le "sezioni" devono contenere ogni articolo una volta sola');
  }
  if (d.documenti) {
    for (const doc of d.documenti.documenti || []) {
      if (!/^doc-/.test(doc.id || '')) err(`documenti.json: l'id "${doc.id}" deve iniziare con doc-`);
      if (!existsSync(join(radice, doc.u || ''))) err(`documenti.json: manca il file ${doc.u}`);
    }
  }
  if (TP) {
    const cat = new Set(['storia', ...(TP.categorie || []).map((c) => c.id)]), ids = new Set();
    const chi = new Set(['tutti', 'forme', 'polizza', 'nessuna', 'cma', 'asa']);
    const norme = new Set((N?.norme || []).map((n) => n.id));
    for (const t of TP.tappe || []) {
      const dove = `tappe.json, tappa "${t.id}"`;
      if (!t.id || ids.has(t.id)) err(`tappe.json: id mancante o ripetuto (${t.id})`); ids.add(t.id);
      if (!isoOk(t.d)) err(`${dove}: data "${t.d}" non valida, usa AAAA-MM-GG`);
      if (t.fine != null && (!isoOk(t.fine) || t.fine < t.d)) err(`${dove}: "fine" deve essere una data uguale o successiva a "d"`);
      if (!['entro', 'dal', 'data', 'periodo'].includes(t.tipo)) err(`${dove}: tipo "${t.tipo}" non previsto (entro, dal, data, periodo)`);
      if (!cat.has(t.cat)) err(`${dove}: categoria "${t.cat}" non prevista`);
      if (!t.titolo || !t.testo) err(`${dove}: servono "titolo" e "testo"`);
      for (const c of t.chi || []) if (!chi.has(c)) err(`${dove}: "chi" contiene "${c}", non previsto`);
      if (t.norma && !norme.has(t.norma)) err(`${dove}: norma "${t.norma}" inesistente in normativa.json`);
      controllaRif(dove, t.rif);
    }
    (TP.ricorrenti || []).forEach((r, i) => controllaRif(`tappe.json, ricorrente ${i + 1}`, r.rif));
  }
  if (d.casse) for (const c of d.casse.casse || []) {
    if (!c.id || !c.sigla || !c.nome) err('casse.json: ogni cassa ha bisogno di id, sigla e nome');
    if (!Array.isArray(c.documenti)) err(`casse.json, ${c.sigla}: "documenti" deve essere un elenco`);
    for (const x of c.documenti || []) if (!/^https:\/\//.test(x.u || '')) err(`casse.json, ${c.sigla}: il collegamento "${x.t}" deve iniziare con https://`);
    controllaRif(`casse.json, ${c.sigla}`, c.rif);
  }
  if (N) {
    for (const n of N.norme || []) { for (const l of n.link || []) if (!/^https:\/\//.test(l.u || '')) err(`normativa.json, "${n.titolo}": collegamento non valido`); controllaRif(`normativa.json, "${n.titolo}"`, n.rif); }
    if (!isoOk(N.riforma?.al)) err('normativa.json: "riforma.al" deve essere una data AAAA-MM-GG');
  }
  if (d.glossario) for (const g of d.glossario.voci || []) { if (!g.t || !g.d) err('glossario.json: ogni voce ha bisogno di "t" (termine) e "d" (definizione)'); controllaRif(`glossario.json, "${g.t}"`, g.rif); }
  if (K) {
    const quota = (x) => typeof x === 'number' && x > 0 && x < 1;
    for (const [k, v] of Object.entries(K.aliquoteSocio || {})) if (!quota(v)) err(`contributi.json: l'aliquota "${k}" deve essere un numero decimale tra 0 e 1 (1,40% = 0.014)`);
    if (!quota(K.familiariACarico?.coniuge) || !quota(K.familiariACarico?.figlio)) err('contributi.json: aliquote dei familiari a carico non valide');
    const scaglioni = (nome, l) => { if (!Array.isArray(l) || !l.length) return err(`contributi.json: "${nome}" vuoto`); l.forEach((r, i) => { const ult = i === l.length - 1; if (ult ? r.fino !== null : !(typeof r.fino === 'number' && (i === 0 || r.fino > l[i - 1].fino))) err(`contributi.json: "${nome}", riga ${i + 1}: i limiti "fino" devono crescere e l'ultimo deve essere null`); }); };
    scaglioni('tabellaA', K.tabellaA); scaglioni('tabellaB.eta', K.tabellaB?.eta); scaglioni('tabellaB.reddito', K.tabellaB?.reddito);
    const v = K.tabellaB?.valori;
    if (!Array.isArray(v) || v.length !== (K.tabellaB?.eta || []).length || v.some((r) => r.length !== K.tabellaB.reddito.length || r.some((c) => c.length !== 4 || c.some((x) => typeof x !== 'number')))) err('contributi.json: "tabellaB.valori" deve avere una riga per fascia d’età, una per fascia di reddito e 4 importi');
  }
  if (d.installa) {
    const I = d.installa, dove = 'installa.json';
    for (const k of ['titoloPagina', 'descrizione', 'nome', 'sottotitolo', 'presentazione', 'apri', 'scegli', 'piede']) if (typeof I[k] !== 'string' || !I[k]) err(`${dove}: manca "${k}"`);
    for (const [k, v] of [['iphone.passiNuovo', I.iphone?.passiNuovo], ['iphone.passiVecchio', I.iphone?.passiVecchio], ['android.passi', I.android?.passi], ['computer.passi', I.computer?.passi], ['notifiche.passi', I.notifiche?.passi], ['problemi.voci', I.problemi?.voci]]) {
      if (!Array.isArray(v) || !v.length) err(`${dove}: "${k}" deve essere un elenco tra parentesi quadre`);
    }
    for (const m of JSON.stringify(I).matchAll(/\{(\w+)\}/g)) if (!(m[1] in ICONE)) err(`${dove}: il disegno {${m[1]}} non esiste (si possono usare ${Object.keys(ICONE).map((x) => '{' + x + '}').join(', ')})`);
  }
  if (TX) {
    const cerca = (k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), TX);
    for (const [file, sorgente] of Object.entries(codice)) {
      for (const m of sorgente.matchAll(/\b([THV])\('([\w.-]+)'\s*[,)]/g)) {
        const v = cerca(m[2]);
        if (v == null) err(`testi.json: manca il testo "${m[2]}", usato in ${file}`);
        else if (m[1] === 'V' && (typeof v.t !== 'string' || !Array.isArray(v.rif))) err(`testi.json: "${m[2]}" deve avere "t" (la frase) e "rif" (i riferimenti)`);
        else if (m[1] === 'V') controllaRif(`testi.json, "${m[2]}"`, v.rif);
        else if (m[1] === 'H' && typeof v !== 'string') err(`testi.json: "${m[2]}" deve essere una frase tra virgolette`);
      }
      for (const m of sorgente.matchAll(/\bTX\('(\w+)'/g)) if (typeof TX.calcolo?.[m[1]] !== 'string') err(`testi.json: manca "calcolo.${m[1]}", usato in ${file}`);
    }
    const viste = ['per-me', 'simulatore', 'casse', 'norme', 'glossario', 'tappe', 'accordo', 'novita'];
    for (const m of TX.altro?.menu || []) if (!viste.includes(m.id)) err(`testi.json: la voce di menu "${m.t}" punta a "${m.id}", che non è una pagina`);
  }
  return P;
}

/* ---------- calendario delle scadenze ---------- */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
function calendario(d) {
  const riempi = (s, v) => String(s).replace(/\{(\w+)\}/g, (t, k) => (k in v ? v[k] : t));
  const TT = d.testi.tappe, cal = d.testi.calendario || {};
  const giorno = (iso, piu = 0) => { const x = new Date(iso + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + piu); return x.toISOString().slice(0, 10).replace(/-/g, ''); };
  const icsTesto = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  const piega = (riga) => { // righe di 75 ottetti al massimo, come vuole lo standard
    const out = []; let cur = '';
    for (const ch of riga) {
      if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) { out.push(cur); cur = ch; } else cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  };
  const quando = (t) => {
    if (t.etichetta) return t.etichetta;
    const [a, m, g] = t.d.split('-').map(Number);
    const lunga = `${g === 1 ? '1°' : g} ${MESI[m - 1]} ${a}`;
    if (t.tipo === 'entro') return t.mese ? riempi(TT.quandoEntroMese, { mese: MESI[m - 1], anno: a }) : riempi(TT.quandoEntro, { data: lunga });
    return t.tipo === 'dal' ? riempi(TT.quandoDal, { data: lunga }) : lunga;
  };
  const righe = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:' + cal.prodotto, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsTesto(cal.nome), 'X-WR-CALDESC:' + icsTesto(cal.descrizione), 'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'];
  for (const t of d.tappe.tappe.filter((x) => x.cat !== 'storia')) {
    const rif = (t.rif || []).map((r) => (typeof r === 'number' ? 'art. ' + r : r)).join(', ');
    const nota = [t.testo, rif && riempi(cal.accordo, { rif }), t.calcolata && riempi(cal.calcolata, { come: t.calcolata }), t.indicativa && cal.indicativa, t.cat === 'norme' && cal.obbligoLegge].filter(Boolean).join('\n');
    righe.push('BEGIN:VEVENT', `UID:${t.id}@${cal.uid}`, `DTSTAMP:${d.sintesi.aggiornato.replace(/-/g, '')}T120000Z`,
      `DTSTART;VALUE=DATE:${giorno(t.d)}`, `DTEND;VALUE=DATE:${giorno(t.fine || t.d, 1)}`,
      piega('SUMMARY:' + icsTesto(riempi(cal.evento, { quando: quando(t), titolo: t.titolo }))), piega('DESCRIPTION:' + icsTesto(nota)), 'TRANSP:TRANSPARENT');
    if (t.tipo === 'entro') righe.push('BEGIN:VALARM', 'ACTION:DISPLAY', piega('DESCRIPTION:' + icsTesto(riempi(cal.promemoria, { titolo: t.titolo }))), 'TRIGGER:-P7D', 'END:VALARM');
    righe.push('END:VEVENT');
  }
  righe.push('END:VCALENDAR');
  return righe.join('\r\n') + '\r\n';
}

/* ---------- esecuzione ---------- */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { dati, problemi } = leggiDati();
  if (!problemi.length) problemi.push(...controlla(dati, { 'assets/app.js': leggi('assets/app.js'), 'assets/calcolo.js': leggi('assets/calcolo.js') }));
  if (problemi.length) {
    console.error('Ci sono problemi nei file dati:\n- ' + problemi.join('\n- '));
    process.exit(1);
  }

  const iniziali = JSON.parse(leggi('redazione/novita-iniziali.json'));
  const idDi = (url) => createHash('sha1').update(url).digest('hex').slice(0, 12);
  const novita = { aggiornato: dati.sintesi.aggiornato + 'T12:00:00Z', voci: iniziali.map((v) => ({ id: idDi(v.url), ...v, trovato: v.data })) };
  const stato = { ultimoControllo: null, fonti: dati.fonti.fonti.map((f) => ({ id: f.id, ok: null, controllato: null })) };
  if (arg.includes('--semina') || !existsSync(join(radice, 'data/news.json'))) {
    scrivi('data/news.json', JSON.stringify(novita, null, 1) + '\n');
    scrivi('data/status.json', JSON.stringify(stato, null, 1) + '\n');
  }

  scrivi('data/scadenze.ics', calendario(dati));

  // La pagina da mandare ai colleghi, con le istruzioni per installare la guida.
  const repo = process.env.GITHUB_REPOSITORY || 'SevenGem27/Cassa-Assistenza-';
  const sito = (process.env.SITE_URL || `https://${repo.split('/')[0].toLowerCase()}.github.io/${repo.split('/')[1]}/`).replace(/\/?$/, '/');
  scrivi('installa.html', paginaInstalla(dati.installa, dati.testi.nonUfficiale, sito));

  // La versione del service worker cambia quando cambia qualunque file dell'app o dei contenuti.
  const guscio = ['index.html', 'config.js', 'assets/app.css', 'assets/app.js', 'assets/calcolo.js', 'manifest.webmanifest', 'monitor/fonti.json', ...FILE_DATI.map((n) => `contenuti/${n}.json`)];
  const impronta = createHash('sha1');
  for (const f of guscio) impronta.update(leggi(f));
  const versione = dati.sintesi.aggiornato.replace(/-/g, '') + '-' + impronta.digest('hex').slice(0, 8);
  scrivi('sw.js', leggi('sw.js').replace(/const VERSIONE = '[^']*';/, `const VERSIONE = '${versione}';`));

  const ia = arg.indexOf('--anteprima');
  if (ia >= 0) {
    const base64 = (p) => readFileSync(join(radice, p)).toString('base64');
    const css = leggi('assets/app.css').replace(/url\("fonts\/([^"]+)"\)/g, (_, f) => `url("data:font/woff2;base64,${base64('assets/fonts/' + f)}")`);
    const js = (p) => leggi(p).replace(/<\/script/gi, '<\\/script');
    const sicuro = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
    const html = leggi('index.html')
      .replace(/<link rel="manifest"[^>]*>\n/, '').replace(/<link rel="apple-touch-icon"[^>]*>\n/, '')
      .replace(/<link rel="icon"[^>]*>/, () => '<link rel="icon" href="data:image/svg+xml;base64,' + base64('icons/favicon.svg') + '">')
      .replace('<link rel="stylesheet" href="assets/app.css">', () => '<style>\n' + css + '</style>')
      .replace('<script src="config.js"></script>', () => '<script>self.CASSA_ANTEPRIMA = true; self.CASSA_CONFIG = {}; self.CASSA_DATI = ' + sicuro(dati) + '; self.CASSA_NOVITA = ' + sicuro(novita) + '; self.CASSA_STATO = ' + sicuro(stato) + ';</script>')
      .replace('<script src="assets/calcolo.js"></script>', () => '<script>' + js('assets/calcolo.js') + '</script>')
      .replace('<script src="assets/app.js"></script>', () => '<script>' + js('assets/app.js') + '</script>');
    if (/(src|href)="(assets|icons|config|manifest|contenuti)/.test(html)) throw new Error('anteprima: restano riferimenti a file esterni');
    writeFileSync(arg[ia + 1], html);
    console.log('anteprima:', arg[ia + 1], Math.round(html.length / 1024) + ' KB');
  }

  console.log(`contenuti in ordine: ${dati.accordo.articoli.length} articoli, ${dati.tappe.tappe.length} tappe, ${dati.casse.casse.length} casse, ${dati.normativa.norme.length} norme, ${dati.glossario.voci.length} voci di glossario | versione ${versione}`);
}
