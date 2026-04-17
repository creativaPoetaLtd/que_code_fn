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
    silent: payload.silent ?? false,
    vibrate: Array.isArray(payload.vibrate) ? payload.vibrate : [200, 100, 200],
    data: {
      ...(payload.data || {}),
      url: payload.url || payload.data?.url || defaultPayload.url,
    },
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const targetUrl = new URL(
        payload.url || payload.data?.url || defaultPayload.url,
        self.location.origin,
      );
      const targetChatId =
        payload.data?.chatId || targetUrl.searchParams.get('chatId');

      const hasVisibleMatchingChatClient = clients.some((client) => {
        if (!(client.visibilityState === 'visible' || client.focused)) {
          return false;
        }

        try {
          const clientUrl = new URL(client.url);
          const isChatClient = clientUrl.pathname.startsWith('/chat');

          if (!isChatClient) {
            return false;
          }

          if (!targetChatId) {
            return true;
          }

          return clientUrl.searchParams.get('chatId') === String(targetChatId);
        } catch (_error) {
          return false;
        }
      });

      if (hasVisibleMatchingChatClient) {
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

  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    const preferredClient =
      clients.find((client) => client.visibilityState === 'visible' || client.focused) ||
      clients[0];

    if (preferredClient) {
      try {
        const navigatedClient = preferredClient.navigate
          ? await preferredClient.navigate(targetUrl)
          : preferredClient;
        await (navigatedClient || preferredClient).focus();
        return;
      } catch (_error) {
        // Fall back to opening a fresh window when existing client navigation fails.
      }
    }

    await self.clients.openWindow(targetUrl);
  })());
});
