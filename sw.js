// sw.js
const CACHE_NAME = 'loocator-cache-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // Wenn offline, gebe ein leeres Response zurück (die App fängt das ab)
            return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
        })
    );
});