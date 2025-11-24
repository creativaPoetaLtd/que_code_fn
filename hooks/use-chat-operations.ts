'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useChat } from '@/context/ChatContext';
import {
  useGetUserChatsQuery,
  useGetChatMessagesQuery,
  useCreateOrGetDMChatMutation,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useCreateGroupChatMutation,
  useJoinGroupChatMutation,
  useDeleteChatMutation,
} from '@/states/chatSlice';
import { toast } from '@/hooks/use-toast';
import type {
  Chat,
  Message,
  LegacyMessage,
  Conversation,
  CreateOrGetDMChatData,
  SendMessageData,
  CreateGroupChatData,
} from '@/types/chat.types';

interface UseChatOperationsReturn {
  conversations: Conversation[];
  activeChat: string | null;
  messages: LegacyMessage[];
  isLoading: boolean;
  isConnected: boolean;
  typingUsers: any[];
  onlineUsers: any[];
  setActiveChat: (chatId: string | null) => void;
  handleStartNewChat: (contact: any) => Promise<void>;
  handleJoinGroup: (group: any) => Promise<void>;
  handleCreateGroupChat: (data: CreateGroupChatData) => Promise<void>;
  handleDeleteChat: (chatId: string) => Promise<void>;
  handleMarkAsRead: (chatId: string) => Promise<void>;
  refreshConversations: () => void;
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

