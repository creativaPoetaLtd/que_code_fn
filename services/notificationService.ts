import { NotificationType, NotificationPayload, NotificationConfig } from '@/types/notification.types';
import { toast } from '@/hooks/use-toast';
import { soundService, getPrefs } from './soundService';
import { getChatPreviewText } from '@/utils/chatPreview';

class NotificationService {
  private config: NotificationConfig = {
    enablePush: true,
    enableToast: true,
    enableSound: true,
    enableVibration: true,
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

  /**
   * Sync runtime config from localStorage prefs.
   * Called once on app boot and after the user changes settings.
   */
  syncFromPrefs() {
    const prefs = getPrefs();
    this.updateConfig({
      enableSound: prefs.soundEnabled,
      enableVibration: prefs.vibrationEnabled,
    });
  }

  private isPageVisible() {
    return typeof document !== 'undefined' && document.visibilityState === 'visible';
  }

  private shouldNotify(payload: NotificationPayload): boolean {
    const currentUserId = String(this.userId || "");
    const senderId = payload.senderId ? String(payload.senderId) : "";

    // Don't notify if it's from the current user
    if (senderId && senderId === currentUserId) return false;

    return true;
  }

  private showToast(payload: NotificationPayload) {
    if (!this.config.enableToast) return;

    toast({
      title: payload.title,
      description: payload.message,
      duration: 3000,
    });
  }

  /** Play sound + vibration according to current config. */
  private playFeedback() {
    if (this.config.enableSound) soundService.playMessageSound();
    if (this.config.enableVibration) soundService.vibrate();
  }

  private shouldShowToast(payload: NotificationPayload) {
    if (!this.isPageVisible()) return false;
    if (payload.chatId && payload.chatId === this.activeChat) return false;
    return true;
  }

  async notify(payload: NotificationPayload) {
    if (!this.shouldNotify(payload)) return;

    if (!this.isPageVisible()) return;

    // Auditory / haptic feedback first for foreground events
    this.playFeedback();

    if (this.shouldShowToast(payload)) {
      this.showToast(payload);
    }
  }

  // Convenience methods for specific notification types
  async notifyNewMessage(data: {
    chatId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'voice' | 'money' | 'secure';
  }) {
    if (data.messageType === 'secure') {
      await this.notify({
        type: NotificationType.MESSAGE,
        title: 'New secure message',
        message: 'Open QueCode to view this encrypted message.',
        url: `${window.location.origin}/chat`,
        chatId: data.chatId,
        senderId: data.senderId,
      });
      return;
    }

    const typeMap: Record<string, NotificationType> = {
      text: NotificationType.MESSAGE,
      image: NotificationType.MEDIA,
      video: NotificationType.MEDIA,
      audio: NotificationType.VOICE,
      file: NotificationType.DOCUMENT,
      voice: NotificationType.VOICE,
      money: NotificationType.MONEY,
    };

    const titleMap: Record<string, string> = {
      text: `New message from ${data.senderName}`,
      image: `${data.senderName} sent a photo`,
      video: `${data.senderName} sent a video`,
      audio: `${data.senderName} sent an audio`,
      file: `${data.senderName} sent a file`,
      voice: `${data.senderName} sent a voice note`,
      money: `💰 ${data.senderName} sent you money`,
    };

    await this.notify({
      type: typeMap[data.messageType] || NotificationType.MESSAGE,
      title: titleMap[data.messageType] || `New message from ${data.senderName}`,
      message: getChatPreviewText(data).substring(0, 100),
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
