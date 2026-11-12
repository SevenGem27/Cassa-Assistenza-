/* Genera installa.html, la pagina da mandare ai colleghi con le istruzioni per installare la guida.
   I testi stanno in contenuti/installa.json (e l'avviso in contenuti/testi.json): qui c'è solo l'impaginazione. */

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Disegni dei tasti, da usare nei testi tra graffe: {lineette}, {puntini}, {condividi}, {menu}, {aggiungi}
const svg = (corpo, nome) => `<span class="tasto" role="img" aria-label="${nome}"><svg viewBox="0 0 24 24" aria-hidden="true">${corpo}</svg></span>`;
export const ICONE = {
  lineette: svg('<path d="M5 7h14M5 12h14M5 17h14"/>', 'tre lineette'),
  puntini: svg('<circle cx="6" cy="12" r="1.6" class="pieno"/><circle cx="12" cy="12" r="1.6" class="pieno"/><circle cx="18" cy="12" r="1.6" class="pieno"/>', 'tre puntini'),
  condividi: svg('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M8.5 10H6.5a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5h-2"/>', 'condividi'),
  menu: svg('<circle cx="12" cy="6" r="1.6" class="pieno"/><circle cx="12" cy="12" r="1.6" class="pieno"/><circle cx="12" cy="18" r="1.6" class="pieno"/>', 'menu'),
  aggiungi: svg('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>', 'aggiungi'),
};
export function testo(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\{(\w+)\}/g, (t, k) => ICONE[k] || t);
}
const passi = (lista) => '<ol class="passi">' + lista.map((p) => `<li>${testo(p)}</li>`).join('') + '</ol>';

