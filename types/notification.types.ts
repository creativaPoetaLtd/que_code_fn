export enum NotificationType {
  MESSAGE = 'message',
  MEDIA = 'media',
  VOICE = 'voice',
  DOCUMENT = 'document',
  MONEY = 'money',
  CONTACT_REQUEST = 'contact_request',
  GROUP_INVITATION = 'group_invitation',
  GROUP_DONATION = 'group_donation',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  url?: string;
  chatId?: string;
  senderId?: string;
  senderName?: string;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  enablePush: boolean;
  enableToast: boolean;
  enableSound: boolean;
}
