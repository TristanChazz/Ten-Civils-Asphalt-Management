const CACHE_VERSION = 'ten-civils-pacing-v2-nologo'; 

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './libs/jsqr.min.js',
  './libs/zxing.min.js'
];
 
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('[SW] Pre-caching Ten Civils App Shell (No Logos)');
      return cache.addAll(APP_SHELL);
    })
  );
});
 
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => {});
 
      if (cachedResponse) return cachedResponse;
      return fetchPromise.catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});