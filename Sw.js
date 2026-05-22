const CACHE_VERSION = 'tc-paveops-prod-v2'; // Forced cache bump for Tailwind UI Update

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './libs/jsqr.min.js',
  './libs/zxing.min.js',
  './assets/tc-logo.png' 
];
 
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('[SW] Pre-caching TC Pave Ops Production Shell v2');
      return cache.addAll(APP_SHELL);
    })
  );
});
 
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => {
              console.log('[SW] Removing old cache', key);
              return caches.delete(key);
            })
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
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed, silently fallback to cache
      });
 
      if (cachedResponse) {
        return cachedResponse;
      }
     
      return fetchPromise.catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
