'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { useAuthToken } from './use-auth-token';
import axios from 'axios';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { getToken } = useAuthToken();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    try {
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        setPermission('granted');
        await registerToken(fcmToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const registerToken = async (fcmToken: string) => {
    const authToken = getToken();
    if (!authToken) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/fcm/token`,
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  };

  const unregisterToken = async () => {
    const authToken = getToken();
    if (!authToken) return;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/fcm/token`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  };

  useEffect(() => {
    if (permission === 'granted') {
      const unsubscribe = onMessageListener().then((payload: any) => {
        console.log('Foreground message received:', payload);
        
        if (payload.notification) {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
          });
        }
      });

      return () => {
        unsubscribe.catch(console.error);
      };
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    requestPermission,
    unregisterToken,
  };
}