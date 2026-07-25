const CACHE = 'orbita-v2.0.2';
const ASSETS = [
  './','./index.html','./styles.css','./app.js','./engine.js','./config.js','./advisors.js','./booking-core.js','./booking-service.js','./manifest.webmanifest',
  './privacy.html','./terms.html','./commerce.html','./assets/icons/icon-192.png','./assets/icons/icon-512.png',
  './assets/advisors/luna.webp','./assets/advisors/shion.webp','./assets/advisors/rei.webp','./assets/advisors/mikoto.webp','./assets/advisors/sougen.webp',
  './assets/advisors/aurora.webp','./assets/advisors/malik.webp','./assets/advisors/rou.webp','./assets/advisors/riho.webp','./assets/advisors/usaki.webp'
];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html'))));
});
