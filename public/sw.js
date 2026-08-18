// Spotify 2.0 PWA Service Worker
const CACHE_NAME = 'spotify-pwa-v2.0.1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/icon-maskable.svg',
];

// Install Event - Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Core precache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Removing old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Smart Cache Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser-extension schemes
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 1. API calls -> Network First with short cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Only cache safe read APIs
              if (url.pathname.includes('/home') || url.pathname.includes('/search')) {
                cache.put(request, responseToCache);
              }
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'OFFLINE', message: 'You are currently offline' },
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 2. Audio streams -> Network only (prevent large media files exhausting quota and preserve native byte-range background streaming)
  // EXCEPT: Check our offline downloads cache first!
  const isAudio = url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.endsWith('.mp4') ||
    url.pathname.endsWith('.aac') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.flac') ||
    url.pathname.includes('/stream') ||
    url.hostname.includes('saavncdn.com') ||
    url.hostname.includes('apple.com') ||
    url.hostname.includes('audio');

  if (isAudio || request.headers.get('range')) {
    event.respondWith(
      caches.open('spotify-offline-audio').then(async (cache) => {
        const cachedResponse = await cache.match(request, { ignoreSearch: false });
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not found in offline audio cache, fallback to network and do not cache it
        return fetch(request);
      })
    );
    return;
  }

  // 3. Static assets & Shell Navigation -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and requesting navigation, return index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
