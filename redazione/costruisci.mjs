#!/usr/bin/env node
/* Ricostruisce i file generati dell'app a partire dalla cartella redazione/.
   Uso:  node redazione/costruisci.mjs [--semina] [--anteprima percorso.html]
   --semina     riscrive data/news.json e data/status.json con le novità iniziali
   --anteprima  crea anche una pagina unica, senza file esterni, per mostrarla fuori dal sito */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as E from './editoriale.mjs';

const qui = dirname(fileURLToPath(import.meta.url));
const radice = join(qui, '..');
const leggi = (p) => readFileSync(join(radice, p), 'utf8');
const scrivi = (p, s) => { mkdirSync(dirname(join(radice, p)), { recursive: true }); writeFileSync(join(radice, p), s); };
const arg = process.argv.slice(2);

const testo = JSON.parse(leggi('redazione/testo-accordo.json'));
const fonti = JSON.parse(leggi('monitor/fonti.json'));
const acc = testo.accordo;

/* ---------- contenuti.js ---------- */
const articoli = acc.articoli.map((a) => {
  const s = E.SINTESI[a.n];
  if (!s) throw new Error('manca la sintesi dell\'articolo ' + a.n);
  return { n: a.n, titolo: a.titolo, breve: s.breve, punti: s.punti, blocchi: a.blocchi };
});
for (const s of E.SEZIONI) for (const n of s.articoli) if (!articoli.find((a) => a.n === n)) throw new Error('sezione con articolo inesistente: ' + n);
const usati = E.SEZIONI.flatMap((s) => s.articoli).sort((a, b) => a - b);
if (usati.join() !== articoli.map((a) => a.n).join()) throw new Error('le sezioni non coprono tutti gli articoli una volta sola');
for (const t of E.TAPPE) for (const r of t.rif || []) if (typeof r === 'number' && !articoli.find((a) => a.n === r)) throw new Error(`tappa ${t.id}: articolo ${r} inesistente`);
for (const t of E.TAPPE) if (t.norma && !E.NORME.find((n) => n.id === t.norma)) throw new Error(`tappa ${t.id}: norma ${t.norma} inesistente`);
for (const f of ['accordo-costituzione-cassa.pdf', 'lettera-impegno.pdf', 'allegato-1-tabella-a.pdf', 'allegato-2-tabella-b.pdf']) if (!existsSync(join(radice, 'documenti', f))) throw new Error('manca il documento firmato documenti/' + f);

const dati = {
  meta: E.META,
  intestazione: acc.intestazione,
  premesse: { ...E.SINTESI.premesse, testo: acc.premesse },
  sezioni: E.SEZIONI,
  articoli,
  firme: acc.firme,
  lettera: { ...E.SINTESI.lettera, blocchi: testo.lettera },
  allegati: testo.allegati,
  documenti: [
    { id: 'doc-accordo', t: 'Accordo (PDF)', breve: 'Accordo', nome: 'Accordo per la costituzione della Cassa Assistenza del Gruppo Banco BPM', file: 'accordo-costituzione-cassa.pdf', u: 'documenti/accordo-costituzione-cassa.pdf' },
    { id: 'doc-lettera', t: 'Lettera d’impegno (PDF)', breve: 'Lettera d’impegno', nome: 'Lettera d’impegno del Gruppo', file: 'lettera-impegno.pdf', u: 'documenti/lettera-impegno.pdf' },
    { id: 'doc-tabella-a', t: 'Tabella A (PDF)', breve: 'Tabella A', nome: 'Allegato 1, Tabella A', file: 'allegato-1-tabella-a.pdf', u: 'documenti/allegato-1-tabella-a.pdf' },
    { id: 'doc-tabella-b', t: 'Tabella B (PDF)', breve: 'Tabella B', nome: 'Allegato 2, Tabella B', file: 'allegato-2-tabella-b.pdf', u: 'documenti/allegato-2-tabella-b.pdf' },
  ],
  cifre: E.CIFRE,
  tappe: E.TAPPE,
  ricorrenti: E.RICORRENTI,
  categorieTappe: E.CATEGORIE_TAPPE,
  casse: E.CASSE,
  norme: E.NORME,
  riforma: E.RIFORMA,
  glossario: E.GLOSSARIO,
  fonti: fonti.fonti.map((f) => ({ id: f.id, nome: f.nome, descrizione: f.descrizione, categoria: f.categoria, pagina: f.pagina })),
};
scrivi('assets/contenuti.js', '/* File generato da redazione/costruisci.mjs: non modificarlo a mano. */\nself.CASSA = ' + JSON.stringify(dati) + ';\n');

/* ---------- novità iniziali ---------- */
const idDi = (url) => createHash('sha1').update(url).digest('hex').slice(0, 12);
const novita = {
  aggiornato: E.META.contenutiAl + 'T12:00:00Z',
  voci: E.NOVITA_INIZIALI.map((v) => ({ id: idDi(v.url), ...v, trovato: v.data })),
};
const stato = { ultimoControllo: null, fonti: fonti.fonti.map((f) => ({ id: f.id, ok: null, controllato: null })) };
if (arg.includes('--semina') || !existsSync(join(radice, 'data/news.json'))) {
  scrivi('data/news.json', JSON.stringify(novita, null, 1) + '\n');
  scrivi('data/status.json', JSON.stringify(stato, null, 1) + '\n');
}

