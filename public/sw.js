// Walt-Tab Service Worker
// Enables PWA installation, share target support, and push notifications

const CACHE_NAME = 'walt-tab-v2';

// Install event - cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests (HTML pages), always try network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // For other requests, try network first then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.ok && event.request.url.match(/\.(js|css|png|svg|ico|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notification event - display notification from server push
self.addEventListener('push', (event) => {
  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
  };

  let title = 'Walt-Tab';
  let options = defaultOptions;

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options = { ...defaultOptions, ...data };
    } catch {
      // If not JSON, treat as plain text
      options = { ...defaultOptions, body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click - open the app or focus existing tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Try to find and focus an existing Walt-Tab tab
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow('/');
    })
  );
});