  const [createOrGetDMChat, { isLoading: isCreatingDMChat }] =
    useCreateOrGetDMChatMutation();
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
        lastMessage: conv.lastMessage?.content
          ? {
              content: conv.lastMessage.content,
              messageType: conv.lastMessage.messageType,
              createdAt: conv.lastMessage.createdAt,
              sender: conv.lastMessage.sender,
            }
          : null,
        timestamp: conv.lastMessage?.createdAt
          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString()
          : '',
        unreadCount: conv.unreadCount,
        avatar: conv.avatar || '/placeholder.svg?height=40&width=40',
        isOnline: conv.isOnline,
        memberCount: conv.memberCount,
        email: conv.isGroup
          ? undefined
          : conv.participants?.find((p: any) => p.userId !== userId)?.user
              ?.email,
        phone: conv.isGroup
          ? undefined
          : conv.participants?.find((p: any) => p.userId !== userId)?.user
              ?.phone,
        participants: conv.participants,
      }))
    : chatsData?.data?.map((chat: Chat) => ({
        id: chat.id,
        name: chat.isGroup
          ? chat.name
          : chat.otherUser
            ? `${chat.otherUser.firstName} ${chat.otherUser.lastName}`
            : chat.participants?.find(p => p.userId !== userId)?.user
              ? `${chat.participants.find(p => p.userId !== userId)?.user.firstName} ${chat.participants.find(p => p.userId !== userId)?.user.lastName}`
              : 'Unknown User',
        isGroup: chat.isGroup,
        lastMessage: chat.latestMessage
          ? {
              content: chat.latestMessage.content,
              messageType: chat.latestMessage.messageType,
              createdAt: chat.latestMessage.createdAt,
              sender: chat.latestMessage.sender,
            }
          : null,
        timestamp: chat.latestMessage?.createdAt
          ? new Date(chat.latestMessage.createdAt).toLocaleTimeString()
          : '',
        unreadCount: chat.unreadCount,
        avatar: chat.avatar || '/placeholder.svg?height=40&width=40',
        isOnline: chat.isOnline,
        memberCount: chat.memberCount,
        email: chat.isGroup
          ? undefined
          : chat.otherUser?.email ||
            chat.participants?.find(p => p.userId !== userId)?.user?.email,
        phone: chat.isGroup
          ? undefined
          : chat.otherUser?.phone ||
            chat.participants?.find(p => p.userId !== userId)?.user?.phone,
        participants: chat.participants,
      })) || [];

  const activeMessages = activeChat ? contextMessages[activeChat] || [] : [];

  const legacyMessages: LegacyMessage[] = activeMessages.map((msg: any) => {
    let senderName = 'Unknown';

    if (typeof msg.sender === 'string') {
      senderName = msg.sender;
    } else if (msg.sender && typeof msg.sender === 'object') {
      if (msg.sender.name) {
        senderName = msg.sender.name;
      } else if (msg.sender.firstName && msg.sender.lastName) {
        senderName = `${msg.sender.firstName} ${msg.sender.lastName}`.trim();
      } else if (msg.sender.firstName) {
        senderName = msg.sender.firstName;
      } else if (msg.sender.lastName) {
        senderName = msg.sender.lastName;
      } else if (msg.sender.username) {
        senderName = msg.sender.username;
      } else if (msg.sender.email) {
        senderName = msg.sender.email;
      } else if (msg.sender.id) {
        senderName = `User ${msg.sender.id.substring(0, 8)}`;
      }
    }

    return {
      id: typeof msg.id === 'string' ? parseInt(msg.id) : msg.id,
      sender: senderName,
      message: msg.content || msg.message,
      timestamp: msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString()
        : msg.timestamp,
      isMe: msg.isMe || msg.sender?.id === userId,
      avatar:
        msg.sender?.avatar ||
        msg.avatar ||
        '/placeholder.svg?height=40&width=40',
    };
  });

  const handleStartNewChat = useCallback(
    async (contact: any) => {
      try {
        const result = await createOrGetDMChat({
          participantId: contact.otherUser.id,
        }).unwrap();

        setContextActiveChat(result.data.chatId);

        toast({
          title: 'Chat Started',
          description: `Started a new conversation with ${contact.otherUser.firstName} ${contact.otherUser.lastName}`,
        });

        contextRefreshConversations?.();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.data?.message || 'Failed to start chat',
          variant: 'destructive',
        });
      }
    },
    [createOrGetDMChat, setContextActiveChat, contextRefreshConversations]
  );

  const handleJoinGroup = useCallback(
    async (group: any) => {
      try {
        const result = await joinGroupChat({
          groupId: group.id,
        }).unwrap();

        setContextActiveChat(result.data.chatId);
        contextRefreshConversations?.();

        toast({
          title: 'Group Chat Opened',
          description: `Welcome to ${group.name}! Your chat is ready.`,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.data?.message || 'Failed to join group chat',
          variant: 'destructive',
        });
      }
    },
    [joinGroupChat, setContextActiveChat, contextRefreshConversations]
  );

  const handleCreateGroupChat = useCallback(
    async (data: CreateGroupChatData) => {
      try {
        const result = await createGroupChat(data).unwrap();

        toast({
          title: 'Group Created',
          description: 'Your group chat has been created successfully',
        });

        contextRefreshConversations?.();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.data?.message || 'Failed to create group chat',
          variant: 'destructive',
        });
      }
    },
    [createGroupChat, contextRefreshConversations]
  );

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      try {
        await deleteChat({ chatId }).unwrap();

        toast({
          title: 'Chat Deleted',
          description: 'The chat has been deleted successfully',
        });

        if (activeChat === chatId) {
          setContextActiveChat(null);
        }

        contextRefreshConversations?.();
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.data?.message || 'Failed to delete chat',
          variant: 'destructive',
        });
      }
    },
    [deleteChat, activeChat, setContextActiveChat, contextRefreshConversations]
  );

  const handleMarkAsRead = useCallback(
    async (chatId: string) => {
      try {
        await markAsRead({ chatId }).unwrap();
      } catch (error: any) {
        console.error('Failed to mark messages as read:', error);
      }
    },
    [markAsRead]
  );

  const refreshConversations = useCallback(() => {
    contextRefreshConversations?.();
    refetchChats();
  }, [contextRefreshConversations, refetchChats]);

  return {
    conversations,
    activeChat,
    messages: legacyMessages,
    isLoading:
      chatsLoading ||
      isCreatingDMChat ||
      isSendingMessage ||
      isCreatingGroup ||
      isJoiningGroup,
    isConnected,
    typingUsers: typingUsers.filter(t => t.chatId === activeChat),
    onlineUsers,
    setActiveChat: setContextActiveChat,
    handleStartNewChat,
    handleJoinGroup,
    handleCreateGroupChat,
    handleDeleteChat,
    handleMarkAsRead,
    refreshConversations,
  };
}
