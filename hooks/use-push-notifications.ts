'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuthToken } from './use-auth-token';
import {
  getExistingPushSubscription,
  isPushConfigured,
  isPushSupported,
  requiresIosInstallForPush,
  subscribeToWebPush,
  syncExistingWebPushSubscription,
  unsubscribeFromWebPush,
} from '@/services/webPushService';

export const usePushNotifications = () => {
  const { getToken } = useAuthToken();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [requiresInstall, setRequiresInstall] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const refreshState = useCallback(async () => {
    const supported = isPushSupported();
    const configured = isPushConfigured();
    const installRequired = requiresIosInstallForPush();
    const token = getToken();

    setIsSupported(supported);
    setIsConfigured(configured);
    setRequiresInstall(installRequired);

    if (!supported) {
      setPermission('unsupported');
      setIsSubscribed(false);
      return;
    }

    setPermission(Notification.permission);

    let existingSubscription = await getExistingPushSubscription();

    if (
      token &&
      configured &&
      supported &&
      !installRequired &&
      Notification.permission === 'granted' &&
      !existingSubscription
    ) {
      try {
        const subscribeResult = await subscribeToWebPush(token);
        if (subscribeResult.success) {
          existingSubscription = await getExistingPushSubscription();
        } else {
          console.warn('Automatic web push subscription did not complete:', subscribeResult.reason);
        }
      } catch (error) {
        console.error('Automatic web push subscription failed:', error);
      }
    }

    setIsSubscribed(Boolean(existingSubscription));

    if (existingSubscription && Notification.permission === 'granted') {
      if (token) {
        await syncExistingWebPushSubscription(token).catch((error) => {
          console.error('Failed to sync existing push subscription:', error);
        });
      }
    }
  }, [getToken]);

  useEffect(() => {
    void refreshState();

    const handleAuthTokenChange = () => {
      void refreshState();
    };
    const handleFocus = () => {
      void refreshState();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshState();
      }
    };

    window.addEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshState]);

  const requestPermission = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return false;
    }

    try {
      const result = await subscribeToWebPush(token);
      await refreshState();
      return result.success;
    } catch (error) {
      console.error('Failed to subscribe to web push:', error);
      await refreshState();
      return false;
    }
  }, [getToken, refreshState]);

  const unsubscribe = useCallback(async () => {
    const token = getToken();
    const success = await unsubscribeFromWebPush(token);
    await refreshState();
    return success;
  }, [getToken, refreshState]);

  return {
    isConfigured,
    isSupported,
    requiresInstall,
    permission,
    isSubscribed,
    requestPermission,
    unsubscribe,
    refreshState,
  };
};
