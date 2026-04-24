'use client';

import { useEffect } from 'react';
import baseUrl from '@/helpers/baseUrl';
import { useChat } from '@/context/ChatContext';
import { useNotifications } from '@/context/NotificationContext';
import { closeChatNotifications } from '@/services/browserNotificationService';
import { getValidToken, refreshAccessToken } from '@/utils/tokenUtils';
import type { Notification } from '@/types/notification.types';

const isChatMessageNotification = (notification: Notification, chatId: string) => {
  const type = notification.type || '';

  return (
    notification.data?.chatId === chatId &&
    (type.startsWith('CHAT_MESSAGE_') || type.startsWith('chat_message_'))
  );
};

const markNotificationsReadOnServer = async (notificationIds: string[]) => {
  if (!notificationIds.length || !baseUrl) {
    return;
  }

  const token = getValidToken() || (await refreshAccessToken());
  if (!token) {
    return;
  }

  await Promise.allSettled(
    notificationIds.map((notificationId) =>
      fetch(`${baseUrl}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ),
  );
};

export default function ChatNotificationSync() {
  const { activeChat } = useChat();
  const { notifications, dismissNotificationsByIds } = useNotifications();

  useEffect(() => {
    if (!activeChat) {
      return;
    }

    void closeChatNotifications(activeChat);
  }, [activeChat]);

  useEffect(() => {
    if (!activeChat || !dismissNotificationsByIds) {
      return;
    }

    const matchingNotifications = notifications.filter((notification) =>
      isChatMessageNotification(notification, activeChat),
    );

    if (!matchingNotifications.length) {
      return;
    }

    const matchingIds = matchingNotifications.map((notification) => notification.id);
    const unreadIds = matchingNotifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    dismissNotificationsByIds(matchingIds);
    void closeChatNotifications(activeChat);
    void markNotificationsReadOnServer(unreadIds);
  }, [activeChat, notifications, dismissNotificationsByIds]);

  return null;
}
