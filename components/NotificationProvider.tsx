"use client";

import { useEffect } from 'react';
import { notificationService } from '@/services/notificationService';
import { useNotificationListener } from '@/hooks/use-notification-listener';
import { useChat } from '@/context/ChatContext';

/**
 * Example component showing how to integrate the notification system
 * This component should be placed high in the component tree (e.g., in layout or main app component)
 */
export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { activeChat } = useChat();
  
  // Set up socket-based notification listeners
  useNotificationListener();

  // Update active chat in notification service
  useEffect(() => {
    notificationService.setActiveChat(activeChat);
  }, [activeChat]);

  return <>{children}</>;
}

/**
 * Example: Sending custom notifications from any component
 */
export function ExampleNotificationUsage() {
  const handleSendCustomNotification = async () => {
    // Example 1: Send a message notification
    await notificationService.notifyNewMessage({
      chatId: 'chat-123',
      senderId: 'user-456',
      senderName: 'John Doe',
      content: 'Hello, this is a test message!',
      messageType: 'text',
    });

    // Example 2: Send a money notification
    await notificationService.notifyMoneyReceived({
      amount: 100.50,
      from: 'Jane Smith',
      chatId: 'chat-789',
    });

    // Example 3: Send a contact request notification
    await notificationService.notifyContactRequest({
      from: 'Bob Johnson',
      action: 'received',
    });

    // Example 4: Send a group invitation notification
    await notificationService.notifyGroupInvitation({
      groupName: 'Study Group',
      inviterName: 'Alice Williams',
    });

    // Example 5: Configure notification settings
    notificationService.updateConfig({
      enablePush: true,
      enableToast: true,
      enableSound: false,
    });
  };

  return (
    <button onClick={handleSendCustomNotification}>
      Send Test Notifications
    </button>
  );
}
