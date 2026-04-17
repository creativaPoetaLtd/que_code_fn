'use client';

import { useEffect, useRef } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetPendingInvitationsUnifiedQuery } from '@/states/contactSlice';
import { useGetPendingJoinRequestsQuery } from '@/states/groupSlice';

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const stripUnreadPrefix = (title: string) => title.replace(/^\(\d+\)\s*/, '');

export default function BrowserNotificationBadge() {
  const { unreadCount } = useNotifications();
  const { getToken } = useAuthToken();
  const token = getToken();
  const baseTitleRef = useRef<string>('QueCode - Chat & Payment App');

  const { data: pendingContactRequests } = useGetPendingInvitationsUnifiedQuery(
    {
      token: token || '',
      page: 1,
      limit: 20,
    },
    { skip: !token },
  );

  const { data: pendingJoinRequests } = useGetPendingJoinRequestsQuery(
    token || '',
    { skip: !token },
  );

  const contactRequestsCount = pendingContactRequests?.invitations?.length || 0;
  const joinRequestsCount = pendingJoinRequests?.data?.requests?.length || 0;
  const totalUnreadCount = unreadCount + contactRequestsCount + joinRequestsCount;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    baseTitleRef.current = stripUnreadPrefix(document.title || baseTitleRef.current);

    return () => {
      document.title = baseTitleRef.current;
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const baseTitle = stripUnreadPrefix(baseTitleRef.current || document.title);
    document.title =
      totalUnreadCount > 0 ? `(${totalUnreadCount}) ${baseTitle}` : baseTitle;

    const badgeNavigator = navigator as BadgeNavigator;
    if (totalUnreadCount > 0) {
      void badgeNavigator.setAppBadge?.(totalUnreadCount).catch(() => undefined);
      return;
    }

    void badgeNavigator.clearAppBadge?.().catch(() => undefined);
  }, [totalUnreadCount]);

  return null;
}
