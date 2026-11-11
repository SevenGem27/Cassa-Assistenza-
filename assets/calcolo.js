/* Regole di calcolo dei contributi, come scritte nell'accordo del 10 novembre 2026
   (articoli 11, 12, 15, 16, 17 e allegati 1 e 2). Nessuna dipendenza: gira nel browser e in Node. */
(function (root) {
  'use strict';

  // Allegato 1, Tabella A: coniuge e assimilati non a carico, per reddito del familiare.
  var TABELLA_A = [
    { fino: 10000, annuo: null, etichetta: 'fino a 10.000 €' }, // come a carico: 0,30% sulla base del socio
    { fino: 15000, annuo: 300, etichetta: '10.001 - 15.000 €' },
    { fino: 30000, annuo: 420, etichetta: '15.001 - 30.000 €' },
    { fino: 40000, annuo: 600, etichetta: '30.001 - 40.000 €' },
    { fino: 50000, annuo: 840, etichetta: '40.001 - 50.000 €' },
    { fino: 60000, annuo: 1080, etichetta: '50.001 - 60.000 €' },
    { fino: Infinity, annuo: 1440, etichetta: 'oltre 60.000 €' }
  ];

  // Allegato 2, Tabella B: altri familiari non a carico.
  // valori[fascia d'età][fascia di reddito][numero di familiari: 1, 2, 3, 4 o più]
  var TABELLA_B = {
    eta: [{ fino: 35, etichetta: 'fino a 35 anni' }, { fino: 50, etichetta: '36 - 50 anni' }, { fino: 65, etichetta: '51 - 65 anni' }, { fino: Infinity, etichetta: '66 anni e oltre' }],
    reddito: [{ fino: 20000, etichetta: 'fino a 20.000 €' }, { fino: 40000, etichetta: '20.000 - 40.000 €' }, { fino: 60000, etichetta: '40.000 - 60.000 €' }, { fino: Infinity, etichetta: 'oltre 60.000 €' }],
    valori: [
      [[500, 455, 430, 400], [605, 555, 515, 470], [705, 655, 615, 570], [805, 775, 715, 670]],
      [[840, 765, 700, 630], [965, 885, 820, 755], [1085, 1010, 940, 875], [1210, 1130, 1065, 995]],
      [[1085, 1055, 1020, 985], [1445, 1330, 1230, 1130], [1775, 1660, 1560, 1460], [2105, 1995, 1895, 1795]],
      [[1155, 1100, 1050, 1000], [1600, 1470, 1360, 1250], [1950, 1840, 1725, 1615], [2315, 2205, 2095, 1985]]
    ]
  };

  var ALIQUOTE = { servizio: 0.014, esodo: 0.014, superstite: 0.014, pensione2028: 0.021, invalidita: 0.014 };
  var AZIENDA_ANNUO = 1300;
  var RISERVA_PRO_CAPITE = 980;
  var RISERVA = { cma: 0, fas: 600, caspop: 360, fiam: 460, polizza: 980, assunto2627: 0 };
  var SANATORIA = { base: 1500, perAnno: 250, familiare: 2000, rate: 4 };

  function fascia(lista, valore) {
    for (var i = 0; i < lista.length; i++) if (valore <= lista[i].fino) return i;
    return lista.length - 1;
  }
  function euro(n) { return Math.round(n * 100) / 100; }

  function tabellaB(eta, reddito, nFamiliari) {
    var e = fascia(TABELLA_B.eta, eta), r = fascia(TABELLA_B.reddito, reddito);
    var n = Math.min(Math.max(nFamiliari || 1, 1), 4) - 1;
    return { importo: TABELLA_B.valori[e][r][n], eta: TABELLA_B.eta[e].etichetta, reddito: TABELLA_B.reddito[r].etichetta, colonna: n + 1 };
  }

  /* Contributo ordinario del socio. situazione: servizio | esodo | pensione2028 | pensioneAnte | superstite | invalidita */
  function contributoSocio(situazione, base) {
    if (situazione === 'pensioneAnte') {
      return { importo: null, aliquota: null, rif: 16, nota: 'In sostanziale continuità con quanto versi oggi alla tua forma, e comunque non meno di quanto versato al 31 dicembre 2027.' };
    }
    var al = ALIQUOTE[situazione];
    if (al == null) throw new Error('situazione non prevista: ' + situazione);
    return { importo: euro((Number(base) || 0) * al), aliquota: al, rif: situazione === 'pensione2028' ? 16 : 15 };
  }

  /* Familiari. Ognuno: { tipo: coniuge | figlio | figlioInabile | genitore, aCarico, eta, reddito, convivente } */
  function contributiFamiliari(base, familiari) {
    base = Number(base) || 0;
    var righe = (familiari || []).map(function (f, i) {
      return { i: i, f: f, tipo: f.tipo, importo: 0, regola: '', note: [], iscrivibile: true };
    });

    righe.forEach(function (r) {
      var f = r.f, eta = Number(f.eta);
      if (f.tipo === 'figlio' && eta > 50) { r.iscrivibile = false; r.regola = 'Non iscrivibile: figli fino a 50 anni'; }
      if (f.tipo === 'genitore' && eta > 70 && !(f.aCarico && f.convivente)) { r.iscrivibile = false; r.regola = 'Non iscrivibile: genitori fino a 70 anni, senza limite solo se conviventi e a carico'; }
      if (!r.iscrivibile) r.note.push('Può aderire alla polizza facoltativa, a proprie spese (articolo 11, comma 9).');
    });

    // 1) Familiari fiscalmente a carico che pagano in percentuale: coniuge 0,30%, figli 0,25% (articolo 11, comma 4, lettera a).
    var percentuale = righe.filter(function (r) {
      return r.iscrivibile && r.f.aCarico && (r.f.tipo === 'coniuge' || r.f.tipo === 'figlio' || r.f.tipo === 'figlioInabile');
    });
    percentuale.forEach(function (r) {
      r.aliquota = r.f.tipo === 'coniuge' ? 0.003 : 0.0025;
      r.importo = euro(base * r.aliquota);
      r.regola = (r.f.tipo === 'coniuge' ? '0,30%' : '0,25%') + ' della tua base di calcolo';
    });
    // Il contributo è dovuto al massimo per tre di loro: qui si contano i tre più costosi (ipotesi prudente).
    percentuale.slice().sort(function (a, b) { return b.aliquota - a.aliquota || a.i - b.i; }).forEach(function (r, pos) {
      if (pos >= 3) { r.importo = 0; r.regola = 'Non dovuto: dal quarto familiare a carico non si paga'; }
    });

    // 1 bis) Coniuge non a carico con reddito fino a 10.000 €: Tabella A, "come a carico", cioè 0,30%.
    //        Resta fuori dal tetto dei tre, che l'accordo riferisce ai familiari fiscalmente a carico (ipotesi prudente).
    righe.forEach(function (r) {
      var f = r.f;
      if (!r.iscrivibile || f.tipo !== 'coniuge' || f.aCarico || Number(f.reddito || 0) > TABELLA_A[0].fino) return;
      r.aliquota = 0.003;
      r.importo = euro(base * 0.003);
      r.regola = 'Tabella A (reddito fino a 10.000 €): come a carico, 0,30% della tua base di calcolo';
    });

    // 2) Genitori e ascendenti a carico: 500 € l'anno.
    righe.forEach(function (r) {
      if (r.iscrivibile && r.f.tipo === 'genitore' && r.f.aCarico) { r.importo = 500; r.regola = '500 € l’anno (genitore o ascendente a carico)'; }
    });

    // 3) Coniuge non a carico con reddito oltre 10.000 €: Tabella A, salvo le due eccezioni per età.
    righe.forEach(function (r) {
      var f = r.f;
      if (!r.iscrivibile || f.tipo !== 'coniuge' || f.aCarico) return;
      var red = Number(f.reddito || 0), eta = Number(f.eta);
      if (red <= TABELLA_A[0].fino) return;
      if ((eta < 35 && red > 40000) || (eta < 51 && red > 60000)) {
        var b = tabellaB(eta, red, 1);
        r.importo = b.importo;
        r.regola = 'Tabella B, colonna 1 familiare (' + b.eta + ', reddito ' + b.reddito + ')';
        r.note.push(eta < 35 ? 'Coniuge sotto i 35 anni con reddito oltre 40.000 €: si applica la Tabella B.' : 'Coniuge sotto i 51 anni con reddito oltre 60.000 €: si applica la Tabella B.');
      } else {
        var a = TABELLA_A[fascia(TABELLA_A, red)];
        r.importo = a.annuo;
        r.regola = 'Tabella A (reddito ' + a.etichetta + ')';
      }
    });

    // 4) Altri familiari non a carico: Tabella B, colonna in base a quanti sono.
    var altri = righe.filter(function (r) {
      return r.iscrivibile && r.f.tipo !== 'coniuge' && !r.f.aCarico;
    });
    altri.forEach(function (r) {
      var b = tabellaB(Number(r.f.eta), Number(r.f.reddito || 0), altri.length);
      r.importo = b.importo;
      r.regola = 'Tabella B, colonna ' + (b.colonna === 4 ? '4 o più familiari' : b.colonna + (b.colonna === 1 ? ' familiare' : ' familiari')) + ' (' + b.eta + ', reddito ' + b.reddito + ')';
    });

    var totale = righe.reduce(function (s, r) { return s + (r.iscrivibile ? r.importo : 0); }, 0);
    return { righe: righe, totale: euro(totale) };
  }

  /* Contributo una tantum di costituzione della riserva, per provenienza. */
  function contributoRiserva(provenienza) {
    if (!(provenienza in RISERVA)) return null;
    var imp = RISERVA[provenienza];
    return { importo: imp, rataAnnua: euro(imp / 3), rateMax: 3, conguaglio: ['cma', 'fas', 'caspop', 'fiam'].indexOf(provenienza) >= 0 };
  }

  /* Sanatoria per i dipendenti non iscritti a nessuna forma (articolo 12, commi 8 e 9).
     finestra: '2027' oppure '2028'. forma: quella a cui si sarebbe potuto aderire (cma | fas | caspop | fiam). */
  function sanatoria(finestra, forma, anniNonIscritto) {
    var anni = Math.max(0, Math.floor(Number(anniNonIscritto) || 0));
    var perAnni = forma === 'caspop' ? 0 : anni * SANATORIA.perAnno;
    var riserva = finestra === '2028' && forma in RISERVA ? RISERVA[forma] : 0;
    var totale = SANATORIA.base + perAnni + riserva;
    return { base: SANATORIA.base, perAnni: perAnni, riserva: riserva, totale: totale, rataAnnua: euro(totale / SANATORIA.rate), rateMax: SANATORIA.rate };
  }

  var api = {
    TABELLA_A: TABELLA_A, TABELLA_B: TABELLA_B, ALIQUOTE: ALIQUOTE, AZIENDA_ANNUO: AZIENDA_ANNUO,
    RISERVA: RISERVA, RISERVA_PRO_CAPITE: RISERVA_PRO_CAPITE, SANATORIA: SANATORIA,
    tabellaB: tabellaB, contributoSocio: contributoSocio, contributiFamiliari: contributiFamiliari,
    contributoRiserva: contributoRiserva, sanatoria: sanatoria
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calcolo = api;
})(typeof self !== 'undefined' ? self : this);
