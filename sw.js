importScripts('./image-assets.js');

const CACHE_NAME = 'cache-kronobabylon-v4';
const ASSETS = [...new Set([
  './',
  './index.html',
  './style.css',
  './image-assets.js',
  './manifest.json',
  ...Object.values(IMAGE_ASSETS).map(filename => `./${filename}`),
])];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Mise en cache des ressources');
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('cache-kronobabylon') && key !== CACHE_NAME)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then((response) => {
      return response || fetch(event.request);
    })
  );
});