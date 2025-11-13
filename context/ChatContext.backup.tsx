"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { socketService } from "@/services/socketService";
import { useAuthToken } from "@/hooks/use-auth-token";
import { 
    Conversation, 
    Message, 
    TypingUser, 
    OnlineUser, 
    ChatParticipantStatus 
} from "@/types/chat.types";
import { toast } from "@/hooks/use-toast";

interface ChatContextType {
    // Connection status
    isConnected: boolean;
    
    // Chat management
    conversations: Conversation[];
    activeChat: string | null;
    messages: Record<string, Message[]>;
    
    // Real-time features
    typingUsers: TypingUser[];
    onlineUsers: OnlineUser[];
    participantsStatus: Record<string, ChatParticipantStatus[]>;
    
    // Actions
    setActiveChat: (chatId: string | null) => void;
    sendMessage: (chatId: string, content: string, messageType?: "text" | "image" | "file" | "money") => void;
    markMessagesAsRead: (chatId: string) => void;
    startTyping: (chatId: string) => void;
    stopTyping: (chatId: string) => void;
    createGroupChat: (participantIds: string[], groupName?: string) => void;
    deleteChat: (chatId: string) => void;
    initializeEncryption: (password?: string) => void;
    
    // Legacy methods for backward compatibility
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    markMessageRead: (chatId: string, messageId: string) => void;
    addMessage: (message: Message) => void;
    updateMessageReadStatus: (chatId: string, messageId: string, readBy: any) => void;
    
    // Data refresh
    refreshConversations: () => void;
    refreshMessages: (chatId: string) => void;
}

// Unified Chat Context - combines original ChatContext and EnhancedChatContext functionality

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { getToken, getUserId } = useAuthToken();
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

    // Socket event handlers
    const handleConnect = useCallback(() => {
        setIsConnected(true);
        console.log("Chat: Connected to server");
    }, []);

    const handleDisconnect = useCallback(() => {
        setIsConnected(false);
        console.log("Chat: Disconnected from server");
    }, []);

    const handleNewMessage = useCallback((message: Message) => {
        setMessages(prev => ({
            ...prev,
            [message.chatId]: [...(prev[message.chatId] || []), message]
        }));

        // Show notification if message is not from current user and chat is not active
        const userId = getUserId();
        if (message.sender.id !== userId && activeChat !== message.chatId) {
            toast({
                title: `New message from ${message.sender.name}`,
                description: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
            });
        }
    }, [activeChat, getUserId]);

    const handleMessageRead = useCallback((data: { chatId: string; messageId: string; readBy: string; readAt: string }) => {
        setMessages(prev => ({
            ...prev,
            [data.chatId]: prev[data.chatId]?.map(msg => 
                msg.id === data.messageId 
                    ? {
                        ...msg,
                        readBy: [...msg.readBy, {
                            userId: data.readBy,
                            name: "User", // You might want to get the actual name
                            readAt: data.readAt
                        }]
                    }
                    : msg
            ) || []
        }));
    }, []);

    const handleUserTyping = useCallback((data: TypingIndicator) => {
        setTypingUsers(prev => {
            const filtered = prev.filter(t => t.userId !== data.userId || t.chatId !== data.chatId);
            return data.isTyping ? [...filtered, data] : filtered;
        });

        // Remove typing indicator after 3 seconds if still typing
        if (data.isTyping) {
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(t => 
                    !(t.userId === data.userId && t.chatId === data.chatId)
                ));
            }, 3000);
        }
    }, []);

    const handleUserStatusChanged = useCallback((data: { userId: string; isOnline: boolean; lastSeen: string }) => {
        setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== data.userId);
            return data.isOnline 
                ? [...filtered, { userId: data.userId, socketId: '', lastSeen: data.lastSeen }]
                : filtered;
        });
    }, []);

    const handleOnlineUsers = useCallback((users: OnlineUser[]) => {
        setOnlineUsers(users);
    }, []);

    const handleError = useCallback((error: any) => {
        console.error("Chat error:", error);
        toast({
            title: "Chat Error",
            description: error.message || "Something went wrong",
            variant: "destructive"
        });
    }, []);

    // Initialize socket connection
    useEffect(() => {
        const userId = getUserId();
        const token = getToken();
        
        if (userId && token) {
            const socket = socketService.connect(userId, token);
            
            // Set up event listeners
            socket.on("connect", handleConnect);
            socket.on("disconnect", handleDisconnect);
            socket.on("connect_error", handleError);
            
            // Chat event listeners
            socketService.onNewMessage(handleNewMessage);
            socketService.onMessageRead(handleMessageRead);
            socketService.onUserTyping(handleUserTyping);
            socketService.onUserStatusChanged(handleUserStatusChanged);
            socketService.onOnlineUsers(handleOnlineUsers);
            
            return () => {
                // Clean up event listeners
                socket.off("connect", handleConnect);
                socket.off("disconnect", handleDisconnect);
                socket.off("connect_error", handleError);
                
                socketService.offNewMessage(handleNewMessage);
                socketService.offMessageRead(handleMessageRead);
                socketService.offUserTyping(handleUserTyping);
                socketService.offUserStatusChanged(handleUserStatusChanged);
                socketService.offOnlineUsers(handleOnlineUsers);
                
                socketService.disconnect();
            };
        }
    }, [
        getUserId, 
        getToken, 
        handleConnect, 
        handleDisconnect, 
        handleError,
        handleNewMessage,
        handleMessageRead,
        handleUserTyping,
        handleUserStatusChanged,
        handleOnlineUsers
    ]);

    // Chat actions
    const joinChat = useCallback((chatId: string) => {
        socketService.joinChat(chatId);
    }, []);

    const leaveChat = useCallback((chatId: string) => {
        socketService.leaveChat(chatId);
    }, []);

    const sendMessage = useCallback((
        chatId: string, 
        content: string, 
        messageType: "text" | "image" | "file" | "money" = "text",
        transactionId?: string
    ) => {
        socketService.sendMessage(chatId, content, messageType, transactionId);
    }, []);

    const markMessageRead = useCallback((chatId: string, messageId: string) => {
        socketService.markMessageRead(chatId, messageId);
    }, []);

    const startTyping = useCallback((chatId: string) => {
        socketService.startTyping(chatId);
    }, []);

    const stopTyping = useCallback((chatId: string) => {
        socketService.stopTyping(chatId);
    }, []);

    // Helper methods
    const addMessage = useCallback((message: Message) => {
        setMessages(prev => ({
            ...prev,
            [message.chatId]: [...(prev[message.chatId] || []), message]
        }));
    }, []);

    const updateMessageReadStatus = useCallback((chatId: string, messageId: string, readBy: any) => {
        setMessages(prev => ({
            ...prev,
            [chatId]: prev[chatId]?.map(msg => 
                msg.id === messageId 
                    ? { ...msg, readBy: [...msg.readBy, readBy] }
                    : msg
            ) || []
        }));
    }, []);

    // Auto-join active chat
    useEffect(() => {
        if (activeChat && isConnected) {
            joinChat(activeChat);
        }
        
        return () => {
            if (activeChat) {
                leaveChat(activeChat);
            }
        };
    }, [activeChat, isConnected, joinChat, leaveChat]);

    const value: ChatContextType = {
        isConnected,
        onlineUsers,
        activeChat,
        messages,
        typingUsers,
        joinChat,
        leaveChat,
        sendMessage,
        markMessageRead,
        setActiveChat,
        startTyping,
        stopTyping,
        addMessage,
        updateMessageReadStatus
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};