/* ---------- calendario delle scadenze ---------- */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const giorno = (iso, piu = 0) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + piu); return d.toISOString().slice(0, 10).replace(/-/g, ''); };
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
  if (t.tipo === 'entro') return t.mese ? `entro ${MESI[m - 1]} ${a}` : `entro il ${lunga}`;
  return t.tipo === 'dal' ? `dal ${lunga}` : lunga;
};
const righe = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nuova Cassa//Tappe dell\'accordo//IT', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:Nuova Cassa Banco BPM', 'X-WR-CALDESC:Le tappe dell\'accordo del 10 novembre 2026', 'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'];
for (const t of E.TAPPE.filter((x) => x.cat !== 'storia')) {
  const rif = (t.rif || []).map((r) => (typeof r === 'number' ? 'art. ' + r : r)).join(', ');
  const nota = [t.testo, rif && 'Accordo: ' + rif, t.calcolata && 'Data calcolata: ' + t.calcolata, t.indicativa && 'Data indicativa', t.cat === 'norme' && 'Obbligo di legge, non dell\'accordo'].filter(Boolean).join('\n');
  righe.push('BEGIN:VEVENT', `UID:${t.id}@nuova-cassa`, `DTSTAMP:${E.META.contenutiAl.replace(/-/g, '')}T120000Z`,
    `DTSTART;VALUE=DATE:${giorno(t.d)}`, `DTEND;VALUE=DATE:${giorno(t.fine || t.d, 1)}`,
    piega('SUMMARY:' + icsTesto(`Cassa BPM, ${quando(t)}: ${t.titolo}`)), piega('DESCRIPTION:' + icsTesto(nota)), 'TRANSP:TRANSPARENT');
  if (t.tipo === 'entro') righe.push('BEGIN:VALARM', 'ACTION:DISPLAY', piega('DESCRIPTION:' + icsTesto('Tra una settimana: ' + t.titolo)), 'TRIGGER:-P7D', 'END:VALARM');
  righe.push('END:VEVENT');
}
righe.push('END:VCALENDAR');
scrivi('data/scadenze.ics', righe.join('\r\n') + '\r\n');

/* ---------- versione del service worker ---------- */
const guscio = ['index.html', 'config.js', 'assets/app.css', 'assets/app.js', 'assets/contenuti.js', 'assets/calcolo.js', 'manifest.webmanifest'];
const impronta = createHash('sha1');
for (const f of guscio) impronta.update(leggi(f));
const versione = E.META.contenutiAl.replace(/-/g, '') + '-' + impronta.digest('hex').slice(0, 8);
scrivi('sw.js', leggi('sw.js').replace(/const VERSIONE = '[^']*';/, `const VERSIONE = '${versione}';`));

/* ---------- pagina unica di anteprima ---------- */
const ia = arg.indexOf('--anteprima');
if (ia >= 0) {
  const base64 = (p) => readFileSync(join(radice, p)).toString('base64');
  let css = leggi('assets/app.css').replace(/url\("fonts\/([^"]+)"\)/g, (_, f) => `url("data:font/woff2;base64,${base64('assets/fonts/' + f)}")`);
  const js = (p) => leggi(p).replace(/<\/script/gi, '<\\/script');
  let html = leggi('index.html')
    .replace(/<link rel="manifest"[^>]*>\n/, '').replace(/<link rel="apple-touch-icon"[^>]*>\n/, '')
    .replace(/<link rel="icon"[^>]*>/, () => '<link rel="icon" href="data:image/svg+xml;base64,' + base64('icons/favicon.svg') + '">')
    .replace('<link rel="stylesheet" href="assets/app.css">', () => '<style>\n' + css + '</style>')
    .replace('<script src="config.js"></script>', () => '<script>self.CASSA_ANTEPRIMA = true; self.CASSA_CONFIG = {}; self.CASSA_NOVITA = ' + JSON.stringify(novita).replace(/</g, '\\u003c') + '; self.CASSA_STATO = ' + JSON.stringify(stato) + ';</script>')
    .replace('<script src="assets/contenuti.js"></script>', () => '<script>' + js('assets/contenuti.js').replace(/</g, '\\u003c') + '</script>')
    .replace('<script src="assets/calcolo.js"></script>', () => '<script>' + js('assets/calcolo.js') + '</script>')
    .replace('<script src="assets/app.js"></script>', () => '<script>' + js('assets/app.js') + '</script>');
  if (/(src|href)="(assets|icons|config|manifest)/.test(html)) throw new Error('anteprima: restano riferimenti a file esterni');
  writeFileSync(arg[ia + 1], html);
  console.log('anteprima:', arg[ia + 1], Math.round(html.length / 1024) + ' KB');
}

console.log(`contenuti: ${articoli.length} articoli, ${E.TAPPE.length} tappe, ${E.CASSE.length} schede, ${E.NORME.length} norme, ${E.GLOSSARIO.length} voci di glossario | versione ${versione}`);
