const staticCacheName = 'dikaeinstein-currency-converter-static-v1';
const ratesCache = 'dikaeinstein-currency-converter-rates-v1';

const allCaches = [staticCacheName, ratesCache];

self.addEventListener('install', (event) =>{
  event.waitUntil(
    caches.open(staticCacheName).then(function(cache) {
      return cache.addAll([
        './index.html',
        './js/index.js',
        './css/index.css',
        './js/idb.js',
        './js/db.js',
        'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/css/materialize.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-rc.2/js/materialize.min.js'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName
            .startsWith('dikaeinstein-currency-converter-')
            && !allCaches.includes(cacheName);
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(caches.match('/index.html'));
      return;
    }
  }

  return event.respondWith(
    caches.open(ratesCache).
      then((cache) => {
        return cache.match(event.request)
          .then((response) => {
            if (response) {
              console.log('Found response in cache:');
              return response;
            }

            console.log('Fetching request from the network');

            return fetch(event.request).then((networkResponse) => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          })
          .catch((error) => {
            // Handles exceptions from match() or fetch().
            console.error('Error in fetch handler:', error);
            throw error;
          });
    })
  );
});
