export type MessageType = "text" | "image" | "file" | "money" | "audio" | "video" | "document";
export type MessageStatus = "sent" | "delivered" | "read";
export type ChatType = "dm" | "group" | "support";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isOnline: boolean;
  lastSeen?: Date;
  profile?: {
    profileImage?: string;
  };
}

export interface Participant {
  userId: string;
  user: User;
}

export interface LastMessage {
  content: string;
  messageType: MessageType;
  createdAt: string;
  sender:
    | string
    | {
        id: string;
        firstName: string;
        lastName: string;
      };
}

export interface Conversation {
  id: string;
  name?: string; // Make optional to match Chat interface
  isGroup: boolean;
  type?: ChatType;
  groupId?: string; // The actual group ID for group chats
  lastMessage?: LastMessage | null;
  timestamp?: string;
  unreadCount: number;
  avatar?: string;
  memberCount?: number;
  isOnline: boolean | number;
  participants: Participant[];
  email?: string;
  phone?: string;
}

export interface Chat {
  id: string;
  name?: string; // Optional since DM chats might not have names
  isGroup: boolean;
  type?: ChatType;
  groupId?: string; // The actual group ID for group chats
  avatar?: string;
  participants: Participant[];
  unreadCount: number;
  isOnline: boolean;
  memberCount?: number;
  lastMessage?: LastMessage;
  latestMessage?: LastMessage; // API sometimes uses latestMessage
  otherUser?: User; // For DM chats, the other participant
}

export interface MessageSender {
  id: string;
  name: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export interface MediaData {
    mediaUrl?: string;
    mediaType?: string;
    fileSize?: number;
    thumbnailUrl?: string;
    fileName?: string;
    mimeType?: string;
    duration?: number;
    width?: number;
    height?: number;
}

export interface Message extends MediaData {
    id: string;
    chatId: string;
    content: string;
    messageType: MessageType;
    status: MessageStatus;
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: string;
    sender: MessageSender;
    readBy?: ReadReceipt[];
    isMe?: boolean;
}

export interface LegacyMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  isMe: boolean;
  avatar?: string;
}

export interface ReadReceipt {
  userId: string;
  name: string;
  readAt: Date;
}

export interface TypingUser {
  userId: string;
  username: string;
  chatId: string;
  isTyping: boolean;
}

export interface OnlineUser {
  userId: string;
  socketId: string;
  lastSeen: Date;
}

export interface ChatParticipantStatus {
  userId: string;
  name: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface CreateGroupChatData {
  participantIds: string[];
  groupName?: string;
}

export interface SendMessageData {
  chatId: string;
  content: string;
  messageType: MessageType;
  transactionId?: string;
}

export interface CreateOrGetDMChatData {
  participantId: string;
}

export interface MarkMessagesAsReadData {
  chatId: string;
}

export interface DeleteChatData {
  chatId: string;
}

export interface InitializeEncryptionData {
  password?: string;
}
