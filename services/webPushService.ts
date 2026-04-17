'use client';

import baseUrl from '@/helpers/baseUrl';

type SerializablePushSubscription = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

const SERVICE_WORKER_PATH = '/sw.js';
const FALLBACK_WEB_PUSH_VAPID_PUBLIC_KEY =
  'BBO_3_8IHqqvpVRPElGXyIVK97R-kKj7dDgROrFjwbihKcpY3QG6TnzFdWsBkFkS4gK-CrJ-7wmxAQxu31MDllI';
const getWebPushPublicKey = () =>
  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ||
  FALLBACK_WEB_PUSH_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export const isPushConfigured = () =>
  Boolean(getWebPushPublicKey() && baseUrl);

export const isPushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const isStandaloneMode = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

export const isIOSDevice = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod/i.test(navigator.userAgent);

export const requiresIosInstallForPush = () => isIOSDevice() && !isStandaloneMode();

export const registerPushServiceWorker = async () => {
  if (!isPushSupported()) {
    return null;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
};

export const getExistingPushSubscription = async () => {
  if (!isPushSupported()) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

const serializeSubscription = (
  subscription: PushSubscription,
): SerializablePushSubscription => {
  const json = subscription.toJSON();

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
};

const persistSubscription = async (
  token: string,
  subscription: SerializablePushSubscription,
) => {
  const response = await fetch(`${baseUrl}/push-subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription,
      userAgent: navigator.userAgent,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save push subscription (${response.status})`);
  }

  return response.json();
};

export const syncExistingWebPushSubscription = async (token?: string | null) => {
  if (
    !token ||
    !isPushConfigured() ||
    !isPushSupported() ||
    Notification.permission !== 'granted'
  ) {
    return false;
  }

  const existingSubscription = await getExistingPushSubscription();
  if (!existingSubscription) {
    return false;
  }

  await persistSubscription(token, serializeSubscription(existingSubscription));
  return true;
};

export const subscribeToWebPush = async (token: string) => {
  if (!isPushSupported()) {
    return { success: false as const, reason: 'unsupported' as const };
  }

  if (!isPushConfigured()) {
    return { success: false as const, reason: 'missing-config' as const };
  }

  if (requiresIosInstallForPush()) {
    return { success: false as const, reason: 'ios-install-required' as const };
  }

  const registration = await registerPushServiceWorker();
  if (!registration) {
    return { success: false as const, reason: 'registration-failed' as const };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { success: false as const, reason: 'permission-denied' as const };
  }

  const publicKey = getWebPushPublicKey();
  if (!publicKey) {
    return { success: false as const, reason: 'missing-config' as const };
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const serialized = serializeSubscription(subscription);
  await persistSubscription(token, serialized);

  return {
    success: true as const,
    subscription: serialized,
  };
};

export const unsubscribeFromWebPush = async (token?: string | null) => {
  const subscription = await getExistingPushSubscription();
  if (!subscription) {
    return true;
  }

  const endpoint = subscription.endpoint;

  if (token && baseUrl) {
    await fetch(`${baseUrl}/push-subscriptions`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });
  }

  return subscription.unsubscribe();
};
