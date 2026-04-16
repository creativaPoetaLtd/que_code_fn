importScripts("https://cdn.pushalert.co/sw-87118_2.js");

// Custom push event handler for PWA notifications
self.addEventListener('push', function(event) {
  const defaultData = {
    title: 'QueCode',
    message: 'New notification',
    url: '/chat',
  };

  let data = defaultData;
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      const text = event.data.text ? event.data.text() : null;
      data = {
        ...defaultData,
        message: text || defaultData.message,
      };
    }
  }

  const options = {
    body: data.message || defaultData.message,
    icon: data.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || defaultData.url,
    },
    tag: data.tag || `quecode-notification-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || defaultData.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.openWindow(url)
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  event.waitUntil(
    self.clients.claim()
  );
});