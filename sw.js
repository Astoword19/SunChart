const CACHE_NAME = 'natal-chart-v13';
const ASSETS = [
  './',
  './index.html',
  './transits.html',
  './natal-transits.html',
  './solar.html',
  './lunar.html',
  './combo.html',
  './relocation.html',
  './compatibility.html',
  './horary.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.45/moment-timezone-with-data.min.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=DM+Sans:wght@400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Геокодинг — только онлайн
  if (url.includes('geocoding-api.open-meteo.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"results":[]}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // CDN-библиотеки — cache first (не меняются)
  if (url.includes('cdnjs.cloudflare.com') || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || url.includes('cdn.jsdelivr.net')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return resp;
        });
      }).catch(() => new Response('Нет соединения', { status: 503 }))
    );
    return;
  }

  // HTML, JS, manifest — network first, кеш только как fallback
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.ok) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request).then(cached => cached || new Response('Нет соединения', { status: 503 })))
  );
});
