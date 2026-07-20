'use client';

import { useCallback, useEffect } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useChat } from '@/context/ChatContext';
import {
    useGetUserChatsQuery,
    useSendMessageMutation,
    useMarkMessagesAsReadMutation,
    useCreateGroupChatMutation,
    useJoinGroupChatMutation,
    useDeleteChatMutation,
} from '@/states/chatSlice';
import { toast } from '@/hooks/use-toast';
import { parseMessageContent } from '@/utils/messageUtils';
import { createOrGetPreferredDmChat } from '@/services/secureChatService';
import type {
    Chat,
    Message,
    Conversation,
    CreateGroupChatData,
} from '@/types/chat.types';

interface UseChatOperationsReturn {
    conversations: Conversation[]
    activeChat: string | null
    messages: Message[]
    isLoading: boolean
    isConnected: boolean
    typingUsers: any[]
    onlineUsers: any[]
    setActiveChat: (chatId: string | null) => void
    handleStartNewChat: (contact: any) => Promise<void>
    handleJoinGroup: (group: any) => Promise<void>
    handleCreateGroupChat: (data: CreateGroupChatData) => Promise<void>
    handleDeleteChat: (chatId: string) => Promise<void>
    handleMarkAsRead: (chatId: string) => Promise<void>
    refreshConversations: () => void
    upsertConversation: (conversation: Conversation) => void
}

const getDirectConversationOtherUserId = (conversation: Conversation, currentUserId?: string | null) => {
    if (conversation.isGroup || conversation.type === 'support') {
        return null
    }

    return conversation.participants?.find((participant: any) => participant.userId !== currentUserId)?.userId || null
}

const preferSecureDirectConversations = (
    conversations: Conversation[],
    currentUserId?: string | null,
) => {
    const keptByDirectKey = new Map<string, Conversation>()

    for (const conversation of conversations) {
        const otherUserId = getDirectConversationOtherUserId(conversation, currentUserId)
        if (!otherUserId) {
            continue
        }

        const mapKey = `dm:${otherUserId}`
        const existing = keptByDirectKey.get(mapKey)

        if (!existing) {
            keptByDirectKey.set(mapKey, conversation)
            continue
        }

        const existingIsSecure = existing.securityMode === 'secure_dm_v1'
        const currentIsSecure = conversation.securityMode === 'secure_dm_v1'

        if (currentIsSecure && !existingIsSecure) {
            keptByDirectKey.set(mapKey, conversation)
            continue
        }

        if (currentIsSecure === existingIsSecure) {
            const existingTimestamp = new Date(existing.lastMessage?.createdAt || existing.timestamp || 0).getTime()
            const currentTimestamp = new Date(conversation.lastMessage?.createdAt || conversation.timestamp || 0).getTime()

            if (currentTimestamp > existingTimestamp) {
                keptByDirectKey.set(mapKey, conversation)
            }
        }
    }

    const seen = new Set<string>()

    return conversations.filter((conversation) => {
        const otherUserId = getDirectConversationOtherUserId(conversation, currentUserId)
        if (!otherUserId) {
            return true
        }

        const mapKey = `dm:${otherUserId}`
        const preferred = keptByDirectKey.get(mapKey)
        if (!preferred || preferred.id !== conversation.id || seen.has(mapKey)) {
            return false
        }

        seen.add(mapKey)
        return true
    })
}

const getPreferredDirectConversationMap = (
    conversations: Conversation[],
    currentUserId?: string | null,
) => {
    const map = new Map<string, Conversation>()

    for (const conversation of preferSecureDirectConversations(conversations, currentUserId)) {
        const otherUserId = getDirectConversationOtherUserId(conversation, currentUserId)
        if (!otherUserId) {
            continue
        }

        map.set(otherUserId, conversation)
    }

    return map
}

