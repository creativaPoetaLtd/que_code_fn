'use client';

import { useEffect } from 'react';
import { sendPushNotification, getSubscriberId } from '@/services/pushAlertService';
import { useAuthToken } from './use-auth-token';

export const usePushNotifications = () => {
  const { getToken } = useAuthToken();
  const token = getToken();

  const requestPermission = async () => {
    // PushAlert handles permission automatically via the unified script
    return true;
  };

  const sendNotification = async (data: {
    title: string;
    message: string;
    url?: string;
    icon?: string;
    image?: string;
  }) => {
    return await sendPushNotification(data);
  };

  return {
    requestPermission,
    sendNotification,
    subscriberId: getSubscriberId(),
  };
};
