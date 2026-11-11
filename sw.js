/* Service worker di Nuova Cassa: uso senza rete, aggiornamenti e notifiche push. */
const VERSIONE = '20261111-51ae8b15';
const CACHE = 'cassa-' + VERSIONE;
const GUSCIO = [
  './', 'index.html', 'config.js', 'manifest.webmanifest',
  'assets/app.css', 'assets/app.js', 'assets/contenuti.js', 'assets/calcolo.js',
  'assets/fonts/atkinson-next.woff2', 'assets/fonts/literata.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon.svg', 'icons/badge-96.png',
  'data/news.json', 'data/status.json',
  'documenti/accordo-costituzione-cassa.pdf', 'documenti/lettera-impegno.pdf', 'documenti/allegato-1-tabella-a.pdf', 'documenti/allegato-2-tabella-b.pdf',
  'assets/pdf/pdf.min.mjs', 'assets/pdf/pdf.worker.min.mjs'
];

try { importScripts('config.js'); } catch (e) { /* senza configurazione le notifiche restano spente */ }

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(GUSCIO.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n.startsWith('cassa-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const chiave = url.origin + url.pathname;

  // Novità e stato delle fonti: prima la rete, la copia salvata solo se manca la rete.
  if (url.pathname.includes('/data/')) {
    e.respondWith(
      fetch(req).then((r) => {
        if (r.status === 200) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(chiave, copia)); }
        return r;
      }).catch(() => caches.match(chiave).then((r) => r || Response.error()))
    );
    return;
  }

  // Tutto il resto: risposta immediata dalla copia salvata, aggiornata in sottofondo per l'apertura successiva.
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(req.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : chiave).then((salvata) => {
        const rete = fetch(req).then((r) => {
          if (r.status === 200 && r.type === 'basic') c.put(req.mode === 'navigate' ? new URL('index.html', self.registration.scope).href : chiave, r.clone());
          return r;
        }).catch(() => salvata || Response.error());
        if (salvata) { e.waitUntil(rete.catch(() => null)); return salvata; }
        return rete;
      })
    )
  );
});

/* ---------- notifiche ---------- */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { testo: e.data ? e.data.text() : '' }; }
  const lavori = [
    self.registration.showNotification(d.titolo || 'Nuova Cassa', {
      body: d.testo || 'Ci sono novità sulla Cassa.',
      icon: 'icons/icon-192.png',
      badge: 'icons/badge-96.png',
      tag: d.tag || 'novita',
      renotify: true,
      timestamp: d.ts || Date.now(),
      data: { url: d.url || './#novita' }
    }),
    self.clients.matchAll({ type: 'window' }).then((cs) => cs.forEach((c) => c.postMessage({ tipo: 'novita' })))
  ];
  if (self.navigator && self.navigator.setAppBadge) lavori.push(self.navigator.setAppBadge(d.conta || 1).catch(() => null));
  e.waitUntil(Promise.all(lavori));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ambito = self.registration.scope;
  let url = new URL((e.notification.data && e.notification.data.url) || './#novita', ambito).href;
  if (!url.startsWith(ambito)) url = ambito + '#novita'; // si apre sempre l'app, mai un sito esterno
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const aperta = cs.find((c) => c.url.startsWith(ambito));
      if (aperta) return (aperta.navigate ? aperta.navigate(url).catch(() => null) : Promise.resolve()).then(() => aperta.focus());
      return self.clients.openWindow(url);
    })
  );
});

// Se il telefono rinnova l'indirizzo delle notifiche, lo comunichiamo al servizio.
self.addEventListener('pushsubscriptionchange', (e) => {
  const cfg = (self.CASSA_CONFIG && self.CASSA_CONFIG.push) || {};
  if (!cfg.servizio || !cfg.chiavePubblica) return;
  const chiave = (b64) => Uint8Array.from(atob((b64 + '==='.slice((b64.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
  e.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiave(cfg.chiavePubblica) })
      .then((sub) => fetch(cfg.servizio.replace(/\/$/, '') + '/iscrivi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iscrizione: sub.toJSON(), sostituisce: e.oldSubscription ? e.oldSubscription.endpoint : null })
      }))
      .catch(() => null)
  );
});
