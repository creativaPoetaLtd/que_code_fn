'use client';

import { socketService } from '@/services/socketService';
import { unsubscribeFromWebPush } from '@/services/webPushService';
import { apiSlice } from '@/states/apiSlice';

type LogoutOptions = {
  token?: string | null;
  removeToken: () => void;
  dispatch?: ((action: any) => any) | null;
  clearChatState?: (() => void) | null;
  clearNotificationState?: (() => void) | null;
};

type BadgeNavigator = Navigator & {
  clearAppBadge?: () => Promise<void>;
};

const PRESERVED_LOCAL_STORAGE_KEYS = ['theme', 'sidebarExpanded'] as const;

const clearBrowserNotificationIndicators = () => {
  if (typeof document !== 'undefined') {
    document.title = document.title.replace(/^\(\d+\)\s*/, '');
  }

  const badgeNavigator = navigator as BadgeNavigator;
  void badgeNavigator.clearAppBadge?.().catch(() => undefined);
};

export const performClientLogout = async ({
  token,
  removeToken,
  dispatch,
  clearChatState,
  clearNotificationState,
}: LogoutOptions) => {
  if (typeof window === 'undefined') {
    return;
  }

  await unsubscribeFromWebPush(token).catch((error) => {
    console.error('Failed to unsubscribe web push during logout:', error);
  });

  clearBrowserNotificationIndicators();

  try {
    clearChatState?.();
  } catch (error) {
    console.error('Failed to clear chat state during logout:', error);
  }

  try {
    clearNotificationState?.();
  } catch (error) {
    console.error('Failed to clear notification state during logout:', error);
  }

  socketService.forceDisconnect();
  dispatch?.(apiSlice.util.resetApiState());

  const preservedItems = Object.fromEntries(
    PRESERVED_LOCAL_STORAGE_KEYS.map((key) => [key, localStorage.getItem(key)]),
  ) as Record<(typeof PRESERVED_LOCAL_STORAGE_KEYS)[number], string | null>;

  sessionStorage.clear();
  removeToken();
  localStorage.clear();

  for (const key of PRESERVED_LOCAL_STORAGE_KEYS) {
    const value = preservedItems[key];
    if (value) {
      localStorage.setItem(key, value);
    }
  }
};
