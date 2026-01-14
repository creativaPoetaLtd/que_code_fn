// PushAlert Configuration
const PUSHALERT_CONFIG = {
  restApiKey: process.env.NEXT_PUBLIC_PUSHALERT_REST_API_KEY || '9ba563f8f5c09ff904fa70f376348d08',
};

// Initialize PushAlert - Not needed, already in layout
export const initPushAlert = () => {
  // PushAlert is initialized via script in layout.tsx
  return;
};

// Subscribe user to push notifications
export const subscribeToPush = async () => {
  if (typeof window === 'undefined') return false;

  try {
    // PushAlert handles subscription automatically
    return true;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return false;
  }
};

// Send push notification via REST API (through backend)
export const sendPushNotification = async (data: {
  title: string;
  message: string;
  url?: string;
  icon?: string;
  image?: string;
  subscriberId?: string;
}) => {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: data.title,
        message: data.message,
        url: data.url,
        icon: data.icon,
        image: data.image,
        subscriberId: data.subscriberId,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return null;
  }
};

// Get subscriber ID from localStorage (PushAlert stores it there)
export const getSubscriberId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pa_subscriber_id') || null;
};

// Check if user is subscribed
export const isSubscribed = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('pa_subscriber_id');
};

declare global {
  interface Window {
    PushAlertCo: any;
  }
}
