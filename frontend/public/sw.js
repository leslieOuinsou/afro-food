/* Service worker Afro-food : réception des notifications push */

const CACHE = 'afro-shell-v1';
const SHELL = ['/hors-ligne.html', '/icon-192.png', '/icon-512.png', '/logo-afro-eats.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titre: 'Afro-food', corps: event.data ? event.data.text() : '' };
  }
  const titre = data.titre || 'Afro-food';
  event.waitUntil(
    self.registration.showNotification(titre, {
      body: data.corps || '',
      icon: '/logo-afro-eats.png',
      badge: '/logo-afro-eats.png',
      data: { url: data.url || '/' },
      tag: data.tag || undefined,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Jamais de cache sur l'API ni sur les pages : seules les icônes du shell sont servies du cache,
// et la page hors-ligne remplace une navigation qui échoue.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/hors-ligne.html')));
    return;
  }
  if (SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
