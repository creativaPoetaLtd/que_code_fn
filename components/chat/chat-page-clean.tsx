'use client';

import { useState, useEffect } from 'react';
import ChatArea from '@/components/chat/chat-area';
import ConversationListLayout from '@/components/chat/conversation-list-layout';
import Navigation from '@/components/Navigation';
import { useChatOperations } from '@/hooks/use-chat-operations';
import { useChatModals } from '@/hooks/use-chat-modals';
import { useAuthToken } from '@/hooks/use-auth-token';
import type { Conversation } from '@/types/chat.types';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';

import SendMoneyModal from '@/components/chat/send-money-modal';
import RequestMoneyModal from '@/components/chat/request-money-modal';
import AddContactModal from '@/components/chat/add-contact-modal';
import UserProfileModal from '@/components/chat/user-profile-modal';
import GroupProfileModal from '@/components/chat/group-profile-modal';
import ContactRequestModal from '@/components/chat/contact-request';
import AddMemberModal from '@/components/chat/add-member-modal';
import GroupSettingsModal from '@/components/chat/group-settings-modal';
import { Header } from '@/components/Header';

export default function ChatPageClean() {
  const { getToken } = useAuthToken();
  const token = getToken();
  const { isExpanded } = useSidebar();

  const {
    conversations,
    activeChat,
    messages,
    isLoading,
    isConnected,
    typingUsers,
    onlineUsers,
    setActiveChat,
    handleStartNewChat,
    handleJoinGroup,
  } = useChatOperations();

  const {
    isSendMoneyModalOpen,
    isRequestMoneyModalOpen,
    isAddContactModalOpen,
    isUserProfileModalOpen,
    isGroupProfileModalOpen,
    isContactRequestModalOpen,
    isInviteToGroupModalOpen,
    selectedRecipient,
    openSendMoneyModal,
    closeSendMoneyModal,
    setIsRequestMoneyModalOpen,
    setIsAddContactModalOpen,
    setIsUserProfileModalOpen,
    setIsGroupProfileModalOpen,
    setIsContactRequestModalOpen,
    setIsInviteToGroupModalOpen,
  } = useChatModals();

  const [showMobileConversationList, setShowMobileConversationList] =
    useState(true);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [isGroupSettingsModalOpen, setIsGroupSettingsModalOpen] = useState(false);

  // Determine if chat is active (used to hide bottom nav)
  const isChatActive = !!selectedChat && !showMobileConversationList;

  // Auto-select conversation when activeChat changes (e.g., from joining a group)
  useEffect(() => {
    if (activeChat && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === activeChat);
      if (conversation && (!selectedChat || conversation.id !== selectedChat.id)) {
        const conversationData = conversation as any;
        setSelectedChat({
          id: conversationData.id,
          name:
            conversationData.name ||
            (conversationData.otherUser
              ? `${conversationData.otherUser.firstName} ${conversationData.otherUser.lastName}`
              : 'Unknown Contact'),
          isGroup: conversationData.isGroup,
          groupId: conversationData.groupId,
          avatar: conversationData.avatar,
          participants: conversationData.participants || [],
          unreadCount: conversationData.unreadCount || 0,
          isOnline: conversationData.isOnline || false,
          memberCount: conversationData.memberCount,
        });
        setShowMobileConversationList(false);
      }
    }
  }, [activeChat, conversations]);

  const handleConversationSelect = (conversation: any) => {
    setSelectedChat({
      id: conversation.id,
      name:
        conversation.name ||
        (conversation.otherUser
          ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
          : 'Unknown Contact'),
      isGroup: conversation.isGroup,
      groupId: conversation.groupId,
      avatar: conversation.avatar,
      participants: conversation.participants || [],
      unreadCount: conversation.unreadCount || 0,
      isOnline: conversation.isOnline || false,
      memberCount: conversation.memberCount,
    });
    setActiveChat(conversation.id);
    setShowMobileConversationList(false);
  };

  const handleViewProfile = () => {
    if (selectedChat?.isGroup) {
      setIsGroupProfileModalOpen(true);
    } else {
      setIsUserProfileModalOpen(true);
    }
  };

  const handleInviteToGroup = () => {
    if (selectedChat?.isGroup) {
      setIsInviteToGroupModalOpen(true);
    }
  };

  const handleGroupSettings = () => {
    if (selectedChat?.isGroup) {
      setIsGroupSettingsModalOpen(true);
    }
  };

  const getUserFromChat = () => {
    if (!selectedChat || selectedChat.isGroup) return undefined;
    return selectedChat.participants.find(p => p.userId !== activeChat)
      ?.user as any;
  };

  return (
    <div className='flex flex-col min-h-screen bg-gray-50 dark:bg-darkBg-main'>
      {/* Desktop Sidebar - Always visible on desktop */}
      <Navigation hideBottomNav={isChatActive} />

      {/* Main Content */}
      <main className={cn(
        'flex flex-col transition-all duration-300',
        'h-screen overflow-hidden',
        isExpanded ? 'lg:ml-64' : 'lg:ml-20'
      )}>
        {/* Fixed Header */}
        <div className='flex-shrink-0 z-20 bg-white dark:bg-darkBg-card border-b border-gray-100 dark:border-darkBorder-light'>
          <Header />
        </div>

        {!isConnected && (
          <div className='flex-shrink-0 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-2'>
            <p className='text-sm'>Connecting to chat server...</p>
          </div>
        )}

        {/* Chat Content - fills remaining height, scrollable */}
        <div className='flex-1 flex flex-col md:flex-row min-h-0'>
          <ConversationListLayout
            conversations={conversations}
            activeConversation={selectedChat || conversations[0]}
            onConversationSelect={handleConversationSelect}
            showOnMobile={showMobileConversationList}
            onAddContact={() => setIsAddContactModalOpen(true)}
            onViewContactRequests={() => setIsContactRequestModalOpen(true)}
            onQuickSendMoney={conversation =>
              openSendMoneyModal(conversation.name)
            }
            onStartNewChat={handleStartNewChat}
            onJoinGroup={handleJoinGroup}
            isLoading={isLoading}
          />

          {selectedChat ? (
            <ChatArea
              conversation={selectedChat as any}
              messages={messages}
              showOnMobile={!showMobileConversationList}
              onBackClick={() => setShowMobileConversationList(true)}
              onSendMoney={() => openSendMoneyModal(selectedChat.name)}
              onRequestMoney={() => setIsRequestMoneyModalOpen(true)}
              onViewProfile={handleViewProfile}
              onInviteToGroup={handleInviteToGroup}
              onGroupSettings={handleGroupSettings}
              typingUsers={typingUsers}
              onlineUsers={onlineUsers}
            />
          ) : (
            <div className='flex-1 flex items-center justify-center bg-gray-50 dark:bg-darkBg-card'>
              <div className='text-center'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                  Select a conversation
                </h3>
                <p className='text-gray-500 dark:text-gray-400'>
                  Choose a conversation from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <SendMoneyModal
        isOpen={isSendMoneyModalOpen}
        onClose={closeSendMoneyModal}
        recipient={selectedRecipient}
        currentConversation={selectedChat as any}
      />

      <RequestMoneyModal
        isOpen={isRequestMoneyModalOpen}
        onClose={() => setIsRequestMoneyModalOpen(false)}
        conversation={selectedChat as any}
      />

      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => setIsAddContactModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        user={getUserFromChat()}
      />

      <GroupProfileModal
        isOpen={isGroupProfileModalOpen}
        onClose={() => setIsGroupProfileModalOpen(false)}
        groupId={selectedChat?.isGroup ? selectedChat.groupId || null : null}
        token={token || ''}
      />

      <ContactRequestModal
        isOpen={isContactRequestModalOpen}
        onClose={() => setIsContactRequestModalOpen(false)}
      />

      <AddMemberModal
        isOpen={isInviteToGroupModalOpen}
        onClose={() => setIsInviteToGroupModalOpen(false)}
        groupId={selectedChat?.groupId || null}
        groupName={selectedChat?.name || ''}
        token={token || ''}
      />

      <GroupSettingsModal
        isOpen={isGroupSettingsModalOpen}
        onClose={() => setIsGroupSettingsModalOpen(false)}
        groupId={selectedChat?.groupId || null}
      />
    </div>
  );
}