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

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const { getToken, getUserId } = useAuthToken();
    
    // State management
    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [participantsStatus, setParticipantsStatus] = useState<Record<string, ChatParticipantStatus[]>>({});
    
    // Connect to socket when user is authenticated
    useEffect(() => {
        const userId = getUserId();
        const token = getToken();
        
        if (userId && token) {
            const socket = socketService.connect(userId, token);
            
            const handleConnect = () => {
                console.log('Chat: Connected to socket successfully');
                setIsConnected(true);
                // Initialize encryption for the user
                socketService.initializeEncryption();
                // Get online users
                socketService.getOnlineUsers();
            };
            
            const handleDisconnect = () => {
                console.log('Chat: Disconnected from socket');
                setIsConnected(false);
            };
            
            const handleConnectError = (error: any) => {
                console.error('Chat: Connection error:', error);
                setIsConnected(false);
            };
            
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
    }, []); // Remove dependencies to prevent reconnections
    
    // Set up real-time event listeners
    useEffect(() => {
        if (!isConnected) return;
        
        const userId = getUserId();
        
        // Message events
        const handleNewMessage = (message: Message) => {
            console.log('New message received:', message);
            
            // Add isMe flag
            const enhancedMessage = {
                ...message,
                isMe: message.sender.id === userId
            };
            
            setMessages(prev => ({
                ...prev,
                [message.chatId]: [...(prev[message.chatId] || []), enhancedMessage]
            }));
            
            // Update conversation with latest message
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
            
            // Show notification if not active chat
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
        
        // Typing events
        const handleUserTyping = (data: TypingUser) => {
            if (data.userId === userId) return; // Don't show own typing
            
            setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== data.userId || u.chatId !== data.chatId);
                return data.isTyping 
                    ? [...filtered, data]
                    : filtered;
            });
        };
        
        // Online status events
        const handleOnlineUsers = (users: OnlineUser[]) => {
            setOnlineUsers(users);
            
            // Update conversations with online status
            setConversations(prev => prev.map(conv => {
                const onlineCount = users.filter(u => conv.participants.some(p => p.userId === u.userId)).length;
                return {
                    ...conv,
                    isOnline: conv.isGroup 
                        ? onlineCount > 0
                        : users.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId)),
                    online: conv.isGroup ? onlineCount : (users.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId)) ? 1 : 0)
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
                
                // Update conversations with new online status
                setConversations(convs => convs.map(conv => {
                    const onlineCount = updatedUsers.filter(u => conv.participants.some(p => p.userId === u.userId)).length;
                    return {
                        ...conv,
                        isOnline: conv.isGroup 
                            ? onlineCount > 0
                            : updatedUsers.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId)),
                        online: conv.isGroup ? onlineCount : (updatedUsers.some(u => conv.participants.some(p => p.userId === u.userId && p.userId !== userId)) ? 1 : 0)
                    };
                }));
                
                return updatedUsers;
            });
        };
        
        // Chat management events
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
        
        const handleNewGroupChat = (data: any) => {
            toast({
                title: "New Group Chat",
                description: "You've been added to a new group chat",
                duration: 3000,
            });
            refreshConversations();
        };
        
        const handleGroupChatCreated = (data: { chatId: string; participants: string[] }) => {
            console.log('Group chat created:', data);
            toast({
                title: "Group Chat Created",
                description: "Your group chat has been created successfully",
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
        
        const handleEncryptionInitialized = (data: { userId: string; publicKey: string; initialized: boolean }) => {
            console.log('Encryption initialized for user:', data.userId);
        };
        
        const handleJoinedChat = (data: { chatId: string }) => {
            console.log('Joined chat:', data.chatId);
            // Get participants status when joining a chat
            socketService.getChatParticipantsStatus(data.chatId);
        };
        
        const handleError = (error: { message: string }) => {
            console.error('Socket error:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
                duration: 5000,
            });
        };
        
        // Register event listeners
        socketService.onNewMessage(handleNewMessage);
        socketService.onMessageDelivered(handleMessageDelivered);
        socketService.onMessagesRead(handleMessagesRead);
        socketService.onUserTyping(handleUserTyping);
        socketService.onOnlineUsers(handleOnlineUsers);
        socketService.onUserStatusChanged(handleUserStatusChanged);
        socketService.onChatDeleted(handleChatDeleted);
        socketService.onNewGroupChat(handleNewGroupChat);
        socketService.onGroupChatCreated(handleGroupChatCreated);
        socketService.onChatParticipantsStatus(handleChatParticipantsStatus);
        socketService.onEncryptionInitialized(handleEncryptionInitialized);
        socketService.onJoinedChat(handleJoinedChat);
        socketService.onError(handleError);
        
        return () => {
            // Cleanup event listeners
            socketService.offNewMessage(handleNewMessage);
            socketService.offMessageDelivered(handleMessageDelivered);
            socketService.offMessagesRead(handleMessagesRead);
            socketService.offUserTyping(handleUserTyping);
            socketService.offOnlineUsers(handleOnlineUsers);
            socketService.offUserStatusChanged(handleUserStatusChanged);
            socketService.offChatDeleted(handleChatDeleted);
            socketService.offNewGroupChat(handleNewGroupChat);
            socketService.offGroupChatCreated(handleGroupChatCreated);
            socketService.offChatParticipantsStatus(handleChatParticipantsStatus);
            socketService.offEncryptionInitialized(handleEncryptionInitialized);
            socketService.offJoinedChat(handleJoinedChat);
            socketService.offError(handleError);
        };
    }, [isConnected, activeChat, getUserId]);
    
    // Join/leave chat when active chat changes
    useEffect(() => {
        if (activeChat && isConnected) {
            socketService.joinChat(activeChat);
            // Mark messages as read when joining
            socketService.markMessageRead(activeChat, '');
            
            return () => {
                if (activeChat) {
                    socketService.leaveChat(activeChat);
                }
            };
        }
    }, [activeChat, isConnected]);
    
    // Load conversations on mount
    const refreshConversations = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setConversations(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }, [getToken]);
    
    // Load messages for a specific chat
    const refreshMessages = useCallback(async (chatId: string) => {
        const token = getToken();
        const userId = getUserId();
        if (!token) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats/${chatId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const messagesWithIsMe = (data.data?.messages || []).map((msg: Message) => ({
                    ...msg,
                    isMe: msg.sender.id === userId
                }));
                
                setMessages(prev => ({
                    ...prev,
                    [chatId]: messagesWithIsMe
                }));
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }, [getToken, getUserId]);
    
    // Load messages when active chat changes
    useEffect(() => {
        if (activeChat && isConnected) {
            refreshMessages(activeChat);
        }
    }, [activeChat, isConnected, refreshMessages]);
    
    // Load initial data
    useEffect(() => {
        const userId = getUserId();
        const token = getToken();
        
        if (userId && token) {
            refreshConversations();
            // If there's an active chat, load its messages
            if (activeChat) {
                refreshMessages(activeChat);
            }
        }
    }, [getUserId, getToken, refreshConversations, activeChat, refreshMessages]);
    
    // Actions
    const sendMessage = useCallback((chatId: string, content: string, messageType: "text" | "image" | "file" | "money" = "text") => {
        if (isConnected && content.trim()) {
            socketService.sendMessage(chatId, content.trim(), messageType);
            
            // Optimistically add message to UI
            const userId = getUserId();
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
    }, [isConnected, getUserId]);
    
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
    
    // Legacy methods for backward compatibility
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
        // Legacy methods
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

// Export for backward compatibility
export const useEnhancedChat = useChat;
export const EnhancedChatProvider = ChatProvider;