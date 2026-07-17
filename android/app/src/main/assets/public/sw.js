const CACHE_NAME = 'shop-calc-cache-v8';
const ASSETS_TO_CACHE = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable.png',
  'screenshot-desktop.png',
  'screenshot-mobile.png'
];

// Install Event - Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core assets');
      // Use standard caching
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[Service Worker] Core assets pre-caching warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First caching strategy to ensure latest updates while keeping 100% offline-ready
self.addEventListener('fetch', (event) => {
  // Only handle standard local GET requests
  if (
    event.request.method !== 'GET' || 
    !event.request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the request succeeds, cache the updated resource and return the response
        if (networkResponse && networkResponse.status === 200) {
          const contentType = networkResponse.headers.get('content-type');
          const isHtml = contentType && contentType.includes('text/html');
          const isImgRequest = event.request.url.match(/\.(png|svg|jpg|jpeg|gif|ico|webp)$/i);
          const isJsonRequest = event.request.url.match(/\.json$/i);

          // Avoid caching HTML fallbacks (SPA routing) for images or json assets
          if (!((isImgRequest || isJsonRequest) && isHtml)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline or network fails, fallback to cached assets
        return caches.match(event.request, { ignoreSearch: true });
      })
  );
});
