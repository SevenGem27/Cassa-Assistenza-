/* Regole di calcolo dei contributi, come scritte nell'accordo del 10 novembre 2026
   (articoli 11, 12, 15, 16, 17 e allegati 1 e 2). Nessuna dipendenza: gira nel browser e in Node.
   I numeri stanno in contenuti/contributi.json, le frasi in contenuti/testi.json (sezione "calcolo"):
   qui c'è solo la logica.  Uso:  var C = Calcolo.con(contributi, testi.calcolo); */
(function (root) {
  'use strict';

  function senzaLimite(lista) { // in JSON "fino": null vuol dire senza limite superiore
    return lista.map(function (r) { var c = {}; for (var k in r) c[k] = r[k]; c.fino = r.fino == null ? Infinity : r.fino; return c; });
  }
  function riempi(modello, valori) {
    return String(modello).replace(/\{(\w+)\}/g, function (tutto, k) { return valori && k in valori ? valori[k] : tutto; });
  }
  function percento(al) { return (Math.round(al * 10000) / 100).toFixed(2).replace('.', ','); } // 0.003 -> "0,30"
  function euroTesto(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; }
  function euro(n) { return Math.round(n * 100) / 100; }
  function fascia(lista, valore) {
    for (var i = 0; i < lista.length; i++) if (valore <= lista[i].fino) return i;
    return lista.length - 1;
  }

  function con(P, testi) {
    if (!P || !testi) throw new Error('Calcolo.con: mancano i parametri o i testi');
    var TX = function (k, v) { if (!(k in testi)) throw new Error('testo mancante: calcolo.' + k); return riempi(testi[k], v); };
    var TABELLA_A = senzaLimite(P.tabellaA);
    var TABELLA_B = { eta: senzaLimite(P.tabellaB.eta), reddito: senzaLimite(P.tabellaB.reddito), valori: P.tabellaB.valori };
    var ALIQUOTE = P.aliquoteSocio, FAM = P.familiariACarico, LIMITI = P.limitiEta, RIS = P.riserva, SANATORIA = P.sanatoria;

    function tabellaB(eta, reddito, nFamiliari) {
      var e = fascia(TABELLA_B.eta, eta), r = fascia(TABELLA_B.reddito, reddito);
      var n = Math.min(Math.max(nFamiliari || 1, 1), 4) - 1;
      return { importo: TABELLA_B.valori[e][r][n], eta: TABELLA_B.eta[e].etichetta, reddito: TABELLA_B.reddito[r].etichetta, colonna: n + 1 };
    }

    /* Contributo ordinario del socio. situazione: servizio | esodo | pensione2028 | pensioneAnte | superstite | invalidita */
    function contributoSocio(situazione, base) {
      if (situazione === 'pensioneAnte') return { importo: null, aliquota: null, rif: 16, nota: TX('pensioneAnte') };
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
        if (f.tipo === 'figlio' && eta > LIMITI.figlio) { r.iscrivibile = false; r.regola = TX('figlioNonIscrivibile', { eta: LIMITI.figlio }); }
        if (f.tipo === 'genitore' && eta > LIMITI.genitore && !(f.aCarico && f.convivente)) { r.iscrivibile = false; r.regola = TX('genitoreNonIscrivibile', { eta: LIMITI.genitore }); }
        if (!r.iscrivibile) r.note.push(TX('polizzaFacoltativa'));
      });

      // 1) Familiari fiscalmente a carico che pagano in percentuale: coniuge e figli (articolo 11, comma 4, lettera a).
      var percentuale = righe.filter(function (r) {
        return r.iscrivibile && r.f.aCarico && (r.f.tipo === 'coniuge' || r.f.tipo === 'figlio' || r.f.tipo === 'figlioInabile');
      });
      percentuale.forEach(function (r) {
        r.aliquota = r.f.tipo === 'coniuge' ? FAM.coniuge : FAM.figlio;
        r.importo = euro(base * r.aliquota);
        r.regola = TX('percentuale', { aliquota: percento(r.aliquota) });
      });
      // Il contributo è dovuto al massimo per alcuni di loro: qui si contano i più costosi (ipotesi prudente).
      percentuale.slice().sort(function (a, b) { return b.aliquota - a.aliquota || a.i - b.i; }).forEach(function (r, pos) {
        if (pos >= FAM.massimoPaganti) { r.importo = 0; r.regola = TX('oltreIlTetto'); }
      });

      // 1 bis) Coniuge non a carico nel primo scaglione della Tabella A: "come a carico".
      //        Resta fuori dal tetto, che l'accordo riferisce ai familiari fiscalmente a carico (ipotesi prudente).
      righe.forEach(function (r) {
        var f = r.f;
        if (!r.iscrivibile || f.tipo !== 'coniuge' || f.aCarico || Number(f.reddito || 0) > TABELLA_A[0].fino) return;
        r.aliquota = FAM.coniuge;
        r.importo = euro(base * FAM.coniuge);
        r.regola = TX('coniugeComeACarico', { fascia: TABELLA_A[0].etichetta, aliquota: percento(FAM.coniuge) });
      });

      // 2) Genitori e ascendenti a carico: importo fisso l'anno.
      righe.forEach(function (r) {
        if (r.iscrivibile && r.f.tipo === 'genitore' && r.f.aCarico) { r.importo = FAM.genitoreAnnuo; r.regola = TX('genitoreACarico', { importo: euroTesto(FAM.genitoreAnnuo) }); }
      });

      // 3) Coniuge non a carico oltre il primo scaglione: Tabella A, salvo le eccezioni per età (Tabella B, colonna 1).
      righe.forEach(function (r) {
        var f = r.f;
        if (!r.iscrivibile || f.tipo !== 'coniuge' || f.aCarico) return;
        var red = Number(f.reddito || 0), eta = Number(f.eta);
        if (red <= TABELLA_A[0].fino) return;
        var eccezione = P.coniugeInTabellaB.filter(function (x) { return eta < x.etaSotto && red > x.redditoOltre; })[0];
        if (eccezione) {
          var b = tabellaB(eta, red, 1);
          r.importo = b.importo;
          r.regola = TX('coniugeTabellaB', { eta: b.eta, reddito: b.reddito });
          r.note.push(TX('coniugeTabellaBNota', { eta: eccezione.etaSotto, reddito: euroTesto(eccezione.redditoOltre) }));
        } else {
          var a = TABELLA_A[fascia(TABELLA_A, red)];
          r.importo = a.annuo;
          r.regola = TX('tabellaA', { fascia: a.etichetta });
        }
      });

      // 4) Altri familiari non a carico: Tabella B, colonna in base a quanti sono.
      var altri = righe.filter(function (r) {
        return r.iscrivibile && r.f.tipo !== 'coniuge' && !r.f.aCarico;
      });
      altri.forEach(function (r) {
        var b = tabellaB(Number(r.f.eta), Number(r.f.reddito || 0), altri.length);
        r.importo = b.importo;
        var colonna = b.colonna === 4 ? TX('colonnaUltima', { n: 4 }) : b.colonna === 1 ? TX('colonnaUno') : TX('colonnaPiu', { n: b.colonna });
        r.regola = TX('tabellaB', { colonna: colonna, eta: b.eta, reddito: b.reddito });
      });

      var totale = righe.reduce(function (s, r) { return s + (r.iscrivibile ? r.importo : 0); }, 0);
      return { righe: righe, totale: euro(totale) };
    }

    /* Contributo una tantum di costituzione della riserva, per provenienza. */
    function contributoRiserva(provenienza) {
      if (!(provenienza in RIS.perProvenienza)) return null;
      var imp = RIS.perProvenienza[provenienza];
      return { importo: imp, rataAnnua: euro(imp / RIS.rateMassime), rateMax: RIS.rateMassime, conguaglio: RIS.conguaglio.indexOf(provenienza) >= 0 };
    }

    /* Sanatoria per i dipendenti non iscritti a nessuna forma (articolo 12, commi 8 e 9).
       finestra: '2027' oppure '2028'. forma: quella a cui si sarebbe potuto aderire (cma | fas | caspop | fiam). */
    function sanatoria(finestra, forma, anniNonIscritto) {
      var anni = Math.max(0, Math.floor(Number(anniNonIscritto) || 0));
      var perAnni = SANATORIA.senzaQuotaAnnuaPer.indexOf(forma) >= 0 ? 0 : anni * SANATORIA.perAnno;
      var riserva = finestra === '2028' && forma in RIS.perProvenienza ? RIS.perProvenienza[forma] : 0;
      var totale = SANATORIA.base + perAnni + riserva;
      return { base: SANATORIA.base, perAnni: perAnni, riserva: riserva, totale: totale, rataAnnua: euro(totale / SANATORIA.rate), rateMax: SANATORIA.rate };
    }

    return {
      TABELLA_A: TABELLA_A, TABELLA_B: TABELLA_B, ALIQUOTE: ALIQUOTE, AZIENDA_ANNUO: P.aziendaAnnuo,
      RISERVA: RIS.perProvenienza, RISERVA_PRO_CAPITE: RIS.proCapite, RATE_RISERVA: RIS.rateMassime, SANATORIA: SANATORIA,
      tabellaB: tabellaB, contributoSocio: contributoSocio, contributiFamiliari: contributiFamiliari,
      contributoRiserva: contributoRiserva, sanatoria: sanatoria
    };
  }

  var api = { con: con, riempi: riempi };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Calcolo = api;
})(typeof self !== 'undefined' ? self : this);
