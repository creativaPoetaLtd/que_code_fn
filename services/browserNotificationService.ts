'use client';

type NotificationCloseFilters = {
  chatId?: string;
  messageId?: string;
  notificationId?: string;
};

const postMessageToServiceWorker = async (message: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const targetWorker =
    registration?.active ||
    navigator.serviceWorker.controller ||
    registration?.waiting ||
    registration?.installing;

  if (!targetWorker) {
    return;
  }

  targetWorker.postMessage(message);
};

export const closeBrowserNotifications = async (
  filters: NotificationCloseFilters,
) => {
  await postMessageToServiceWorker({
    type: 'QC_CLOSE_NOTIFICATIONS',
    filters,
  });
};

export const closeChatNotifications = async (chatId: string) => {
  if (!chatId) {
    return;
  }

  await closeBrowserNotifications({ chatId });
};
