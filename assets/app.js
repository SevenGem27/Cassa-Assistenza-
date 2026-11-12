/* Guida alla Cassa Assistenza: logica dell'app. Niente framework.
   I contenuti e tutti i testi stanno nei file della cartella contenuti/ (più monitor/fonti.json):
   qui ci sono solo la logica e la struttura delle pagine. */
(function () {
  'use strict';

  var D = null, C = null, TESTI = {};
  var CFG = window.CASSA_CONFIG || {};
  var ANTEPRIMA = !!window.CASSA_ANTEPRIMA;
  var vista = document.getElementById('vista');
  var FILE_DATI = ['testi', 'accordo', 'sintesi', 'documenti', 'tappe', 'casse', 'normativa', 'glossario', 'contributi'];

  /* ---------- utilità ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function testo(k) {
    var v = k.split('.').reduce(function (o, p) { return o == null ? o : o[p]; }, TESTI);
    if (v == null) { if (window.console) console.warn('Testo mancante in contenuti/testi.json: ' + k); return k; }
    return v;
  }
  function riempi(s, v) { return v ? String(s).replace(/\{(\w+)\}/g, function (t, k) { return k in v ? v[k] : t; }) : s; }
  // T: testo semplice (da passare a esc). H: testo già pronto per l'HTML, con **grassetto**; i valori vanno passati già sicuri.
  function T(k, v) { var s = testo(k); return typeof s === 'string' ? riempi(s, v) : s; }
  function H(k, v) { return riempi(esc(testo(k)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'), v); }
  // V: una frase con i suoi riferimenti all'accordo, come [testo, riferimenti].
  function V(k, v) { var o = testo(k); return [riempi(o.t, v), o.rif || []]; }
  function coppie(lista, campo) { return lista.map(function (o) { return campo ? [o.id, o.nome, o[campo]] : [o.id, o.nome]; }); }

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
    if (n === 0) return T('tempo.oggi');
    if (n === 1) return T('tempo.domani');
    if (n === -1) return T('tempo.ieri');
    if (n < 0) return T('tempo.giorniFa', { n: -n });
    if (n < 75) return T('tempo.traGiorni', { n: n });
    if (n < 700) return T('tempo.traMesi', { n: Math.round(n / 30.44) });
    return T('tempo.traAnni', { n: (Math.round(n / 36.525) / 10).toLocaleString('it-IT') });
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
    return stesso ? T('tempo.oggiAlle', { ora: ora }) : T('tempo.giornoAlle', { data: d.getDate() + ' ' + MESI[d.getMonth()], ora: ora });
  }
  var FRECCIA = '<svg class="freccia" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- caricamento dei contenuti ---------- */
  function caricaDati() {
    if (window.CASSA_DATI) return Promise.resolve(window.CASSA_DATI); // anteprima in un file unico
    var leggi = function (u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }); };
    return Promise.all(FILE_DATI.map(function (n) { return leggi('contenuti/' + n + '.json'); }).concat([leggi('monitor/fonti.json')])).then(function (r) {
      var d = {};
      FILE_DATI.forEach(function (n, i) { d[n] = r[i]; });
      d.fonti = r[FILE_DATI.length];
      return d;
    });
  }
  // Ricompone i file in un unico oggetto per le viste.
  function componi(f) {
    var S = f.sintesi, A = f.accordo;
    return {
      meta: { firmato: S.firmato, contenutiAl: S.aggiornato },
      intestazione: A.intestazione,
      premesse: { breve: S.premesse.breve, punti: S.premesse.punti, testo: A.premesse },
      sezioni: S.sezioni,
      articoli: A.articoli.map(function (a) { var s = S.articoli[a.n] || { breve: '', punti: [] }; return { n: a.n, titolo: a.titolo, breve: s.breve, punti: s.punti, blocchi: a.blocchi }; }),
      firme: A.firme,
      lettera: { breve: S.lettera.breve, punti: S.lettera.punti, blocchi: A.lettera },
      allegati: A.allegati,
      documenti: f.documenti.documenti,
      tappe: f.tappe.tappe,
      ricorrenti: f.tappe.ricorrenti,
      categorieTappe: f.tappe.categorie,
      casse: f.casse.casse,
      riservaUnica: f.casse.riservaUnica,
      norme: f.normativa.norme,
      riforma: f.normativa.riforma,
      glossario: f.glossario.voci,
      fonti: f.fonti.fonti.map(function (x) { return { id: x.id, nome: x.nome, descrizione: x.descrizione, categoria: x.categoria, pagina: x.pagina }; }),
      contributi: f.contributi
    };
  }

  /* ---------- riferimenti agli articoli ---------- */
  var ART = {};
  function rifLink(r) {
    if (typeof r === 'number') return '<a class="rif" href="#art-' + r + '">' + H('riferimenti.articolo', { n: r }) + '</a>';
    if (r === 'premesse') return '<a class="rif" href="#premesse">' + H('riferimenti.premesse') + '</a>';
    if (r === 'lettera') return '<a class="rif" href="#lettera">' + H('riferimenti.lettera') + '</a>';
    if (r === 'tabella-a') return '<a class="rif" href="#tabella-a">' + H('riferimenti.tabella-a') + '</a>';
    if (r === 'tabella-b') return '<a class="rif" href="#tabella-b">' + H('riferimenti.tabella-b') + '</a>';
    return '';
  }
  function rifs(lista, norma) {
    var h = (lista || []).map(rifLink).join('');
    if (norma) h += '<a class="rif" href="#norme">' + H('riferimenti.norma') + '</a>';
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
    if (t.tipo === 'entro') return t.mese ? T('tappe.quandoEntroMese', { mese: MESI[d.getMonth()], anno: d.getFullYear() }) : T('tappe.quandoEntro', { data: dataLunga(t.d) });
    if (t.tipo === 'dal') return T('tappe.quandoDal', { data: dataLunga(t.d) });
    return dataLunga(t.d);
  }
  function timbro(t, opz) {
    opz = opz || {};
    var d = dataDa(t.d), st = statoTappa(t);
    var cls = st === 'fatto' || st === 'vigore' ? 'fatto' : st === 'corso' ? 'corso' : st === 'passato' ? 'passato' : opz.prossimo ? 'prossimo' : '';
    var pre = t.tipo === 'entro' ? T('tappe.timbroEntro') : t.tipo === 'dal' ? T('tappe.timbroDal') : t.tipo === 'periodo' && !/^nel corso/.test(t.etichetta || '') ? T('tappe.timbroDa') : '';
    var soloAnno = /^nel corso/.test(t.etichetta || '');
    var giorno = t.mese || t.tipo === 'periodo' ? '' : d.getDate();
    var h = '<div class="timbro ' + cls + (opz.grande ? ' grande' : '') + (opz.premi ? ' premi' : '') + '" aria-hidden="true">';
    if (pre) h += '<span class="pre">' + esc(pre) + '</span>';
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
      '<span class="det">' + esc(quandoTxt) + (v.pertinente ? '' : H('novita.altroArgomento')) + '</span></span>' + FRECCIA + '</a></li>';
  }

  /* ---------- viste ---------- */
  function vOggi() {
    // In cima: è una guida personale, indipendente e non ufficiale. Poi che cosa fa, come restare aggiornati e il percorso.
    var h = '<h1 class="solo-lettori">' + H('home.titolo') + '</h1>' +
      '<aside class="non-ufficiale" aria-labelledby="nu-tit"><p class="nu-tit" id="nu-tit">' + H('nonUfficiale.titolo') + '</p><p>' + H('nonUfficiale.testo') + '</p></aside>';
    h += '<section class="blocco"><h2 class="t2">' + H('home.cosaFa') + '</h2><p>' + H('home.intro') + '</p><ul class="breve">' +
      T('home.sezioni').map(function (x) { return '<li><b>' + esc(x.nome) + '</b>: ' + esc(x.d) + '</li>'; }).join('') + '</ul></section>';
    h += '<section class="blocco nota"><h2 class="t3">' + H('home.aggiornato') + '</h2>' + restaAggiornato() + '</section>';
    h += '<section class="blocco"><h2 class="t2">' + H('home.timeline') + '</h2>' + lineaDelTempo() +
      '<p class="azioni"><a class="btn chiaro" href="#tappe">' + H('home.dettagli') + '</a></p></section>';
    return h;
  }
  function restaAggiornato() {
    if (su.installata && statoPush === 'attive') return '<p>' + H('home.notificheAttive') + '</p>';
    var h = su.installata ? '' : '<p>' + H('home.aggiornatoTesto') + '</p><p>' + H(su.ios ? 'home.passoIphone' : 'home.passoAndroid') + '</p>';
    h += '<p>' + (su.installata ? H('home.passoNotificheInstallata') : H('home.passoNotifiche')) + '</p>';
    if (ANTEPRIMA) return h;
    return h + '<p class="azioni">' + (invito ? '<button class="btn" data-az="installa">' + H('home.installa') + '</button>' : '') +
      '<a class="btn' + (invito ? ' chiaro' : '') + '" href="#novita" data-az="vai-notifiche">' + H('home.vaiNotifiche') + '</a></p>';
  }
  // La linea del tempo: tutte le tappe, passate e future, con il segno di oggi.
  function isoDi(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function lineaDelTempo() {
    var lista = D.tappe.slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    var oggiIso = isoDi(oggi()), p = prossimaScadenza();
    var inizio = dataDa(lista[0].d), fine = dataDa(lista.reduce(function (m, t) { var f = t.fine || t.d; return f > m ? f : m; }, lista[0].d));
    var dove = function (iso) { return Math.max(0, Math.min(100, (dataDa(iso) - inizio) / (fine - inizio) * 100)).toFixed(2); };
    // panoramica in proporzione
    var anni = '';
    for (var y = inizio.getFullYear(); y <= fine.getFullYear(); y++) {
      var iso = y === inizio.getFullYear() ? lista[0].d : y + '-01-01';
      anni += '<span class="' + (y === inizio.getFullYear() ? 'primo' : y === fine.getFullYear() ? 'ultimo' : '') + '" style="left:' + dove(iso) + '%">' + y + '</span>';
    }
    var pallini = lista.map(function (t) { return '<span class="' + (t.d <= oggiIso ? 'p-fatta' : 'p-futura') + '" style="left:' + dove(t.d) + '%"></span>'; }).join('');
    var h = '<div class="panoramica" aria-hidden="true"><div class="binario"><span class="percorso" style="width:' + dove(oggiIso) + '%"></span>' + pallini +
      '<span class="oggi-pin" style="left:' + dove(oggiIso) + '%"><b>' + H('home.oggi') + '</b></span></div><div class="anni">' + anni + '</div></div>';
    // elenco verticale
    h += '<ol class="linea">';
    var anno = null, segnato = false;
    lista.forEach(function (t) {
      if (!segnato && t.d > oggiIso) {
        h += '<li class="oggi-segno"><span>' + H('home.oggiData', { data: esc(dataLunga(oggiIso)) }) + '</span></li>';
        segnato = true;
      }
      var a = t.d.slice(0, 4);
      if (a !== anno) { anno = a; h += '<li class="anno-l" aria-hidden="true">' + a + '</li>'; }
      var st = statoTappa(t), passata = t.d <= oggiIso && st !== 'corso';
      var cls = st === 'corso' ? 'corso' : passata ? 'passata' : t === p ? 'futura vicina' : 'futura';
      var nota = st === 'corso' ? H('home.inCorso') : t === p ? H('home.prossima', { quando: esc(traQuanto(t.d)) }) : '';
      h += '<li class="t ' + cls + '"><a href="#tappe" data-az="vai-tappa" data-v="' + esc(t.id) + '"><span class="punto" aria-hidden="true"></span>' +
        '<span class="q">' + esc(quando(t)) + (nota ? ' <em>' + nota + '</em>' : '') + '</span><span class="tt">' + esc(t.titolo) + '</span>' +
        '<span class="solo-lettori">, ' + (passata ? H('home.statoPassata') : H('home.statoFutura')) + '</span></a></li>';
    });
    if (!segnato) h += '<li class="oggi-segno"><span>' + H('home.oggiData', { data: esc(dataLunga(oggiIso)) }) + '</span></li>';
    return h + '</ol>';
  }
  function voceMenu(id, tit, det) {
    return '<li><a class="riga" href="#' + id + '"><span class="corpo"><span class="tit">' + esc(tit) + '</span>' + (det ? '<span class="det">' + esc(det) + '</span>' : '') + '</span>' + FRECCIA + '</a></li>';
  }
  function testoControllo() {
    if (ANTEPRIMA) return T('controllo.anteprima', { data: dataLunga(D.meta.contenutiAl) });
    if (novita.errore && !navigator.onLine) return T('controllo.senzaRete');
    if (!novita.ultimo) return T('controllo.maiFatto');
    return T('controllo.ultimo', { quando: oraLocale(novita.ultimo) });
  }

  var filtroTappe = memoria.leggi('filtroTappe', 'tutte');
  var mostraStoria = false;
  function vTappe() {
    var cats = [{ id: 'tutte', nome: T('tappe.tutte') }].concat(D.categorieTappe);
    var h = '<section class="blocco"><h1 class="solo-lettori">' + H('tappe.titolo') + '</h1><p class="sotto">' + H('tappe.intro') + '</p>' +
      '<div class="filtri" role="group" aria-label="' + H('tappe.filtri') + '">' + cats.map(function (c) {
        return '<button class="filtro" data-az="filtro-tappe" data-v="' + c.id + '" aria-pressed="' + (filtroTappe === c.id) + '">' + esc(c.nome) + '</button>';
      }).join('') + '</div></section>';

    var lista = D.tappe.filter(function (t) {
      if (t.cat === 'storia') return mostraStoria && filtroTappe === 'tutte';
      return filtroTappe === 'tutte' || t.cat === filtroTappe;
    }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });

    var p = prossimaScadenza(), anno = null;
    h += '<section>';
    if (filtroTappe === 'tutte') h += '<p><button class="btn chiaro stretto" data-az="storia">' + (mostraStoria ? H('tappe.nascondiStoria') : H('tappe.mostraStoria')) + '</button></p>';
    lista.forEach(function (t) {
      var a = t.d.slice(0, 4);
      if (a !== anno) { anno = a; h += '<h2 class="anno">' + a + '</h2>'; }
      var st = statoTappa(t), segni = '';
      if (st === 'fatto') segni += '<span class="segno">' + H('tappe.fatto') + '</span> ';
      if (st === 'vigore') segni += '<span class="segno">' + H('tappe.vigore') + '</span> ';
      if (st === 'corso') segni += '<span class="segno">' + H('tappe.corso') + '</span> ';
      if (st === 'passato' && t.tipo === 'entro') segni += '<span class="segno rosso">' + H('tappe.passata') + '</span> ';
      if (t === p) segni += '<span class="segno rosso">' + esc(traQuanto(t.d)) + '</span> ';
      if (t.calcolata) segni += '<span class="segno neutro">' + H('tappe.calcolata', { come: esc(t.calcolata) }) + '</span> ';
      if (t.indicativa) segni += '<span class="segno neutro">' + H('tappe.indicativa') + '</span> ';
      if (t.cat === 'norme') segni += '<span class="segno neutro">' + H('tappe.obbligoLegge') + '</span> ';
      h += '<article class="tappa' + (st === 'fatto' ? ' e-fatta' : '') + '" id="t-' + t.id + '">' + timbro(t, { prossimo: t === p }) +
        '<div class="corpo"><p class="quando">' + esc(quando(t)) + '</p><h3 class="tit">' + esc(t.titolo) + '</h3><p class="txt">' + esc(t.testo) + '</p>' +
        (segni ? '<p class="rifs">' + segni + '</p>' : '') + rifs(t.rif, t.norma) + '</div></article>';
    });
    if (!lista.length) h += '<p class="nota">' + H('tappe.nessuna') + '</p>';
    h += '</section>';

    h += '<section class="blocco"><h2 class="t2">' + H('tappe.ricorrenti') + '</h2><ul class="righe">' + D.ricorrenti.map(function (r) {
      return '<li><div class="riga"><span class="corpo"><span class="tit">' + esc(r.titolo) + '</span><span class="det">' + esc(r.testo) + '</span>' + rifs(r.rif) + '</span></div></li>';
    }).join('') + '</ul></section>';

    h += '<section class="blocco nota"><h2 class="t3">' + H('tappe.calendario') + '</h2>';
    if (ANTEPRIMA) h += '<p>' + H('tappe.calendarioAnteprima') + '</p>';
    else h += '<p>' + H('tappe.calendarioTesto') + '</p><p class="azioni"><a class="btn stretto" href="data/scadenze.ics">' + H('tappe.calendarioTasto') + '</a></p>';
    h += '</section>';
    return h;
  }

  /* ----- accordo ----- */
  var domanda = '';
  function testoBlocchi(blocchi) { return blocchi.map(function (b) { return b.x; }).join(' '); }
  function indiceRicerca() {
    if (indiceRicerca.c) return indiceRicerca.c;
    var v = [];
    v.push({ h: 'premesse', t: T('accordo.cercaPremesse'), s: D.premesse.testo.map(function (p) { return p.x; }).join(' ') + ' ' + D.premesse.punti.join(' ') });
    D.articoli.forEach(function (a) {
      v.push({ h: 'art-' + a.n, t: T('accordo.cercaArticolo', { n: a.n, titolo: a.titolo }), s: a.titolo + ' ' + testoBlocchi(a.blocchi) + ' ' + a.breve + ' ' + a.punti.join(' ') });
    });
    v.push({ h: 'lettera', t: T('accordo.cercaLettera'), s: testoBlocchi(D.lettera.blocchi) + ' ' + D.lettera.punti.join(' ') });
    v.push({ h: 'tabella-a', t: T('viste.tabella-a'), s: D.allegati.a.titolo + ' ' + D.allegati.a.note.join(' ') });
    v.push({ h: 'tabella-b', t: T('viste.tabella-b'), s: D.allegati.b.titolo + ' ' + D.allegati.b.note.join(' ') });
    D.tappe.forEach(function (t) { v.push({ h: 'tappe', t: T('accordo.cercaTappa', { titolo: t.titolo }), s: t.titolo + ' ' + t.testo + ' ' + quando(t) }); });
    D.glossario.forEach(function (g) { v.push({ h: 'glossario', t: T('accordo.cercaGlossario', { t: g.t }), s: g.t + ' ' + g.d }); });
    D.norme.forEach(function (n) { v.push({ h: 'norme', t: T('accordo.cercaNorma', { titolo: n.titolo }), s: n.titolo + ' ' + n.fonte + ' ' + n.testo }); });
    D.casse.forEach(function (c) { v.push({ h: 'casse', t: T('accordo.cercaCassa', { sigla: c.sigla }), s: c.sigla + ' ' + c.nome + ' ' + c.cosa + ' ' + c.destino }); });
    v.forEach(function (x) { x.n = senzaAccenti(x.s); });
    return (indiceRicerca.c = v);
  }
  function evidenzia(testoIntero, q) {
    var n = senzaAccenti(testoIntero), i = n.indexOf(q);
    if (i < 0) return esc(testoIntero.slice(0, 140));
    var da = Math.max(0, i - 60), a = Math.min(testoIntero.length, i + q.length + 90);
    return (da ? '…' : '') + esc(testoIntero.slice(da, i)) + '<mark>' + esc(testoIntero.slice(i, i + q.length)) + '</mark>' + esc(testoIntero.slice(i + q.length, a)) + (a < testoIntero.length ? '…' : '');
  }
  function risultati(q) {
    var qq = senzaAccenti(q.trim());
    if (qq.length < 2) return '';
    var trovati = indiceRicerca().filter(function (x) { return x.n.indexOf(qq) >= 0; });
    if (!trovati.length) return '<p class="nota">' + H('accordo.nessunRisultato', { q: esc(q) }) + '</p>';
    return '<p class="piccolo">' + (trovati.length === 1 ? H('accordo.risultato', { n: 1 }) : H('accordo.risultati', { n: trovati.length })) + '</p><ul class="righe">' + trovati.map(function (x) {
      return '<li><a class="riga" href="#' + x.h + '"><span class="corpo"><span class="tit">' + esc(x.t) + '</span><span class="det">' + evidenzia(x.s, qq) + '</span></span>' + FRECCIA + '</a></li>';
    }).join('') + '</ul>';
  }
  function indiceAccordo() {
    var h = '<ul class="righe">' + voceIndice('premesse', '', T('accordo.premesse'), D.premesse.breve) + '</ul>';
    D.sezioni.forEach(function (s) {
      h += '<h2 class="sez-tit">' + esc(s.titolo) + (s.nota ? ' (' + esc(s.nota) + ')' : '') + '</h2><ul class="righe">' + s.articoli.map(function (n) {
        return voceIndice('art-' + n, n, ART[n].titolo, ART[n].breve);
      }).join('') + '</ul>';
    });
    h += '<h2 class="sez-tit">' + H('accordo.letteraAllegati') + '</h2><ul class="righe">' +
      voceIndice('lettera', '', T('accordo.letteraIndice'), D.lettera.breve) +
      voceIndice('tabella-a', 'A', T('viste.tabella-a'), T('accordo.tabellaAIndice')) +
      voceIndice('tabella-b', 'B', T('viste.tabella-b'), T('accordo.tabellaBIndice')) + '</ul>';
    return h;
  }
  function voceIndice(id, num, tit, det) {
    return '<li><a class="riga" href="#' + id + '">' + (num !== '' ? '<span class="num">' + num + '</span>' : '<span class="num"></span>') +
      '<span class="corpo"><span class="tit">' + esc(tit) + '</span><span class="det">' + esc(det) + '</span></span>' + FRECCIA + '</a></li>';
  }
  function vAccordo() {
    return '<section class="blocco"><h1 class="solo-lettori">' + H('accordo.titolo') + '</h1>' +
      '<form class="cerca" role="search" data-az="cerca"><label class="solo-lettori" for="q">' + H('accordo.cercaEtichetta') + '</label>' +
      '<input id="q" type="search" inputmode="search" autocomplete="off" placeholder="' + H('accordo.cercaSegnaposto') + '" value="' + esc(domanda) + '"></form></section>' +
      '<section id="esiti">' + (domanda.trim().length >= 2 ? risultati(domanda) : indiceAccordo()) + '</section>' +
      '<section class="blocco nota"><h2 class="t3">' + H('accordo.firmati') + '</h2><p>' + H('accordo.firmatiTesto') + '</p>' +
      (ANTEPRIMA ? '<p class="piccolo">' + H('accordo.firmatiAnteprima') + '</p>'
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
    return '<section class="blocco"><h2 class="t2">' + H('accordo.inBreve') + '</h2><ul class="breve">' + punti.map(function (p) { return '<li>' + collegaArticoli(esc(p)) + '</li>'; }).join('') + '</ul></section>';
  }
  function scadenzeCollegate(chiave) {
    var l = D.tappe.filter(function (t) { return t.cat !== 'storia' && (t.rif || []).indexOf(chiave) >= 0; });
    if (!l.length) return '';
    return '<section class="blocco"><h2 class="t2">' + H('accordo.dateCollegate') + '</h2><ul class="righe">' + l.map(function (t) {
      return '<li><a class="riga" href="#tappe"><span class="corpo"><span class="tit">' + esc(t.titolo) + '</span><span class="det">' + esc(quando(t)) + '</span></span><span class="lato">' + esc(traQuanto(t.fine && statoTappa(t) === 'corso' ? t.fine : t.d)) + '</span></a></li>';
    }).join('') + '</ul></section>';
  }
  function vArticolo(n) {
    var a = ART[n];
    if (!a) return vAccordo();
    var prima = ART[n - 1], dopo = ART[n + 1];
    var h = '<section class="blocco"><p class="piccolo">' + H('accordo.articolo', { n: n }) + '</p><h1 class="t1">' + esc(a.titolo) + '</h1><p class="sotto">' + esc(a.breve) + '</p></section>' + inBreve(a.punti);
    var strumenti = '';
    if ([11, 12, 15, 16, 17].indexOf(n) >= 0) strumenti += '<a class="btn stretto" href="#simulatore">' + H('accordo.tastoSimulatore') + '</a>';
    if (n === 11) strumenti += '<a class="btn chiaro stretto" href="#tabella-a">' + H('viste.tabella-a') + '</a><a class="btn chiaro stretto" href="#tabella-b">' + H('viste.tabella-b') + '</a>';
    if ([7, 8, 9, 10, 17, 18, 22].indexOf(n) >= 0) strumenti += '<a class="btn chiaro stretto" href="#casse">' + H('accordo.tastoCasse') + '</a>';
    if ([2, 24, 26].indexOf(n) >= 0) strumenti += '<a class="btn chiaro stretto" href="#norme">' + H('accordo.tastoNormativa') + '</a>';
    if (strumenti) h += '<p class="azioni">' + strumenti + '</p>';
    h += scadenzeCollegate(n);
    h += '<section class="blocco"><h2 class="t2">' + H('accordo.testoFirmato') + '</h2><div class="testo">' + blocchiHtml(a.blocchi) + '</div>' + tastoPdf('doc-accordo') + '</section>';
    h += '<nav class="passi" aria-label="' + H('accordo.passiNav') + '">' +
      (prima ? '<a href="#art-' + (n - 1) + '">' + H('accordo.articolo', { n: n - 1 }) + '<b>' + esc(prima.titolo) + '</b></a>' : '<a href="#premesse">' + H('accordo.prima') + '<b>' + H('accordo.premesse') + '</b></a>') +
      (dopo ? '<a href="#art-' + (n + 1) + '">' + H('accordo.articolo', { n: n + 1 }) + '<b>' + esc(dopo.titolo) + '</b></a>' : '<a href="#lettera">' + H('accordo.poi') + '<b>' + H('viste.lettera') + '</b></a>') + '</nav>';
    return h;
  }
  function vPremesse() {
    var p = D.premesse;
    return '<section class="blocco"><h1 class="t1">' + H('accordo.premesse') + '</h1><p class="sotto">' + esc(p.breve) + '</p></section>' + inBreve(p.punti) +
      '<section class="blocco"><h2 class="t2">' + H('accordo.testoFirmato') + '</h2><div class="testo">' +
      D.intestazione.map(function (x, i) { return '<p class="' + (i === 0 ? 'centro' : '') + '">' + esc(x) + '</p>'; }).join('') +
      '<p class="centro">' + H('accordo.premessoChe') + '</p>' + p.testo.map(function (b) { return '<p class="voce"><span class="m">' + esc(b.m) + '</span> ' + esc(b.x) + '</p>'; }).join('') +
      '<p class="centro">' + H('accordo.siConviene') + '</p></div>' + tastoPdf('doc-accordo') + '</section>' +
      '<nav class="passi"><a href="#accordo">' + H('accordo.indice') + '<b>' + H('accordo.titolo') + '</b></a><a href="#art-1">' + H('accordo.articolo', { n: 1 }) + '<b>' + esc(ART[1].titolo) + '</b></a></nav>';
  }
  function vLettera() {
    var l = D.lettera;
    return '<section class="blocco"><p class="piccolo">' + H('accordo.letteraDa') + '</p><h1 class="t1">' + H('viste.lettera') + '</h1><p class="sotto">' + esc(l.breve) + '</p></section>' + inBreve(l.punti) +
      scadenzeCollegate('lettera') +
      '<section class="blocco"><h2 class="t2">' + H('accordo.testoFirmato') + '</h2><div class="testo">' + l.blocchi.map(function (b) {
        if (b.t === 'li') return '<p class="voce"><span class="m">' + esc(b.m) + '</span> ' + esc(b.x) + '</p>';
        return '<p class="' + (b.ind > 40 ? 'firma' : '') + '">' + esc(b.x) + '</p>';
      }).join('') + '</div>' + tastoPdf('doc-lettera') + '</section>' +
      '<p class="firma piccolo">' + H('accordo.inCalce', { firme: esc(D.firme.join(' / ')) }) + '</p>' +
      '<nav class="passi"><a href="#art-26">' + H('accordo.articolo', { n: 26 }) + '<b>' + esc(ART[26].titolo) + '</b></a><a href="#tabella-a">' + H('accordo.allegato1') + '<b>' + H('viste.tabella-a') + '</b></a></nav>';
  }
  function tastiTabella(altra, pdf) {
    return '<p class="azioni"><a class="btn stretto" href="#simulatore">' + H('accordo.calcolaFamiglia') + '</a><a class="btn chiaro stretto" href="#' + altra + '">' + H('viste.' + altra) + '</a><a class="btn chiaro stretto" href="#art-11">' + H('accordo.articolo', { n: 11 }) + '</a>' + tastoPdf(pdf, true) + '</p>';
  }
  function vTabellaA() {
    var a = D.allegati.a;
    var righe = C.TABELLA_A.map(function (r) {
      return '<tr><th scope="row">' + esc(r.etichetta) + '</th><td>' + (r.annuo == null ? H('accordo.comeACarico') : euro(r.annuo / 12)) + '</td><td>' + (r.annuo == null ? H('accordo.comeACarico') : euro(r.annuo)) + '</td></tr>';
    }).join('');
    return '<section class="blocco"><p class="piccolo">' + H('accordo.allegato1All') + '</p><h1 class="t1">' + H('viste.tabella-a') + '</h1><p class="sotto">' + esc(a.titolo) + '. ' + esc(a.sottotitolo) + '</p></section>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">' + esc(a.colonne[0]) + '</th><th scope="col">' + esc(a.colonne[1]) + '</th><th scope="col">' + esc(a.colonne[2]) + '</th></tr></thead><tbody>' + righe + '</tbody></table></div>' +
      '<section class="blocco"><ul class="breve">' + a.note.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' + tastiTabella('tabella-b', 'doc-tabella-a') + '</section>';
  }
  function vTabellaB() {
    var b = D.allegati.b, TB = C.TABELLA_B, corpo = '';
    TB.eta.forEach(function (e, i) {
      TB.reddito.forEach(function (r, j) {
        corpo += '<tr class="' + (j === 0 && i > 0 ? 'gruppo' : '') + '"><th scope="row">' + (j === 0 ? esc(e.etichetta) : '<span class="solo-lettori">' + esc(e.etichetta) + '</span>') + '</th><td>' + esc(r.etichetta) + '</td>' +
          TB.valori[i][j].map(function (v) { return '<td>' + euro(v) + '</td>'; }).join('') + '</tr>';
      });
    });
    return '<section class="blocco"><p class="piccolo">' + H('accordo.allegato2All') + '</p><h1 class="t1">' + H('viste.tabella-b') + '</h1><p class="sotto">' + esc(b.titolo) + '. ' + esc(b.sottotitolo) + '</p></section>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr>' + T('accordo.colonneB').map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + corpo + '</tbody></table></div>' +
      '<section class="blocco"><ul class="breve">' + b.note.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' + tastiTabella('tabella-a', 'doc-tabella-b') + '</section>';
  }

  /* ----- documenti firmati, aperti dentro l'app ----- */
  function tastoPdf(id, soloTasto) {
    if (ANTEPRIMA) return '';
    var a = '<a class="btn chiaro stretto" href="#' + id + '">' + H('accordo.apriPdf') + '</a>';
    return soloTasto ? a : '<p class="azioni">' + a + '</p>';
  }
  function vDocumento(d) {
    return '<section class="blocco"><p class="piccolo">' + H('documento.firmato', { data: dataLunga(D.meta.firmato) }) + '</p><h1 class="t1">' + esc(d.nome) + '</h1></section>' +
      '<div id="pdf" class="pdf" data-u="' + esc(d.u) + '"><p class="piccolo">' + H('documento.apro') + '</p></div>' +
      '<p class="azioni"><a class="btn chiaro stretto" href="' + esc(d.u) + '" download="' + esc(d.file) + '">' + H('documento.salva') + '</a></p>';
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
      cont.innerHTML = '<p class="nota attenzione">' + H('documento.nonRiesco') + ' <a href="' + esc(url) + '">' + H('documento.apriFile') + '</a>.</p>';
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
      return pdf.getPage(1).then(function (primaPagina) {
        if (giro !== giroPdf) return;
        var foglio = primaPagina.getViewport({ scale: 1 }), larghezza = cont.clientWidth || 360, nitidezza = Math.min(window.devicePixelRatio || 1, 2);
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
          tela.setAttribute('aria-label', T('documento.pagina', { n: n, tot: pdf.numPages }));
          tela.style.aspectRatio = foglio.width + ' / ' + foglio.height;
          cont.appendChild(tela);
          if (osserva) osserva.observe(tela); else disegnaPagina(tela);
        }
      });
    }).catch(nonRiuscito);
  }

  /* ----- che cosa cambia per me ----- */
  var SITUAZIONI = [], PROVENIENZE = [], profilo = null;
  function opzioni(lista, scelto) { return lista.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === scelto ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function provenienzeAmmesse(sit) { return sit === 'servizio' ? PROVENIENZE : PROVENIENZE.filter(function (p) { return ['nessuna', 'assunto2627', 'nuovo2028'].indexOf(p[0]) < 0; }); }

  function perMe(sit, prov) {
    var S = [], forma = ['cma', 'fas', 'caspop', 'fiam'].indexOf(prov) >= 0, attivo = sit === 'servizio' || sit === 'esodo';
    var entri = [];
    if (forma || prov === 'assunto2627') {
      entri.push(V('perMe.entri.automatico'));
      var recesso = V('perMe.entri.recesso');
      if (attivo) recesso[0] += ' ' + T('perMe.entri.recessoAttivo');
      entri.push(recesso);
      if (prov === 'assunto2627') entri.push(V('perMe.entri.assunto2627'));
    }
    if (prov === 'polizza') {
      entri.push(V('perMe.entri.polizzaCopertura'));
      entri.push(V('perMe.entri.polizzaAdesione'));
      if (attivo) entri.push(V('perMe.entri.polizzaPerdi'));
      entri.push(V('perMe.entri.polizzaFusioni'));
    }
    if (prov === 'nessuna') {
      entri.push(V('perMe.entri.nessuna2027'));
      entri.push(V('perMe.entri.nessuna2028'));
      entri.push(V('perMe.entri.nessunaRate'));
      entri.push(V('perMe.entri.nessunaRiserva'));
      entri.push(V('perMe.entri.nessunaTardiva'));
    }
    if (prov === 'nuovo2028') {
      entri.push(V('perMe.entri.nuovoDestinatari'));
      entri.push(V('perMe.entri.nuovo90'));
      entri.push(V('perMe.entri.nuovoOltre'));
    }
    S.push({ t: T('perMe.sezioni.entri'), p: entri });

    var versi = [];
    if (sit === 'servizio') {
      versi.push(V('perMe.versi.servizioTu'));
      versi.push(V('perMe.versi.servizioAzienda'));
      versi.push(V('perMe.versi.servizioPensione'));
    }
    if (sit === 'esodo') {
      versi.push(V('perMe.versi.esodoTu'));
      versi.push(V('perMe.versi.esodoAzienda'));
      versi.push(V('perMe.versi.esodoPensione'));
    }
    if (sit === 'pensione') {
      if (prov === 'polizza') versi.push(V('perMe.versi.pensionePolizza'));
      else versi.push(V('perMe.versi.pensioneContinuita'));
      versi.push(V('perMe.versi.pensioneAdeguamenti'));
      versi.push(V('perMe.versi.pensioneNoAzienda'));
    }
    if (sit === 'superstite') {
      versi.push(V('perMe.versi.superstiteBase'));
      versi.push(V('perMe.versi.superstiteChi'));
    }
    S.push({ t: T('perMe.sezioni.versi'), p: versi });

    var fam = [];
    if (forma || prov === 'polizza' || prov === 'assunto2627') {
      fam.push(V('perMe.familiari.conferma'));
      fam.push(V('perMe.familiari.altri60'));
    }
    if (prov === 'nessuna') fam.push(V('perMe.familiari.sanatoria'));
    fam.push(V('perMe.familiari.aggiorna'));
    fam.push(V('perMe.familiari.regole'));
    S.push({ t: T('perMe.sezioni.familiari'), p: fam });

    var una = [], r = C.contributoRiserva(prov);
    if (r) {
      una.push(r.importo === 0 ? V('perMe.riserva.zero') : V('perMe.riserva.importo', { importo: euro(r.importo), proCapite: euro(C.RISERVA_PRO_CAPITE) }));
      if (r.importo > 0) una.push(V('perMe.riserva.rate', { rate: r.rateMax, rata: euro(r.rataAnnua, r.rataAnnua % 1 !== 0) }));
      if (r.conguaglio) una.push(V('perMe.riserva.conguaglio'));
    } else if (prov === 'nessuna') {
      una.push(V('perMe.riserva.nessuna'));
    } else {
      una.push(V('perMe.riserva.nuovi'));
    }
    S.push({ t: T('perMe.sezioni.riserva'), p: una });

    if (['fas', 'caspop', 'fiam'].indexOf(prov) >= 0) {
      S.push({ t: T('perMe.sezioni.asa'), p: [V('perMe.asa.stop'), V('perMe.asa.passa'), V('perMe.asa.uso')] });
    } else if (sit === 'servizio') {
      S.push({ t: T('perMe.sezioni.asaServizio'), p: [V('perMe.asa.servizio')] });
    }

    var nomenclatore = V('perMe.prestazioni.nomenclatore');
    if (prov === 'cma') nomenclatore[0] += ' ' + T('perMe.prestazioni.nomenclatoreCma');
    var prest = [nomenclatore, V('perMe.prestazioni.team')];
    if (attivo) prest.push(V('perMe.prestazioni.checkup'));
    S.push({ t: T('perMe.sezioni.prestazioni'), p: prest });

    var piu = [];
    if (prov === 'caspop') {
      piu.push(V('perMe.piu.caspopCoperture'));
      piu.push(V('perMe.piu.caspopSezione'));
    }
    if (prov === 'cma') {
      piu.push(V('perMe.piu.cmaSociale'));
      piu.push(V('perMe.piu.cmaSuperstiti'));
    }
    if (prov === 'fiam') piu.push(V('perMe.piu.fiamPercorso'));
    if (sit === 'servizio') {
      piu.push(V('perMe.piu.servizioMorte'));
      piu.push(V('perMe.piu.servizioLtc'));
    }
    if (piu.length) S.push({ t: T('perMe.sezioni.piu'), p: piu });
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
      h += '<section class="blocco"><h2 class="t2">' + H('perMe.sezioni.date') + '</h2>' + date.map(function (t) {
        return '<article class="tappa">' + timbro(t) + '<div class="corpo"><p class="quando">' + esc(quando(t)) + '</p><h3 class="tit">' + esc(t.titolo) + '</h3><p class="txt">' + esc(t.testo) + '</p>' + rifs(t.rif) + '</div></article>';
      }).join('') + '</section>';
    }
    return h;
  }
  function vPerMe() {
    var amm = provenienzeAmmesse(profilo.sit);
    if (!amm.some(function (p) { return p[0] === profilo.prov; })) profilo.prov = amm[0][0];
    return '<section class="blocco"><h1 class="t1">' + H('perMe.titolo') + '</h1><p class="sotto">' + H('perMe.intro') + '</p>' +
      '<div class="griglia2 larga"><div class="campo"><label for="p-sit">' + H('perMe.oggi') + '</label><select id="p-sit" data-az="profilo">' + opzioni(SITUAZIONI, profilo.sit) + '</select></div>' +
      '<div class="campo"><label for="p-prov">' + H('perMe.assistenza') + '</label><select id="p-prov" data-az="profilo">' + opzioni(amm, profilo.prov) + '</select></div></div></section>' +
      '<div id="esito-profilo">' + esitoPerMe() + '</div>' +
      '<section class="blocco"><p class="azioni"><a class="btn" href="#simulatore">' + H('perMe.calcola') + '</a></p>' +
      '<p class="piccolo">' + H('perMe.avvertenza') + '</p></section>';
  }

  /* ----- simulatore ----- */
  var sim = null, SIT_SIM = [], PROV_SIM = [], TIPI_FAM = [], NOMI_TIPI = {};
  function nomeTipo(t) { return NOMI_TIPI[t]; }
  function schedaFamiliare(f, i) {
    return '<div class="familiare" data-i="' + i + '"><div class="capo"><b>' + esc(nomeTipo(f.tipo)) + ' ' + (i + 1) + '</b><button class="btn chiaro stretto" data-az="togli-fam" data-i="' + i + '">' + H('simulatore.togli') + '</button></div>' +
      '<div class="campo"><label for="f-tipo-' + i + '">' + H('simulatore.chiE') + '</label><select id="f-tipo-' + i + '" data-campo="tipo">' + opzioni(TIPI_FAM, f.tipo) + '</select></div>' +
      '<label class="spunta"><input type="checkbox" data-campo="aCarico"' + (f.aCarico ? ' checked' : '') + '> ' + H('simulatore.aCarico') + '</label>' +
      '<div class="griglia2"><div class="campo"><label for="f-eta-' + i + '">' + H('simulatore.eta') + '</label><input id="f-eta-' + i + '" type="number" inputmode="numeric" min="0" max="110" data-campo="eta" value="' + esc(f.eta) + '"></div>' +
      (f.aCarico ? '' : '<div class="campo"><label for="f-red-' + i + '">' + H('simulatore.reddito') + '</label><input id="f-red-' + i + '" type="number" inputmode="numeric" min="0" step="500" data-campo="reddito" value="' + esc(f.reddito) + '"></div>') + '</div>' +
      (f.tipo === 'genitore' && f.aCarico ? '<label class="spunta"><input type="checkbox" data-campo="convivente"' + (f.convivente ? ' checked' : '') + '> ' + H('simulatore.convivente') + '</label>' : '') + '</div>';
  }
  function esitoSimulatore() {
    var socio = C.contributoSocio(sim.sit, sim.base), fam = C.contributiFamiliari(sim.base, sim.familiari), ris = C.contributoRiserva(sim.prov);
    var righe = '<tr><th scope="row">' + H('simulatore.tu') + '</th><td>' + (socio.importo == null ? H('simulatore.comeOggi') : euro(socio.importo, true)) + '</td><td class="note">' +
      (socio.importo == null ? esc(socio.nota) : H('simulatore.percentualeBase', { aliquota: (socio.aliquota * 100).toLocaleString('it-IT', { minimumFractionDigits: 2 }) })) + '</td></tr>';
    fam.righe.forEach(function (r, i) {
      righe += '<tr><th scope="row">' + esc(nomeTipo(r.tipo)) + ' ' + (i + 1) + '</th><td>' + (r.iscrivibile ? euro(r.importo, true) : H('simulatore.nonIscrivibile')) + '</td><td class="note">' + esc(r.regola) + (r.note.length ? '. ' + esc(r.note.join(' ')) : '') + '</td></tr>';
    });
    var tot = (socio.importo || 0) + fam.totale;
    var h = '<h2 class="t2">' + H('simulatore.risultato') + '</h2><div class="totale"><span>' + H('simulatore.ogniAnno') + (socio.importo == null ? '<br><span class="piccolo">' + H('simulatore.soloFamiliari') + '</span>' : '') + '</span><b>' + euro(tot, true) + '</b></div>' +
      '<p class="piccolo">' + H('simulatore.alMese', { importo: euro(tot / 12, true) }) + '</p>' +
      '<div class="tab-scroll"><table class="tab"><thead><tr>' + T('simulatore.colonne').map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' + righe + '</tbody></table></div>';
    var extra = '<ul class="righe">';
    if (ris) extra += '<li><div class="riga"><span class="corpo"><span class="tit">' + H('simulatore.riserva', { importo: euro(ris.importo) }) + '</span><span class="det">' + (ris.importo ? H('simulatore.riservaRate', { rate: ris.rateMax, rata: euro(ris.rataAnnua, ris.rataAnnua % 1 !== 0) }) : H('simulatore.riservaZero')) + (ris.conguaglio ? ' ' + H('simulatore.riservaConguaglio') : '') + '</span>' + rifs([17]) + '</span></div></li>';
    if (sim.sit === 'servizio' || sim.sit === 'esodo') extra += '<li><div class="riga"><span class="corpo"><span class="tit">' + H('simulatore.azienda', { importo: euro(C.AZIENDA_ANNUO) }) + '</span><span class="det">' + H('simulatore.aziendaSpese') + '</span>' + rifs([15, 23]) + '</span></div></li>';
    extra += '</ul>';
    h += extra + '<div class="nota"><h3 class="t3">' + H('simulatore.lettura') + '</h3><ul class="breve">' +
      T('simulatore.note').map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') +
      '</ul><p class="piccolo">' + H('simulatore.stima') + '</p></div>';
    return h;
  }
  function vSimulatore() {
    var s = SIT_SIM.filter(function (x) { return x[0] === sim.sit; })[0] || SIT_SIM[0];
    return '<section class="blocco"><h1 class="t1">' + H('simulatore.titolo') + '</h1><p class="sotto">' + H('simulatore.intro') + '</p></section>' +
      '<section class="blocco" id="modulo-sim">' +
      '<div class="campo"><label for="s-sit">' + H('simulatore.situazione') + '</label><select id="s-sit" data-sim="sit">' + opzioni(SIT_SIM, sim.sit) + '</select></div>' +
      '<div class="campo"><label for="s-base" id="s-base-l">' + esc(s[2]) + '</label><input id="s-base" type="number" inputmode="numeric" min="0" step="500" data-sim="base" value="' + esc(sim.base) + '"><span class="aiuto">' + H('simulatore.aiutoBase') + '</span></div>' +
      '<div class="campo"><label for="s-prov">' + H('simulatore.provenienza') + '</label><select id="s-prov" data-sim="prov">' + opzioni(PROV_SIM, sim.prov) + '</select><span class="aiuto">' + H('simulatore.aiutoProvenienza') + '</span></div>' +
      '<h2 class="t2">' + H('simulatore.familiariTitolo') + '</h2><div id="familiari" class="blocco">' + sim.familiari.map(schedaFamiliare).join('') + '</div>' +
      '<p class="azioni">' + TIPI_FAM.map(function (t) { return '<button class="btn chiaro stretto" data-az="aggiungi-fam" data-v="' + t[0] + '">' + H('simulatore.aggiungi', { tipo: esc(nomeTipo(t[0]).toLowerCase()) }) + '</button>'; }).join('') + '</p></section>' +
      '<section class="blocco" id="esito-sim" aria-live="polite">' + esitoSimulatore() + '</section>' +
      '<p class="azioni"><a class="btn chiaro stretto" href="#tabella-a">' + H('viste.tabella-a') + '</a><a class="btn chiaro stretto" href="#tabella-b">' + H('viste.tabella-b') + '</a><a class="btn chiaro stretto" href="#art-11">' + H('accordo.articolo', { n: 11 }) + '</a></p>';
  }

  /* ----- novità ----- */
  var filtroNovita = 'tema';
  function vNovita() {
    var soglia = memoria.leggi('visto', null);
    var voci = novita.voci.filter(function (v) {
      if (filtroNovita === 'tutte') return true;
      if (filtroNovita === 'tema') return v.pertinente;
      var c = categoriaVoce(v);
      return filtroNovita === 'norme' ? (c === 'norme' || c === 'stampa') : c === filtroNovita;
    });
    var h = '<section class="blocco"><h1 class="solo-lettori">' + H('novita.titolo') + '</h1>' +
      '<p class="piccolo">' + esc(testoControllo()) + '</p>' +
      '<div class="filtri" role="group" aria-label="' + H('novita.filtri') + '">' + T('novita.categorie').map(function (f) {
        return '<button class="filtro" data-az="filtro-novita" data-v="' + f.id + '" aria-pressed="' + (filtroNovita === f.id) + '">' + esc(f.nome) + '</button>';
      }).join('') + '</div></section>';
    h += '<section>' + (voci.length ? '<ul class="righe">' + voci.slice(0, 120).map(function (v) { return rigaNovita(v, soglia); }).join('') + '</ul>'
      : '<p class="nota">' + (novita.caricate ? H('novita.vuota') : H('novita.carico')) + '</p>') + '</section>';
    h += '<section class="blocco" id="notifiche">' + schedaNotifiche() + '</section>';
    h += '<section class="blocco"><h2 class="t2">' + H('novita.fonti') + '</h2><p class="piccolo">' + H('novita.fontiIntro') + '</p><ul class="stato-fonti">' +
      D.fonti.map(function (f) {
        var s = novita.fonti.filter(function (x) { return x.id === f.id; })[0];
        var stato = !s || !s.controllato ? '<span class="ok">' + H('novita.inAttesa') + '</span>' : s.ok ? '<span class="ok">' + H('novita.letta', { quando: esc(oraLocale(s.controllato)) }) + '</span>' : '<span class="ko">' + H('novita.nonLetta', { errore: esc(s.errore || T('novita.errore')) }) + '</span>';
        return '<li><a href="' + esc(f.pagina) + '" target="_blank" rel="noopener">' + esc(f.nome) + '</a><span class="piccolo">' + esc(f.descrizione) + '</span>' + stato + '</li>';
      }).join('') + '</ul><p class="piccolo">' + H('novita.fas') + '</p></section>';
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
  function servizioPush() { return String(CFG.push.servizio).trim().replace(/\/+$/, ''); }
  function leggiStatoPush() {
    if (!su.push) { statoPush = 'assenti'; return Promise.resolve(); }
    if (Notification.permission === 'denied') { statoPush = 'negate'; return Promise.resolve(); }
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) {
      statoPush = s ? 'attive' : 'spente';
    }).catch(function () { statoPush = 'spente'; });
  }
  function inviaIscrizione(sub) {
    return fetch(servizioPush() + '/iscrivi', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ iscrizione: sub.toJSON(), preferenze: prefs })
    }).then(function (r) { if (!r.ok) throw new Error('servizio ' + r.status); });
  }
  function attivaNotifiche() {
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { statoPush = p === 'denied' ? 'negate' : 'spente'; throw new Error('permesso'); }
      return navigator.serviceWorker.ready;
    }).then(function (r) {
      return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiaveBinaria(CFG.push.chiavePubblica.trim()) });
    }).then(function (sub) { return inviaIscrizione(sub); }).then(function () {
      statoPush = 'attive'; avviso(T('notifiche.attivate'));
    });
  }
  function spegniNotifiche() {
    return navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) {
      if (!s) return;
      var fine = s.endpoint;
      return s.unsubscribe().then(function () {
        return fetch(servizioPush() + '/disiscrivi', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: fine }) }).catch(function () {});
      });
    }).then(function () { statoPush = 'spente'; avviso(T('notifiche.disattivate')); });
  }
  function schedaNotifiche() {
    var h = '<h2 class="t2">' + H('notifiche.titolo') + '</h2>';
    if (ANTEPRIMA) return h + '<p class="nota">' + H('notifiche.anteprima') + '</p>';
    if (su.ios && !su.installata) return h + '<div class="nota"><p>' + H('notifiche.iosHome') + '</p><p>' + H('notifiche.iosPassi') + '</p></div>';
    if (!su.push) return h + '<p class="nota">' + H('notifiche.nonSupportate') + '</p>';
    if (!su.configurate) return h + '<p class="nota">' + H('notifiche.nonConfigurate') + '</p>';
    if (statoPush === 'negate') return h + '<p class="nota attenzione">' + H('notifiche.negate') + '</p>';
    if (statoPush === 'attive') {
      return h + '<p>' + H('notifiche.attive') + '</p>' +
        '<label class="spunta"><input type="checkbox" data-pref="norme"' + (prefs.norme ? ' checked' : '') + '> ' + H('notifiche.prefNorme') + '</label>' +
        '<label class="spunta"><input type="checkbox" data-pref="tutte"' + (prefs.tutte ? ' checked' : '') + '> ' + H('notifiche.prefTutte') + '</label>' +
        '<p class="azioni"><button class="btn chiaro stretto" data-az="spegni-notifiche">' + H('notifiche.disattiva') + '</button></p>';
    }
    return h + '<p>' + H('notifiche.invito') + '</p><p class="azioni"><button class="btn" data-az="attiva-notifiche">' + H('notifiche.attiva') + '</button></p>';
  }

  /* ----- casse, normativa, glossario, altro ----- */
  function vCasse() {
    var h = '<section class="blocco"><h1 class="solo-lettori">' + H('casse.titolo') + '</h1><p class="sotto">' + H('casse.intro') + '</p></section>';
    h += '<section class="nota"><h2 class="t3">' + H('casse.statutoTitolo') + '</h2><p>' + H('casse.statutoTesto') + '</p>' + rifs(T('casse.statutoRif')) + '</section>';
    D.casse.forEach(function (c) {
      var doc = c.documenti.map(function (d) {
        return '<a class="btn ' + (d.principale ? '' : 'chiaro ') + 'stretto" href="' + esc(d.u) + '" target="_blank" rel="noopener">' + esc(d.t) + '</a>';
      }).join('');
      h += '<article class="cassa" id="cassa-' + c.id + '"><p class="sigla">' + esc(c.sigla) + (c.chiusa ? ' <span class="segno neutro">' + H('casse.sciolta') + '</span>' : '') + '</p><h2 class="t3">' + esc(c.nome) + '</h2><p class="piccolo">' + esc(c.origine) + '</p>' +
        '<p>' + esc(c.cosa) + '</p><p>' + H('casse.cheSuccede') + ' ' + esc(c.destino) + '</p>' +
        '<div class="dati"><div><b>' + (c.riserva == null ? H('casse.nessunaRiserva') : H('casse.milioni', { n: c.riserva.toLocaleString('it-IT') })) + '</b><span>' + H('casse.riservaPortata') + '</span></div><div><b>' + euro(c.contributo) + '</b><span>' + H('casse.contributo') + '</span></div></div>' +
        (doc ? '<div class="docs">' + doc + '</div>' : '') +
        c.documenti.filter(function (d) { return d.nota; }).map(function (d) { return '<p class="piccolo">' + esc(d.nota) + '</p>'; }).join('') +
        (c.avviso ? '<p class="piccolo">' + esc(c.avviso) + '</p>' : '') +
        (c.sito ? '<p class="piccolo"><a href="' + esc(c.sito) + '" target="_blank" rel="noopener">' + H('casse.sitoUfficiale') + '</a></p>' : '') + rifs(c.rif) + '</article>';
    });
    var R = D.riservaUnica, col = T('casse.riservaColonne');
    h += '<section class="blocco"><h2 class="t2">' + H('casse.riservaTitolo') + '</h2><div class="tab-scroll"><table class="tab"><thead><tr><th scope="col">' + esc(col[0]) + '</th><th scope="col">' + esc(col[1]) + '</th></tr></thead><tbody>' +
      R.righe.map(function (r) { return '<tr><th scope="row">' + esc(r.da) + '</th><td>' + esc(r.milioni) + '</td></tr>'; }).join('') +
      '</tbody><tfoot><tr><th scope="row">' + esc(R.totale.da) + '</th><td>' + esc(R.totale.milioni) + '</td></tr></tfoot></table></div>' +
      '<p class="piccolo">' + H('casse.riservaNota') + '</p>' + rifs(R.rif) + '</section>';
    return h;
  }
  function vNorme() {
    var h = '<section class="blocco"><h1 class="solo-lettori">' + H('normativa.titolo') + '</h1><p class="sotto">' + H('normativa.intro') + '</p></section><section class="blocco">';
    D.norme.forEach(function (n) {
      h += '<article class="cassa"><h2 class="t3">' + esc(n.titolo) + (n.nuova ? ' <span class="segno rosso">' + H('normativa.nuova') + '</span>' : '') + '</h2><p class="piccolo">' + esc(n.fonte) + '</p><p>' + esc(n.testo) + '</p>' +
        (n.perche ? '<p>' + H('normativa.perche') + ' ' + esc(n.perche) + '</p>' : '') +
        '<div class="docs">' + n.link.map(function (l) { return '<a class="btn chiaro stretto" href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + '</a>'; }).join('') + '</div>' + rifs(n.rif) + '</article>';
    });
    h += '</section><section class="blocco"><h2 class="t2">' + H('normativa.riforma') + '</h2><p>' + esc(D.riforma.intro) + '</p><p class="piccolo">' + H('normativa.situazione', { data: dataLunga(D.riforma.al) }) + '</p><ul class="righe">' +
      D.riforma.voci.map(function (v) {
        return '<li><div class="riga"><span class="corpo"><span class="tit">' + esc(v.titolo) + '</span><span class="det">' + esc(v.testo) + '</span><span class="docs" style="margin-top:8px">' +
          v.link.map(function (l) { return '<a class="btn chiaro stretto" href="' + esc(l.u) + '" target="_blank" rel="noopener">' + esc(l.t) + '</a>'; }).join('') + '</span></span></div></li>';
      }).join('') + '</ul>' + rifs([26]) + '</section>';
    return h;
  }
  function vGlossario() {
    return '<section class="blocco"><h1 class="solo-lettori">' + H('glossario.titolo') + '</h1><p class="sotto">' + H('glossario.intro') + '</p></section><dl class="voci">' + D.glossario.map(function (g) {
      return '<dt>' + esc(g.t) + '</dt><dd>' + esc(g.d) + rifs(g.rif) + '</dd>';
    }).join('') + '</dl>';
  }
  function vAltro() {
    return '<section class="blocco"><h1 class="solo-lettori">' + H('altro.titolo') + '</h1><ul class="righe">' +
      T('altro.menu').map(function (m) { return voceMenu(m.id, m.t, m.d); }).join('') + '</ul></section>';
  }

  /* ---------- navigazione ---------- */
  var VISTE = null;
  function preparaViste() {
    VISTE = {
      oggi: { t: T('app.nomeTitolo'), s: 'oggi', f: vOggi },
      tappe: { t: T('viste.tappe'), s: 'tappe', f: vTappe },
      accordo: { t: T('viste.accordo'), s: 'accordo', f: vAccordo },
      premesse: { t: T('viste.premesse'), s: 'accordo', su: 'accordo', f: vPremesse },
      lettera: { t: T('viste.lettera'), s: 'accordo', su: 'accordo', f: vLettera },
      'tabella-a': { t: T('viste.tabella-a'), s: 'accordo', su: 'accordo', f: vTabellaA },
      'tabella-b': { t: T('viste.tabella-b'), s: 'accordo', su: 'accordo', f: vTabellaB },
      novita: { t: T('viste.novita'), s: 'novita', f: vNovita },
      altro: { t: T('viste.altro'), s: 'altro', f: vAltro },
      'per-me': { t: T('viste.per-me'), s: 'altro', su: 'altro', f: vPerMe },
      simulatore: { t: T('viste.simulatore'), s: 'altro', su: 'altro', f: vSimulatore },
      casse: { t: T('viste.casse'), s: 'altro', su: 'altro', f: vCasse },
      norme: { t: T('viste.norme'), s: 'altro', su: 'altro', f: vNorme },
      glossario: { t: T('viste.glossario'), s: 'altro', su: 'altro', f: vGlossario }
    };
  }
  var corrente = null, vaiA = null;
  function rotta() {
    var h = (location.hash || '#oggi').slice(1), m = /^art-(\d{1,2})$/.exec(h);
    if (m && ART[+m[1]]) return { id: h, t: T('viste.articolo', { n: m[1] }), s: 'accordo', su: 'accordo', f: function () { return vArticolo(+m[1]); } };
    var doc = ANTEPRIMA ? null : D.documenti.filter(function (d) { return d.id === h; })[0];
    if (doc) return { id: h, t: doc.breve, s: 'accordo', su: 'accordo', pdf: true, f: function () { return vDocumento(doc); } };
    var v = VISTE[h] || VISTE.oggi;
    return { id: VISTE[h] ? h : 'oggi', t: v.t, nota: v.nota, s: v.s, su: v.su, f: v.f };
  }
  function disegna(tieniScroll) {
    if (!D) return;
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
    document.title = r.id === 'oggi' ? T('app.titoloHome') : T('app.titoloPagina', { vista: r.t, nome: T('app.nome') });
    if (cambia && !tieniScroll) window.scrollTo(0, 0);
    if (vaiA) { var meta = document.getElementById(vaiA); vaiA = null; if (meta) meta.scrollIntoView({ block: 'center' }); }
    if (r.id === 'novita') { memoria.scrivi('visto', new Date().toISOString()); aggiornaPallino(); }
  }
  window.addEventListener('hashchange', function () { disegna(false); });

  var timerAvviso = null;
  function avviso(testoAvviso, azione, etichetta) {
    var a = document.getElementById('avviso');
    a.innerHTML = '<span>' + esc(testoAvviso) + '</span>' + (azione ? '<button type="button">' + esc(etichetta) + '</button>' : '');
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
        avviso(err && err.message === 'permesso' ? T('notifiche.permessoNegato') : T('notifiche.nonRiuscito'));
      }).then(function () { disegna(true); });
    }
    else if (az === 'spegni-notifiche') { spegniNotifiche().catch(function () {}).then(function () { disegna(true); }); }
    else if (az === 'installa' && invito) { invito.prompt(); invito = null; disegna(true); }
    else if (az === 'ricarica') { location.reload(); }
    else if (az === 'vai-notifiche') { e.preventDefault(); vaiA = 'notifiche'; if (location.hash === '#novita') disegna(true); else location.hash = 'novita'; }
    else if (az === 'vai-tappa') {
      e.preventDefault();
      var tp = D.tappe.filter(function (x) { return x.id === v; })[0];
      filtroTappe = 'tutte'; memoria.scrivi('filtroTappe', 'tutte');
      if (tp && tp.cat === 'storia') mostraStoria = true;
      vaiA = 't-' + v; location.hash = 'tappe';
    }
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
      navigator.serviceWorker.ready.then(function (r) { return r.pushManager.getSubscription(); }).then(function (s) { if (s) return inviaIscrizione(s); }).then(function () { avviso(T('notifiche.preferenzeSalvate')); }).catch(function () { avviso(T('notifiche.preferenzeNonSalvate')); });
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
  // Le scritte fisse della pagina (schede in basso, accessibilità) prendono anch'esse il testo da testi.json.
  function scritteFisse() {
    Array.prototype.forEach.call(document.querySelectorAll('.schede a'), function (a) {
      var s = a.querySelector('span'), k = a.getAttribute('data-scheda');
      if (s && TESTI.schede && TESTI.schede[k]) s.textContent = TESTI.schede[k];
    });
    var acc = TESTI.accessibilita || {};
    var salta = document.querySelector('.salta'), ind = document.getElementById('indietro'), nav = document.querySelector('.schede');
    if (salta && acc.salta) salta.textContent = acc.salta;
    if (ind && acc.indietro) ind.setAttribute('aria-label', acc.indietro);
    if (nav && acc.sezioni) nav.setAttribute('aria-label', acc.sezioni);
  }
  function avvia(file) {
    TESTI = file.testi;
    D = componi(file);
    C = window.Calcolo.con(D.contributi, TESTI.calcolo);
    D.articoli.forEach(function (a) { ART[a.n] = a; });
    SITUAZIONI = coppie(T('perMe.situazioni'));
    PROVENIENZE = coppie(T('perMe.provenienze'));
    profilo = memoria.leggi('profilo', { sit: 'servizio', prov: 'cma' });
    SIT_SIM = coppie(T('simulatore.situazioni'), 'base');
    PROV_SIM = PROVENIENZE.filter(function (p) { return p[0] !== 'nessuna' && p[0] !== 'nuovo2028'; }).concat([['altro', T('simulatore.altraProvenienza')]]);
    TIPI_FAM = coppie(T('simulatore.tipiFamiliari'));
    T('simulatore.tipiFamiliari').forEach(function (o) { NOMI_TIPI[o.id] = o.breve; });
    sim = memoria.leggi('simulatore', { sit: 'servizio', base: 40000, prov: 'cma', familiari: [] });
    preparaViste();
    scritteFisse();
    disegna(false);
    caricaNovita().then(function () { if (corrente === 'oggi' || corrente === 'novita') disegna(true); });
  }
  function nonCaricati() {
    vista.innerHTML = '<p class="nota attenzione">' + esc(vista.getAttribute('data-errore')) + '</p><p class="azioni"><button class="btn" data-az="ricarica">' + esc(vista.getAttribute('data-riprova')) + '</button></p>';
  }

  // Niente zoom: Safari su iPhone ignora l'impostazione della pagina, quindi si fermano anche i gesti con due dita.
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, function (e) { e.preventDefault(); }, { passive: false }); });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); invito = e; if (corrente === 'oggi') disegna(true); });
  window.addEventListener('appinstalled', function () { invito = null; su.installata = true; });
  document.addEventListener('visibilitychange', function () {
    if (D && document.visibilityState === 'visible') caricaNovita().then(function () { if (corrente === 'oggi') disegna(true); });
  });

  caricaDati().then(avvia, function (e) {
    if (window.console) console.error('Contenuti non caricati:', e);
    nonCaricati();
  });

  if (su.sw) {
    navigator.serviceWorker.register('sw.js').then(function () { return leggiStatoPush(); }).then(function () {
      if (corrente === 'novita' || corrente === 'oggi') disegna(true);
    }).catch(function () { /* senza service worker l'app funziona comunque in linea */ });
    var avevaControllo = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (avevaControllo) avviso(D ? T('app.aggiornata') : '', function () { location.reload(); }, D ? T('app.aggiorna') : '↻');
      avevaControllo = true;
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (D && e.data && e.data.tipo === 'novita') caricaNovita().then(function () { if (corrente === 'oggi' || corrente === 'novita') disegna(true); });
    });
  }
})();
