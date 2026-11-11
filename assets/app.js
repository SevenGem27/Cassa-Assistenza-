/* Nuova Cassa: logica dell'app. Niente framework: viste generate da contenuti.js. */
(function () {
  'use strict';

  var D = window.CASSA;
  var C = window.Calcolo;
  var CFG = window.CASSA_CONFIG || {};
  var ANTEPRIMA = !!window.CASSA_ANTEPRIMA;
  var vista = document.getElementById('vista');

  /* ---------- utilità ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var memoria = {
    leggi: function (k, d) { try { var v = localStorage.getItem('cassa.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    scrivi: function (k, v) { try { localStorage.setItem('cassa.' + k, JSON.stringify(v)); } catch (e) { /* senza memoria si va avanti lo stesso */ } }
  };
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var MESI3 = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  function dataDa(iso) { var p = iso.slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function oggi() { var n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
  function giorniA(iso) { return Math.round((dataDa(iso) - oggi()) / 864e5); }
  function giornoTesto(d) { return d.getDate() === 1 ? '1°' : String(d.getDate()); }
  function dataLunga(iso) { var d = dataDa(iso); return giornoTesto(d) + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear(); }
  function dataBreve(iso) { var d = dataDa(iso); return d.getDate() + ' ' + MESI3[d.getMonth()] + ' ' + d.getFullYear(); }
  function traQuanto(iso) {
    var n = giorniA(iso);
    if (n === 0) return 'oggi';
    if (n === 1) return 'domani';
    if (n === -1) return 'ieri';
    if (n < 0) return (-n) + ' giorni fa';
    if (n < 75) return 'tra ' + n + ' giorni';
    if (n < 700) return 'tra circa ' + Math.round(n / 30.44) + ' mesi';
    return 'tra circa ' + (Math.round(n / 36.525) / 10).toLocaleString('it-IT') + ' anni';
  }
  function euro(n, dec) { // 1.300 € e 1.935,50 €: il punto per le migliaia anche sulle quattro cifre
    var parti = Math.abs(Number(n) || 0).toFixed(dec ? 2 : 0).split('.');
    parti[0] = parti[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '-' : '') + parti.join(',') + ' €';
  }
  function senzaAccenti(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'"); }
  function oraLocale(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var stesso = d.toDateString() === new Date().toDateString();
    var ora = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    return stesso ? 'oggi alle ' + ora : d.getDate() + ' ' + MESI[d.getMonth()] + ' alle ' + ora;
  }
  var FRECCIA = '<svg class="freccia" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- riferimenti agli articoli ---------- */
  var ART = {};
  D.articoli.forEach(function (a) { ART[a.n] = a; });
  function rifLink(r) {
    if (typeof r === 'number') return '<a class="rif" href="#art-' + r + '">art. ' + r + '</a>';
    if (r === 'premesse') return '<a class="rif" href="#premesse">premesse</a>';
    if (r === 'lettera') return '<a class="rif" href="#lettera">lettera d’impegno</a>';
    if (r === 'tabella-a') return '<a class="rif" href="#tabella-a">Tabella A</a>';
    if (r === 'tabella-b') return '<a class="rif" href="#tabella-b">Tabella B</a>';
    return '';
  }
  function rifs(lista, norma) {
    var h = (lista || []).map(rifLink).join('');
    if (norma) h += '<a class="rif" href="#norme">norma di legge</a>';
    return h ? '<p class="rifs">' + h + '</p>' : '';
  }
  // Trasforma "art. 12", "articoli 15 e 16", "artt. 8, 9 e 10" in collegamenti, lasciando stare le norme esterne.
  var RE_ART = /\b(art(?:icol[oi]|t)?\.?)(\s+)(\d{1,2}(?:\s*,\s*\d{1,2})*(?:\s+e\s+\d{1,2})?)(?![\d.]*\d)/gi;
  var RE_ESTERNO = /TUIR|Codice Civile|c\.c\.|D\.M\.|del 30 luglio 2025/;
  function collegaArticoli(testoEsc) {
    return testoEsc.replace(RE_ART, function (tutto, parola, spazio, numeri, pos, intera) {
      if (RE_ESTERNO.test(intera.slice(pos + tutto.length, pos + tutto.length + 90).split(/[;]|\.\s/)[0])) return tutto;
      var ok = false;
      var nn = numeri.replace(/\d{1,2}/g, function (n) {
        if (ART[+n]) { ok = true; return '<a href="#art-' + (+n) + '">' + n + '</a>'; }
        return n;
      });
      return ok ? parola + spazio + nn : tutto;
    });
  }

  /* ---------- tappe ---------- */
  function statoTappa(t) {
    var o = oggi(), d = dataDa(t.d), f = t.fine ? dataDa(t.fine) : d;
    if (t.fatto) return 'fatto';
    if (t.tipo === 'periodo') return o < d ? 'futuro' : (o <= f ? 'corso' : 'passato');
    if (t.tipo === 'dal') return o >= d ? 'vigore' : 'futuro';
    return d < o ? 'passato' : 'futuro';
  }
  function quando(t) {
    if (t.etichetta) return t.etichetta;
    var d = dataDa(t.d);
    if (t.tipo === 'entro') return t.mese ? 'entro ' + MESI[d.getMonth()] + ' ' + d.getFullYear() : 'entro il ' + dataLunga(t.d);
    if (t.tipo === 'dal') return 'dal ' + dataLunga(t.d);
    return dataLunga(t.d);
  }
  function timbro(t, opz) {
    opz = opz || {};
    var d = dataDa(t.d), st = statoTappa(t);
    var cls = st === 'fatto' || st === 'vigore' ? 'fatto' : st === 'corso' ? 'corso' : st === 'passato' ? 'passato' : opz.prossimo ? 'prossimo' : '';
    var pre = t.tipo === 'entro' ? 'entro' : t.tipo === 'dal' ? 'dal' : t.tipo === 'periodo' && !/^nel corso/.test(t.etichetta || '') ? 'da' : '';
    var soloAnno = /^nel corso/.test(t.etichetta || '');
    var giorno = t.mese || t.tipo === 'periodo' ? '' : d.getDate();
    var h = '<div class="timbro ' + cls + (opz.grande ? ' grande' : '') + (opz.premi ? ' premi' : '') + '" aria-hidden="true">';
    if (pre) h += '<span class="pre">' + pre + '</span>';
    if (soloAnno) h += '<span class="g">' + d.getFullYear() + '</span>';
    else {
      if (giorno !== '') h += '<span class="g">' + giorno + '</span>';
      h += '<span class="m">' + MESI3[d.getMonth()] + '</span><span class="a">' + d.getFullYear() + '</span>';
    }
    return h + '</div>';
  }
  function tappeFuture() {
    return D.tappe.filter(function (t) { return !t.fatto && giorniA(t.fine || t.d) >= 0; })
      .sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }
  function prossimaScadenza() {
    return tappeFuture().filter(function (t) { return t.tipo === 'entro' && t.cat !== 'norme' && giorniA(t.d) >= 0; })[0];
  }

  /* ---------- novità ---------- */
  var novita = { voci: [], fonti: [], ultimo: null, errore: false, caricate: false };
  function nomeFonte(v) {
    if (v.nomeFonte) return v.nomeFonte;
    var f = D.fonti.filter(function (x) { return x.id === v.fonte; })[0];
    return f ? f.nome : v.fonte;
  }
  function categoriaVoce(v) {
    if (v.categoria) return v.categoria;
    var f = D.fonti.filter(function (x) { return x.id === v.fonte; })[0];
    return f ? f.categoria : 'norme';
  }
  function urlSicuro(u) { return /^https?:\/\//i.test(u || '') ? u : '#novita'; }
  function nonLette() {
    var visto = memoria.leggi('visto', null);
    if (!visto) return 0;
    return novita.voci.filter(function (v) { return v.pertinente && (v.trovato || v.data) > visto; }).length;
  }
  function aggiornaPallino() {
    var n = nonLette(), p = document.getElementById('pallino');
    p.hidden = !n;
    p.textContent = n > 99 ? '99+' : String(n);
    try {
      if (navigator.setAppBadge) { var pr = n ? navigator.setAppBadge(n) : navigator.clearAppBadge(); if (pr && pr.catch) pr.catch(function () {}); }
    } catch (e) { /* non tutti i telefoni hanno il contatore sull'icona */ }
  }
  function applicaNovita(n, s) {
    novita.voci = ((n && n.voci) || []).slice().sort(function (a, b) { return (b.data || b.trovato) < (a.data || a.trovato) ? -1 : 1; });
    novita.fonti = (s && s.fonti) || [];
    novita.ultimo = (s && s.ultimoControllo) || null;
    novita.caricate = true;
    if (!memoria.leggi('visto', null)) memoria.scrivi('visto', new Date().toISOString());
    aggiornaPallino();
  }
  function caricaNovita() {
    if (ANTEPRIMA || !window.fetch) { applicaNovita(window.CASSA_NOVITA, window.CASSA_STATO); return Promise.resolve(); }
    var json = function (u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };
    return Promise.all([json('data/news.json'), json('data/status.json')]).then(function (r) {
      novita.errore = false;
      applicaNovita(r[0], r[1]);
    }).catch(function () {
      novita.errore = true;
      if (!novita.caricate) applicaNovita(window.CASSA_NOVITA, window.CASSA_STATO);
    });
  }
  function rigaNovita(v, soglia) {
    var nuova = soglia && v.pertinente && (v.trovato || v.data) > soglia;
    var quandoTxt = v.data ? dataBreve(v.data) : '';
    return '<li><a class="riga' + (nuova ? ' nuova' : '') + '" href="' + esc(urlSicuro(v.url)) + '" target="_blank" rel="noopener">' +
      '<span class="fonte">' + esc(nomeFonte(v)) + '</span>' +
      '<span class="corpo"><span class="tit">' + esc(v.titolo) + '</span>' +
      '<span class="det">' + esc(quandoTxt) + (v.pertinente ? '' : ', altro argomento') + '</span></span>' + FRECCIA + '</a></li>';
  }

  /* ---------- viste ---------- */
  function vOggi() {
    var p = prossimaScadenza();
    var fut = tappeFuture().filter(function (t) { return t !== p && t.tipo !== 'periodo'; }).slice(0, 4);
    var h = '<section class="blocco"><p class="piccolo">Accordo firmato il ' + dataLunga(D.meta.firmato) + '</p><h1 class="t1">La prossima scadenza</h1>';
    if (p) {
      h += '<a class="prossima" href="#tappe">' + timbro(p, { grande: true, prossimo: true, premi: true }) +
        '<span><span class="quando">' + esc(traQuanto(p.d)) + '</span><span class="cosa">' + esc(p.titolo) + '</span>' +
        '<span class="piccolo">' + esc(quando(p)) + (p.rif && typeof p.rif[0] === 'number' ? ', articolo ' + p.rif[0] : '') + '</span></span></a>';
    } else {
      h += '<p class="nota">Non ci sono altre scadenze in calendario.</p>';
    }
    h += '</section>';

    if (fut.length) {
      h += '<section class="blocco"><h2 class="t2">Subito dopo</h2><ul class="righe">' + fut.map(function (t) {
        return '<li><a class="riga" href="#tappe"><span class="corpo"><span class="tit">' + esc(t.titolo) + '</span><span class="det">' + esc(quando(t)) + '</span></span><span class="lato">' + esc(traQuanto(t.d)) + '</span></a></li>';
      }).join('') + '</ul><p><a class="btn chiaro" href="#tappe">Tutte le tappe</a></p></section>';
    }

    var ultime = novita.voci.filter(function (v) { return v.pertinente; }).slice(0, 3);
    h += '<section class="blocco"><h2 class="t2">Novità</h2>';
    if (ultime.length) h += '<ul class="righe">' + ultime.map(function (v) { return rigaNovita(v, memoria.leggi('visto', null)); }).join('') + '</ul>';
    else h += '<p class="piccolo">' + (novita.caricate ? 'Nessuna novità per ora.' : 'Carico le novità.') + '</p>';
    h += '<p class="piccolo">' + esc(testoControllo()) + '</p><p><a class="btn chiaro" href="#novita">Tutte le novità</a></p></section>';

    h += '<section class="blocco"><h2 class="t2">L’accordo in cifre</h2><div class="cifre">' + D.cifre.map(function (c) {
      return '<a href="#art-' + c.a + '"><b>' + esc(c.v) + '</b><span>' + esc(c.t) + '</span></a>';
    }).join('') + '</div></section>';

    h += '<section class="blocco"><h2 class="t2">Per orientarti</h2><ul class="righe">' +
      voceMenu('per-me', 'Che cosa cambia per me', 'In base a dove lavori e a quale forma sei iscritto') +
      voceMenu('simulatore', 'Calcola i tuoi contributi', 'Per te e per i tuoi familiari, dal 2028') +
      voceMenu('casse', 'Le casse di oggi e i loro statuti', 'CMA, FAS, FIAM, ex CASPOP') +
      voceMenu('norme', 'Normativa sulle casse di assistenza', 'E la riforma in discussione') +
      '</ul></section>';
    h += schedaInstalla();
    return h;
  }
  function voceMenu(id, tit, det) {
    return '<li><a class="riga" href="#' + id + '"><span class="corpo"><span class="tit">' + esc(tit) + '</span>' + (det ? '<span class="det">' + esc(det) + '</span>' : '') + '</span>' + FRECCIA + '</a></li>';
  }
  function testoControllo() {
    if (ANTEPRIMA) return 'Anteprima: elenco aggiornato al ' + dataLunga(D.meta.contenutiAl) + '. Il controllo automatico parte quando l’app è pubblicata.';
    if (novita.errore && !navigator.onLine) return 'Sei senza rete: vedi le ultime novità salvate.';
    if (!novita.ultimo) return 'Il primo controllo automatico delle fonti non è ancora avvenuto.';
    return 'Ultimo controllo delle fonti: ' + oraLocale(novita.ultimo) + '.';
  }

  var filtroTappe = memoria.leggi('filtroTappe', 'tutte');
  var mostraStoria = false;
  function vTappe() {
    var cats = [{ id: 'tutte', nome: 'Tutte' }].concat(D.categorieTappe);
    var h = '<section class="blocco"><h1 class="t1">Le tappe</h1><p class="sotto">Dalla firma alla Cassa a regime. Ogni data rimanda all’articolo che la fissa.</p>' +
      '<div class="filtri" role="group" aria-label="Filtra le tappe">' + cats.map(function (c) {
        return '<button class="filtro" data-az="filtro-tappe" data-v="' + c.id + '" aria-pressed="' + (filtroTappe === c.id) + '">' + esc(c.nome) + '</button>';
      }).join('') + '</div></section>';

    var lista = D.tappe.filter(function (t) {
      if (t.cat === 'storia') return mostraStoria && filtroTappe === 'tutte';
      return filtroTappe === 'tutte' || t.cat === filtroTappe;
    }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });

    var p = prossimaScadenza(), anno = null;
    h += '<section>';
    if (filtroTappe === 'tutte') h += '<p><button class="btn chiaro stretto" data-az="storia">' + (mostraStoria ? 'Nascondi il percorso fino alla firma' : 'Mostra il percorso fino alla firma') + '</button></p>';
    lista.forEach(function (t) {
      var a = t.d.slice(0, 4);
      if (a !== anno) { anno = a; h += '<h2 class="anno">' + a + '</h2>'; }
      var st = statoTappa(t), segni = '';
      if (st === 'fatto') segni += '<span class="segno">fatto</span> ';
      if (st === 'vigore') segni += '<span class="segno">in vigore</span> ';
      if (st === 'corso') segni += '<span class="segno">in corso</span> ';
      if (st === 'passato' && t.tipo === 'entro') segni += '<span class="segno rosso">data passata: verifica nelle novità</span> ';
      if (t === p) segni += '<span class="segno rosso">' + esc(traQuanto(t.d)) + '</span> ';
      if (t.calcolata) segni += '<span class="segno neutro">data calcolata: ' + esc(t.calcolata) + '</span> ';
      if (t.indicativa) segni += '<span class="segno neutro">data indicativa</span> ';
      if (t.cat === 'norme') segni += '<span class="segno neutro">obbligo di legge, non dell’accordo</span> ';
      h += '<article class="tappa' + (st === 'fatto' ? ' e-fatta' : '') + '" id="t-' + t.id + '">' + timbro(t, { prossimo: t === p }) +
        '<div class="corpo"><p class="quando">' + esc(quando(t)) + '</p><h3 class="tit">' + esc(t.titolo) + '</h3><p class="txt">' + esc(t.testo) + '</p>' +
        (segni ? '<p class="rifs">' + segni + '</p>' : '') + rifs(t.rif, t.norma) + '</div></article>';
    });
    if (!lista.length) h += '<p class="nota">Nessuna tappa in questa categoria.</p>';
    h += '</section>';

    h += '<section class="blocco"><h2 class="t2">Sempre, lungo il percorso</h2><ul class="righe">' + D.ricorrenti.map(function (r) {
      return '<li><div class="riga"><span class="corpo"><span class="tit">' + esc(r.titolo) + '</span><span class="det">' + esc(r.testo) + '</span>' + rifs(r.rif) + '</span></div></li>';
    }).join('') + '</ul></section>';

    h += '<section class="blocco nota"><h2 class="t3">Le scadenze nel tuo calendario</h2>';
    if (ANTEPRIMA) h += '<p>Nell’app pubblicata qui trovi il file da aggiungere al calendario del telefono, con un promemoria una settimana prima di ogni scadenza.</p>';
    else h += '<p>Aggiungi tutte le scadenze al calendario del telefono, con un promemoria una settimana prima.</p><p class="azioni"><a class="btn stretto" href="data/scadenze.ics">Aggiungi al calendario</a></p>';
    h += '</section>';
    return h;
  }

  /* ----- accordo ----- */
  var domanda = '';
  function testoBlocchi(blocchi) { return blocchi.map(function (b) { return b.x; }).join(' '); }
  function indiceRicerca() {
    if (indiceRicerca.c) return indiceRicerca.c;
    var v = [];
    v.push({ h: 'premesse', t: 'Premesse', s: D.premesse.testo.map(function (p) { return p.x; }).join(' ') + ' ' + D.premesse.punti.join(' ') });
    D.articoli.forEach(function (a) {
      v.push({ h: 'art-' + a.n, t: 'Articolo ' + a.n + ', ' + a.titolo, s: a.titolo + ' ' + testoBlocchi(a.blocchi) + ' ' + a.breve + ' ' + a.punti.join(' ') });
    });
    v.push({ h: 'lettera', t: 'Lettera d’impegno', s: testoBlocchi(D.lettera.blocchi) + ' ' + D.lettera.punti.join(' ') });
    v.push({ h: 'tabella-a', t: 'Tabella A', s: D.allegati.a.titolo + ' ' + D.allegati.a.note.join(' ') });
    v.push({ h: 'tabella-b', t: 'Tabella B', s: D.allegati.b.titolo + ' ' + D.allegati.b.note.join(' ') });
    D.tappe.forEach(function (t) { v.push({ h: 'tappe', t: 'Tappa: ' + t.titolo, s: t.titolo + ' ' + t.testo + ' ' + quando(t) }); });
    D.glossario.forEach(function (g) { v.push({ h: 'glossario', t: 'Glossario: ' + g.t, s: g.t + ' ' + g.d }); });
    D.norme.forEach(function (n) { v.push({ h: 'norme', t: 'Norma: ' + n.titolo, s: n.titolo + ' ' + n.fonte + ' ' + n.testo }); });
    D.casse.forEach(function (c) { v.push({ h: 'casse', t: 'Cassa: ' + c.sigla, s: c.sigla + ' ' + c.nome + ' ' + c.cosa + ' ' + c.destino }); });
    v.forEach(function (x) { x.n = senzaAccenti(x.s); });
    return (indiceRicerca.c = v);
  }
  function evidenzia(testo, q) {
    var n = senzaAccenti(testo), i = n.indexOf(q);
    if (i < 0) return esc(testo.slice(0, 140));
    var da = Math.max(0, i - 60), a = Math.min(testo.length, i + q.length + 90);
    return (da ? '…' : '') + esc(testo.slice(da, i)) + '<mark>' + esc(testo.slice(i, i + q.length)) + '</mark>' + esc(testo.slice(i + q.length, a)) + (a < testo.length ? '…' : '');
  }
  function risultati(q) {
    var qq = senzaAccenti(q.trim());
    if (qq.length < 2) return '';
    var trovati = indiceRicerca().filter(function (x) { return x.n.indexOf(qq) >= 0; });
    if (!trovati.length) return '<p class="nota">Nessun risultato per “' + esc(q) + '”. Prova con una parola sola, per esempio “recesso” o “ASA”.</p>';
    return '<p class="piccolo">' + trovati.length + (trovati.length === 1 ? ' risultato' : ' risultati') + '</p><ul class="righe">' + trovati.map(function (x) {
      return '<li><a class="riga" href="#' + x.h + '"><span class="corpo"><span class="tit">' + esc(x.t) + '</span><span class="det">' + evidenzia(x.s, qq) + '</span></span>' + FRECCIA + '</a></li>';
    }).join('') + '</ul>';
  }
  function indiceAccordo() {
    var h = '<ul class="righe">' + voceIndice('premesse', '', 'Premesse', D.premesse.breve) + '</ul>';
    D.sezioni.forEach(function (s) {
      h += '<h2 class="sez-tit">' + esc(s.titolo) + (s.nota ? ' (' + esc(s.nota) + ')' : '') + '</h2><ul class="righe">' + s.articoli.map(function (n) {
        return voceIndice('art-' + n, n, ART[n].titolo, ART[n].breve);
      }).join('') + '</ul>';
    });
    h += '<h2 class="sez-tit">Lettera e allegati</h2><ul class="righe">' +
      voceIndice('lettera', '', 'Lettera d’impegno del Gruppo', D.lettera.breve) +
      voceIndice('tabella-a', 'A', 'Tabella A', 'Coniuge e assimilati non a carico') +
      voceIndice('tabella-b', 'B', 'Tabella B', 'Altri familiari non a carico') + '</ul>';
    return h;
  }
  function voceIndice(id, num, tit, det) {
    return '<li><a class="riga" href="#' + id + '">' + (num !== '' ? '<span class="num">' + num + '</span>' : '<span class="num"></span>') +
      '<span class="corpo"><span class="tit">' + esc(tit) + '</span><span class="det">' + esc(det) + '</span></span>' + FRECCIA + '</a></li>';
  }
  function vAccordo() {
    return '<section class="blocco"><h1 class="t1">L’accordo</h1><p class="sotto">26 articoli, una lettera d’impegno e due tabelle. Per ogni articolo trovi una sintesi e il testo firmato.</p>' +
      '<form class="cerca" role="search" data-az="cerca"><label class="solo-lettori" for="q">Cerca nell’accordo</label>' +
      '<input id="q" type="search" inputmode="search" autocomplete="off" placeholder="Cerca: recesso, ASA, familiari…" value="' + esc(domanda) + '"></form></section>' +
      '<section id="esiti">' + (domanda.trim().length >= 2 ? risultati(domanda) : indiceAccordo()) + '</section>' +
      '<section class="blocco nota"><h2 class="t3">I documenti firmati</h2><p>Le sintesi sono nostre. Fa fede solo il testo firmato il 10 novembre 2026: i quattro documenti originali sono qui dentro, in PDF.</p>' +
      (ANTEPRIMA ? '<p class="piccolo">In questa anteprima i PDF non sono inclusi: si aprono nell’app pubblicata.</p>'
        : '<p class="azioni">' + D.documenti.map(function (d, i) { return '<a class="btn ' + (i ? 'chiaro ' : '') + 'stretto" href="#' + d.id + '">' + esc(d.t) + '</a>'; }).join('') + '</p>') + '</section>';
  }
  function blocchiHtml(blocchi) {
    return blocchi.map(function (b) {
      var x = collegaArticoli(esc(b.x));
      if (b.t === 'h') return '<h3 class="sub"><span class="n">' + esc(b.n) + '.</span> ' + x + '</h3>';
      if (b.t === 'c') return '<p><span class="n">' + esc(b.n) + '.</span> ' + x + '</p>';
      if (b.t === 'li') return '<p class="voce' + (b.l === 2 ? ' l2' : '') + '"><span class="m">' + esc(b.m) + '</span> ' + x + '</p>';
      return '<p class="' + (b.c ? 'centro' : b.l ? 'rientro' : '') + '">' + x + '</p>';
    }).join('');
  }
  function inBreve(punti) {
    return '<section class="blocco"><h2 class="t2">In breve</h2><ul class="breve">' + punti.map(function (p) { return '<li>' + collegaArticoli(esc(p)) + '</li>'; }).join('') + '</ul></section>';
  }
  function scadenzeCollegate(chiave) {
    var l = D.tappe.filter(function (t) { return t.cat !== 'storia' && (t.rif || []).indexOf(chiave) >= 0; });
    if (!l.length) return '';
    return '<section class="blocco"><h2 class="t2">Date collegate</h2><ul class="righe">' + l.map(function (t) {
      return '<li><a class="riga" href="#tappe"><span class="corpo"><span class="tit">' + esc(t.titolo) + '</span><span class="det">' + esc(quando(t)) + '</span></span><span class="lato">' + esc(traQuanto(t.fine && statoTappa(t) === 'corso' ? t.fine : t.d)) + '</span></a></li>';
    }).join('') + '</ul></section>';
  }
  function vArticolo(n) {
    var a = ART[n];
    if (!a) return vAccordo();
    var prima = ART[n - 1], dopo = ART[n + 1];
    var h = '<section class="blocco"><p class="piccolo">Articolo ' + n + '</p><h1 class="t1">' + esc(a.titolo) + '</h1><p class="sotto">' + esc(a.breve) + '</p></section>' + inBreve(a.punti);
    var strumenti = '';
    if ([11, 12, 15, 16, 17].indexOf(n) >= 0) strumenti += '<a class="btn stretto" href="#simulatore">Calcola i tuoi contributi</a>';
    if (n === 11) strumenti += '<a class="btn chiaro stretto" href="#tabella-a">Tabella A</a><a class="btn chiaro stretto" href="#tabella-b">Tabella B</a>';
    if ([7, 8, 9, 10, 17, 18, 22].indexOf(n) >= 0) strumenti += '<a class="btn chiaro stretto" href="#casse">Le casse di oggi</a>';
    if ([2, 24, 26].indexOf(n) >= 0) strumenti += '<a class="btn chiaro stretto" href="#norme">La normativa richiamata</a>';
    if (strumenti) h += '<p class="azioni">' + strumenti + '</p>';
    h += scadenzeCollegate(n);
    h += '<section class="blocco"><h2 class="t2">Il testo firmato</h2><div class="testo">' + blocchiHtml(a.blocchi) + '</div>' + tastoPdf('doc-accordo') + '</section>';
    h += '<nav class="passi" aria-label="Articolo precedente e successivo">' +
      (prima ? '<a href="#art-' + (n - 1) + '">Articolo ' + (n - 1) + '<b>' + esc(prima.titolo) + '</b></a>' : '<a href="#premesse">Prima<b>Premesse</b></a>') +
      (dopo ? '<a href="#art-' + (n + 1) + '">Articolo ' + (n + 1) + '<b>' + esc(dopo.titolo) + '</b></a>' : '<a href="#lettera">Poi<b>Lettera d’impegno</b></a>') + '</nav>';
    return h;
  }
  function vPremesse() {
    var p = D.premesse;
    return '<section class="blocco"><h1 class="t1">Premesse</h1><p class="sotto">' + esc(p.breve) + '</p></section>' + inBreve(p.punti) +
      '<section class="blocco"><h2 class="t2">Il testo firmato</h2><div class="testo">' +
      D.intestazione.map(function (x, i) { return '<p class="' + (i === 0 ? 'centro' : '') + '">' + esc(x) + '</p>'; }).join('') +
      '<p class="centro">PREMESSO CHE</p>' + p.testo.map(function (b) { return '<p class="voce"><span class="m">' + esc(b.m) + '</span> ' + esc(b.x) + '</p>'; }).join('') +
      '<p class="centro">SI CONVIENE QUANTO SEGUE</p></div>' + tastoPdf('doc-accordo') + '</section>' +
      '<nav class="passi"><a href="#accordo">Indice<b>L’accordo</b></a><a href="#art-1">Articolo 1<b>' + esc(ART[1].titolo) + '</b></a></nav>';
  }
  function vLettera() {
    var l = D.lettera;
    return '<section class="blocco"><p class="piccolo">Banco BPM alla Delegazione sindacale, 10 novembre 2026</p><h1 class="t1">Lettera d’impegno</h1><p class="sotto">' + esc(l.breve) + '</p></section>' + inBreve(l.punti) +
      scadenzeCollegate('lettera') +
      '<section class="blocco"><h2 class="t2">Il testo firmato</h2><div class="testo">' + l.blocchi.map(function (b) {
        if (b.t === 'li') return '<p class="voce"><span class="m">' + esc(b.m) + '</span> ' + esc(b.x) + '</p>';
        return '<p class="' + (b.ind > 40 ? 'firma' : '') + '">' + esc(b.x) + '</p>';
      }).join('') + '</div>' + tastoPdf('doc-lettera') + '</section>' +
      '<p class="firma piccolo">In calce all’accordo: ' + esc(D.firme.join(' / ')) + '</p>' +
      '<nav class="passi"><a href="#art-26">Articolo 26<b>' + esc(ART[26].titolo) + '</b></a><a href="#tabella-a">Allegato 1<b>Tabella A</b></a></nav>';
  }
  function vTabellaA() {
    var a = D.allegati.a;
    var righe = C.TABELLA_A.map(function (r) {
      return '<tr><th scope="row">' + esc(r.etichetta) + '</th><td>' + (r.annuo == null ? 'come a carico*' : euro(r.annuo / 12)) + '</td><td>' + (r.annuo == null ? 'come a carico*' : euro(r.annuo)) + '</td></tr>';
    }).join('');
    return '<section class="blocco"><p class="piccolo">Allegato 1 all’accordo</p><h1 class="t1">Tabella A</h1><p class="sotto">' + esc(a.titolo) + '. ' + esc(a.sottotitolo) + '</p></section>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">' + esc(a.colonne[0]) + '</th><th scope="col">' + esc(a.colonne[1]) + '</th><th scope="col">' + esc(a.colonne[2]) + '</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
      '<section class="blocco"><ul class="breve">' + a.note.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<p class="azioni"><a class="btn stretto" href="#simulatore">Calcola per la tua famiglia</a><a class="btn chiaro stretto" href="#tabella-b">Tabella B</a><a class="btn chiaro stretto" href="#art-11">Articolo 11</a>' + tastoPdf('doc-tabella-a', true) + '</p></section>';
  }
  function vTabellaB() {
    var b = D.allegati.b, T = C.TABELLA_B, corpo = '';
    T.eta.forEach(function (e, i) {
      T.reddito.forEach(function (r, j) {
        corpo += '<tr class="' + (j === 0 && i > 0 ? 'gruppo' : '') + '"><th scope="row">' + (j === 0 ? esc(e.etichetta) : '<span class="solo-lettori">' + esc(e.etichetta) + '</span>') + '</th><td>' + esc(r.etichetta) + '</td>' +
          T.valori[i][j].map(function (v) { return '<td>' + euro(v) + '</td>'; }).join('') + '</tr>';
      });
    });
    return '<section class="blocco"><p class="piccolo">Allegato 2 all’accordo</p><h1 class="t1">Tabella B</h1><p class="sotto">' + esc(b.titolo) + '. ' + esc(b.sottotitolo) + '</p></section>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">Età</th><th scope="col">Reddito</th><th scope="col">1 familiare</th><th scope="col">2 familiari</th><th scope="col">3 familiari</th><th scope="col">4 o più familiari</th></tr></thead><tbody>' + corpo + '</tbody></table></div>' +
      '<section class="blocco"><ul class="breve">' + b.note.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
      '<p class="azioni"><a class="btn stretto" href="#simulatore">Calcola per la tua famiglia</a><a class="btn chiaro stretto" href="#tabella-a">Tabella A</a><a class="btn chiaro stretto" href="#art-11">Articolo 11</a>' + tastoPdf('doc-tabella-b', true) + '</p></section>';
  }

  /* ----- documenti firmati, aperti dentro l'app ----- */
  function tastoPdf(id, soloTasto) {
    if (ANTEPRIMA) return '';
    var a = '<a class="btn chiaro stretto" href="#' + id + '">Apri il PDF firmato</a>';
    return soloTasto ? a : '<p class="azioni">' + a + '</p>';
  }
  function vDocumento(d) {
    return '<section class="blocco"><p class="piccolo">Documento firmato il ' + dataLunga(D.meta.firmato) + '</p><h1 class="t1">' + esc(d.nome) + '</h1></section>' +
      '<div id="pdf" class="pdf" data-u="' + esc(d.u) + '"><p class="piccolo">Apro il documento.</p></div>' +
      '<p class="azioni"><a class="btn chiaro stretto" href="' + esc(d.u) + '" download="' + esc(d.file) + '">Salva il PDF sul telefono</a></p>';
  }
  var libPdf = null, pdfAperto = null, giroPdf = 0;
  function chiudiPdf() {
    giroPdf++;
    if (pdfAperto) { try { pdfAperto.destroy(); } catch (e) { /* già chiuso */ } pdfAperto = null; }
  }
  function apriPdf() {
    var cont = document.getElementById('pdf');
    if (!cont) return;
    var giro = ++giroPdf, url = new URL(cont.getAttribute('data-u'), document.baseURI).href;
    var nonRiuscito = function () {
      if (giro !== giroPdf) return;
      cont.innerHTML = '<p class="nota attenzione">Non riesco a mostrare il documento qui dentro. <a href="' + esc(url) + '">Apri il file PDF</a>.</p>';
    };
    libPdf = libPdf || import(new URL('assets/pdf/pdf.min.mjs', document.baseURI).href).then(function (lib) {
      lib.GlobalWorkerOptions.workerSrc = new URL('assets/pdf/pdf.worker.min.mjs', document.baseURI).href;
      return lib;
    });
    libPdf.then(function (lib) {
      // il file si scarica intero, una volta sola: così resta disponibile anche senza rete
      return lib.getDocument({ url: url, disableRange: true, disableStream: true, disableAutoFetch: true }).promise;
    }).then(function (pdf) {
      if (giro !== giroPdf) { pdf.destroy(); return null; }
      pdfAperto = pdf;
      return pdf.getPage(1).then(function (prima) {
        if (giro !== giroPdf) return;
        var foglio = prima.getViewport({ scale: 1 }), larghezza = cont.clientWidth || 360, nitidezza = Math.min(window.devicePixelRatio || 1, 2);
        function disegnaPagina(tela) {
          pdf.getPage(+tela.getAttribute('data-p')).then(function (pagina) {
            if (giro !== giroPdf) return null;
            var base = pagina.getViewport({ scale: 1 }), vp = pagina.getViewport({ scale: (larghezza / base.width) * nitidezza });
            tela.width = Math.floor(vp.width); tela.height = Math.floor(vp.height);
            return pagina.render({ canvas: tela, canvasContext: tela.getContext('2d'), viewport: vp }).promise;
          }).then(function () { tela.setAttribute('data-pronta', '1'); }).catch(function () { /* la pagina resta bianca, le altre si vedono */ });
        }
        var osserva = 'IntersectionObserver' in window ? new IntersectionObserver(function (viste) {
          viste.forEach(function (v) { if (v.isIntersecting) { osserva.unobserve(v.target); disegnaPagina(v.target); } });
        }, { rootMargin: '900px 0px' }) : null;
        cont.innerHTML = '';
        for (var n = 1; n <= pdf.numPages; n++) {
          var tela = document.createElement('canvas');
          tela.className = 'pagina';
          tela.setAttribute('data-p', n);
          tela.setAttribute('role', 'img');
          tela.setAttribute('aria-label', 'Pagina ' + n + ' di ' + pdf.numPages);
          tela.style.aspectRatio = foglio.width + ' / ' + foglio.height;
          cont.appendChild(tela);
          if (osserva) osserva.observe(tela); else disegnaPagina(tela);
        }
      });
    }).catch(nonRiuscito);
  }

  /* ----- che cosa cambia per me ----- */
  var SITUAZIONI = [['servizio', 'Lavoro nel Gruppo'], ['esodo', 'Sono in esodo (Fondo di Solidarietà)'], ['pensione', 'Sono in pensione'], ['superstite', 'Sono un familiare superstite']];
  var PROVENIENZE = [['cma', 'CMA'], ['fas', 'FAS'], ['caspop', 'Ex CASPOP, oggi nel FAS'], ['fiam', 'FIAM'], ['polizza', 'Polizza ex Profamily, Akros o Oaklins'], ['nessuna', 'Nessuna: non sono iscritto'], ['assunto2627', 'Sono stato assunto nel 2026 o lo sarò nel 2027'], ['nuovo2028', 'Sarò assunto dal 2028']];
  var profilo = memoria.leggi('profilo', { sit: 'servizio', prov: 'cma' });
  function opzioni(lista, scelto) { return lista.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === scelto ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function provenienzeAmmesse(sit) { return sit === 'servizio' ? PROVENIENZE : PROVENIENZE.filter(function (p) { return ['nessuna', 'assunto2627', 'nuovo2028'].indexOf(p[0]) < 0; }); }

  function perMe(sit, prov) {
    var S = [], forma = ['cma', 'fas', 'caspop', 'fiam'].indexOf(prov) >= 0, attivo = sit === 'servizio' || sit === 'esodo';
    var entri = [];
    if (forma || prov === 'assunto2627') {
      entri.push(['Dal 1° gennaio 2028 passi alla nuova Cassa in automatico, senza fare nulla: la tua posizione viene trasferita con la fusione.', [11, 12]]);
      entri.push(['Se non vuoi, puoi recedere entro 30 giorni dall’efficacia della fusione.' + (attivo ? ' Attenzione: chi recede perde il contributo aziendale per l’assistenza sanitaria.' : ''), [12]]);
      if (prov === 'assunto2627') entri.push(['Vale se sei iscritto a una delle forme attuali. Se non lo sei, guarda il profilo “Nessuna: non sono iscritto”.', [12]]);
    }
    if (prov === 'polizza') {
      entri.push(['Per tutto il 2027 resti con la copertura di oggi, con i costi ripartiti come adesso. Dal 1° gennaio 2027 non puoi più entrare in CMA.', [8]]);
      entri.push(['Per entrare nella Cassa devi aderire tu, con il modulo che sarà reso disponibile, entro il 30 novembre 2027. L’adesione vale dal 1° gennaio 2028.', [12]]);
      if (attivo) entri.push(['Se non aderisci perdi il contributo aziendale per l’assistenza sanitaria.', [12]]);
      entri.push(['L’adesione presuppone che le fusioni vadano in porto: in caso contrario non sarà possibile iscriversi.', [7]]);
    }
    if (prov === 'nessuna') {
      entri.push(['Nel 2027 puoi iscriverti in sanatoria alla forma di riferimento (CMA, FAS o FIAM): 1.500 € più 250 € per ogni anno di mancata iscrizione. I 250 € non valgono per chi non era iscritto alla ex CASPOP.', [12]]);
      entri.push(['Oppure, dal 1° gennaio al 29 febbraio 2028, puoi iscriverti direttamente alla nuova Cassa: 1.500 €, più il contributo di costituzione della riserva della forma a cui avresti potuto aderire, più 250 € per anno.', [12, 17]]);
      entri.push(['In entrambi i casi puoi pagare a rate, fino a 4 annualità.', [12]]);
      entri.push(['Se entri in una forma nel 2027 ne diventi socio: con la fusione, a nostra lettura, vale anche per te il contributo di costituzione della riserva previsto per i soci di quella forma.', [17]]);
      entri.push(['Dal 1° marzo 2028 l’iscrizione è tardiva: paghi i contributi dalla data di assunzione e hai le prestazioni solo per le spese successive all’adesione.', [12]]);
    }
    if (prov === 'nuovo2028') {
      entri.push(['Dal 1° gennaio 2028 tutti i neoassunti del Gruppo sono destinatari della Cassa.', [25]]);
      entri.push(['Puoi aderire entro 90 giorni dall’assunzione; l’adesione vale dalla data in cui la fai.', [12]]);
      entri.push(['Oltre i 90 giorni paghi i contributi dalla data di assunzione e hai le prestazioni solo per le spese successive all’adesione.', [12]]);
    }
    S.push({ t: 'Come entri nella Cassa', p: entri });

    var versi = [];
    if (sit === 'servizio') {
      versi.push(['Tu: 1,40% della retribuzione imponibile INPS. Con part-time o retribuzione ridotta il calcolo si fa sulla retribuzione a tempo pieno del pari grado.', [15]]);
      versi.push(['L’Azienda: 1.300 € l’anno, più tutte le spese di funzionamento della Cassa.', [15, 23]]);
      versi.push(['Quando andrai in pensione (dal 2028): 2,10% sulla somma delle pensioni, se hai almeno 10 anni di servizio effettivo, 5 in caso di inabilità.', [16, 11]]);
    }
    if (sit === 'esodo') {
      versi.push(['Tu: 1,40% dell’imponibile usato per i contributi INPS del periodo di esodo, riparametrato a tempo pieno.', [15]]);
      versi.push(['L’Azienda: 1.300 € l’anno anche per chi è nel Fondo di Solidarietà.', [15]]);
      versi.push(['Resti socio per tutta la durata dell’assegno e poi da pensionato. Se la pensione decorre dal 2028: 2,10% sulla somma delle pensioni.', [11, 16]]);
    }
    if (sit === 'pensione') {
      if (prov === 'polizza') versi.push(['2,10% sulla somma di tutte le pensioni: è la regola per chi è già pensionato al 31 dicembre 2027 di provenienza Akros, Oaklins ed ex Profamily.', [16]]);
      else versi.push(['Contributi in sostanziale continuità con quelli che versi oggi alla tua forma, e comunque non meno di quanto versato al 31 dicembre 2027.', [16]]);
      versi.push(['Eventuali adeguamenti futuri spettano al Consiglio di Amministrazione della Cassa, nei limiti dello Statuto.', [16]]);
      versi.push(['Per i pensionati non c’è contributo aziendale: è previsto solo per chi è in servizio o in esodo.', [15]]);
    }
    if (sit === 'superstite') {
      versi.push(['1,40% della somma di redditi di lavoro, pensioni e pensione di reversibilità.', [15]]);
      versi.push(['Per i decessi dal 1° gennaio 2028 è superstite il coniuge non separato (o unito civilmente, o convivente di fatto registrato); in sua assenza il figlio fino a 50 anni, senza limite se invalido al 100%.', [11]]);
    }
    S.push({ t: 'Quanto versi ogni anno, dal 2028', p: versi });

    var fam = [];
    if (forma || prov === 'polizza' || prov === 'assunto2627') {
      fam.push(['I familiari che oggi sono coperti dalla tua forma devono confermare l’iscrizione alla Cassa, o l’adesione alla polizza facoltativa, nei termini che saranno comunicati.', [11]]);
      fam.push(['Entro 60 giorni dall’efficacia della fusione puoi iscrivere altri familiari con effetto dal 1° gennaio 2028: gratis quelli che prima non erano iscrivibili e quelli a carico che potevano esserlo senza contributo; con 2.000 €, anche in 4 anni, gli altri che potevano essere iscritti e non lo erano.', [11]]);
    }
    if (prov === 'nessuna') fam.push(['Se aderisci a una delle due sanatorie, i tuoi familiari si iscrivono dal 1° gennaio ed entro il 29 febbraio 2028: gratis quelli che prima non erano iscrivibili e quelli a carico che potevano esserlo senza contributo; con 2.000 €, anche in 4 anni, gli altri.', [11]]);
    fam.push(['Dal 1° gennaio 2028 puoi aggiornare l’elenco dei tuoi familiari, inserendoli o confermandoli. Chi viene iscritto in ritardo paga i contributi arretrati e ha le prestazioni solo per le spese successive.', [12, 11]]);
    fam.push(['A carico: 0,25% per ogni figlio e 0,30% per il coniuge, al massimo per tre familiari; 500 € l’anno per i genitori. Non a carico: Tabella A per il coniuge, Tabella B per gli altri, con massimali condivisi con te.', [11, 'tabella-a', 'tabella-b']]);
    S.push({ t: 'I tuoi familiari', p: fam });

    var una = [], r = C.contributoRiserva(prov);
    if (r) {
      una.push([r.importo === 0 ? 'Non devi versare nulla per la riserva.' : 'Versi una sola volta ' + euro(r.importo) + ': è la differenza tra i 980 € di riserva per socio e la riserva pro capite della tua forma di provenienza.', [17]]);
      if (r.importo > 0) una.push(['Puoi pagare a rate, fino a 3 annualità (in parti uguali sarebbero ' + euro(r.rataAnnua, r.rataAnnua % 1 !== 0) + ' l’anno), e usare le somme della tua posizione ASA.', [17, 19]]);
      if (r.conguaglio) una.push(['L’importo sarà conguagliato quando si conosceranno le riserve effettivamente trasferite.', [17]]);
    } else if (prov === 'nessuna') {
      una.push(['Dipende dalla finestra di sanatoria che scegli: nella seconda (gennaio-febbraio 2028) si aggiunge il contributo di costituzione della riserva della forma a cui avresti potuto aderire.', [12, 17]]);
    } else {
      una.push(['Per chi viene assunto dal 2028 l’accordo non prevede un contributo di costituzione della riserva.', [17]]);
    }
    S.push({ t: 'Il contributo una tantum per la riserva', p: una });

    if (['fas', 'caspop', 'fiam'].indexOf(prov) >= 0) {
      S.push({ t: 'La tua ASA', p: [
        ['Dal 1° gennaio 2027 non puoi più fare versamenti volontari. Fino al 30 novembre 2027 puoi versare solo dal portale welfare.', [19]],
        ['Quello che resta sulla tua posizione passa alla Cassa, sempre a tuo nome.', [19]],
        ['Dal 2028 lo usi, entro il 31 dicembre 2028, in quest’ordine: contributi ordinari, contributo di costituzione della riserva, rimborso di prestazioni.', [19]]
      ] });
    } else if (sit === 'servizio') {
      S.push({ t: 'ASA', p: [['Dal 1° gennaio 2028 tutti i soci in servizio potranno versare a titolo di ASA, solo dal portale welfare, con un nuovo regolamento.', [19]]] });
    }

    var prest = [
      ['Il Nomenclatore sarà in sostanziale continuità con quello della CMA in vigore al 31 dicembre 2026.' + (prov === 'cma' ? ' Per te, quindi, il punto di partenza è quello che conosci.' : ''), [14]],
      ['Un team di esperti valuta aggiornamenti e la continuità dei massimali pluriennali, compreso quanto hai già fruito nella tua forma: lavori chiusi entro il 30 giugno 2027.', [14]]
    ];
    if (attivo) prest.push(['Il Gruppo si è impegnato a pagare un check-up per i soci in servizio, tramite la Cassa.', ['lettera']]);
    S.push({ t: 'Le prestazioni', p: prest });

    var piu = [];
    if (prov === 'caspop') {
      piu.push(['Per il 2027 il FAS deve garantirti, senza interruzioni, le coperture assicurative dedicate.', [9]]);
      piu.push(['Nella nuova Cassa non ci sarà una sezione ex CASPOP: la riserva ex CASPOP è il motivo per cui il tuo contributo una tantum è più basso.', [18]]);
    }
    if (prov === 'cma') {
      piu.push(['L’Assistenza Sociale della CMA non confluisce: dal 2028 le tutele equivalenti saranno garantite direttamente da Banco BPM, con un’intesa entro il 31 dicembre 2027.', [22]]);
      piu.push(['L’Assistenza Superstiti resta solo per chi la percepisce al 31 dicembre 2027.', [22]]);
    }
    if (prov === 'fiam') piu.push(['Il percorso di armonizzazione del FIAM previsto nel 2025 è aggiornato da questo accordo.', [10]]);
    if (sit === 'servizio') {
      piu.push(['Dal 1° gennaio 2028: copertura assicurativa collettiva caso morte per i dipendenti con CCNL Credito e polizza Kasko estesa a tutti i lavoratori del Gruppo.', [22, 'lettera']]);
      piu.push(['Nel corso del 2028: condizioni di favore, a tue spese e su base volontaria, per la copertura caso morte e per la LTC dei familiari.', ['lettera']]);
    }
    if (piu.length) S.push({ t: 'In più', p: piu });
    return S;
  }
  function dateProfilo(sit, prov) {
    var tag = ['tutti'];
    if (['cma', 'fas', 'caspop', 'fiam', 'assunto2627'].indexOf(prov) >= 0) tag.push('forme');
    if (prov === 'polizza' || prov === 'nessuna' || prov === 'cma') tag.push(prov);
    if (['fas', 'caspop', 'fiam'].indexOf(prov) >= 0) tag.push('asa');
    return D.tappe.filter(function (t) {
      return !t.fatto && giorniA(t.fine || t.d) >= 0 && (t.chi || []).some(function (c) { return tag.indexOf(c) >= 0; });
    });
  }
  function esitoPerMe() {
    var h = perMe(profilo.sit, profilo.prov).map(function (s) {
      return '<section class="blocco"><h2 class="t2">' + esc(s.t) + '</h2><ul class="righe">' + s.p.map(function (p) {
        return '<li><div class="riga"><span class="corpo">' + esc(p[0]) + rifs(p[1]) + '</span></div></li>';
      }).join('') + '</ul></section>';
    }).join('');
    var date = dateProfilo(profilo.sit, profilo.prov);
    if (date.length) {
      h += '<section class="blocco"><h2 class="t2">Le tue date</h2>' + date.map(function (t) {
        return '<article class="tappa">' + timbro(t) + '<div class="corpo"><p class="quando">' + esc(quando(t)) + '</p><h3 class="tit">' + esc(t.titolo) + '</h3><p class="txt">' + esc(t.testo) + '</p>' + rifs(t.rif) + '</div></article>';
      }).join('') + '</section>';
    }
    return h;
  }
  function vPerMe() {
    var amm = provenienzeAmmesse(profilo.sit);
    if (!amm.some(function (p) { return p[0] === profilo.prov; })) profilo.prov = amm[0][0];
    return '<section class="blocco"><h1 class="t1">Che cosa cambia per me</h1><p class="sotto">Scegli la tua situazione: ti mostriamo solo le regole che ti riguardano, con l’articolo da cui vengono.</p>' +
      '<div class="griglia2 larga"><div class="campo"><label for="p-sit">Oggi</label><select id="p-sit" data-az="profilo">' + opzioni(SITUAZIONI, profilo.sit) + '</select></div>' +
      '<div class="campo"><label for="p-prov">Assistenza sanitaria</label><select id="p-prov" data-az="profilo">' + opzioni(amm, profilo.prov) + '</select></div></div></section>' +
      '<div id="esito-profilo">' + esitoPerMe() + '</div>' +
      '<section class="blocco"><p class="azioni"><a class="btn" href="#simulatore">Calcola i tuoi contributi</a></p>' +
      '<p class="piccolo">È una lettura dell’accordo, non una consulenza. Statuto e Regolamenti della Cassa, quando ci saranno, potranno precisare questi punti.</p></section>';
  }

  /* ----- simulatore ----- */
  var sim = memoria.leggi('simulatore', { sit: 'servizio', base: 40000, prov: 'cma', familiari: [] });
  var SIT_SIM = [['servizio', 'In servizio', 'Retribuzione annua imponibile INPS'], ['esodo', 'In esodo', 'Imponibile annuo usato per i contributi INPS dell’esodo'], ['pensione2028', 'In pensione dal 2028, o da polizza ex Profamily, Akros, Oaklins', 'Somma annua di tutte le pensioni'], ['pensioneAnte', 'Già in pensione al 31 dicembre 2027 da CMA, FAS, ex CASPOP o FIAM', 'Somma annua di tutte le pensioni'], ['superstite', 'Superstite', 'Redditi di lavoro, pensioni e reversibilità in un anno'], ['invalidita', 'Cessato per superamento del comporto, con assegno di invalidità', 'Somma annua di tutte le pensioni']];
  var PROV_SIM = PROVENIENZE.filter(function (p) { return p[0] !== 'nessuna' && p[0] !== 'nuovo2028'; }).concat([['altro', 'Nessuna di queste']]);
  var TIPI_FAM = [['coniuge', 'Coniuge, unito civilmente o convivente registrato'], ['figlio', 'Figlio'], ['figlioInabile', 'Figlio con inabilità accertata'], ['genitore', 'Genitore o altro ascendente']];
  function nomeTipo(t) { return { coniuge: 'Coniuge', figlio: 'Figlio', figlioInabile: 'Figlio inabile', genitore: 'Genitore' }[t]; }
  function schedaFamiliare(f, i) {
    return '<div class="familiare" data-i="' + i + '"><div class="capo"><b>' + esc(nomeTipo(f.tipo)) + ' ' + (i + 1) + '</b><button class="btn chiaro stretto" data-az="togli-fam" data-i="' + i + '">Togli</button></div>' +
      '<div class="campo"><label for="f-tipo-' + i + '">Chi è</label><select id="f-tipo-' + i + '" data-campo="tipo">' + opzioni(TIPI_FAM, f.tipo) + '</select></div>' +
      '<label class="spunta"><input type="checkbox" data-campo="aCarico"' + (f.aCarico ? ' checked' : '') + '> Fiscalmente a carico</label>' +
      '<div class="griglia2"><div class="campo"><label for="f-eta-' + i + '">Età nel 2028</label><input id="f-eta-' + i + '" type="number" inputmode="numeric" min="0" max="110" data-campo="eta" value="' + esc(f.eta) + '"></div>' +
      (f.aCarico ? '' : '<div class="campo"><label for="f-red-' + i + '">Reddito annuo lordo</label><input id="f-red-' + i + '" type="number" inputmode="numeric" min="0" step="500" data-campo="reddito" value="' + esc(f.reddito) + '"></div>') + '</div>' +
      (f.tipo === 'genitore' && f.aCarico ? '<label class="spunta"><input type="checkbox" data-campo="convivente"' + (f.convivente ? ' checked' : '') + '> Convive con me</label>' : '') + '</div>';
  }
  function esitoSimulatore() {
    var socio = C.contributoSocio(sim.sit, sim.base), fam = C.contributiFamiliari(sim.base, sim.familiari), ris = C.contributoRiserva(sim.prov);
    var righe = '<tr><th scope="row">Tu</th><td>' + (socio.importo == null ? 'come oggi' : euro(socio.importo, true)) + '</td><td class="note">' +
      (socio.importo == null ? esc(socio.nota) : (socio.aliquota * 100).toLocaleString('it-IT', { minimumFractionDigits: 2 }) + '% della base di calcolo') + '</td></tr>';
    fam.righe.forEach(function (r, i) {
      righe += '<tr><th scope="row">' + esc(nomeTipo(r.tipo)) + ' ' + (i + 1) + '</th><td>' + (r.iscrivibile ? euro(r.importo, true) : 'non iscrivibile') + '</td><td class="note">' + esc(r.regola) + (r.note.length ? '. ' + esc(r.note.join(' ')) : '') + '</td></tr>';
    });
    var tot = (socio.importo || 0) + fam.totale;
    var h = '<h2 class="t2">Il risultato</h2><div class="totale"><span>Ogni anno, dal 2028' + (socio.importo == null ? '<br><span class="piccolo">solo i familiari: il tuo contributo resta in continuità</span>' : '') + '</span><b>' + euro(tot, true) + '</b></div>' +
      '<p class="piccolo">Circa ' + euro(tot / 12, true) + ' al mese.</p>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">Per chi</th><th scope="col">Ogni anno</th><th scope="col">Regola applicata</th></tr></thead><tbody>' + righe + '</tbody></table></div>';
    var extra = '<ul class="righe">';
    if (ris) extra += '<li><div class="riga"><span class="corpo"><span class="tit">Una tantum per la riserva: ' + euro(ris.importo) + '</span><span class="det">' + (ris.importo ? 'Anche a rate, fino a 3 annualità (in parti uguali ' + euro(ris.rataAnnua, ris.rataAnnua % 1 !== 0) + ' l’anno), e pagabile con la posizione ASA.' : 'Per la tua provenienza non è dovuto nulla.') + (ris.conguaglio ? ' Soggetto a conguaglio.' : '') + '</span>' + rifs([17]) + '</span></div></li>';
    if (sim.sit === 'servizio' || sim.sit === 'esodo') extra += '<li><div class="riga"><span class="corpo"><span class="tit">L’Azienda versa per te ' + euro(C.AZIENDA_ANNUO) + ' l’anno</span><span class="det">Più le spese di funzionamento della Cassa.</span>' + rifs([15, 23]) + '</span></div></li>';
    extra += '</ul>';
    h += extra + '<div class="nota"><h3 class="t3">Come abbiamo letto l’accordo</h3><ul class="breve">' +
      '<li>Familiari a carico: il contributo è dovuto al massimo per tre tra coniuge e figli. Se sono di più contiamo i tre più costosi, perché l’accordo non dice quali.</li>' +
      '<li>Il coniuge non a carico con reddito fino a 10.000 € paga lo 0,30% come se fosse a carico, ma lo teniamo fuori dal tetto dei tre.</li>' +
      '<li>Genitori a carico: 500 € l’anno per ciascuno. L’accordo non precisa se l’importo è a persona.</li>' +
      '<li>Tabella B: la colonna dipende da quanti familiari non a carico iscrivi, escluso il coniuge, e l’importo è per ciascuno.</li>' +
      '<li>Per chi non è in servizio, le percentuali dei familiari a carico sono applicate alla stessa base usata per te.</li>' +
      '<li>Età: indica gli anni che il familiare compie nel 2028. I limiti dei 50 e dei 70 anni valgono fino al 31 dicembre dell’anno in cui si compiono; per le fasce d’età delle tabelle l’accordo non indica una data di riferimento.</li>' +
      '<li>Per i familiari non a carico i massimali saranno condivisi con il socio, come definirà la commissione dell’articolo 14.</li>' +
      '</ul><p class="piccolo">È una stima sul testo dell’accordo: gli importi veri li fisseranno Statuto e Regolamenti della Cassa.</p></div>';
    return h;
  }
  function vSimulatore() {
    var s = SIT_SIM.filter(function (x) { return x[0] === sim.sit; })[0] || SIT_SIM[0];
    return '<section class="blocco"><h1 class="t1">Calcola i tuoi contributi</h1><p class="sotto">Le regole in vigore dal 1° gennaio 2028, applicate ai tuoi dati. I numeri restano sul tuo telefono.</p></section>' +
      '<section class="blocco" id="modulo-sim">' +
      '<div class="campo"><label for="s-sit">La tua situazione nel 2028</label><select id="s-sit" data-sim="sit">' + opzioni(SIT_SIM, sim.sit) + '</select></div>' +
      '<div class="campo"><label for="s-base" id="s-base-l">' + esc(s[2]) + '</label><input id="s-base" type="number" inputmode="numeric" min="0" step="500" data-sim="base" value="' + esc(sim.base) + '"><span class="aiuto">In euro, lordi. Con part-time indica la retribuzione a tempo pieno.</span></div>' +
      '<div class="campo"><label for="s-prov">Da dove vieni</label><select id="s-prov" data-sim="prov">' + opzioni(PROV_SIM, sim.prov) + '</select><span class="aiuto">Serve per il contributo una tantum alla riserva.</span></div>' +
      '<h2 class="t2">Familiari da iscrivere</h2><div id="familiari" class="blocco">' + sim.familiari.map(schedaFamiliare).join('') + '</div>' +
      '<p class="azioni">' + TIPI_FAM.map(function (t) { return '<button class="btn chiaro stretto" data-az="aggiungi-fam" data-v="' + t[0] + '">Aggiungi ' + esc(nomeTipo(t[0]).toLowerCase()) + '</button>'; }).join('') + '</p></section>' +
      '<section class="blocco" id="esito-sim" aria-live="polite">' + esitoSimulatore() + '</section>' +
      '<p class="azioni"><a class="btn chiaro stretto" href="#tabella-a">Tabella A</a><a class="btn chiaro stretto" href="#tabella-b">Tabella B</a><a class="btn chiaro stretto" href="#art-11">Articolo 11</a></p>';
  }

  /* ----- novità ----- */
  var filtroNovita = 'tema';
  var FILTRI_NOVITA = [['tema', 'Sulla Cassa'], ['sindacati', 'Sindacati'], ['casse', 'Casse di oggi'], ['norme', 'Norme e stampa'], ['tutte', 'Tutte']];
  function vNovita() {
    var soglia = memoria.leggi('visto', null);
    var voci = novita.voci.filter(function (v) {
      if (filtroNovita === 'tutte') return true;
      if (filtroNovita === 'tema') return v.pertinente;
      var c = categoriaVoce(v);
      return filtroNovita === 'norme' ? (c === 'norme' || c === 'stampa') : c === filtroNovita;
    });
    var h = '<section class="blocco"><h1 class="t1">Novità</h1><p class="sotto">Quello che pubblicano FABI, FIRST CISL, FISAC CGIL e UILCA su Banco BPM, le casse di oggi e le novità di legge sulle casse di assistenza.</p>' +
      '<p class="piccolo">' + esc(testoControllo()) + '</p>' +
      '<div class="filtri" role="group" aria-label="Filtra le novità">' + FILTRI_NOVITA.map(function (f) {
        return '<button class="filtro" data-az="filtro-novita" data-v="' + f[0] + '" aria-pressed="' + (filtroNovita === f[0]) + '">' + esc(f[1]) + '</button>';
      }).join('') + '</div></section>';
    h += '<section>' + (voci.length ? '<ul class="righe">' + voci.slice(0, 120).map(function (v) { return rigaNovita(v, soglia); }).join('') + '</ul>'
      : '<p class="nota">' + (novita.caricate ? 'Niente in questa categoria, per ora.' : 'Carico le novità.') + '</p>') + '</section>';
    h += '<section class="blocco" id="notifiche">' + schedaNotifiche() + '</section>';
    h += '<section class="blocco"><h2 class="t2">Le fonti controllate</h2><p class="piccolo">Sei controlli al giorno, tra le 6 e le 22. Per i siti nazionali teniamo solo le pubblicazioni che citano Banco BPM.</p><ul class="stato-fonti">' +
      D.fonti.map(function (f) {
        var s = novita.fonti.filter(function (x) { return x.id === f.id; })[0];
        var stato = !s || !s.controllato ? '<span class="ok">in attesa del primo controllo</span>' : s.ok ? '<span class="ok">letta ' + esc(oraLocale(s.controllato)) + '</span>' : '<span class="ko">non letta: ' + esc(s.errore || 'errore') + '</span>';
        return '<li><a href="' + esc(f.pagina) + '" target="_blank" rel="noopener">' + esc(f.nome) + '</a><span class="piccolo">' + esc(f.descrizione) + '</span>' + stato + '</li>';
      }).join('') + '</ul><p class="piccolo">Il sito del FAS non consente la lettura automatica: aprilo dalla scheda del fondo.</p></section>';
    return h;
  }

  /* ----- notifiche e installazione ----- */
  var su = {
    ios: /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    installata: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true,
    sw: 'serviceWorker' in navigator && !ANTEPRIMA,
    push: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !ANTEPRIMA,
    configurate: !!(CFG.push && CFG.push.chiavePubblica && CFG.push.servizio)
  };
  var invito = null, statoPush = 'ignoto';
  var prefs = memoria.leggi('prefs', { tutte: false, norme: true });
  function chiaveBinaria(b64) {
    var s = atob((b64 + '==='.slice((b64.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/')), a = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
    return a;
  }
  function leggiStatoPush() {
    if (!su.push) { statoPush = 'assenti'; return Promise.resolve(); }
    if (Notification.permission === 'denied') { statoPush = 'negate'; return Promise.resolve(); }
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) {
      statoPush = s ? 'attive' : 'spente';
    }).catch(function () { statoPush = 'spente'; });
  }
  function inviaIscrizione(sub) {
    return fetch(CFG.push.servizio.replace(/\/$/, '') + '/iscrivi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ iscrizione: sub.toJSON(), preferenze: prefs })
    }).then(function (r) { if (!r.ok) throw new Error('servizio ' + r.status); });
  }
  function attivaNotifiche() {
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { statoPush = p === 'denied' ? 'negate' : 'spente'; throw new Error('permesso'); }
      return navigator.serviceWorker.ready;
    }).then(function (r) {
      return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiaveBinaria(CFG.push.chiavePubblica) });
    }).then(function (sub) { return inviaIscrizione(sub); }).then(function () {
      statoPush = 'attive'; avviso('Notifiche attivate.');
    });
  }
  function spegniNotifiche() {
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) {
      if (!s) return;
      var fine = s.endpoint;
      return s.unsubscribe().then(function () {
        return fetch(CFG.push.servizio.replace(/\/$/, '') + '/disiscrivi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: fine }) }).catch(function () {});
      });
    }).then(function () { statoPush = 'spente'; avviso('Notifiche disattivate.'); });
  }
  function schedaNotifiche() {
    var h = '<h2 class="t2">Notifiche</h2>';
    if (ANTEPRIMA) return h + '<p class="nota">Questa è un’anteprima: qui non si possono ricevere notifiche. Arrivano sul telefono quando l’app è pubblicata e installata.</p>';
    if (su.ios && !su.installata) return h + '<div class="nota"><p>Su iPhone le notifiche arrivano solo se aggiungi l’app alla schermata Home.</p><p>In Safari tocca <b>Condividi</b>, poi <b>Aggiungi alla schermata Home</b>. Apri l’app dall’icona e torna qui.</p></div>';
    if (!su.push) return h + '<p class="nota">Questo browser non supporta le notifiche. Le novità restano qui, aggiornate a ogni apertura.</p>';
    if (!su.configurate) return h + '<p class="nota">Su questa installazione le notifiche non sono ancora state configurate da chi la gestisce. Le novità restano qui, aggiornate a ogni apertura.</p>';
    if (statoPush === 'negate') return h + '<p class="nota attenzione">Hai bloccato le notifiche per questa app. Per riattivarle vai nelle impostazioni del telefono, alla voce Notifiche.</p>';
    if (statoPush === 'attive') {
      return h + '<p>Ricevi una notifica quando esce qualcosa sulla Cassa. Per spedirtela è registrato solo l’indirizzo tecnico del telefono, senza nome né numero: si cancella disattivando le notifiche.</p>' +
        '<label class="spunta"><input type="checkbox" data-pref="norme"' + (prefs.norme ? ' checked' : '') + '> Anche le novità di legge e di stampa sulle casse di assistenza</label>' +
        '<label class="spunta"><input type="checkbox" data-pref="tutte"' + (prefs.tutte ? ' checked' : '') + '> Anche tutte le altre pubblicazioni dei quattro sindacati su Banco BPM</label>' +
        '<p class="azioni"><button class="btn chiaro stretto" data-az="spegni-notifiche">Disattiva le notifiche</button></p>';
    }
    return h + '<p>Ti avvisiamo quando FABI, FIRST CISL, FISAC CGIL o UILCA pubblicano qualcosa sulla Cassa, e quando cambia una norma sulle casse di assistenza. Viene registrato solo l’indirizzo tecnico del telefono, senza nome né numero.</p><p class="azioni"><button class="btn" data-az="attiva-notifiche">Attiva le notifiche</button></p>';
  }
  function schedaInstalla() {
    if (ANTEPRIMA || su.installata) return '';
    if (invito) return '<section class="blocco nota"><h2 class="t3">Tienila sul telefono</h2><p>Si apre come un’app, funziona anche senza rete e ti avvisa delle novità.</p><p class="azioni"><button class="btn" data-az="installa">Installa l’app</button></p></section>';
    if (su.ios) return '<section class="blocco nota"><h2 class="t3">Tienila sul telefono</h2><p>In Safari tocca <b>Condividi</b>, poi <b>Aggiungi alla schermata Home</b>. Da lì si apre come un’app e può mandarti le notifiche.</p></section>';
    return '';
  }

  /* ----- casse, norme, glossario, informazioni ----- */
  function vCasse() {
    var h = '<section class="blocco"><h1 class="t1">Le casse di oggi</h1><p class="sotto">Le forme che confluiscono nella nuova Cassa, con i loro statuti e regolamenti sui siti ufficiali.</p></section>';
    h += '<section class="nota"><h2 class="t3">Lo Statuto della nuova Cassa</h2><p>Non esiste ancora: le Parti devono condividerlo entro gennaio 2027, prima dell’atto notarile.</p>' + rifs([4]) + '</section>';
    D.casse.forEach(function (c) {
      var doc = c.documenti.map(function (d) {
        return '<a class="btn ' + (d.principale ? '' : 'chiaro ') + 'stretto" href="' + esc(d.u) + '" target="_blank" rel="noopener">' + esc(d.t) + '</a>';
      }).join('');
      h += '<article class="cassa" id="cassa-' + c.id + '"><p class="sigla">' + esc(c.sigla) + (c.chiusa ? ' <span class="segno neutro">sciolta</span>' : '') + '</p><h2 class="t3">' + esc(c.nome) + '</h2><p class="piccolo">' + esc(c.origine) + '</p>' +
        '<p>' + esc(c.cosa) + '</p><p><b>Che cosa succede.</b> ' + esc(c.destino) + '</p>' +
        '<div class="dati"><div><b>' + (c.riserva == null ? 'nessuna' : c.riserva.toLocaleString('it-IT') + ' milioni') + '</b><span>riserva che porta nella Cassa (stima 2026)</span></div><div><b>' + euro(c.contributo) + '</b><span>contributo una tantum di ogni socio</span></div></div>' +
        (doc ? '<div class="docs">' + doc + '</div>' : '') +
        c.documenti.filter(function (d) { return d.nota; }).map(function (d) { return '<p class="piccolo">' + esc(d.nota) + '</p>'; }).join('') +
        (c.avviso ? '<p class="piccolo">' + esc(c.avviso) + '</p>' : '') +
        (c.sito ? '<p class="piccolo"><a href="' + esc(c.sito) + '" target="_blank" rel="noopener">Sito ufficiale</a></p>' : '') + rifs(c.rif) + '</article>';
    });
    h += '<section class="blocco"><h2 class="t2">Come si arriva a 30 milioni di riserva</h2><div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">Da dove</th><th scope="col">Milioni di euro</th></tr></thead><tbody>' +
      '<tr><th scope="row">CMA</th><td>11,0</td></tr><tr><th scope="row">Riserva ex CASPOP presso il FAS</th><td>6,8</td></tr><tr><th scope="row">FAS</th><td>2,4</td></tr><tr><th scope="row">FIAM</th><td>1,2</td></tr>' +
      '<tr><th scope="row">Contributi una tantum dei soci, residuo della dotazione aziendale, avanzi di gestione</th><td>8,6</td></tr></tbody><tfoot><tr><th scope="row">Riserva unica</th><td>30,0</td></tr></tfoot></table></div>' +
      '<p class="piccolo">Stime dell’accordo sui dati 2026. L’ultima riga è la differenza tra 30 e 21,4 milioni.</p>' + rifs([17]) + '</section>';
    return h;
  }
  function vNorme() {
    var h = '<section class="blocco"><h1 class="t1">Normativa</h1><p class="sotto">Le leggi che l’accordo richiama, spiegate in breve, con il testo ufficiale a un tocco.</p></section><section class="blocco">';
    D.norme.forEach(function (n) {
      h += '<article class="cassa"><h2 class="t3">' + esc(n.titolo) + (n.nuova ? ' <span class="segno rosso">del 2026</span>' : '') + '</h2><p class="piccolo">' + esc(n.fonte) + '</p><p>' + esc(n.testo) + '</p>' +
        (n.perche ? '<p><b>Perché conta qui.</b> ' + esc(n.perche) + '</p>' : '') +
        '<div class="docs">' + n.link.map(function (l) { return '<a class="btn chiaro stretto" href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + '</a>'; }).join('') + '</div>' + rifs(n.rif) + '</article>';
    });
    h += '</section><section class="blocco"><h2 class="t2">La riforma in discussione</h2><p>' + esc(D.riforma.intro) + '</p><p class="piccolo">Situazione al ' + dataLunga(D.riforma.al) + '. Gli sviluppi arrivano nelle Novità.</p><ul class="righe">' +
      D.riforma.voci.map(function (v) {
        return '<li><div class="riga"><span class="corpo"><span class="tit">' + esc(v.titolo) + '</span><span class="det">' + esc(v.testo) + '</span><span class="docs" style="margin-top:8px">' +
          v.link.map(function (l) { return '<a class="btn chiaro stretto" href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + '</a>'; }).join('') + '</span></span></div></li>';
      }).join('') + '</ul>' + rifs([26]) + '</section>';
    return h;
  }
  function vGlossario() {
    return '<section class="blocco"><h1 class="t1">Glossario</h1><p class="sotto">Le parole dell’accordo, in chiaro.</p></section><dl class="voci">' + D.glossario.map(function (g) {
      return '<dt>' + esc(g.t) + '</dt><dd>' + esc(g.d) + rifs(g.rif) + '</dd>';
    }).join('') + '</dl>';
  }
  function vAltro() {
    return '<section class="blocco"><h1 class="t1">Altro</h1><ul class="righe">' +
      voceMenu('per-me', 'Che cosa cambia per me', 'Le regole per la tua situazione') +
      voceMenu('simulatore', 'Calcola i tuoi contributi', 'Tu e i tuoi familiari, dal 2028') +
      voceMenu('casse', 'Le casse di oggi e i loro statuti', 'CMA, FAS, FIAM, ex CASPOP') +
      voceMenu('norme', 'Normativa', 'Fisco, Anagrafe, trasparenza, riforma') +
      voceMenu('glossario', 'Glossario', 'ASA, Nomenclatore, risorse vincolate…') + '</ul></section>';
  }

  /* ---------- navigazione ---------- */
  var VISTE = {
    oggi: { t: 'Nuova Cassa', nota: 'Guida non ufficiale', s: 'oggi', f: vOggi },
    tappe: { t: 'Tappe', s: 'tappe', f: vTappe },
    accordo: { t: 'Accordo', s: 'accordo', f: vAccordo },
    premesse: { t: 'Premesse', s: 'accordo', su: 'accordo', f: vPremesse },
    lettera: { t: 'Lettera d’impegno', s: 'accordo', su: 'accordo', f: vLettera },
    'tabella-a': { t: 'Tabella A', s: 'accordo', su: 'accordo', f: vTabellaA },
    'tabella-b': { t: 'Tabella B', s: 'accordo', su: 'accordo', f: vTabellaB },
    novita: { t: 'Novità', s: 'novita', f: vNovita },
    altro: { t: 'Altro', s: 'altro', f: vAltro },
    'per-me': { t: 'Per me', s: 'altro', su: 'altro', f: vPerMe },
    simulatore: { t: 'Contributi', s: 'altro', su: 'altro', f: vSimulatore },
    casse: { t: 'Casse di oggi', s: 'altro', su: 'altro', f: vCasse },
    norme: { t: 'Normativa', s: 'altro', su: 'altro', f: vNorme },
    glossario: { t: 'Glossario', s: 'altro', su: 'altro', f: vGlossario }
  };
  var corrente = null;
  function rotta() {
    var h = (location.hash || '#oggi').slice(1), m = /^art-(\d{1,2})$/.exec(h);
    if (m && ART[+m[1]]) return { id: h, t: 'Articolo ' + m[1], s: 'accordo', su: 'accordo', f: function () { return vArticolo(+m[1]); } };
    var doc = ANTEPRIMA ? null : D.documenti.filter(function (d) { return d.id === h; })[0];
    if (doc) return { id: h, t: doc.breve, s: 'accordo', su: 'accordo', pdf: true, f: function () { return vDocumento(doc); } };
    var v = VISTE[h] || VISTE.oggi;
    return { id: VISTE[h] ? h : 'oggi', t: v.t, nota: v.nota, s: v.s, su: v.su, f: v.f };
  }
  function disegna(tieniScroll) {
    var r = rotta();
    var cambia = !corrente || corrente !== r.id;
    corrente = r.id;
    chiudiPdf();
    vista.innerHTML = r.f();
    if (r.pdf) apriPdf();
    document.getElementById('titolo').textContent = r.t;
    document.getElementById('sottotitolo').textContent = r.nota || '';
    var ind = document.getElementById('indietro');
    ind.hidden = !r.su;
    if (r.su) ind.setAttribute('href', '#' + r.su);
    Array.prototype.forEach.call(document.querySelectorAll('.schede a'), function (a) {
      if (a.getAttribute('data-scheda') === r.s) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.title = (r.id === 'oggi' ? '' : r.t + ' - ') + 'Nuova Cassa';
    if (cambia && !tieniScroll) window.scrollTo(0, 0);
    if (r.id === 'novita') { memoria.scrivi('visto', new Date().toISOString()); aggiornaPallino(); }
  }
  window.addEventListener('hashchange', function () { disegna(false); });

  var timerAvviso = null;
  function avviso(testo, azione, etichetta) {
    var a = document.getElementById('avviso');
    a.innerHTML = '<span>' + esc(testo) + '</span>' + (azione ? '<button type="button">' + esc(etichetta) + '</button>' : '');
    a.hidden = false;
    if (azione) a.querySelector('button').onclick = azione;
    clearTimeout(timerAvviso);
    if (!azione) timerAvviso = setTimeout(function () { a.hidden = true; }, 4200);
  }

  /* ---------- azioni ---------- */
  vista.addEventListener('click', function (e) {
    var b = e.target.closest('[data-az]');
    if (!b || b.tagName === 'FORM' || b.tagName === 'SELECT') return;
    var az = b.getAttribute('data-az'), v = b.getAttribute('data-v');
    if (az === 'filtro-tappe') { filtroTappe = v; memoria.scrivi('filtroTappe', v); disegna(true); }
    else if (az === 'storia') { mostraStoria = !mostraStoria; disegna(true); }
    else if (az === 'filtro-novita') { filtroNovita = v; disegna(true); }
    else if (az === 'aggiungi-fam') {
      sim.familiari.push({ tipo: v, aCarico: true, eta: v === 'coniuge' ? 45 : v === 'genitore' ? 68 : 12, reddito: 0, convivente: false });
      memoria.scrivi('simulatore', sim); disegna(true);
      var ult = vista.querySelector('.familiare:last-child'); if (ult) ult.scrollIntoView({ block: 'center' });
    }
    else if (az === 'togli-fam') { sim.familiari.splice(+b.getAttribute('data-i'), 1); memoria.scrivi('simulatore', sim); disegna(true); }
    else if (az === 'attiva-notifiche') {
      b.disabled = true;
      attivaNotifiche().catch(function (err) {
        avviso(err && err.message === 'permesso' ? 'Non hai dato il permesso alle notifiche.' : 'Non siamo riusciti ad attivare le notifiche. Riprova più tardi.');
      }).then(function () { disegna(true); });
    }
    else if (az === 'spegni-notifiche') { spegniNotifiche().catch(function () {}).then(function () { disegna(true); }); }
    else if (az === 'installa' && invito) { invito.prompt(); invito = null; disegna(true); }
  });
  vista.addEventListener('submit', function (e) { e.preventDefault(); var q = document.getElementById('q'); if (q) q.blur(); });
  var timerCerca = null;
  vista.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') {
      domanda = t.value;
      clearTimeout(timerCerca);
      timerCerca = setTimeout(function () {
        var es = document.getElementById('esiti');
        if (es) es.innerHTML = domanda.trim().length >= 2 ? risultati(domanda) : indiceAccordo();
      }, 160);
      return;
    }
    if (t.hasAttribute('data-sim') && t.type === 'number') { sim.base = Number(t.value) || 0; salvaSim(); return; }
    var fam = t.closest('.familiare');
    if (fam && t.type === 'number') { sim.familiari[+fam.getAttribute('data-i')][t.getAttribute('data-campo')] = Number(t.value) || 0; salvaSim(); }
  });
  vista.addEventListener('change', function (e) {
    var t = e.target;
    if (t.getAttribute('data-az') === 'profilo') {
      profilo = { sit: document.getElementById('p-sit').value, prov: document.getElementById('p-prov').value };
      memoria.scrivi('profilo', profilo);
      if (t.id === 'p-sit') disegna(true); else document.getElementById('esito-profilo').innerHTML = esitoPerMe();
      return;
    }
    if (t.hasAttribute('data-sim') && t.tagName === 'SELECT') {
      sim[t.getAttribute('data-sim')] = t.value; memoria.scrivi('simulatore', sim);
      if (t.id === 's-sit') { var s = SIT_SIM.filter(function (x) { return x[0] === sim.sit; })[0]; document.getElementById('s-base-l').textContent = s[2]; }
      document.getElementById('esito-sim').innerHTML = esitoSimulatore();
      return;
    }
    if (t.hasAttribute('data-pref')) {
      prefs[t.getAttribute('data-pref')] = t.checked; memoria.scrivi('prefs', prefs);
      navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) { if (s) return inviaIscrizione(s); }).then(function () { avviso('Preferenze salvate.'); }).catch(function () { avviso('Preferenze non salvate: riprova quando hai rete.'); });
      return;
    }
    var fam = t.closest('.familiare');
    if (fam && (t.tagName === 'SELECT' || t.type === 'checkbox')) {
      var f = sim.familiari[+fam.getAttribute('data-i')], campo = t.getAttribute('data-campo');
      f[campo] = t.type === 'checkbox' ? t.checked : t.value;
      memoria.scrivi('simulatore', sim); disegna(true);
    }
  });
  function salvaSim() { memoria.scrivi('simulatore', sim); var es = document.getElementById('esito-sim'); if (es) es.innerHTML = esitoSimulatore(); }

  /* ---------- avvio ---------- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); invito = e; if (corrente === 'oggi') disegna(true); });
  window.addEventListener('appinstalled', function () { invito = null; su.installata = true; });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') caricaNovita().then(function () { if (corrente === 'oggi') disegna(true); });
  });

  disegna(false);
  caricaNovita().then(function () { if (corrente === 'oggi' || corrente === 'novita') disegna(true); });

  if (su.sw) {
    navigator.serviceWorker.register('sw.js').then(function () { return leggiStatoPush(); }).then(function () {
      if (corrente === 'novita') disegna(true);
    }).catch(function () { /* senza service worker l'app funziona comunque in linea */ });
    var avevaControllo = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (avevaControllo) avviso('È pronta una versione aggiornata.', function () { location.reload(); }, 'Aggiorna');
      avevaControllo = true;
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.tipo === 'novita') caricaNovita().then(function () { if (corrente === 'oggi' || corrente === 'novita') disegna(true); });
    });
  }
})();