export function useChatOperations(): UseChatOperationsReturn {
    const { getToken, getUserId } = useAuthToken(true);
    const token = getToken();
    const userId = getUserId();

    const {
        activeChat: contextActiveChat,
        setActiveChat: setContextActiveChat,
        messages: contextMessages,
        typingUsers,
        onlineUsers,
        isConnected,
        conversations: enhancedConversations,
        refreshConversations: contextRefreshConversations,
        initializeEncryption,
        upsertConversation,
    } = useChat();

    const {
        data: chatsData,
        error: chatsError,
        isLoading: chatsLoading,
        refetch: refetchChats,
    } = useGetUserChatsQuery(undefined, {
        skip: !token,
    });

    const [sendMessage, { isLoading: isSendingMessage }] =
        useSendMessageMutation();
    const [markAsRead] = useMarkMessagesAsReadMutation();
    const [createGroupChat, { isLoading: isCreatingGroup }] =
        useCreateGroupChatMutation();
    const [joinGroupChat, { isLoading: isJoiningGroup }] =
        useJoinGroupChatMutation();
    const [deleteChat] = useDeleteChatMutation();

    const activeChat = contextActiveChat;

    useEffect(() => {
        if (isConnected && initializeEncryption) {
            initializeEncryption();
        }
    }, [isConnected, initializeEncryption]);

    useEffect(() => {
        if (chatsError) {
            toast({
                title: 'Error loading chats',
                description: 'Failed to load your conversations. Please try again.',
                variant: 'destructive',
            });
        }
    }, [chatsError]);
    const rawConversations: Conversation[] = enhancedConversations?.length
        ? enhancedConversations.map((conv: any) => ({
            id: conv.id,
            name: conv.name,
            isGroup: conv.isGroup,
            type: conv.type,
            securityMode: conv.securityMode,
            protocolVersion: conv.protocolVersion,
            groupId: conv.groupId, // Include groupId
            lastMessage: conv.lastMessage?.content ? {
                content: parseMessageContent(conv.lastMessage.content, conv.lastMessage.messageType),
                messageType: conv.lastMessage.messageType,
                createdAt: conv.lastMessage.createdAt,
                sender: conv.lastMessage.sender
            } : null,
            timestamp: conv.lastMessage?.createdAt
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString()
                : "",
            unreadCount: conv.unreadCount || 0,
            avatar: conv.avatar || "/placeholder.svg?height=40&width=40",
            isOnline: conv.isOnline,
            memberCount: conv.memberCount,
            email: conv.isGroup ? undefined : conv.participants?.find((p: any) => p.userId !== userId)?.user?.email,
            phone: conv.isGroup ? undefined : conv.participants?.find((p: any) => p.userId !== userId)?.user?.phone,
            participants: conv.participants
        }))
        : chatsData?.data?.map((chat: Chat) => ({
            id: chat.id,
            name: chat.name,
            isGroup: chat.isGroup,
            type: chat.type,
            securityMode: chat.securityMode,
            protocolVersion: chat.protocolVersion,
            groupId: chat.groupId, // Include groupId
            lastMessage: chat.lastMessage ? {
                content: parseMessageContent(chat.lastMessage.content, chat.lastMessage.messageType),
                messageType: chat.lastMessage.messageType,
                createdAt: chat.lastMessage.createdAt,
                sender: chat.lastMessage.sender
            } : null,
            timestamp: chat.lastMessage?.createdAt
                ? new Date(chat.lastMessage.createdAt).toLocaleTimeString()
                : "",
            unreadCount: chat.unreadCount || 0,
            avatar: chat.avatar || "/placeholder.svg?height=40&width=40",
            isOnline: chat.isOnline,
            memberCount: chat.memberCount,
            email: chat.isGroup ? undefined : chat.participants.find(p => p.userId !== userId)?.user.email,
            phone: chat.isGroup ? undefined : chat.participants.find(p => p.userId !== userId)?.user.phone,
            participants: chat.participants
        })) || []

    const conversations: Conversation[] = preferSecureDirectConversations(rawConversations, userId)

    useEffect(() => {
        if (!contextActiveChat || !rawConversations.length) {
            return
        }

        const activeConversation = rawConversations.find((conversation) => conversation.id === contextActiveChat)
        if (!activeConversation) {
            return
        }

        const otherUserId = getDirectConversationOtherUserId(activeConversation, userId)
        if (!otherUserId) {
            return
        }

        const preferredMap = getPreferredDirectConversationMap(rawConversations, userId)
        const preferredConversation = preferredMap.get(otherUserId)

        if (
            preferredConversation &&
            preferredConversation.id !== contextActiveChat &&
            preferredConversation.securityMode === 'secure_dm_v1'
        ) {
            setContextActiveChat(preferredConversation.id)
        }
    }, [contextActiveChat, rawConversations, userId, setContextActiveChat])

    const messages: Message[] = activeChat ? (contextMessages[activeChat] || []) : []

    const handleStartNewChat = useCallback(async (contact: any) => {
        try {
            if (!token) {
                throw new Error("Authentication required");
            }

            const result = await createOrGetPreferredDmChat({
                token,
                participantId: contact.otherUser.id,
            });

            upsertConversation({
                id: result.chatId,
                name: `${contact.otherUser.firstName} ${contact.otherUser.lastName}`.trim() || 'Unknown Contact',
                isGroup: false,
                type: 'dm',
                securityMode: 'secure_dm_v1',
                protocolVersion: result.protocolVersion,
                lastMessage: null,
                timestamp: '',
                unreadCount: 0,
                avatar: contact.otherUser.profileImage || "/placeholder.svg?height=40&width=40",
                isOnline: false,
                participants: [
                    {
                        userId: userId || '',
                        role: 'member',
                    } as any,
                    {
                        userId: contact.otherUser.id,
                        role: 'member',
                        user: {
                            id: contact.otherUser.id,
                            email: contact.otherUser.email,
                            phone: contact.otherUser.phone,
                        },
                    } as any,
                ],
            })
            setContextActiveChat(result.chatId)

            toast({
                title: "Secure Chat Started",
                description: `Started a secure conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            })

            contextRefreshConversations?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || error?.message || "Failed to start chat",
                variant: "destructive"
            })
        }
    }, [token, setContextActiveChat, contextRefreshConversations, upsertConversation, userId])

    const handleJoinGroup = useCallback(async (group: any) => {
        try {
            const result = await joinGroupChat({
                groupId: group.id
            }).unwrap()

            setContextActiveChat(result.data.chatId)
            contextRefreshConversations?.()

            toast({
                title: "Group Chat Opened",
                description: `Welcome to ${group.name}! Your chat is ready.`,
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.data?.message || "Failed to join group chat",
                variant: "destructive"
            })
        }
    }, [joinGroupChat, setContextActiveChat, contextRefreshConversations])

    const handleCreateGroupChat = useCallback(async (data: CreateGroupChatData) => {
        try {
            const result = await createGroupChat(data).unwrap()

            toast({
                title: "Group Created",
                description: "Your group chat has been created successfully",
            })

            contextRefreshConversations?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.data?.message || "Failed to create group chat",
                variant: "destructive"
            })
        }
    }, [createGroupChat, contextRefreshConversations])

    const handleDeleteChat = useCallback(async (chatId: string) => {
        try {
            await deleteChat({ chatId }).unwrap()

            toast({
                title: "Chat Deleted",
                description: "The chat has been deleted successfully",
            })

            if (activeChat === chatId) {
                setContextActiveChat(null)
            }


            contextRefreshConversations?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.data?.message || "Failed to delete chat",
                variant: "destructive"
            })
        }
    }, [deleteChat, activeChat, setContextActiveChat, contextRefreshConversations])

    const handleMarkAsRead = useCallback(async (chatId: string) => {
        try {
            await markAsRead({ chatId }).unwrap()
        } catch (error: any) {
            console.error("Failed to mark messages as read:", error)
        }
    }, [markAsRead])

    const refreshConversations = useCallback(() => {
        contextRefreshConversations?.()
        refetchChats()
    }, [contextRefreshConversations, refetchChats])

    return {
        conversations,
        activeChat,
        messages,
        isLoading: chatsLoading || isSendingMessage || isCreatingGroup || isJoiningGroup,
        isConnected,
        typingUsers,
        onlineUsers,
        setActiveChat: setContextActiveChat,
        handleStartNewChat,
        handleJoinGroup,
        handleCreateGroupChat,
        handleDeleteChat,
        handleMarkAsRead,
        refreshConversations,
        upsertConversation,
    }
}
