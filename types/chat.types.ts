export interface Conversation {
    id: string;
    name: string;
    isGroup: boolean;
    lastMessage?: {
        content: string;
        messageType: string;
        createdAt: string;
        sender: string;
    } | null;
    timestamp?: string;
    unreadCount: number;
    avatar?: string;
    memberCount?: number;
    isOnline: boolean | number;
    participants: Participant[];
}

export interface Participant {
    userId: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isOnline: boolean;
        lastSeen?: Date;
        profile?: {
            profileImage?: string;
        };
    };
}

export interface Message {
    id: string;
    chatId: string;
    content: string;
    messageType: "text" | "image" | "file" | "money";
    status: "sent" | "delivered" | "read";
    deliveredAt?: Date;
    readAt?: Date;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        avatar?: string;
    };
    readBy?: ReadReceipt[];
    isMe?: boolean;
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
    messageType: "text" | "image" | "file" | "money";
    transactionId?: string;
}