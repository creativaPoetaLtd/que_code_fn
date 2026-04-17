'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useAuthToken } from '@/hooks/use-auth-token';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { getToken } = useAuthToken();
  const token = getToken();
  const {
    isConfigured,
    isSupported,
    requiresInstall,
    permission,
    isSubscribed,
    requestPermission,
  } = usePushNotifications();

  useEffect(() => {
    if (
      dismissed ||
      !token ||
      !isConfigured ||
      !isSupported ||
      requiresInstall ||
      permission === 'denied' ||
      isSubscribed
    ) {
      setShowPrompt(false);
      return;
    }

    const timer = window.setTimeout(() => setShowPrompt(true), 2000);
    return () => window.clearTimeout(timer);
  }, [dismissed, token, isConfigured, isSupported, requiresInstall, permission, isSubscribed]);

  const handleEnableNotifications = async () => {
    setErrorMessage(null);

    try {
      const success = await requestPermission();
      if (success) {
        setShowPrompt(false);
        return;
      }

      setErrorMessage('Notifications not enabled yet. Accept the browser permission, then retry.');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setErrorMessage('Failed to enable notifications. Please retry.');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  if (!token || !isConfigured || !isSupported || requiresInstall || isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-darkBg-card rounded-lg shadow-xl border border-gray-200 dark:border-darkBorder-light p-4">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-brand-green/10 dark:bg-brand-gold/10 rounded-full">
          <Bell size={20} className="text-brand-green dark:text-brand-gold" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Enable Notifications</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Stay updated with messages, payments, and group activities. This enables true push notifications for the installed app.
          </p>
          {errorMessage ? (
            <p className="text-xs text-red-600 dark:text-red-400 mb-3">{errorMessage}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              onClick={handleEnableNotifications}
              size="sm"
              className="flex-1 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
            >
              Enable
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Later
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
