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

    setIsSupported(supported);
    setIsConfigured(configured);
    setRequiresInstall(installRequired);

    if (!supported) {
      setPermission('unsupported');
      setIsSubscribed(false);
      return;
    }

    setPermission(Notification.permission);

    const existingSubscription = await getExistingPushSubscription();
    setIsSubscribed(Boolean(existingSubscription));

    if (existingSubscription && Notification.permission === 'granted') {
      const token = getToken();
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

    window.addEventListener('authTokenChanged', handleAuthTokenChange as EventListener);

    return () => {
      window.removeEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
    };
  }, [refreshState]);

  const requestPermission = useCallback(async () => {
    const token = getToken();
    if (!token) {
      return false;
    }

    const result = await subscribeToWebPush(token);
    await refreshState();
    return result.success;
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
