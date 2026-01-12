importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

let firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

let messagingReady = false;

// Listen for config from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data.type);
  
  if (event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    console.log('[Service Worker] Received Firebase config from main thread:', {
      projectId: firebaseConfig.projectId,
      messagingSenderId: firebaseConfig.messagingSenderId
    });
    
    // Initialize Firebase if not already done
    if (!messagingReady) {
      initializeFirebase();
    }
    
    // Send confirmation back to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'FIREBASE_CONFIG_RECEIVED',
          timestamp: Date.now()
        });
      });
    });
  }
});

function initializeFirebase() {
  if (messagingReady) {
    console.log('[Service Worker] Firebase already initialized');
    return;
  }
  
  console.log('[Service Worker] Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId
  });

  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    messagingReady = true;
    console.log('[Service Worker] Firebase initialized successfully');
    
    setupMessageHandlers(messaging);
  } catch (error) {
    console.error('[Service Worker] Firebase initialization error:', error);
  }
}

function setupMessageHandlers(messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] Background message received:', {
      title: payload.notification?.title,
      body: payload.notification?.body,
      data: payload.data
    });

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new message',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data,
      tag: 'notification',
      requireInteraction: false
    };

    self.registration.showNotification(notificationTitle, notificationOptions).catch(err => {
      console.error('[Service Worker] Error showing notification:', err);
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);
  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  if (data?.type === 'chat_message' && data?.chatId) {
    url = `/chat?id=${data.chatId}`;
  } else if (data?.type === 'money_request') {
    url = '/transactions';
  } else if (data?.type === 'group_invite') {
    url = '/groups';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if any client has the target URL already open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          console.log('[Service Worker] Focusing existing client with URL:', url);
          return client.focus();
        }
      }
      // If no matching client, open a new window
      if (clients.openWindow) {
        console.log('[Service Worker] Opening new window with URL:', url);
        return clients.openWindow(url);
      }
    }).catch(err => {
      console.error('[Service Worker] Error handling notification click:', err);
    })
  );
});