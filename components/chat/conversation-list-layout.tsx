'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConversationItem from './conversation-item';
import QuickActions from './quick-actions';
import SearchBar from './search-bar';
import ConversationFilters, { type FilterType } from './conversation-filters';
import EmptyState from './empty-state';
import StartChatModal from './start-chart-modal';
import JoinGroupByLinkModal from './join-group-by-link-modal';
import CreateGroupModalUpdated from './create-group-modal';
import OutsideMessagesTab from './outside-messages-tab';
import type { Conversation, OutsideMessage } from '@/types/chat.types';
import { Send, Link } from 'lucide-react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetGroupsQuery } from '@/states/groupSlice';

type ChatTabType = 'chats' | 'outside-messages';

interface ConversationListLayoutProps {
  conversations: Conversation[];
  activeConversation: Conversation;
  onConversationSelect: (conversation: Conversation) => void;
  showOnMobile: boolean;
  onAddContact: () => void;
  onViewContactRequests: () => void;
  onQuickSendMoney: (conversation: Conversation) => void;
  onStartNewChat?: (contact: any) => void;
  onJoinGroup?: (group: any) => void;
  isLoading?: boolean;
  selectedOutsideMessageId?: string | null;
  onSelectOutsideMessage?: (msg: OutsideMessage) => void;
}

