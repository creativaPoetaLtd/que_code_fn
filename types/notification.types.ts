// Chat notification types (for centralized notification service)
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

// Existing notification types (for UI dropdown and API)
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
  data?: {
    message?: string;
    groupId?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    url?: string;
    title?: string;
    actions?: Array<{
      type: string;
      url: string;
      label?: string;
    }>;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  clearAll?: () => void;
  addNotification?: (notification: Notification) => void;
  clearNotifications?: () => void;
  removeNotification?: (id: string) => void;
  removeContactRequestNotification?: (userId: string) => void;
  isConnected?: boolean;
  clearNotificationState?: () => void;
}
