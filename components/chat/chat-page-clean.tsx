'use client';

import { useState } from 'react';
import { Layout } from 'antd';
import ChatArea from '@/components/chat/chat-area';
import ConversationListLayout from '@/components/chat/conversation-list-layout';
import Navigation from '@/components/Navigation';
import { useChatOperations } from '@/hooks/use-chat-operations';
import { useChatModals } from '@/hooks/use-chat-modals';
import type { Chat, Conversation } from '@/types/chat.types';

import SendMoneyModal from '@/components/chat/send-money-modal';
import RequestMoneyModal from '@/components/chat/request-money-modal';
import AddContactModal from '@/components/chat/add-contact-modal';
import UserProfileModal from '@/components/chat/user-profile-modal';
import GroupProfileModal from '@/components/chat/group-profile-modal';
import ContactRequestModal from '@/components/chat/contact-request';
import InviteToGroupModal from '@/components/chat/invite-to-group-modal';

const { Content } = Layout;

export default function ChatPageClean() {
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

  const handleConversationSelect = (conversation: any) => {
    setSelectedChat({
      id: conversation.id,
      name:
        conversation.name ||
        (conversation.otherUser
          ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
          : 'Unknown Contact'),
      isGroup: conversation.isGroup,
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

  const getUserFromChat = () => {
    if (!selectedChat || selectedChat.isGroup) return undefined;
    return selectedChat.participants.find(p => p.userId !== activeChat)
      ?.user as any;
  };

  return (
    <Layout className='min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100'>
      <div className='flex min-h-screen'>
        <Navigation />

        <main className='flex-1 lg:ml-20 w-full max-w-full overflow-x-hidden'>
          <div className='flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100vh-100px)] md:h-screen shadow-lg'>
            {!isConnected && (
              <div className='bg-yellow-100 border-yellow-400 text-yellow-700 px-4 py-2 border-b'>
                <p className='text-sm'>Connecting to chat server...</p>
              </div>
            )}

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
                typingUsers={typingUsers}
                onlineUsers={onlineUsers}
              />
            ) : (
              <div className='flex-1 flex items-center justify-center bg-gray-50'>
                <div className='text-center'>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Select a conversation
                  </h3>
                  <p className='text-gray-500'>
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

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
        group={selectedChat?.isGroup ? (selectedChat as any) : undefined}
      />

      <ContactRequestModal
        isOpen={isContactRequestModalOpen}
        onClose={() => setIsContactRequestModalOpen(false)}
      />

      <InviteToGroupModal
        isOpen={isInviteToGroupModalOpen}
        onClose={() => setIsInviteToGroupModalOpen(false)}
        group={selectedChat as any}
        token={null}
      />
    </Layout>
  );
}