export default function ConversationListLayout({
  conversations,
  activeConversation,
  onConversationSelect,
  showOnMobile,
  onAddContact,
  onViewContactRequests,
  onQuickSendMoney,
  onStartNewChat,
  onJoinGroup,
  isLoading = false,
  selectedOutsideMessageId,
  onSelectOutsideMessage,
}: ConversationListLayoutProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isStartChatModalOpen, setIsStartChatModalOpen] =
    useState<boolean>(false);
  const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] =
    useState<boolean>(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ChatTabType>('chats');

  const { getToken } = useAuthToken();
  const token = getToken();
  // Calculate total unread messages count
  const totalUnreadCount = conversations.reduce(
    (total, conv) => total + (conv.unreadCount || 0),
    0
  );
  // Get groups data when groups filter is active
  const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery(
    token as string,
    { skip: !token || activeFilter !== 'groups' }
  );

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = (conv.name || 'Unknown Contact')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    switch (activeFilter) {
      case 'users':
        return matchesSearch && !conv.isGroup;
      case 'groups':
        return matchesSearch && conv.isGroup;
      default:
        return matchesSearch;
    }
  });

  // Get groups for groups filter
  const groups = groupsData?.data?.groups || [];
  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Count conversations by type
  const userCount = conversations.filter(conv => !conv.isGroup).length;
  const groupCount = conversations.filter(conv => conv.isGroup).length;

  return (
    <div
      className={`${
        showOnMobile ? 'flex' : 'hidden'
      } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card h-full overflow-hidden`}
    >
      {/* Header - Fixed */}
      <div className='flex-shrink-0 px-3 pt-3 pb-2 border-b border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card space-y-2'>
        <QuickActions
          onAddContact={onAddContact}
          onStartNewChat={() => setIsStartChatModalOpen(true)}
          onCreateGroup={() => setIsCreateGroupModalOpen(true)}
          onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
          onViewContactRequests={onViewContactRequests}
        />
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>

      {/* Tab Navigation */}
      <div className='flex-shrink-0 border-b border-gray-100 dark:border-darkBorder-light flex'>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chats'
              ? 'text-brand-green dark:text-brand-gold border-brand-green dark:border-brand-gold'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('outside-messages')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'outside-messages'
              ? 'text-brand-green dark:text-brand-gold border-brand-green dark:border-brand-gold'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Outside Messages
        </button>
      </div>

      {/* Chats Tab Content */}
      {activeTab === 'chats' && (
        <>
          <div className='px-3 py-1.5 border-b border-gray-100 dark:border-darkBorder-light'>
            <ConversationFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              totalCount={conversations.length}
              userCount={userCount}
              groupCount={groupCount}
            />
          </div>

          {/* Content Area */}
          <div className='flex-1 overflow-y-auto'>
            {activeFilter === 'groups' ? (
              // Groups-specific rendering
              groupsLoading ? (
                <div className='flex items-center justify-center h-32'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512]'></div>
                  <span className='ml-2 text-gray-500'>Loading groups...</span>
                </div>
              ) : (
                <div>
                  {/* Groups List */}
                  {filteredGroups.length > 0 ||
                  filteredConversations.length > 0 ? (
                    <div>
                      {/* Show conversation groups first */}
                      {filteredConversations.length > 0 && (
                        <>
                          <div className='px-4 py-2 bg-gray-50 border-b border-gray-100'>
                            <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                              Group Conversations (
                              {filteredConversations.length})
                            </p>
                          </div>
                          {filteredConversations.map(conversation => (
                            <div
                              key={conversation.id}
                              className='relative group'
                            >
                              <ConversationItem
                                conversation={conversation}
                                isActive={
                                  activeConversation.id === conversation.id
                                }
                                onClick={() =>
                                  onConversationSelect(conversation)
                                }
                              />
                            </div>
                          ))}
                        </>
                      )}

                      {/* Show additional groups */}
                      {filteredGroups.length > 0 && (
                        <>
                          <div className='px-4 py-2 bg-gray-50 border-b border-gray-100'>
                            <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                              Available Groups ({filteredGroups.length})
                            </p>
                          </div>
                          {filteredGroups.map((group: any) => (
                            <div
                              key={group.id}
                              className='p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light cursor-pointer hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:border-l-2 hover:border-l-brand-green dark:hover:border-l-brand-gold transition-all duration-200'
                              onClick={() => onJoinGroup?.(group)}
                            >
                              <div className='flex items-center gap-2 sm:gap-3'>
                                <div className='relative flex-shrink-0'>
                                  <div className='bg-brand-green dark:bg-brand-gold h-10 w-10 rounded-full flex items-center justify-center text-white dark:text-darkBg-main'>
                                    <Send size={18} />
                                  </div>
                                </div>
                                <div className='flex-1 min-w-0'>
                                  <div className='flex justify-between items-center'>
                                    <p className='font-medium truncate text-sm sm:text-base'>
                                      {group.name}
                                    </p>
                                    <span className='text-xs text-gray-500 whitespace-nowrap ml-1'>
                                      {group.memberCount || 0} members
                                    </span>
                                  </div>
                                  <div className='flex justify-between items-center mt-1'>
                                    <p className='text-xs sm:text-sm text-gray-500 truncate max-w-[70%]'>
                                      {group.description || 'No description'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-8'>
                      <p className='text-gray-500 mb-4'>No groups found</p>
                      <Button
                        onClick={() => setIsJoinGroupByLinkModalOpen(true)}
                        variant='outline'
                        size='sm'
                        className='border-brand-green dark:border-brand-gold text-brand-green dark:text-brand-gold hover:bg-brand-green dark:hover:bg-brand-gold hover:text-white dark:hover:text-darkBg-main'
                      >
                        <Link size={14} className='mr-2' />
                        Join Your First Group
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : // Regular conversations rendering
            isLoading ? (
              <div className='flex items-center justify-center h-32'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512]'></div>
                <span className='ml-2 text-gray-500'>
                  Loading conversations...
                </span>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div>
                {filteredConversations.map(conversation => (
                  <div key={conversation.id} className='relative group'>
                    <ConversationItem
                      conversation={conversation}
                      isActive={activeConversation.id === conversation.id}
                      onClick={() => onConversationSelect(conversation)}
                    />

                    {/* Quick Send Money Button - Only for users */}
                    {!conversation.isGroup && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={e => {
                          e.stopPropagation();
                          onQuickSendMoney(conversation);
                        }}
                        className='absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-darkBg-interactive h-8 w-8'
                        aria-label='Quick send money'
                      >
                        <Send
                          size={14}
                          className='text-brand-green dark:text-brand-gold'
                        />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                filterType={activeFilter}
                hasSearchTerm={!!searchTerm}
                onStartNewChat={() => setIsStartChatModalOpen(true)}
                onViewMyGroups={() => {}}
                onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
                onAddContact={onAddContact}
              />
            )}
          </div>
        </>
      )}

      {/* Outside Messages Tab Content */}
      {activeTab === 'outside-messages' && (
        <OutsideMessagesTab
          selectedMessageId={selectedOutsideMessageId}
          onSelectMessage={onSelectOutsideMessage ?? (() => {})}
        />
      )}

      {/* Modals */}
      <StartChatModal
        isOpen={isStartChatModalOpen}
        onClose={() => setIsStartChatModalOpen(false)}
        onStartChat={contact => {
          onStartNewChat?.(contact);
          setIsStartChatModalOpen(false);
        }}
        existingConversations={conversations}
      />
      <JoinGroupByLinkModal
        isOpen={isJoinGroupByLinkModalOpen}
        onClose={() => setIsJoinGroupByLinkModalOpen(false)}
        onGroupJoined={group => {
          onJoinGroup?.(group);
          setIsJoinGroupByLinkModalOpen(false);
        }}
      />
      <CreateGroupModalUpdated
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        token={token}
      />
    </div>
  );
}
