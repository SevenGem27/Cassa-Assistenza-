// node --test monitor/test/calcolo.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../../assets/calcolo.js');

test('socio: aliquote dell’articolo 15 e 16', () => {
  assert.equal(C.contributoSocio('servizio', 40000).importo, 560);
  assert.equal(C.contributoSocio('esodo', 50000).importo, 700);
  assert.equal(C.contributoSocio('pensione2028', 30000).importo, 630);
  assert.equal(C.contributoSocio('superstite', 20000).importo, 280);
  assert.equal(C.contributoSocio('pensioneAnte', 30000).importo, null);
});

test('Tabella A: ogni scaglione', () => {
  const caso = (reddito, eta = 55) => C.contributiFamiliari(40000, [{ tipo: 'coniuge', aCarico: false, eta, reddito }]).righe[0].importo;
  assert.equal(caso(10000), 120); // come a carico: 0,30% di 40.000
  assert.equal(caso(10001), 300);
  assert.equal(caso(15000), 300);
  assert.equal(caso(15001), 420);
  assert.equal(caso(30000), 420);
  assert.equal(caso(30001), 600);
  assert.equal(caso(40000), 600);
  assert.equal(caso(40001), 840);
  assert.equal(caso(50001), 1080);
  assert.equal(caso(60000), 1080);
  assert.equal(caso(60001), 1440);
});

test('Tabella A: eccezioni per il coniuge giovane', () => {
  const caso = (eta, reddito) => C.contributiFamiliari(40000, [{ tipo: 'coniuge', aCarico: false, eta, reddito }]).righe[0].importo;
  assert.equal(caso(30, 45000), 705);  // sotto i 35, oltre 40.000: Tabella B fino a 35 anni, 40-60k, 1 familiare
  assert.equal(caso(30, 70000), 805);
  assert.equal(caso(30, 40000), 600);  // non oltre 40.000: resta Tabella A
  assert.equal(caso(35, 45000), 840);  // 35 anni compiuti non è "sotto i 35"
  assert.equal(caso(45, 70000), 1210); // sotto i 51, oltre 60.000: Tabella B 36-50, oltre 60k
  assert.equal(caso(45, 55000), 1080);
  assert.equal(caso(51, 70000), 1440);
});

test('Tabella B: valori ai quattro angoli e colonne', () => {
  assert.equal(C.tabellaB(35, 20000, 1).importo, 500);
  assert.equal(C.tabellaB(36, 20001, 2).importo, 885);
  assert.equal(C.tabellaB(65, 60000, 3).importo, 1560);
  assert.equal(C.tabellaB(66, 60001, 4).importo, 1985);
  assert.equal(C.tabellaB(80, 100000, 9).importo, 1985);
  assert.equal(C.tabellaB(51, 10000, 1).importo, 1085);
});

test('Tabella B: tutte le 64 celle sono decrescenti per numero di familiari e crescenti per reddito', () => {
  const v = C.TABELLA_B.valori;
  assert.equal(v.length, 4);
  for (const eta of v) {
    assert.equal(eta.length, 4);
    for (let r = 0; r < 4; r++) {
      assert.equal(eta[r].length, 4);
      for (let n = 1; n < 4; n++) assert.ok(eta[r][n] < eta[r][n - 1]);
      if (r) for (let n = 0; n < 4; n++) assert.ok(eta[r][n] > eta[r - 1][n]);
    }
  }
});

test('familiari a carico: percentuali e tetto di tre', () => {
  const base = 40000;
  const r = C.contributiFamiliari(base, [
    { tipo: 'coniuge', aCarico: true, eta: 40 },
    { tipo: 'figlio', aCarico: true, eta: 10 },
    { tipo: 'figlio', aCarico: true, eta: 8 },
    { tipo: 'figlio', aCarico: true, eta: 5 },
  ]);
  assert.deepEqual(r.righe.map(x => x.importo), [120, 100, 100, 0]);
  assert.equal(r.totale, 320);
});

