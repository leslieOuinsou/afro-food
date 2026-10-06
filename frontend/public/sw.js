/* Service worker Afro-food : réception des notifications push */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
