import { NotificationType, NotificationPayload, NotificationConfig } from '@/types/notification.types';
import { toast } from '@/hooks/use-toast';

class NotificationService {
  private config: NotificationConfig = {
    enablePush: true,
    enableToast: true,
    enableSound: false,
  };

  private userId: string | null = null;
  private activeChat: string | null = null;

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  setActiveChat(chatId: string | null) {
    this.activeChat = chatId;
  }

  updateConfig(config: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldNotify(payload: NotificationPayload): boolean {
    // Don't notify if it's from the current user
    if (payload.senderId === this.userId) return false;
    
    // Don't notify if it's from the active chat (user is already viewing it)
    if (payload.chatId && payload.chatId === this.activeChat) return false;
    
    return true;
  }

  private async sendPushNotification(payload: NotificationPayload) {
    if (!this.config.enablePush) return;

    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          message: payload.message,
          url: payload.url || `${window.location.origin}/chat`,
        }),
      });
    } catch (error) {
      console.error('Push notification failed:', error);
    }
  }

  private showToast(payload: NotificationPayload) {
    if (!this.config.enableToast) return;

    toast({
      title: payload.title,
      description: payload.message,
      duration: 3000,
    });
  }

  async notify(payload: NotificationPayload) {
    if (!this.shouldNotify(payload)) return;

    // Send push notification
    await this.sendPushNotification(payload);

    // Show toast notification
    this.showToast(payload);
  }

  // Convenience methods for specific notification types
  async notifyNewMessage(data: {
    chatId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: 'text' | 'image' | 'file' | 'voice' | 'money';
  }) {
    const typeMap: Record<string, NotificationType> = {
      text: NotificationType.MESSAGE,
      image: NotificationType.MEDIA,
      file: NotificationType.DOCUMENT,
      voice: NotificationType.VOICE,
      money: NotificationType.MONEY,
    };

    const titleMap: Record<string, string> = {
      text: `New message from ${data.senderName}`,
      image: `${data.senderName} sent a photo`,
      file: `${data.senderName} sent a file`,
      voice: `${data.senderName} sent a voice note`,
      money: `💰 ${data.senderName} sent you money`,
    };

    await this.notify({
      type: typeMap[data.messageType] || NotificationType.MESSAGE,
      title: titleMap[data.messageType] || `New message from ${data.senderName}`,
      message: data.content.substring(0, 100),
      url: `${window.location.origin}/chat`,
      chatId: data.chatId,
      senderId: data.senderId,
      senderName: data.senderName,
    });
  }

  async notifyMoneyReceived(data: {
    amount: number;
    from: string;
    chatId: string;
  }) {
    await this.notify({
      type: NotificationType.MONEY,
      title: '💰 Money Received!',
      message: `You received $${data.amount.toFixed(2)} from ${data.from}`,
      url: `${window.location.origin}/transactions`,
      chatId: data.chatId,
    });
  }

  async notifyContactRequest(data: {
    from: string;
    action: 'received' | 'accepted';
  }) {
    const title = data.action === 'received' 
      ? `New contact request from ${data.from}`
      : `${data.from} accepted your contact request`;
    
    await this.notify({
      type: NotificationType.CONTACT_REQUEST,
      title,
      message: data.action === 'received' 
        ? 'Tap to view and respond'
        : 'You can now start chatting',
      url: `${window.location.origin}/contacts`,
    });
  }

  async notifyGroupInvitation(data: {
    groupName: string;
    inviterName: string;
  }) {
    await this.notify({
      type: NotificationType.GROUP_INVITATION,
      title: `Group invitation from ${data.inviterName}`,
      message: `You've been invited to join ${data.groupName}`,
      url: `${window.location.origin}/groups`,
    });
  }

  async notifyGroupDonation(data: {
    groupName: string;
    donorName: string;
    amount: number;
  }) {
    await this.notify({
      type: NotificationType.GROUP_DONATION,
      title: `New donation in ${data.groupName}`,
      message: `${data.donorName} donated $${data.amount.toFixed(2)}`,
      url: `${window.location.origin}/groups`,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
