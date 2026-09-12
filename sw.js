const CACHE_NAME = 'loocator-cache-v7';
const TILE_CACHE_NAME = 'loocator-tiles-v1';
const TILE_CACHE_MAX_ENTRIES = 300;
const OFFLINE_URLS = [
  './',
  'index.html',
  'app.js',
  'output.css',
  'styles.css',
  'translations.js',
  'manifest.json',
  'src/lib/openingHours.js',
  'src/lib/karma.js',
  'src/lib/toiletRules.js',
  'fonts/baloo2-latin.woff2',
  'fonts/baloo2-latin-ext.woff2',
  'img/loocator.svg',
  'img/apple-touch-icon.png',
  'img/map-tag.svg',
  'img/report.svg',
  'img/route.svg',
  'img/search.svg',
  'img/share.svg'
];

// Map-Kachel-Hosts: Cache-first mit Größenlimit, damit wiederholtes Ansehen
// derselben Gegend (und ein kurzer Netzwerkausfall) nicht jedes Mal neu
// nachladen muss.
const TILE_HOSTS = ['tile.openstreetmap.fr', 'server.arcgisonline.com'];

async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE_NAME);
  const keys = await cache.keys();
  if (keys.length > TILE_CACHE_MAX_ENTRIES) {
    await Promise.all(keys.slice(0, keys.length - TILE_CACHE_MAX_ENTRIES).map(k => cache.delete(k)));
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  const keep = new Set([CACHE_NAME, TILE_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => !keep.has(key)).map(key => caches.delete(key)))
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
    '/output.css',
    '/styles.css',
    '/translations.js',
    '/manifest.json',
    '/sw.js',
    '/src/lib/openingHours.js',
    '/src/lib/karma.js',
    '/src/lib/toiletRules.js'
  ].some(path => requestUrl.pathname.endsWith(path) || requestUrl.pathname === path);

  if (TILE_HOSTS.includes(requestUrl.hostname)) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
              trimTileCache();
            }
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

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