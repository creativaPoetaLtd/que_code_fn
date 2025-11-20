export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    isOnline?: boolean;
    lastSeen?: string;
    profile?: {
        profileImage?: string;
    };
}

export interface ChatParticipant {
    userId: string;
    user: User;
}

export interface LastMessage {
    content: string;
    messageType: "text" | "image" | "file" | "money";
    createdAt: string;
    sender: string;
}

export interface Chat {
    id: string;
    name: string;
    isGroup: boolean;
    avatar?: string;
    lastMessage?: LastMessage;
    unreadCount: number;
    isOnline: boolean | number; // boolean for DMs, number for groups (online count)
    memberCount?: number;
    participants: ChatParticipant[];
}

export interface MessageSender {
    id: string;
    name: string;
    avatar?: string;
}

export interface ReadReceipt {
    userId: string;
    name: string;
    readAt: string;
}

export interface Message {
    id: string;
    chatId: string;
    content: string;
    messageType: "text" | "image" | "file" | "money";
    createdAt: string;
    sender: MessageSender;
    readBy: ReadReceipt[];
}

export interface TypingIndicator {
    userId: string;
    chatId: string;
    isTyping: boolean;
}

export interface OnlineUser {
    userId: string;
    socketId: string;
    lastSeen: string;
}

// Legacy types for backward compatibility
export interface Group {
    id: number;
    name: string;
    isGroup: true;
    isContributionGroup: boolean;
    lastMessage?: string;
    timestamp?: string;
    unread?: number;
    avatar: string;
    members: number;
    online: number;
    description?: string;
    createdAt: string;
    createdBy: string;
    contributionProgress?: number;
    targetAmount?: number;
    collectedAmount?: number;
    deadline?: string;
}

export interface Contact {
    id: number;
    name: string;
    isGroup: false;
    isContributionGroup: false;
    lastMessage?: string;
    timestamp?: string;
    unread?: number;
    avatar: string;
    online: boolean;
    email?: string;
    phone?: string;
    address?: string;
    joinedAt?: string;
}

export type Conversation = Group | Contact;

// Legacy message interface for backward compatibility with existing components
export interface LegacyMessage {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    isMe: boolean;
    avatar: string;
}
  
  export interface ContactOption {
    id: number;
    name: string;
    avatar: string;
    recent?: boolean;
  }

export * from './analytics.types';
export * from './chat.types';
  