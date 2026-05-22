const CACHE_NAME = 'planner-cache-v1';

// Provide a basic set of URLs to cache for offline availability.
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Do not strictly fail install if some resources can't be fetched
        return Promise.allSettled(urlsToCache.map(url => cache.add(url)));
      })
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Try network
        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response to cache
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response so the browser and cache can both consume it
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                // Avoid caching API routes or next internal non-static data if needed
                // But for basic offline, caching most files is fine
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Fallback if both cache and network fail (offline and not cached)
          // You could return a custom offline page here.
        });
      })
  );
});
