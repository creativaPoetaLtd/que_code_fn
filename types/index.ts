export interface User {
    id: number;
    name: string;
    avatar: string;
    online?: boolean;
    email?: string;
    phone?: string;
    address?: string;
    joinedAt?: string;
  }
  
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
  
  export interface Message {
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
  