export function paginaInstalla(I, avviso, sito) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(I.titoloPagina)}</title>
<meta name="description" content="${esc(I.descrizione)}">
<meta name="theme-color" content="#0E1424">
<meta name="color-scheme" content="dark">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(I.nome)}: ${esc(I.sottotitolo)}">
<meta property="og:description" content="${esc(I.descrizione)}">
<meta property="og:url" content="${esc(sito)}installa.html">
<meta property="og:image" content="${esc(sito)}icons/icon-512.png">
<meta name="apple-mobile-web-app-title" content="${esc(I.nome)}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<script>
  // Se qualcuno installa questa pagina al posto della guida, l'icona apre comunque la guida.
  if ((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) location.replace('./');
</script>
<style>
@font-face { font-family: "Atkinson Next"; src: url("assets/fonts/atkinson-next.woff2") format("woff2"); font-weight: 200 800; font-display: swap; }
:root { --carta: #0E1424; --foglio: #161E33; --inchiostro: #E9EDF5; --inchiostro-2: #A8B2C7; --riga: #2A3550; --timbro: #B7A4F2; --timbro-tenue: #251F45; --segnale: #FF8A80; color-scheme: dark; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 16px; }
body { margin: 0; background: var(--carta); color: var(--inchiostro); font: 400 17px/1.55 "Atkinson Next", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
h1, h2, h3, p, ol, ul { margin: 0; padding: 0; }
a { color: inherit; }
main { max-width: 34rem; margin: 0 auto; padding: calc(28px + env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) calc(40px + env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left)); }
p, li, dd { text-align: justify; -webkit-hyphens: auto; hyphens: auto; }
.testa { display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: center; }
.testa img { width: 84px; height: 84px; border-radius: 19px; display: block; }
.testa h1 { font-size: 30px; line-height: 1.05; font-weight: 800; letter-spacing: -0.01em; }
.testa p { margin-top: 6px; color: var(--inchiostro-2); font-size: 15.5px; line-height: 1.35; text-align: left; }
.presenta { margin-top: 20px; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 12px 26px; border-radius: 8px; background: var(--inchiostro); color: var(--carta); font-weight: 800; font-size: 18px; text-decoration: none; }
.apri { margin-top: 20px; }
.apri .btn { width: 100%; }
.avviso { margin-top: 24px; padding: 12px 16px 14px; border: 2px solid var(--timbro); border-radius: 8px; background: var(--timbro-tenue); }
.avviso b { display: block; color: var(--timbro); margin-bottom: 4px; }
.avviso p { font-size: 15px; line-height: 1.45; }
h2 { margin-top: 40px; font-size: 24px; line-height: 1.2; font-weight: 800; }
h3 { margin-top: 20px; font-size: 17px; font-weight: 800; color: var(--timbro); }
.scelte { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
.scelte a { padding: 8px 16px; border: 1px solid var(--riga); border-radius: 20px; background: var(--foglio); text-decoration: none; font-weight: 700; }
.scelte a[aria-current] { background: var(--timbro); border-color: var(--timbro); color: var(--carta); }
section.sistema { margin-top: 18px; padding: 18px; background: var(--foglio); border: 1px solid var(--riga); border-radius: 10px; }
section.sistema > h2 { margin-top: 0; font-size: 21px; }
.nota { margin-top: 12px; font-size: 15.5px; color: var(--inchiostro-2); }
.passi { list-style: none; counter-reset: passo; margin-top: 12px; }
.passi li { counter-increment: passo; position: relative; padding: 0 0 14px 44px; text-align: left; -webkit-hyphens: manual; hyphens: manual; }
.passi li:last-child { padding-bottom: 0; }
.passi li::before { content: counter(passo); position: absolute; left: 0; top: -1px; width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: var(--timbro-tenue); color: var(--timbro); font-weight: 800; font-size: 16px; box-shadow: inset 0 0 0 2px var(--timbro); }
.passi li::after { content: ""; position: absolute; left: 14px; top: 32px; bottom: 2px; width: 2px; background: var(--riga); }
.passi li:last-child::after { display: none; }
.tasto { display: inline-grid; place-items: center; width: 30px; height: 26px; margin: 0 2px; vertical-align: -6px; border: 1px solid var(--riga); border-radius: 7px; background: var(--carta); }
.tasto svg { width: 18px; height: 18px; fill: none; stroke: var(--inchiostro); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.tasto .pieno { fill: var(--inchiostro); stroke: none; }
.qr { display: grid; grid-template-columns: 132px 1fr; gap: 16px; align-items: center; margin-top: 16px; }
.qr img { width: 132px; height: 132px; padding: 8px; background: #fff; border-radius: 8px; }
.qr p { text-align: left; font-size: 15.5px; color: var(--inchiostro-2); }
details { border-top: 1px solid var(--riga); padding: 12px 0; }
details:last-child { border-bottom: 1px solid var(--riga); }
summary { cursor: pointer; font-weight: 700; }
details p { margin-top: 8px; color: var(--inchiostro-2); }
footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid var(--riga); font-size: 14px; color: var(--inchiostro-2); text-align: left; }
:focus-visible { outline: 3px solid var(--timbro); outline-offset: 2px; }
@media (min-width: 700px) { .testa h1 { font-size: 36px; } }
</style>
</head>
<body>
<main>
  <header class="testa">
    <img src="icons/icon-192.png" alt="" width="84" height="84">
    <div><h1>${esc(I.nome)}</h1><p>${esc(I.sottotitolo)}</p></div>
  </header>
  <p class="presenta">${testo(I.presentazione)}</p>
  <p class="apri"><a class="btn" href="./">${esc(I.apri)}</a></p>
  <aside class="avviso"><b>${esc(avviso.titolo)}</b><p>${esc(avviso.testo)}</p></aside>

  <h2>${esc(I.scegli)}</h2>
  <nav class="scelte" aria-label="${esc(I.scegli)}">
    <a href="#iphone" data-s="ios">${esc(I.schede.iphone)}</a><a href="#android" data-s="android">${esc(I.schede.android)}</a><a href="#computer" data-s="computer">${esc(I.schede.computer)}</a>
  </nav>

  <section class="sistema" id="iphone">
    <h2>${esc(I.iphone.titolo)}</h2>
    <p class="nota">${testo(I.iphone.prima)}</p>
    <h3>${esc(I.iphone.nuovo)}</h3>
    ${passi(I.iphone.passiNuovo)}
    <h3>${esc(I.iphone.vecchio)}</h3>
    ${passi(I.iphone.passiVecchio)}
    <p class="nota">${testo(I.iphone.versione)}</p>
  </section>

  <section class="sistema" id="android">
    <h2>${esc(I.android.titolo)}</h2>
    ${passi(I.android.passi)}
    <p class="nota">${testo(I.android.samsung)}</p>
  </section>

  <section class="sistema" id="computer">
    <h2>${esc(I.computer.titolo)}</h2>
    ${passi(I.computer.passi)}
    <div class="qr"><img src="icons/qr-installa.svg" alt="Codice QR di questa pagina"><p>${testo(I.computer.qr)}</p></div>
  </section>

  <h2>${esc(I.notifiche.titolo)}</h2>
  ${passi(I.notifiche.passi)}

  <h2>${esc(I.aggiornamenti.titolo)}</h2>
  <p class="presenta">${testo(I.aggiornamenti.testo)}</p>

  <h2>${esc(I.problemi.titolo)}</h2>
  <div class="presenta">${I.problemi.voci.map((v) => `<details><summary>${esc(v.d)}</summary><p>${testo(v.r)}</p></details>`).join('')}</div>

  <p class="apri"><a class="btn" href="./">${esc(I.apri)}</a></p>
  <footer>${esc(I.nome)}. ${esc(I.piede)}</footer>
</main>
<script>
  // Mette in evidenza il sistema di chi legge.
  (function () {
    var ua = navigator.userAgent, ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var s = ios ? 'ios' : /android/i.test(ua) ? 'android' : 'computer';
    var a = document.querySelector('.scelte a[data-s="' + s + '"]');
    if (a) a.setAttribute('aria-current', 'true');
  })();
</script>
</body>
</html>
`;
}
