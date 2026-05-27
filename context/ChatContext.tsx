"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { socketService } from "@/services/socketService";
import { useAuthToken } from "@/hooks/use-auth-token";
import { useGetUserChatsQuery, useGetChatMessagesQuery } from "@/states/chatSlice";
import {
    Conversation,
    Message,
    ReplyPreview,
    TypingUser,
    OnlineUser,
    ChatParticipantStatus,
    Participant,
    ReactionRow,
} from "@/types/chat.types";
import { toast } from "@/hooks/use-toast";
import { notificationService } from "@/services/notificationService";
import {
    fetchSecureChatMessages,
    markSecureChatAsRead,
    sendSecureTextMessage,
} from "@/services/secureChatService";

interface ChatContextType {
    isConnected: boolean;
    conversations: Conversation[];
    activeChat: string | null;
    messages: Record<string, Message[]>;
    typingUsers: TypingUser[];
    onlineUsers: OnlineUser[];
    participantsStatus: Record<string, ChatParticipantStatus[]>;
    setActiveChat: (chatId: string | null) => void;
    sendMessage: (
        chatId: string,
        content: string,
        messageType?: "text" | "image" | "file" | "money",
        mentions?: Array<{ userId: string; username: string }>,
        replyToMessageId?: string,
        replyTo?: ReplyPreview | null
    ) => void;
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
    clearChatState: () => void;
    addReaction: (chatId: string, messageId: string, emoji: string) => void;
    removeReaction: (chatId: string, messageId: string) => void;
    upsertConversation: (conversation: Conversation) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
    const { getToken, getUserId } = useAuthToken();
    // Use state to track token and userId changes dynamically
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [participantsStatus, setParticipantsStatus] = useState<Record<string, ChatParticipantStatus[]>>({});
    const [secureMessagesRefreshKey, setSecureMessagesRefreshKey] = useState(0);

    const activeConversation = activeChat
        ? conversations.find((conversation) => conversation.id === activeChat) || null
        : null;
    const isActiveSecureChat = activeConversation?.securityMode === "secure_dm_v1";

    const isSupportConversation = useCallback((conv: Conversation) => {
        if ((conv as any).type === 'support') return true;
        // Fallback for old payloads that do not include `type` yet.
        return !conv.isGroup && (conv.name || '').toLowerCase().includes('support');
    }, []);

    const sortConversations = useCallback((a: Conversation, b: Conversation) => {
        const aSupport = isSupportConversation(a);
        const bSupport = isSupportConversation(b);

        // Pin support/admin chats to the top.
        if (aSupport !== bSupport) return aSupport ? -1 : 1;

        const aTime = a.lastMessage?.createdAt || a.timestamp || '0';
        const bTime = b.lastMessage?.createdAt || b.timestamp || '0';
        return new Date(bTime).getTime() - new Date(aTime).getTime();
    }, [isSupportConversation]);

    // Monitor token and userId changes
    useEffect(() => {
        const currentToken = getToken();
        const currentUserId = getUserId();
        
        // If userId changes (different user logged in), clear all state
        if (userId && currentUserId && userId !== currentUserId) {
            console.log('Different user detected, clearing chat state');
            setConversations([]);
            setActiveChat(null);
            setMessages({});
            setTypingUsers([]);
            setOnlineUsers([]);
            setParticipantsStatus({});
            socketService.forceDisconnect();
        }
        
        setToken(currentToken);
        setUserId(currentUserId);
        
        // Update notification service with current user
        notificationService.setUserId(currentUserId);

        // Listen for token changes via custom event
        const handleAuthTokenChange = (event: CustomEvent) => {
            const newToken = getToken();
            const newUserId = getUserId();
            
            // If user changed, clear state
            if (userId && newUserId && userId !== newUserId) {
                console.log('User changed via token event, clearing chat state');
                setConversations([]);
                setActiveChat(null);
                setMessages({});
                setTypingUsers([]);
                setOnlineUsers([]);
                setParticipantsStatus({});
                socketService.forceDisconnect();
            }
            
            setToken(newToken);
            setUserId(newUserId);
        };

        window.addEventListener('authTokenChanged', handleAuthTokenChange as EventListener);

        return () => {
            window.removeEventListener('authTokenChanged', handleAuthTokenChange as EventListener);
        };
    }, [getToken, getUserId, userId]);

