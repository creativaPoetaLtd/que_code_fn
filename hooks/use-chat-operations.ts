'use client';

import { useState, useCallback, useEffect } from 'react';
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

    const [activeChat, setActiveChat] = useState<string | null>(
        contextActiveChat
    );

    useEffect(() => {
        setActiveChat(contextActiveChat);
    }, [contextActiveChat]);

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
    const conversations: Conversation[] = enhancedConversations?.length
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

            setContextActiveChat(result.chatId)

            toast({
                title: result.usedSecure ? "Secure Chat Started" : "Chat Started",
                description: result.usedSecure
                    ? `Started a secure conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}`
                    : `Started a new conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
            })

            contextRefreshConversations?.()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || error?.message || "Failed to start chat",
                variant: "destructive"
            })
        }
    }, [token, setContextActiveChat, contextRefreshConversations])

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
        refreshConversations
    }
}
