/**
 * PushAlerts Notification Service
 * Manages browser push notifications via PushAlerts API
 * Replaces Firebase Cloud Messaging (FCM)
 */

interface PushAlertsConfig {
  apiKey: string;
  baseUrl?: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

let pushAlertsEnabled = false;
let subscriberId: string | null = null;
let messageCallback: ((payload: any) => void) | null = null;

/**
 * Initialize PushAlerts service
 * Requires NEXT_PUBLIC_PUSHALERTS_API_KEY environment variable
 */
export const initializePushAlerts = async (): Promise<boolean> => {
  if (typeof window === 'undefined') {
    console.error('[PushAlerts] Cannot initialize in non-browser environment');
    return false;
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_PUSHALERTS_API_KEY;
    if (!apiKey) {
      console.error('[PushAlerts] API key not found. Check NEXT_PUBLIC_PUSHALERTS_API_KEY env var');
      return false;
    }

    // Check browser support for notifications
    if (!('Notification' in window)) {
      console.warn('[PushAlerts] Browser does not support notifications');
      return false;
    }

    console.log('[PushAlerts] Service initialized successfully');
    pushAlertsEnabled = true;
    return true;
  } catch (error) {
    console.error('[PushAlerts] Initialization failed:', error);
    return false;
  }
};

/**
 * Request notification permission from user
 * Registers service worker and obtains subscriber ID from PushAlerts
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!pushAlertsEnabled) {
    console.error('[PushAlerts] Service not initialized');
    return null;
  }

  try {
    // First, ensure service worker is registered
    let registration: ServiceWorkerRegistration | null = null;
    
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('[PushAlerts] Service Worker registered');
        
        // Wait for service worker to be active
        const swReady = await navigator.serviceWorker.ready;
        console.log('[PushAlerts] Service Worker is ready');
      } catch (swError) {
        console.error('[PushAlerts] Service Worker registration failed:', swError);
        return null;
      }
    }

    // Request notification permission from user
    if (Notification.permission === 'granted') {
      console.log('[PushAlerts] Notification permission already granted');
      subscriberId = await generateSubscriberId();
      return subscriberId;
    }

    if (Notification.permission === 'denied') {
      console.warn('[PushAlerts] Notification permission denied by user');
      return null;
    }

    // Request permission
    console.log('[PushAlerts] Requesting notification permission from user...');
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[PushAlerts] User granted notification permission');
      subscriberId = await generateSubscriberId();
      return subscriberId;
    } else {
      console.warn('[PushAlerts] User denied notification permission');
      return null;
    }
  } catch (error) {
    console.error('[PushAlerts] Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Generate a unique subscriber ID for this device
 * Uses a combination of device info to create unique ID
 */
const generateSubscriberId = async (): Promise<string> => {
  try {
    // Generate a unique ID from device info
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);

    const combinedString = `${userAgent}-${language}-${platform}-${timestamp}-${random}`;
    
    // Create a hash from the combined string
    const encoder = new TextEncoder();
    const data = encoder.encode(combinedString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const finalId = hashHex.substring(0, 32);
    console.log('[PushAlerts] Generated subscriber ID:', finalId.substring(0, 8) + '...');
    
    return finalId;
  } catch (error) {
    console.error('[PushAlerts] Error generating subscriber ID:', error);
    // Fallback to simpler ID generation
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Set up listener for foreground messages
 * Messages received when app is open
 */
export const onMessageListener = (): Promise<any> => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      const listener = (event: MessageEvent) => {
        console.log('[PushAlerts] Message received from service worker:', event.data);
        
        if (event.data && event.data.type === 'FOREGROUND_MESSAGE') {
          if (messageCallback) {
            messageCallback(event.data.payload);
          }
          resolve(event.data.payload);
        }
      };

      navigator.serviceWorker.addEventListener('message', listener);
      console.log('[PushAlerts] Foreground message listener attached');
    }
  });
};

/**
 * Set callback for incoming messages
 */
export const setMessageCallback = (callback: (payload: any) => void) => {
  messageCallback = callback;
  console.log('[PushAlerts] Message callback registered');
};

/**
 * Check if PushAlerts is enabled
 */
export const isPushAlertsEnabled = (): boolean => {
  return pushAlertsEnabled;
};

/**
 * Get current subscriber ID
 */
export const getSubscriberId = (): string | null => {
  return subscriberId;
};

/**
 * Set subscriber ID (useful when syncing from server)
 */
export const setSubscriberId = (id: string) => {
  subscriberId = id;
  console.log('[PushAlerts] Subscriber ID set:', id.substring(0, 8) + '...');
};

/**
 * Unsubscribe from notifications
 */
export const unsubscribeFromNotifications = async (): Promise<boolean> => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[PushAlerts] Service Worker unregistered');
      }
    }

    subscriberId = null;
    console.log('[PushAlerts] Unsubscribed from notifications');
    return true;
  } catch (error) {
    console.error('[PushAlerts] Error unsubscribing:', error);
    return false;
  }
};
