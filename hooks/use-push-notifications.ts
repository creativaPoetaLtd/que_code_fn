'use client';

import { useEffect, useState, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';
import { useAuthToken } from './use-auth-token';
import axios from 'axios';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [swReady, setSwReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuthToken();

  // Initialize service worker and check support
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setIsSupported(true);
          setPermission(Notification.permission);
          
          // Check if service worker can be registered
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              const hasFirebaseSW = registrations.some(r => r.active?.scriptURL.includes('firebase-messaging-sw'));
              console.log('[usePushNotifications] Service Worker status:', {
                registered: registrations.length > 0,
                hasFirebaseSW
              });
              setSwReady(registrations.length > 0);
            } catch (swError) {
              console.warn('[usePushNotifications] Service Worker check failed:', swError);
            }
          }
        }
      } catch (initError) {
        console.error('[usePushNotifications] Initialization error:', initError);
        setError('Failed to initialize notifications');
      }
    };

    initializeNotifications();
  }, []);

  const registerToken = useCallback(async (fcmToken: string) => {
    const authToken = getToken();
    if (!authToken) {
      console.warn('[usePushNotifications] No auth token available');
      return false;
    }

    try {
      console.log('[usePushNotifications] Registering FCM token...');
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/fcm/token`,
        { fcmToken },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
      console.log('[usePushNotifications] FCM token registered successfully');
      return true;
    } catch (error) {
      console.error('[usePushNotifications] Error registering FCM token:', error);
      setError('Failed to register device for notifications');
      return false;
    }
  }, [getToken]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Notifications not supported on this browser');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[usePushNotifications] Requesting notification permission...');
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        console.log('[usePushNotifications] Permission granted, registering token...');
        setPermission('granted');
        const registered = await registerToken(fcmToken);
        setLoading(false);
        return registered;
      }
      console.warn('[usePushNotifications] No FCM token obtained');
      setPermission(Notification.permission);
      setLoading(false);
      return false;
    } catch (error) {
      console.error('[usePushNotifications] Error requesting notification permission:', error);
      setError('Failed to request notification permission');
      setLoading(false);
      return false;
    }
  }, [isSupported, registerToken]);

  const unregisterToken = useCallback(async () => {
    const authToken = getToken();
    if (!authToken) return false;

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/fcm/token`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('[usePushNotifications] FCM token unregistered');
      return true;
    } catch (error) {
      console.error('[usePushNotifications] Error unregistering FCM token:', error);
      return false;
    }
  }, [getToken]);

  // Listen for foreground messages
  useEffect(() => {
    if (permission === 'granted' && swReady) {
      console.log('[usePushNotifications] Setting up foreground message listener...');
      
      const unsubscribe = onMessageListener().then((payload: any) => {
        console.log('[usePushNotifications] Foreground message received:', {
          title: payload.notification?.title,
          body: payload.notification?.body
        });
        
        if (payload.notification) {
          // Show notification even when app is in foreground
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            data: payload.data
          }).catch(err => {
            console.error('[usePushNotifications] Error showing foreground notification:', err);
          });
        }
      }).catch((err: any) => {
        console.error('[usePushNotifications] Foreground listener error:', err);
      });

      return () => {
        unsubscribe?.catch(console.error);
      };
    }
  }, [permission, swReady]);

  return {
    isSupported,
    permission,
    loading,
    error,
    swReady,
    requestPermission,
    unregisterToken,
  };
}