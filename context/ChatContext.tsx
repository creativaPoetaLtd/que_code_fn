"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { socketService } from "@/services/socketService";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetUserChatsQuery, useGetChatMessagesQuery } from "@/states/chatSlice";
import {
    Conversation,
    Message,
    TypingUser,
    OnlineUser,
    ChatParticipantStatus
} from "@/types/chat.types";
import { toast } from "@/hooks/use-toast";

interface ChatContextType {
    isConnected: boolean;
    conversations: Conversation[];
    activeChat: string | null;
    messages: Record<string, Message[]>;
    typingUsers: TypingUser[];
    onlineUsers: OnlineUser[];
    participantsStatus: Record<string, ChatParticipantStatus[]>;
    setActiveChat: (chatId: string | null) => void;
    sendMessage: (chatId: string, content: string, messageType?: "text" | "image" | "file" | "money") => void;
    markMessagesAsRead: (chatId: string) => void;
    startTyping: (chatId: string) => void;
    stopTyping: (chatId: string) => void;
    createGroupChat: (participantIds: string[], groupName?: string) => void;
    deleteChat: (chatId: string) => void;
    initializeEncryption: (password?: string) => void;
    joinChat: (chatId: string) => void;
    leaveChat: (chatId: string) => void;
    markMessageRead: (chatId: string, messageId: string) => void;
    addMessage: (message: Message) => void;
    updateMessageReadStatus: (chatId: string, messageId: string, readBy: any) => void;
    refreshConversations: () => void;
    refreshMessages: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { getToken, getUserId } = useAuthToken();
    const userId = getUserId();
    const token = getToken();

    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [participantsStatus, setParticipantsStatus] = useState<Record<string, ChatParticipantStatus[]>>({});

    const { data: chatsData, refetch: refetchChats } = useGetUserChatsQuery(undefined, {
        skip: !token
    });

    const { data: messagesData, refetch: refetchMessages } = useGetChatMessagesQuery(
        { chatId: activeChat || '', page: 1, limit: 50 },
        { skip: !activeChat || !token }
    );

