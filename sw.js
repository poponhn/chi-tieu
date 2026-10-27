const VERSION = 'chitieu-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './xlsx.full.min.js',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // App page: network first so updates arrive, cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => {
      if (!r.ok) return caches.match('./index.html').then(hit => hit || r);
      const c = r.clone(); caches.open(VERSION).then(x => x.put('./index.html', c)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Fonts and own files: cache first
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
      return r;
    })));
  }
});
