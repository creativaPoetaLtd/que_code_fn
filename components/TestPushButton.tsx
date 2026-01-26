'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TestPushButton() {
  const [sending, setSending] = useState(false);

  const sendTestNotification = async () => {
    setSending(true);

    try {
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification from QueCode!',
          url: window.location.origin,
        }),
      });

      const result = await response.json();

      toast({
        title: result.success ? 'Notification Sent!' : 'Failed',
        description: result.success
          ? 'Check your browser for the notification'
          : result.message || 'Failed to send notification',
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {

      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      onClick={sendTestNotification}
      disabled={sending}
      className="fixed bottom-20 right-4 z-50 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
    >
      {sending ? (
        <>
          <Loader2 size={16} className="mr-2 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <Bell size={16} className="mr-2" />
          Test Push
        </>
      )}
    </Button>
  );
}
