// Chat notification types (for centralized notification service)
export enum NotificationType {
  MESSAGE = 'message',
  MEDIA = 'media',
  VOICE = 'voice',
  DOCUMENT = 'document',
  MONEY = 'money',
  CONTACT_REQUEST = 'contact_request',
  GROUP_DONATION = 'group_donation',

  // Chat-specific notification types
  CHAT_MESSAGE_TEXT = 'CHAT_MESSAGE_TEXT',
  CHAT_MESSAGE_IMAGE = 'CHAT_MESSAGE_IMAGE',
  CHAT_MESSAGE_VIDEO = 'CHAT_MESSAGE_VIDEO',
  CHAT_MESSAGE_AUDIO = 'CHAT_MESSAGE_AUDIO',
  CHAT_MESSAGE_FILE = 'CHAT_MESSAGE_FILE',
  CHAT_MESSAGE_MONEY = 'CHAT_MESSAGE_MONEY',
  CHAT_MESSAGE_RECEIVED = 'CHAT_MESSAGE_RECEIVED',
  CHAT_MESSAGE_READ = 'CHAT_MESSAGE_READ',
  CHAT_DM_CREATED = 'CHAT_DM_CREATED',
  CHAT_GROUP_CHAT_CREATED = 'CHAT_GROUP_CHAT_CREATED',
  CHAT_DELETED = 'CHAT_DELETED',
  CHAT_USER_ADDED = 'CHAT_USER_ADDED',

  // Group notifications
  GROUP_CREATED = 'GROUP_CREATED',
  GROUP_INVITATION = 'GROUP_INVITATION',
  GROUP_JOINED = 'GROUP_JOINED',
  GROUP_MESSAGE = 'GROUP_MESSAGE',
  GROUP_JOIN_REQUEST = 'GROUP_JOIN_REQUEST',
  GROUP_JOIN_APPROVED = 'GROUP_JOIN_APPROVED',
  GROUP_JOIN_REJECTED = 'GROUP_JOIN_REJECTED',
  GROUP_LINK_JOIN_REQUEST = 'GROUP_LINK_JOIN_REQUEST',
  GROUP_MEMBER_LEFT = 'GROUP_MEMBER_LEFT',
  MEMBER_REMOVED_FROM_GROUP = 'MEMBER_REMOVED_FROM_GROUP',
  GROUP_DELETED = 'GROUP_DELETED',
  GROUP_INVITATION_SENT = 'GROUP_INVITATION_SENT',
  GROUP_INVITATION_ACCEPTED = 'GROUP_INVITATION_ACCEPTED',
  GROUP_INVITATION_REJECTED = 'GROUP_INVITATION_REJECTED',
  GROUP_MEMBER_ADDED = 'GROUP_MEMBER_ADDED',
  GROUP_MEMBER_REMOVED = 'GROUP_MEMBER_REMOVED',
  GROUP_MEMBER_ROLE_CHANGED = 'GROUP_MEMBER_ROLE_CHANGED',
  GROUP_UPDATED = 'GROUP_UPDATED',

  // Contact notifications
  CONTACT_INVITATION_SENT = 'CONTACT_INVITATION_SENT',
  CONTACT_REQUEST_RECEIVED = 'CONTACT_REQUEST_RECEIVED',
  CONTACT_REQUEST_ACCEPTED = 'CONTACT_REQUEST_ACCEPTED',
  CONTACT_REQUEST_REJECTED = 'CONTACT_REQUEST_REJECTED',
  CONTACT_ADDED = 'CONTACT_ADDED',
  CONTACT_BLOCKED = 'CONTACT_BLOCKED',
  CONTACT_UNBLOCKED = 'CONTACT_UNBLOCKED',
  CONTACT_REMOVED = 'CONTACT_REMOVED',

  // Transaction notifications
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_SENT = 'PAYMENT_SENT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  TRANSACTION_COMPLETED = 'TRANSACTION_COMPLETED',
  TRANSACTION_REFUNDED = 'TRANSACTION_REFUNDED',
  TRANSACTION_DISPUTED = 'TRANSACTION_DISPUTED',
  LARGE_TRANSACTION_ALERT = 'LARGE_TRANSACTION_ALERT',

  // Wallet notifications
  WALLET_CREATED = 'WALLET_CREATED',
  WALLET_RESTRICTION_ADDED = 'WALLET_RESTRICTION_ADDED',
  WALLET_RESTRICTION_REMOVED = 'WALLET_RESTRICTION_REMOVED',
  LOW_BALANCE_WARNING = 'LOW_BALANCE_WARNING',

