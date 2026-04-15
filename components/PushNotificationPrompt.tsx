'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function PushNotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { subscriberId } = usePushNotifications();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) return;

    // Check current permission status
    if (Notification.permission === 'granted') {
      setPermissionGranted(true);
      return;
    }

    if (Notification.permission === 'denied') {
      return; // Don't show prompt if denied
    }

    // Show prompt if not prompted before and no subscriber ID
    const hasPrompted = localStorage.getItem('pushPrompted');
    if (!hasPrompted && !subscriberId) {
      setTimeout(() => setShowPrompt(true), 5000);
    }
  }, [subscriberId]);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    localStorage.setItem('pushPrompted', 'true');
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pushPrompted', 'true');
    setShowPrompt(false);
  };

  if (permissionGranted || !showPrompt) return null;

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
            Stay updated with messages, payments, and group activities. Get notified even when the app is closed.
          </p>
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