    const { data: chatsData, refetch: refetchChats } = useGetUserChatsQuery(undefined, {
        skip: !token
    });

    const { data: messagesData, refetch: refetchMessages } = useGetChatMessagesQuery(
        { chatId: activeChat || '', page: 1, limit: 50 },
        { skip: !activeChat || !token || isActiveSecureChat }
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
    }, [userId, token]); // Re-connect when userId or token changes

    useEffect(() => {
        if (!isConnected || !userId) return;

        const handleNewMessage = (message: Message) => {
            const enhancedMessage = { ...message, isMe: String(message.sender.id) === String(userId || "") };

            // Check if message already exists to prevent duplicates
            setMessages((prev: Record<string, Message[]>) => {
                const existingMessages = prev[message.chatId] || [];
                const messageExists = existingMessages.some((msg: Message) =>
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
                        [message.chatId]: existingMessages.map((msg: Message) =>
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

            // Update conversation with new message and unread count
            setConversations((prev: Conversation[]) => {
                const conversationExists = prev.some((conv: Conversation) => conv.id === message.chatId);

                if (!conversationExists) {
                    // Refresh conversations if chat not in list
                    refetchChats();
                    return prev;
                }

                const updatedConversations = prev.map((conv: Conversation) => {
                    if (conv.id !== message.chatId) return conv;

                    // Determine if we should increment unread count
                    const shouldIncrementUnread =
                        message.sender.id !== userId && // Not my own message
                        conv.id !== activeChat; // Not the currently active chat

                    return {
                        ...conv, // Preserve all fields including groupId
                        lastMessage: {
                            content: message.content,
                            messageType: message.messageType,
                            createdAt: message.createdAt,
                            sender: typeof message.sender === 'string' ? message.sender : message.sender.name
                        },
                        timestamp: message.createdAt,
                        unreadCount: shouldIncrementUnread
                            ? (conv.unreadCount || 0) + 1
                            : (conv.unreadCount || 0)
                    };
                });

                // Sort by pinned support first, then most recent message
                return updatedConversations.sort(sortConversations);
            });

            // Send notification using centralized service
            notificationService.notifyNewMessage({
                chatId: message.chatId,
                senderId: message.sender.id,
                senderName: message.sender.lastName || message.sender.name,
                content: message.content,
                messageType: message.messageType as any,
            });
        };

        const handleSecureMessageAvailable = (data: {
            chatId: string;
            messageId: string;
            senderId: string;
            sender: { id: string; name: string; firstName?: string; lastName?: string };
            messageType: "text";
            securityMode: "secure_dm_v1";
            createdAt: string;
        }) => {
            const conversation = conversations.find((item) => item.id === data.chatId);
            if (!conversation || conversation.securityMode !== "secure_dm_v1") {
                refetchChats();
                return;
            }

            if (data.senderId === userId) {
                if (data.chatId === activeChat) {
                    setSecureMessagesRefreshKey((current) => current + 1);
                }
                refetchChats();
                return;
            }

            if (data.chatId === activeChat) {
                setSecureMessagesRefreshKey((current) => current + 1);
            }

            setConversations((prev: Conversation[]) => {
                const updatedConversations = prev.map((conv: Conversation) => {
                    if (conv.id !== data.chatId) return conv;

                    const shouldIncrementUnread =
                        data.senderId !== userId &&
                        conv.id !== activeChat;

                    return {
                        ...conv,
                        lastMessage: {
                            content: "Secure message",
                            messageType: "text" as const,
                            createdAt: data.createdAt,
                            sender: data.sender.name,
                        },
                        timestamp: data.createdAt,
                        unreadCount: shouldIncrementUnread
                            ? (conv.unreadCount || 0) + 1
                            : (conv.unreadCount || 0),
                    };
                });

                return updatedConversations.sort(sortConversations);
            });

            if (data.senderId !== userId) {
                notificationService.notifyNewMessage({
                    chatId: data.chatId,
                    senderId: data.senderId,
                    senderName: data.sender.lastName || data.sender.name,
                    content: "Secure message",
                    messageType: "text" as const,
                });
            }

            refetchChats();
        };

        const handleMessageDelivered = (data: { chatId: string; messageId: string; deliveredAt: Date }) => {
            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [data.chatId]: prev[data.chatId]?.map((msg: Message) =>
                    msg.id === data.messageId
                        ? { ...msg, status: 'delivered', deliveredAt: data.deliveredAt }
                        : msg
                ) || []
            }));
        };

        const handleMessagesRead = (data: { chatId: string; readBy: string; readAt: Date }) => {
            // Update message statuses
            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [data.chatId]: prev[data.chatId]?.map((msg: Message) =>
                    msg.status === 'delivered' && msg.sender.id !== userId
                        ? { ...msg, status: 'read', readAt: data.readAt }
                        : msg
                ) || []
            }));

            // Reset unread count ONLY if the current user is the one who read the messages
            // This means: if I read messages in a chat, MY unread count for that chat goes to 0
            if (data.readBy === userId) {
                setConversations((prev: Conversation[]) => prev.map((conv: Conversation) =>
                    conv.id === data.chatId
                        ? { ...conv, unreadCount: 0 } // ...conv already preserves all fields
                        : conv
                ));
            }
        };

        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === userId) return;

            setTypingUsers((prev: TypingUser[]) => {
                const filtered = prev.filter((u: TypingUser) => u.userId !== data.userId || u.chatId !== data.chatId);
                return data.isTyping ? [...filtered, data] : filtered;
            });
        };

        const handleOnlineUsers = (users: OnlineUser[]) => {
            setOnlineUsers(users);

            setConversations((prev: Conversation[]) => prev.map((conv: Conversation) => {
                const onlineCount = users.filter((u: OnlineUser) => conv.participants.some((p: Participant) => p.userId === u.userId)).length;
                return {
                    ...conv, // Preserve all fields including groupId
                    isOnline: conv.isGroup
                        ? onlineCount > 0
                        : users.some((u: OnlineUser) => conv.participants.some((p: Participant) => p.userId === u.userId && p.userId !== userId))
                };
            }));
        };

        const handleUserStatusChanged = (data: { userId: string; isOnline: boolean; lastSeen?: Date }) => {
            setOnlineUsers((prev: OnlineUser[]) => {
                const updatedUsers = data.isOnline
                    ? [...prev.filter((u: OnlineUser) => u.userId !== data.userId), {
                        userId: data.userId,
                        socketId: '',
                        lastSeen: data.lastSeen || new Date()
                    }]
                    : prev.filter((u: OnlineUser) => u.userId !== data.userId);

                setConversations((convs: Conversation[]) => convs.map((conv: Conversation) => {
                    const onlineCount = updatedUsers.filter((u: OnlineUser) => conv.participants.some((p: Participant) => p.userId === u.userId)).length;
                    return {
                        ...conv, // Preserve all fields including groupId
                        isOnline: conv.isGroup
                            ? onlineCount > 0
                            : updatedUsers.some((u: OnlineUser) => conv.participants.some((p: Participant) => p.userId === u.userId && p.userId !== userId))
                    };
                }));

                return updatedUsers;
            });
        };

        const handleChatDeleted = (data: { chatId: string; deletedBy: string }) => {
            setConversations((prev: Conversation[]) => prev.filter((conv: Conversation) => conv.id !== data.chatId));
            setMessages((prev: Record<string, Message[]>) => {
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
            setParticipantsStatus((prev: Record<string, ChatParticipantStatus[]>) => ({
                ...prev,
                [data.chatId]: data.participants
            }));
        };

        const handleJoinedChat = (data: { chatId: string }) => {
            socketService.getChatParticipantsStatus(data.chatId);
        };

        const handleError = (error: { message: string }) => {
            if (
                activeChat &&
                error.message?.includes("requires secure messaging")
            ) {
                setConversations((prev: Conversation[]) =>
                    prev.map((conversation: Conversation) =>
                        conversation.id === activeChat
                            ? {
                                ...conversation,
                                securityMode: "secure_dm_v1" as const,
                                protocolVersion: conversation.protocolVersion || "secure-dm-v1",
                            }
                            : conversation,
                    ).sort(sortConversations),
                );
                setSecureMessagesRefreshKey((current) => current + 1);
                refetchChats();
                toast({
                    title: "Secure chat ready",
                    description: "This thread is secure. Send the message again using the secure flow.",
                    duration: 5000,
                });
                return;
            }

            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
                duration: 5000,
            });
        };

        const handleMoneyReceived = (data: { amount: number; from: string; transactionId: string; chatId: string }) => {
            // Send notification using centralized service
            notificationService.notifyMoneyReceived({
                amount: data.amount,
                from: data.from,
                chatId: data.chatId,
            });

            if (data.chatId === activeChat) {
                refetchMessages();
            }
        };

        const handlePaymentRequestUpdated = (data: {
            requestId: string;
            status: "paid" | "cancelled";
            transactionId?: string;
            chatId?: string | null;
        }) => {
            // Update every message across all chats that references this requestId
            setMessages(prev => {
                const updated = { ...prev };
                for (const chatId of Object.keys(updated)) {
                    updated[chatId] = updated[chatId].map(msg => {
                        if (msg.messageType !== "money") return msg;
                        try {
                            const parsed = JSON.parse(msg.content);
                            if (parsed?.type === "money_request" && parsed.requestId === data.requestId) {
                                return {
                                    ...msg,
                                    content: JSON.stringify({ ...parsed, status: data.status }),
                                };
                            }
                        } catch {
                            // not JSON, skip
                        }
                        return msg;
                    });
                }
                return updated;
            });
        };

        const handleReactionUpdated = (data: {
            chatId: string;
            messageId: string;
            reactions: ReactionRow[];
        }) => {
            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [data.chatId]: (prev[data.chatId] || []).map((msg: Message) =>
                    msg.id === data.messageId
                        ? { ...msg, reactions: data.reactions }
                        : msg
                ),
            }));
        };

        socketService.onNewMessage(handleNewMessage);
        socketService.onSecureMessageAvailable(handleSecureMessageAvailable);
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
        socketService.onPaymentRequestUpdated(handlePaymentRequestUpdated);
        socketService.onReactionUpdated(handleReactionUpdated);

        return () => {
            socketService.offNewMessage(handleNewMessage);
            socketService.offSecureMessageAvailable(handleSecureMessageAvailable);
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
            socketService.offPaymentRequestUpdated(handlePaymentRequestUpdated);
            socketService.offReactionUpdated(handleReactionUpdated);
        };
    }, [isConnected, activeChat, userId, refetchMessages, sortConversations, conversations, token, refetchChats]);

    useEffect(() => {
        if (!activeChat) return;

        notificationService.setActiveChat(activeChat);

        setConversations((prev: Conversation[]) => prev.map((conv: Conversation) =>
            conv.id === activeChat
                ? { ...conv, unreadCount: 0 }
                : conv
        ));

        if (isActiveSecureChat) {
            if (token && userId) {
                void markSecureChatAsRead({ token, userId, chatId: activeChat }).catch((error) => {
                    console.error("Failed to mark secure chat as read", error);
                });
            }

            return () => {
                notificationService.setActiveChat(null);
            };
        }

        if (isConnected) {
            socketService.joinChat(activeChat);
            socketService.markMessageRead(activeChat, '');

            return () => {
                if (activeChat) {
                    socketService.leaveChat(activeChat);
                    notificationService.setActiveChat(null);
                }
            };
        }

        return () => {
            notificationService.setActiveChat(null);
        };
    }, [activeChat, isConnected, isActiveSecureChat, token, userId]);

    useEffect(() => {
        if (chatsData?.data) {
            // Sort conversations by pinned support first, then most recent message
            const sortedConversations = [...chatsData.data].sort(sortConversations);
            setConversations(sortedConversations);
        }
    }, [chatsData, sortConversations]);

    useEffect(() => {
        if (isActiveSecureChat) {
            return;
        }

        if (messagesData?.data?.messages && activeChat) {
            const messagesWithIsMe = messagesData.data.messages.map((msg: Message) => ({
                ...msg,
                isMe: String(msg.sender.id) === String(userId || "")
            }));

            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [activeChat]: messagesWithIsMe
            }));
        }
    }, [messagesData, activeChat, userId, isActiveSecureChat]);

    useEffect(() => {
        if (!activeChat || !token || !userId || !isActiveSecureChat) {
            return;
        }

        let cancelled = false;

        const loadSecureMessages = async () => {
            try {
                const secureMessages = await fetchSecureChatMessages({
                    token,
                    userId,
                    chatId: activeChat,
                });

                if (cancelled) return;

                setMessages((prev: Record<string, Message[]>) => ({
                    ...prev,
                    [activeChat]: secureMessages.map((message) => ({
                        ...message,
                        isMe: String(message.sender.id) === String(userId),
                    })),
                }));

                await markSecureChatAsRead({ token, userId, chatId: activeChat });
            } catch (error) {
                console.error("Failed to load secure chat messages", error);
            }
        };

        void loadSecureMessages();
        const interval = window.setInterval(() => {
            void loadSecureMessages();
        }, 5000);

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [activeChat, token, userId, isActiveSecureChat, secureMessagesRefreshKey]);

    useEffect(() => {
        if (!token || !userId) {
            return;
        }

        const hasSecureConversations = conversations.some(
            (conversation) => conversation.securityMode === "secure_dm_v1",
        );

        if (!hasSecureConversations) {
            return;
        }

        const interval = window.setInterval(() => {
            refetchChats();
        }, 10000);

        return () => {
            window.clearInterval(interval);
        };
    }, [token, userId, conversations, refetchChats]);

    const refreshConversations = useCallback(() => {
        refetchChats();
    }, [refetchChats]);

    const upsertConversation = useCallback((conversation: Conversation) => {
        setConversations((prev: Conversation[]) => {
            const existingIndex = prev.findIndex((item) => item.id === conversation.id);

            if (existingIndex === -1) {
                return [conversation, ...prev].sort(sortConversations);
            }

            const next = [...prev];
            next[existingIndex] = {
                ...next[existingIndex],
                ...conversation,
            };

            return next.sort(sortConversations);
        });
    }, [sortConversations]);

    const refreshMessages = useCallback((chatId: string) => {
        if (chatId === activeChat) {
            if (activeConversation?.securityMode === "secure_dm_v1") {
                setSecureMessagesRefreshKey((current) => current + 1);
                return;
            }
            refetchMessages();
        }
    }, [activeChat, activeConversation?.securityMode, refetchMessages]);

    const sendMessage = useCallback((
        chatId: string,
        content: string,
        messageType: "text" | "image" | "file" | "money" = "text",
        mentions?: Array<{ userId: string; username: string }>,
        replyToMessageId?: string,
        replyTo?: ReplyPreview | null
    ) => {
        const trimmedContent = content.trim();
        if (!trimmedContent) {
            return;
        }

        const conversation = conversations.find((item) => item.id === chatId);
        if (conversation?.securityMode === "secure_dm_v1") {
            if (messageType !== "text") {
                toast({
                    title: "Not available yet",
                    description: "secure_dm_v1 currently supports text messages only.",
                    variant: "destructive",
                });
                return;
            }

            if (!token || !userId) {
                toast({
                    title: "Secure chat unavailable",
                    description: "Your session is not ready for secure messaging yet.",
                    variant: "destructive",
                });
                return;
            }

            const tempMessageId = `temp_secure_${Date.now()}`;
            const tempMessage: Message = {
                id: tempMessageId,
                chatId,
                content: trimmedContent,
                messageType: "text",
                replyToMessageId: replyToMessageId || null,
                replyTo: replyTo || null,
                reactions: [],
                status: 'sent',
                createdAt: new Date().toISOString(),
                sender: {
                    id: userId,
                    name: 'You',
                    avatar: undefined
                },
                isMe: true,
                mentions,
            };

            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [chatId]: [...(prev[chatId] || []), tempMessage]
            }));

            setConversations((prev: Conversation[]) => {
                const updatedConversations = prev.map((conv: Conversation) =>
                    conv.id === chatId
                        ? {
                            ...conv,
                            lastMessage: {
                                content: "Secure message",
                                messageType: "text" as const,
                                createdAt: tempMessage.createdAt,
                                sender: "You"
                            },
                            timestamp: tempMessage.createdAt
                        }
                        : conv
                );

                return updatedConversations.sort(sortConversations);
            });

            void (async () => {
                try {
                    await sendSecureTextMessage({
                        token,
                        userId,
                        chatId,
                        conversation,
                        content: trimmedContent,
                        replyToMessageId: replyToMessageId || undefined,
                    });
                    setSecureMessagesRefreshKey((current) => current + 1);
                    refetchChats();
                } catch (error: any) {
                    setMessages((prev: Record<string, Message[]>) => ({
                        ...prev,
                        [chatId]: (prev[chatId] || []).filter((message) => message.id !== tempMessageId)
                    }));
                    toast({
                        title: "Secure message failed",
                        description: error?.message || "Failed to send secure message",
                        variant: "destructive",
                    });
                }
            })();
            return;
        }

        if (isConnected) {
            socketService.sendMessage(chatId, trimmedContent, messageType, undefined, mentions, replyToMessageId);

            const tempMessage: Message = {
                id: `temp_${Date.now()}`,
                chatId,
                content: trimmedContent,
                messageType,
                replyToMessageId: replyToMessageId || null,
                replyTo: replyTo || null,
                reactions: [],
                status: 'sent',
                createdAt: new Date().toISOString(),
                sender: {
                    id: userId || '',
                    name: 'You',
                    avatar: undefined
                },
                isMe: true,
                mentions,
            };

            // Add message to messages state
            setMessages((prev: Record<string, Message[]>) => ({
                ...prev,
                [chatId]: [...(prev[chatId] || []), tempMessage]
            }));

            // Update conversation's lastMessage immediately
            setConversations((prev: Conversation[]) => {
                const updatedConversations = prev.map((conv: Conversation) =>
                    conv.id === chatId
                        ? {
                            ...conv, // Preserve all fields including groupId
                            lastMessage: {
                                content: trimmedContent,
                                messageType,
                                createdAt: new Date().toISOString(),
                                sender: 'You'
                            },
                            timestamp: new Date().toISOString()
                        }
                        : conv
                );

                // Sort by pinned support first, then most recent message
                return updatedConversations.sort(sortConversations);
            });
        }
    }, [isConnected, userId, token, conversations, sortConversations, refetchChats]);

    const markMessagesAsRead = useCallback((chatId: string) => {
        const conversation = conversations.find((item) => item.id === chatId);
        if (conversation?.securityMode === "secure_dm_v1") {
            if (token && userId) {
                void markSecureChatAsRead({ token, userId, chatId }).catch((error) => {
                    console.error("Failed to mark secure chat as read", error);
                });
            }
            return;
        }

        if (isConnected) {
            socketService.markMessageRead(chatId, '');
        }
    }, [conversations, isConnected, token, userId]);

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
        const conversation = conversations.find((item) => item.id === chatId);
        if (conversation?.securityMode === "secure_dm_v1") {
            if (token && userId) {
                void markSecureChatAsRead({ token, userId, chatId }).catch((error) => {
                    console.error("Failed to mark secure chat as read", error);
                });
            }
            return;
        }
        socketService.markMessageRead(chatId, messageId);
    }, [conversations, token, userId]);

    const addMessage = useCallback((message: Message) => {
        setMessages((prev: Record<string, Message[]>) => {
            const existingMessages = prev[message.chatId] || [];
            const messageExists = existingMessages.some((msg: Message) => msg.id === message.id);

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
        setMessages((prev: Record<string, Message[]>) => ({
            ...prev,
            [chatId]: prev[chatId]?.map((msg: Message) =>
                msg.id === messageId
                    ? { ...msg, readBy: [...(msg.readBy || []), readBy] }
                    : msg
            ) || []
        }));
    }, []);

    const addReaction = useCallback((chatId: string, messageId: string, emoji: string) => {
        const conversation = conversations.find((item) => item.id === chatId);
        if (conversation?.securityMode === "secure_dm_v1") {
            toast({
                title: "Secure reactions unavailable",
                description: "Plaintext reactions are disabled in secure chats.",
                variant: "destructive",
            });
            return;
        }

        if (isConnected) {
            socketService.addReaction(chatId, messageId, emoji);
        }
    }, [conversations, isConnected]);

    const removeReaction = useCallback((chatId: string, messageId: string) => {
        const conversation = conversations.find((item) => item.id === chatId);
        if (conversation?.securityMode === "secure_dm_v1") {
            toast({
                title: "Secure reactions unavailable",
                description: "Plaintext reactions are disabled in secure chats.",
                variant: "destructive",
            });
            return;
        }

        if (isConnected) {
            socketService.removeReaction(chatId, messageId);
        }
    }, [conversations, isConnected]);

    const clearChatState = useCallback(() => {
        // Disconnect socket properly
        socketService.disconnect();
        
        // Clear all state
        setConversations([]);
        setActiveChat(null);
        setMessages({});
        setTypingUsers([]);
        setOnlineUsers([]);
        setParticipantsStatus({});
        setIsConnected(false);
        setUserId(null);
        setToken(null);
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
        updateMessageReadStatus,
        clearChatState,
        addReaction,
        removeReaction,
        upsertConversation,
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