  // Action notifications (Tickets, Services, etc.)
  ACTION_CREATED = 'ACTION_CREATED',
  ACTION_UPDATED = 'ACTION_UPDATED',
  ACTION_DELETED = 'ACTION_DELETED',
  ACTION_PURCHASED = 'ACTION_PURCHASED',
  ACTION_SOLD = 'ACTION_SOLD',
  ACTION_EXPIRED = 'ACTION_EXPIRED',
  SUB_ACTION_CREATED = 'SUB_ACTION_CREATED',
  SUB_ACTION_UPDATED = 'SUB_ACTION_UPDATED',

  // Organization notifications
  ORGANIZATION_CREATED = 'ORGANIZATION_CREATED',
  ORGANIZATION_VERIFIED = 'ORGANIZATION_VERIFIED',
  ORGANIZATION_UPDATED = 'ORGANIZATION_UPDATED',
  ORGANIZATION_DELETED = 'ORGANIZATION_DELETED',
  ORGANIZATION_SUSPENDED = 'ORGANIZATION_SUSPENDED',
  ORGANIZATION_MEMBER_ADDED = 'ORGANIZATION_MEMBER_ADDED',
  ORGANIZATION_MEMBER_REMOVED = 'ORGANIZATION_MEMBER_REMOVED',
  ORGANIZATION_ROLE_CHANGED = 'ORGANIZATION_ROLE_CHANGED',

  // User account notifications
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PIN_SET = 'PIN_SET',
  PIN_CHANGED = 'PIN_CHANGED',

  // Admin notifications
  ADMIN_USER_CREATED = 'ADMIN_USER_CREATED',
  ADMIN_USER_UPDATED = 'ADMIN_USER_UPDATED',
  ADMIN_USER_DELETED = 'ADMIN_USER_DELETED',
  ADMIN_STATUS_CHANGED = 'ADMIN_STATUS_CHANGED',
  ADMIN_ROLE_ASSIGNED = 'ADMIN_ROLE_ASSIGNED',
  ADMIN_ROLE_REMOVED = 'ADMIN_ROLE_REMOVED',

  // External account notifications
  EXTERNAL_ACCOUNT_LINKED = 'EXTERNAL_ACCOUNT_LINKED',
  EXTERNAL_ACCOUNT_UNLINKED = 'EXTERNAL_ACCOUNT_UNLINKED',
  EXTERNAL_ACCOUNT_VERIFIED = 'EXTERNAL_ACCOUNT_VERIFIED',

  // General notifications
  WELCOME = 'WELCOME',
  REMINDER = 'REMINDER',
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  FEATURE_ANNOUNCEMENT = 'FEATURE_ANNOUNCEMENT',
  PAYMENT_REQUEST_RECEIVED = 'PAYMENT_REQUEST_RECEIVED',
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
  enableVibration: boolean;
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
    // General data
    message?: string;
    title?: string;
    description?: string;
    url?: string;
    reason?: string;

    // User-related data
    userId?: string;
    userName?: string;
    userEmail?: string;

    // Group-related data
    groupId?: string;
    groupName?: string;
    requestId?: string;

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

    // Transaction-related data
    transactionId?: string;
    amount?: number;
    currency?: string;
    transactionType?: string;
    fee?: number;

    // Action-related data
    actionId?: string;
    actionName?: string;
    actionType?: string;
    actionSlug?: string;
    subActionId?: string;
    subActionName?: string;
    purchaseId?: string;
    ticketNumber?: string;
    expiryDate?: string;

    // Organization-related data
    organizationId?: string;
    organizationName?: string;
    organizationType?: string;
    ownerName?: string;

    // Wallet-related data
    walletId?: string;
    balance?: number;
    restrictionType?: string;
    thresholdAmount?: number;

    // External account data
    externalAccountId?: string;
    externalAccountType?: string;
    externalAccountName?: string;

    // Admin action data
    adminId?: string;
    adminName?: string;
    roleId?: string;
    roleName?: string;
    previousStatus?: string;
    newStatus?: string;

    // Actions
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
  dismissNotificationsByIds?: (ids: string[]) => void;
  removeContactRequestNotification?: (userId: string) => void;
  isConnected?: boolean;
  clearNotificationState?: () => void;
}