test('coniuge non a carico con reddito basso: paga come a carico ma fuori dal tetto dei tre', () => {
  const r = C.contributiFamiliari(40000, [
    { tipo: 'coniuge', aCarico: false, eta: 40, reddito: 8000 },
    { tipo: 'figlio', aCarico: true, eta: 10 },
    { tipo: 'figlio', aCarico: true, eta: 8 },
    { tipo: 'figlio', aCarico: true, eta: 5 },
    { tipo: 'figlioInabile', aCarico: true, eta: 30 },
  ]);
  assert.deepEqual(r.righe.map(x => x.importo), [120, 100, 100, 100, 0]);
  assert.equal(r.totale, 420);
});

test('ex dipendente cessato per comporto con assegno di invalidità: 1,40% sulle pensioni', () => {
  assert.equal(C.contributoSocio('invalidita', 18000).importo, 252);
  assert.throws(() => C.contributoSocio('altro', 1));
});

test('limiti di età: 50 anni per i figli, 70 per i genitori, nessuno per coniuge e figli inabili', () => {
  const r = C.contributiFamiliari(40000, [
    { tipo: 'figlio', aCarico: true, eta: 50 },
    { tipo: 'figlio', aCarico: true, eta: 51 },
    { tipo: 'figlioInabile', aCarico: false, eta: 58, reddito: 9000 },
    { tipo: 'genitore', aCarico: true, eta: 70 },
    { tipo: 'genitore', aCarico: true, eta: 71 },
    { tipo: 'genitore', aCarico: false, eta: 71, reddito: 5000, convivente: true },
    { tipo: 'coniuge', aCarico: true, eta: 95 },
  ]);
  assert.deepEqual(r.righe.map(x => x.iscrivibile), [true, false, true, true, false, false, true]);
  assert.deepEqual(r.righe.map(x => x.importo), [100, 0, 1085, 500, 0, 0, 120]);
  assert.equal(r.totale, 1805);
});

test('controllo incrociato: le regole riscritte in modo indipendente danno gli stessi importi', () => {
  // Seconda scrittura delle regole dell'articolo 11 e delle tabelle, senza riusare il codice dell'app.
  const A = [[10000, null], [15000, 300], [30000, 420], [40000, 600], [50000, 840], [60000, 1080], [Infinity, 1440]];
  const B = { 35: [[500, 455, 430, 400], [605, 555, 515, 470], [705, 655, 615, 570], [805, 775, 715, 670]],
    50: [[840, 765, 700, 630], [965, 885, 820, 755], [1085, 1010, 940, 875], [1210, 1130, 1065, 995]],
    65: [[1085, 1055, 1020, 985], [1445, 1330, 1230, 1130], [1775, 1660, 1560, 1460], [2105, 1995, 1895, 1795]],
    999: [[1155, 1100, 1050, 1000], [1600, 1470, 1360, 1250], [1950, 1840, 1725, 1615], [2315, 2205, 2095, 1985]] };
  const b = (eta, red, n) => B[[35, 50, 65, 999].find(e => eta <= e)][red <= 20000 ? 0 : red <= 40000 ? 1 : red <= 60000 ? 2 : 3][Math.min(n, 4) - 1];
  const atteso = (base, fam) => {
    const ok = f => !(f.tipo === 'figlio' && f.eta > 50) && !(f.tipo === 'genitore' && f.eta > 70 && !(f.aCarico && f.convivente));
    const altri = fam.filter(f => ok(f) && f.tipo !== 'coniuge' && !f.aCarico).length;
    let quote = [], tot = 0;
    for (const f of fam) {
      if (!ok(f)) continue;
      if (f.aCarico && f.tipo === 'genitore') tot += 500;
      else if (f.aCarico) quote.push(f.tipo === 'coniuge' ? 0.003 : 0.0025);
      else if (f.tipo === 'coniuge') {
        if (f.reddito <= 10000) tot += base * 0.003;
        else if ((f.eta < 35 && f.reddito > 40000) || (f.eta < 51 && f.reddito > 60000)) tot += b(f.eta, f.reddito, 1);
        else tot += A.find(r => f.reddito <= r[0])[1];
      } else tot += b(f.eta, f.reddito, altri);
    }
    quote.sort((x, y) => y - x);
    return Math.round((tot + quote.slice(0, 3).reduce((s, q) => s + base * q, 0)) * 100) / 100;
  };
  let seme = 20261110, casi = 0;
  const caso = (n) => { seme = (seme * 1103515245 + 12345) % 2147483648; return seme % n; };
  for (let k = 0; k < 4000; k++) {
    const base = 15000 + caso(90) * 1000, fam = [];
    for (let i = caso(6); i > 0; i--) {
      const tipo = ['coniuge', 'figlio', 'figlioInabile', 'genitore'][caso(4)];
      if (tipo === 'coniuge' && fam.some(f => f.tipo === 'coniuge')) continue;
      fam.push({ tipo, aCarico: caso(2) === 1, convivente: caso(2) === 1, eta: [18, 30, 34, 35, 36, 45, 50, 51, 60, 65, 66, 70, 71, 85][caso(14)],
        reddito: [0, 5000, 10000, 10001, 15000, 20000, 20001, 30000, 40000, 40001, 50000, 60000, 60001, 90000][caso(14)] });
    }
    assert.equal(C.contributiFamiliari(base, fam).totale, atteso(base, fam), JSON.stringify({ base, fam }));
    casi++;
  }
  assert.equal(casi, 4000);
});

