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
  
  // Chat-specific notification types
  CHAT_MESSAGE_TEXT = 'chat_message_text',
  CHAT_MESSAGE_IMAGE = 'chat_message_image',
  CHAT_MESSAGE_VIDEO = 'chat_message_video',
  CHAT_MESSAGE_AUDIO = 'chat_message_audio',
  CHAT_MESSAGE_FILE = 'chat_message_file',
  CHAT_MESSAGE_MONEY = 'chat_message_money',
  CHAT_MESSAGE_RECEIVED = 'chat_message_received',
  CHAT_MESSAGE_READ = 'chat_message_read',
  CHAT_DM_CREATED = 'chat_dm_created',
  CHAT_GROUP_CHAT_CREATED = 'chat_group_chat_created',
  CHAT_DELETED = 'chat_deleted',
  CHAT_USER_ADDED = 'chat_user_added',
  
  // Group notifications
  GROUP_CREATED = 'group_created',
  GROUP_JOINED = 'group_joined',
  GROUP_MESSAGE = 'group_message',
  GROUP_JOIN_REQUEST = 'group_join_request',
  GROUP_JOIN_APPROVED = 'group_join_approved',
  GROUP_JOIN_REJECTED = 'group_join_rejected',
  GROUP_LINK_JOIN_REQUEST = 'group_link_join_request',
  GROUP_MEMBER_LEFT = 'group_member_left',
  MEMBER_REMOVED_FROM_GROUP = 'member_removed_from_group',
  GROUP_DELETED = 'group_deleted',
  GROUP_INVITATION_SENT = 'group_invitation_sent',
  GROUP_INVITATION_ACCEPTED = 'group_invitation_accepted',
  GROUP_INVITATION_REJECTED = 'group_invitation_rejected',
  GROUP_MEMBER_ADDED = 'group_member_added',
  GROUP_MEMBER_REMOVED = 'group_member_removed',
  GROUP_MEMBER_ROLE_CHANGED = 'group_member_role_changed',
  GROUP_UPDATED = 'group_updated',
  
  // Contact notifications
  CONTACT_INVITATION_SENT = 'contact_invitation_sent',
  CONTACT_REQUEST_RECEIVED = 'contact_request_received',
  CONTACT_REQUEST_ACCEPTED = 'contact_request_accepted',
  CONTACT_REQUEST_REJECTED = 'contact_request_rejected',
  CONTACT_ADDED = 'contact_added',
  CONTACT_BLOCKED = 'contact_blocked',
  CONTACT_UNBLOCKED = 'contact_unblocked',
  CONTACT_REMOVED = 'contact_removed',
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
    groupName?: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    url?: string;
    title?: string;
    description?: string;
    
    // Contact-specific data
    contactId?: string;
    contactName?: string;
    
    // Chat-specific data
    chatId?: string;
    messageId?: string;
    messageContent?: string;
    messageType?: string;
    senderId?: string;
    senderName?: string;
    chatName?: string;
    isGroupChat?: boolean;
    mediaUrl?: string;
    thumbnailUrl?: string;
    
    // Group-specific data
    requestId?: string;
    newRole?: string;
    
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
