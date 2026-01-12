import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let messaging: any = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
    console.log('[Firebase] Messaging initialized successfully');
  } catch (error) {
    console.warn('[Firebase] Messaging initialization warning:', error);
  }
}

export { messaging };

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!messaging) {
    console.error('[Firebase] Messaging not initialized');
    return null;
  }

  try {
    // First, ensure service worker is registered and ready
    let registration: ServiceWorkerRegistration | null = null;
    
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('[Firebase] Service Worker registered');
        
        // Wait for service worker to be active
        const swReady = await navigator.serviceWorker.ready;
        console.log('[Firebase] Service Worker is ready');
        
        // Pass Firebase config to service worker and wait for it
        if (swReady.active) {
          console.log('[Firebase] Passing config to Service Worker...');
          
          // Create a promise that resolves when SW confirms config receipt
          const configReadyPromise = new Promise<void>((resolve) => {
            const handler = (event: MessageEvent) => {
              if (event.data.type === 'FIREBASE_CONFIG_RECEIVED') {
                console.log('[Firebase] Service Worker confirmed config receipt');
                navigator.serviceWorker.controller?.removeEventListener('message', handler);
                resolve();
              }
            };
            
            navigator.serviceWorker.addEventListener('message', handler);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              navigator.serviceWorker.controller?.removeEventListener('message', handler);
              resolve(); // Continue anyway
            }, 5000);
          });
          
          // Send config to SW
          swReady.active.postMessage({
            type: 'FIREBASE_CONFIG',
            config: firebaseConfig
          });
          
          // Wait for SW to confirm
          await configReadyPromise;
        }
      } catch (swError) {
        console.error('[Firebase] Service Worker registration failed:', swError);
        return null;
      }
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    console.log('[Firebase] Notification permission:', permission);
    
    if (permission === 'granted') {
      try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error('[Firebase] VAPID key is missing. Check NEXT_PUBLIC_FIREBASE_VAPID_KEY env var');
          return null;
        }
        
        console.log('[Firebase] Requesting FCM token with VAPID key...');
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration || await navigator.serviceWorker.ready
        });
        
        if (!token) {
          console.error('[Firebase] No token returned from getToken');
          return null;
        }
        
        console.log('[Firebase] FCM Token obtained:', token.substring(0, 20) + '...');
        return token;
      } catch (tokenError) {
        console.error('[Firebase] Error getting FCM token:', tokenError);
        if (tokenError instanceof Error) {
          console.error('[Firebase] Error details:', tokenError.message, tokenError.stack);
        }
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Error requesting notification permission:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.error('[Firebase] Messaging not initialized in onMessageListener');
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('[Firebase] Foreground message received:', {
        title: payload.notification?.title,
        body: payload.notification?.body
      });
      resolve(payload);
    });
  });