export interface Conversation {
    id: number;
    name: string;
    isGroup: boolean;
    lastMessage: string;
    timestamp: string;
    unread: number;
    avatar: string;
    members?: number;
    online: boolean | number;
}

export interface Message {
    id: number;
    sender: string;
    message: string;
    timestamp: string;
    isMe: boolean;
    avatar: string;
}