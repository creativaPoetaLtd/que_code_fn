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
      } md:flex flex-col w-full md:w-[19rem] lg:w-80 xl:w-96 flex-shrink-0 border-r border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card h-full overflow-hidden`}
    >
      {/* Header - Fixed */}
      <div className='flex-shrink-0 px-3.5 pt-3 pb-2.5 border-b border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card space-y-2.5'>
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
      <div className='flex flex-shrink-0 border-b border-gray-100 dark:border-darkBorder-light'>
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'chats'
              ? 'text-brand-green dark:text-brand-gold border-brand-green dark:border-brand-gold'
              : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab('outside-messages')}
          className={`flex-1 px-4 py-2 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
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
          <div className='flex-shrink-0 px-3.5 py-2 border-b border-gray-100 dark:border-darkBorder-light'>
            <ConversationFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              totalCount={conversations.length}
              userCount={userCount}
              groupCount={groupCount}
            />
          </div>

          {/* Content Area — bottom gutter clears the fixed mobile bottom nav */}
          <div className='flex-1 overflow-y-auto overscroll-contain pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-2'>
            {activeFilter === 'groups' ? (
              // Groups-specific rendering
              groupsLoading ? (
                <div className='flex items-center justify-center gap-2.5 py-10'>
                  <div className='animate-spin rounded-full h-7 w-7 border-b-2 border-[#00B512]'></div>
                  <span className='text-sm text-gray-500'>Loading groups...</span>
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
                          <div className='sticky top-0 z-10 px-4 py-1.5 bg-gray-50 border-b border-gray-100 dark:bg-darkBg-interactive dark:border-darkBorder-light'>
                            <p className='text-[11px] font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-400'>
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
                          <div className='sticky top-0 z-10 px-4 py-1.5 bg-gray-50 border-b border-gray-100 dark:bg-darkBg-interactive dark:border-darkBorder-light'>
                            <p className='text-[11px] font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-400'>
                              Available Groups ({filteredGroups.length})
                            </p>
                          </div>
                          {filteredGroups.map((group: any) => (
                            <div
                              key={group.id}
                              className='relative px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-darkBg-interactive before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-transparent hover:before:bg-brand-green dark:hover:before:bg-brand-gold'
                              onClick={() => onJoinGroup?.(group)}
                            >
                              <div className='flex items-center gap-3'>
                                <div className='relative flex-shrink-0'>
                                  <div className='bg-brand-green dark:bg-brand-gold h-10 w-10 rounded-full flex items-center justify-center text-white dark:text-darkBg-main'>
                                    <Send size={18} />
                                  </div>
                                </div>
                                <div className='min-w-0 flex-1'>
                                  <div className='flex items-baseline gap-2'>
                                    <p className='min-w-0 flex-1 truncate text-[14px] font-semibold leading-[18px]'>
                                      {group.name}
                                    </p>
                                    <span className='shrink-0 whitespace-nowrap text-[11px] leading-[14px] text-gray-500'>
                                      {group.memberCount || 0} members
                                    </span>
                                  </div>
                                  <p className='mt-1 truncate text-[12px] leading-[16px] text-gray-500 dark:text-gray-400'>
                                    {group.description || 'No description'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <div className='flex flex-col items-center px-6 py-12 text-center'>
                      <p className='mb-4 text-sm text-gray-500'>No groups found</p>
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
              <div className='flex items-center justify-center gap-2.5 py-10'>
                <div className='animate-spin rounded-full h-7 w-7 border-b-2 border-[#00B512]'></div>
                <span className='text-sm text-gray-500'>
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

                    {/* Quick Send Money — takes over the timestamp column on hover,
                        which fades out so the two never overlap */}
                    {!conversation.isGroup && (
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={e => {
                          e.stopPropagation();
                          onQuickSendMoney(conversation);
                        }}
                        className='absolute right-2.5 top-1/2 h-8 w-8 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-gray-100 dark:hover:bg-darkBg-interactive'
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
