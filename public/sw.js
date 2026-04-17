self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const defaultPayload = {
    title: 'QueCode',
    body: 'You have a new notification.',
    url: '/notifications',
  };

  let payload = defaultPayload;

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...defaultPayload,
        ...parsed,
        body: parsed.body || parsed.message || defaultPayload.body,
      };
    } catch (_error) {
      payload = {
        ...defaultPayload,
        body: event.data.text() || defaultPayload.body,
      };
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    tag: payload.tag || `quecode-${Date.now()}`,
    renotify: payload.renotify ?? true,
    requireInteraction: payload.requireInteraction ?? false,
    vibrate: [200, 100, 200],
    data: {
      ...(payload.data || {}),
      url: payload.url || payload.data?.url || defaultPayload.url,
    },
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const hasVisibleClient = clients.some(
        (client) => client.visibilityState === 'visible' || client.focused,
      );

      if (hasVisibleClient) {
        return;
      }

      return self.registration.showNotification(payload.title || defaultPayload.title, notificationOptions);
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || '/notifications',
    self.location.origin,
  ).toString();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients[0];

      if (existingClient) {
        return existingClient.navigate(targetUrl).then(() => existingClient.focus());
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
