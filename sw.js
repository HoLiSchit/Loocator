const CACHE_NAME = 'loocator-cache-v4';
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

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isAppAsset = [
    '/index.html',
    '/app.js',
    '/styles.css',
    '/translations.js',
    '/manifest.json',
    '/sw.js'
  ].some(path => requestUrl.pathname.endsWith(path) || requestUrl.pathname === path);

  if (isSameOrigin && isAppAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' }));
      })
    );
    return;
  }

  if (isSameOrigin && requestUrl.pathname.includes('.php')) {
    event.respondWith(
      fetch(event.request)
        .then(response => response)
        .catch(() => new Response('Offline', { status: 503, statusText: 'Service Unavailable' }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => response)
      .catch(() => caches.match(event.request).then(cached => cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' })))
  );
});