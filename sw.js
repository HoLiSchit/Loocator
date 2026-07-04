const CACHE_NAME = 'loocator-cache-v2';
const OFFLINE_URLS = [
  './',
  'index.html',
  'app.js',
  'styles.css',
  'translations.js',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antworten zusätzlich im Cache aktualisieren (z.B. neue Kartenkacheln)
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => {
        return cached || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      }))
  );
});