    useEffect(() => {
        if (userId && token) {
            const socket = socketService.connect(userId, token);

            const handleConnect = () => {
                setIsConnected(true);
                socketService.initializeEncryption();
                socketService.getOnlineUsers();
            };

            const handleDisconnect = () => setIsConnected(false);
            const handleConnectError = () => setIsConnected(false);

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);
            socket.on('connect_error', handleConnectError);

            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
                socket.off('connect_error', handleConnectError);
                socketService.disconnect();
                setIsConnected(false);
            };
        }
    }, []);

    useEffect(() => {
        if (!isConnected || !userId) return;

        const handleNewMessage = (message: Message) => {
            const enhancedMessage = { ...message, isMe: message.sender.id === userId };

            // Check if message already exists to prevent duplicates
            setMessages(prev => {
                const existingMessages = prev[message.chatId] || [];
                const messageExists = existingMessages.some(msg =>
                    msg.id === message.id || // Same ID
                    (msg.id.startsWith('temp_') && // Replace temp message
                        msg.chatId === message.chatId &&
                        msg.content === message.content &&
                        msg.messageType === message.messageType &&
                        msg.sender.id === message.sender.id)
                );

                if (messageExists) {
                    // Replace temp message with real one, or ignore duplicate
                    return {
                        ...prev,
                        [message.chatId]: existingMessages.map(msg =>
                            (msg.id.startsWith('temp_') &&
                                msg.chatId === message.chatId &&
                                msg.content === message.content &&
                                msg.messageType === message.messageType &&
                                msg.sender.id === message.sender.id)
                                ? enhancedMessage
                                : msg
                        )
                    };
                }

                return {
                    ...prev,
                    [message.chatId]: [...existingMessages, enhancedMessage]
                };
            });

            setConversations(prev => prev.map(conv =>
                conv.id === message.chatId
                    ? {
                        ...conv,
                        lastMessage: {
                            content: message.content,
                            messageType: message.messageType,
                            createdAt: message.createdAt,
                            sender: message.sender.name
                        },
                        unreadCount: conv.id === activeChat ? 0 : conv.unreadCount + 1
                    }
                    : conv
            ));

            if (message.chatId !== activeChat && message.sender.id !== userId) {
                toast({
                    title: `New message from ${message.sender.name}`,
                    description: message.content.substring(0, 100),
                    duration: 3000,
                });
            }
        };

        const handleMessageDelivered = (data: { chatId: string; messageId: string; deliveredAt: Date }) => {
            setMessages(prev => ({
                ...prev,
                [data.chatId]: prev[data.chatId]?.map(msg =>
                    msg.id === data.messageId
                        ? { ...msg, status: 'delivered', deliveredAt: data.deliveredAt }
                        : msg
                ) || []
            }));
        };

        const handleMessagesRead = (data: { chatId: string; readBy: string; readAt: Date }) => {
            setMessages(prev => ({
                ...prev,
                [data.chatId]: prev[data.chatId]?.map(msg =>
                    msg.status === 'delivered' && msg.sender.id !== userId
                        ? { ...msg, status: 'read', readAt: data.readAt }
                        : msg
                ) || []
            }));
        };

        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === userId) return;

            setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== data.userId || u.chatId !== data.chatId);
                return data.isTyping ? [...filtered, data] : filtered;
            });
        };

        const handleOnlineUsers = (users: OnlineUser[]) => {
            setOnlineUsers(users);

            setConversations(prev => prev.map(conv => {
                const onlineCount = users.filter(u => conv.participants.some(p => p.userId === u.userId)).length;
                return {
                    ...conv,
                    isOnline: conv.isGroup
                        ? onlineCount > 0
                        : users.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId))
                };
            }));
        };

        const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => {
            setOnlineUsers(prev => {
                const updatedUsers = data.isOnline
                    ? [...prev.filter(u => u.userId !== data.userId), {
                        userId: data.userId,
                        socketId: '',
                        lastSeen: data.lastSeen || new Date()
                    }]
                    : prev.filter(u => u.userId !== data.userId);

                setConversations(convs => convs.map(conv => {
                    const onlineCount = updatedUsers.filter(u => conv.participants.some(p => p.userId === u.userId)).length;
                    return {
                        ...conv,
                        isOnline: conv.isGroup
                            ? onlineCount > 0
                            : updatedUsers.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId))
                    };
                }));

                return updatedUsers;
            });
        };

        const handleChatDeleted = (data: { chatId: string; deletedBy: string }) => {
            setConversations(prev => prev.filter(conv => conv.id !== data.chatId));
            setMessages(prev => {
                const newMessages = { ...prev };
                delete newMessages[data.chatId];
                return newMessages;
            });

            if (activeChat === data.chatId) {
                setActiveChat(null);
            }

            toast({
                title: "Chat Deleted",
                description: data.deletedBy === userId ? "You deleted this chat" : "This chat was deleted",
                duration: 3000,
            });
        };

        const handleGroupChatEvent = () => {
            toast({
                title: "Group Chat Updated",
                description: "Group chat has been updated",
                duration: 3000,
            });
            refreshConversations();
        };

        const handleChatParticipantsStatus = (data: { chatId: string; participants: ChatParticipantStatus[] }) => {
            setParticipantsStatus(prev => ({
                ...prev,
                [data.chatId]: data.participants
            }));
        };

        const handleJoinedChat = (data: { chatId: string }) => {
            socketService.getChatParticipantsStatus(data.chatId);
        };

        const handleError = (error: { message: string }) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
                duration: 5000,
            });
        };

        const handleMoneyReceived = (data: { amount: number; from: string; transactionId: string; chatId: string }) => {
            toast({
                title: "💰 Money Received!",
                description: `You received $${data.amount.toFixed(2)} from ${data.from}`,
                duration: 5000,
            });

            // Refresh messages for the chat where money was received
            if (data.chatId === activeChat) {
                refetchMessages();
            }
        };

        socketService.onNewMessage(handleNewMessage);
        socketService.onMessageDelivered(handleMessageDelivered);
        socketService.onMessagesRead(handleMessagesRead);
        socketService.onUserTyping(handleUserTyping);
        socketService.onOnlineUsers(handleOnlineUsers);
        socketService.onUserStatusChanged(handleUserStatusChanged);
        socketService.onChatDeleted(handleChatDeleted);
        socketService.onNewGroupChat(handleGroupChatEvent);
        socketService.onGroupChatCreated(handleGroupChatEvent);
        socketService.onChatParticipantsStatus(handleChatParticipantsStatus);
        socketService.onEncryptionInitialized(() => { });
        socketService.onJoinedChat(handleJoinedChat);
        socketService.onError(handleError);
        socketService.onMoneyReceived(handleMoneyReceived);

        return () => {
            socketService.offNewMessage(handleNewMessage);
            socketService.offMessageDelivered(handleMessageDelivered);
            socketService.offMessagesRead(handleMessagesRead);
            socketService.offUserTyping(handleUserTyping);
            socketService.offOnlineUsers(handleOnlineUsers);
            socketService.offUserStatusChanged(handleUserStatusChanged);
            socketService.offChatDeleted(handleChatDeleted);
            socketService.offNewGroupChat(handleGroupChatEvent);
            socketService.offGroupChatCreated(handleGroupChatEvent);
            socketService.offChatParticipantsStatus(handleChatParticipantsStatus);
            socketService.offJoinedChat(handleJoinedChat);
            socketService.offError(handleError);
            socketService.offMoneyReceived(handleMoneyReceived);
        };
    }, [isConnected, activeChat, userId, refetchMessages]);

    useEffect(() => {
        if (activeChat && isConnected) {
            socketService.joinChat(activeChat);
            socketService.markMessageRead(activeChat, '');

            return () => {
                if (activeChat) {
                    socketService.leaveChat(activeChat);
                }
            };
        }
    }, [activeChat, isConnected]);

    useEffect(() => {
        if (chatsData?.data) {
            setConversations(chatsData.data);
        }
    }, [chatsData]);

    useEffect(() => {
        if (messagesData?.data?.messages && activeChat) {
            const messagesWithIsMe = messagesData.data.messages.map((msg: Message) => ({
                ...msg,
                isMe: msg.sender.id === userId
            }));

            setMessages(prev => ({
                ...prev,
                [activeChat]: messagesWithIsMe
            }));
        }
    }, [messagesData, activeChat, userId]);

    const refreshConversations = useCallback(() => {
        refetchChats();
    }, [refetchChats]);

    const refreshMessages = useCallback((chatId: string) => {
        if (chatId === activeChat) {
            refetchMessages();
        }
    }, [activeChat, refetchMessages]);

    const sendMessage = useCallback((chatId: string, content: string, messageType: "text" | "image" | "file" | "money" = "text") => {
        if (isConnected && content.trim()) {
            socketService.sendMessage(chatId, content.trim(), messageType);

            const tempMessage: Message = {
                id: `temp_${Date.now()}`,
                chatId,
                content: content.trim(),
                messageType,
                status: 'sent',
                createdAt: new Date().toISOString(),
                sender: {
                    id: userId || '',
                    name: 'You',
                    avatar: undefined
                },
                isMe: true
            };

            setMessages(prev => ({
                ...prev,
                [chatId]: [...(prev[chatId] || []), tempMessage]
            }));
        }
    }, [isConnected, userId]);

    const markMessagesAsRead = useCallback((chatId: string) => {
        if (isConnected) {
            socketService.markMessageRead(chatId, '');
        }
    }, [isConnected]);

    const startTyping = useCallback((chatId: string) => {
        if (isConnected) {
            socketService.startTyping(chatId);
        }
    }, [isConnected]);

    const stopTyping = useCallback((chatId: string) => {
        if (isConnected) {
            socketService.stopTyping(chatId);
        }
    }, [isConnected]);

    const createGroupChat = useCallback((participantIds: string[], groupName?: string) => {
        if (isConnected) {
            socketService.createGroupChat(participantIds, groupName);
        }
    }, [isConnected]);

    const deleteChat = useCallback((chatId: string) => {
        if (isConnected) {
            socketService.deleteChat(chatId);
        }
    }, [isConnected]);

    const initializeEncryption = useCallback((password?: string) => {
        if (isConnected) {
            socketService.initializeEncryption(password);
        }
    }, [isConnected]);

    const joinChat = useCallback((chatId: string) => {
        socketService.joinChat(chatId);
    }, []);

    const leaveChat = useCallback((chatId: string) => {
        socketService.leaveChat(chatId);
    }, []);

    const markMessageRead = useCallback((chatId: string, messageId: string) => {
        socketService.markMessageRead(chatId, messageId);
    }, []);

    const addMessage = useCallback((message: Message) => {
        setMessages(prev => {
            const existingMessages = prev[message.chatId] || [];
            const messageExists = existingMessages.some(msg => msg.id === message.id);

            if (messageExists) {
                return prev; // Don't add duplicate
            }

            return {
                ...prev,
                [message.chatId]: [...existingMessages, { ...message, isMe: message.sender.id === userId }]
            };
        });
    }, [userId]);

    const updateMessageReadStatus = useCallback((chatId: string, messageId: string, readBy: any) => {
        setMessages(prev => ({
            ...prev,
            [chatId]: prev[chatId]?.map(msg =>
                msg.id === messageId
                    ? { ...msg, readBy: [...(msg.readBy || []), readBy] }
                    : msg
            ) || []
        }));
    }, []);

    const value: ChatContextType = {
        isConnected,
        conversations,
        activeChat,
        messages,
        typingUsers,
        onlineUsers,
        participantsStatus,
        setActiveChat,
        sendMessage,
        markMessagesAsRead,
        startTyping,
        stopTyping,
        createGroupChat,
        deleteChat,
        initializeEncryption,
        refreshConversations,
        refreshMessages,
        joinChat,
        leaveChat,
        markMessageRead,
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
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

export const useEnhancedChat = useChat;
export const EnhancedChatProvider = ChatProvider;