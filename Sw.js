const CACHE_VERSION = 'tc-paveops-v1'; // Forced cache bump for TC branding

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './libs/jsqr.min.js',
  './libs/zxing.min.js'
];
 
// Install Event: Pre-cache all essential files
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('[SW] Pre-caching TC Pave Ops App Shell');
      return cache.addAll(APP_SHELL);
    })
  );
});
 
// Activate Event: Clean up old cache versions
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
 
// Fetch Event: Stale-While-Revalidate strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
 
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
     
      // The background network fetch to keep the app up to date silently
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline), do nothing because we are serving from cache anyway
      });
 
      // 1. If we have it in cache, return it instantly (fast offline load)
      if (cachedResponse) {
        return cachedResponse;
      }
     
      // 2. If it's not in cache, wait for the network fetch
      return fetchPromise.catch(() => {
        // 3. If network fails and we don't have it, show the offline page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
