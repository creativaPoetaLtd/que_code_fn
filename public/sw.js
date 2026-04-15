importScripts("https://cdn.pushalert.co/sw-87118_2.js");

// Custom push event handler for PWA notifications
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || 'New notification',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/chat'
      },
      requireInteraction: true,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'QueCode', options)
    );
  }
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