test('genitori a carico, limiti di età e polizza facoltativa', () => {
  const r = C.contributiFamiliari(40000, [
    { tipo: 'genitore', aCarico: true, eta: 68 },
    { tipo: 'genitore', aCarico: true, eta: 82, convivente: true },
    { tipo: 'genitore', aCarico: false, eta: 75, reddito: 18000 },
    { tipo: 'figlio', aCarico: false, eta: 51, reddito: 30000 },
  ]);
  assert.equal(r.righe[0].importo, 500);
  assert.equal(r.righe[1].importo, 500);
  assert.equal(r.righe[2].iscrivibile, false);
  assert.equal(r.righe[3].iscrivibile, false);
  assert.equal(r.totale, 1000);
});

test('altri familiari non a carico: la colonna dipende da quanti sono', () => {
  const r = C.contributiFamiliari(40000, [
    { tipo: 'figlio', aCarico: false, eta: 28, reddito: 25000 },
    { tipo: 'genitore', aCarico: false, eta: 66, reddito: 15000 },
  ]);
  assert.deepEqual(r.righe.map(x => x.importo), [555, 1100]);
});

test('contributo di costituzione della riserva (articolo 17, comma 5)', () => {
  assert.equal(C.contributoRiserva('caspop').importo, 360);
  assert.equal(C.contributoRiserva('fas').importo, 600);
  assert.equal(C.contributoRiserva('fiam').importo, 460);
  assert.equal(C.contributoRiserva('cma').importo, 0);
  assert.equal(C.contributoRiserva('polizza').importo, 980);
  assert.equal(C.contributoRiserva('assunto2627').importo, 0);
  assert.equal(C.contributoRiserva('fas').rataAnnua, 200);
  // 980 meno la riserva pro capite implicita di ciascuna forma
  assert.equal(C.RISERVA_PRO_CAPITE - C.contributoRiserva('polizza').importo, 0);
});

test('sanatoria dei non iscritti (articolo 12, commi 8 e 9)', () => {
  assert.equal(C.sanatoria('2027', 'fas', 4).totale, 2500);
  assert.equal(C.sanatoria('2027', 'caspop', 4).totale, 1500);
  assert.equal(C.sanatoria('2028', 'fas', 4).totale, 3100);
  assert.equal(C.sanatoria('2028', 'cma', 2).totale, 2000);
  assert.equal(C.sanatoria('2028', 'fiam', 0).rataAnnua, 490);
});
