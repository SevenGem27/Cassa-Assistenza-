// Prove dei controlli sui file dati (redazione/costruisci.mjs): ciò che è pubblicato deve passare,
// e gli errori tipici di chi modifica a mano devono essere spiegati.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leggiDati, controlla, FILE_DATI } from '../../redazione/costruisci.mjs';

const RADICE = join(dirname(fileURLToPath(import.meta.url)), '../..');
const codice = { 'assets/app.js': readFileSync(join(RADICE, 'assets/app.js'), 'utf8'), 'assets/calcolo.js': readFileSync(join(RADICE, 'assets/calcolo.js'), 'utf8') };
const copia = (d) => JSON.parse(JSON.stringify(d));

test('i file dati pubblicati sono validi e coerenti', () => {
  const { dati, problemi } = leggiDati(RADICE);
  assert.deepEqual(problemi, []);
  assert.deepEqual(controlla(dati, codice), []);
  assert.equal(dati.accordo.articoli.length, 26);
});

test('errori tipici: testo mancante, data sbagliata, riferimento inesistente, tabella rotta', () => {
  const { dati } = leggiDati(RADICE);
  const d = copia(dati);
  delete d.testi.tappe.titolo;
  d.tappe.tappe[5].d = '2027-13-45';
  d.tappe.tappe[6].rif = [99];
  d.testi.perMe.entri.automatico.rif = 'dodici';
  d.contributi.tabellaB.valori[0][0].pop();
  d.contributi.aliquoteSocio.servizio = 1.4;
  const p = controlla(d, codice).join('\n');
  assert.match(p, /manca il testo "tappe\.titolo"/);
  assert.match(p, /data "2027-13-45" non valida/);
  assert.match(p, /riferimento "99" inesistente/);
  assert.match(p, /perMe\.entri\.automatico/);
  assert.match(p, /tabellaB\.valori/);
  assert.match(p, /aliquota "servizio"/);
});

test('un JSON scritto male viene segnalato con il file e la riga', () => {
  const base = mkdtempSync(join(tmpdir(), 'cassa-dati-'));
  mkdirSync(join(base, 'contenuti')); mkdirSync(join(base, 'monitor'));
  for (const n of FILE_DATI) cpSync(join(RADICE, 'contenuti', n + '.json'), join(base, 'contenuti', n + '.json'));
  cpSync(join(RADICE, 'monitor/fonti.json'), join(base, 'monitor/fonti.json'));
  cpSync(join(RADICE, 'contenuti/installa.json'), join(base, 'contenuti/installa.json'));
  const rotto = readFileSync(join(base, 'contenuti/glossario.json'), 'utf8').replace('"voci": [', '"voci": [,');
  writeFileSync(join(base, 'contenuti/glossario.json'), rotto);
  const { problemi } = leggiDati(base);
  assert.equal(problemi.length, 1);
  assert.match(problemi[0], /^contenuti\/glossario\.json: non è un JSON valido \(riga 2, vicino a «{ "voci": \[,/);
});
