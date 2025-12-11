'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ConversationItem from './conversation-item';
import QuickActions, { type QuickActionType } from './quick-actions';
import SearchBar from './search-bar';
import ConversationFilters, { type FilterType } from './conversation-filters';
import EmptyState from './empty-state';
import StartChatModal from './start-chart-modal';
import JoinGroupByLinkModal from './join-group-by-link-modal';
import CreateGroupModalUpdated from './create-group-modal';
import type { Conversation } from '@/types/chat.types';
import { Send, Link } from 'lucide-react'
import { useAuthToken } from '@/hooks/use-auth-token'
import { useGetGroupsQuery } from '@/states/groupSlice';

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
}: ConversationListLayoutProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeQuickTab, setActiveQuickTab] =
    useState<QuickActionType>('conversations');
  const [isStartChatModalOpen, setIsStartChatModalOpen] =
    useState<boolean>(false);
  const [isJoinGroupByLinkModalOpen, setIsJoinGroupByLinkModalOpen] =
    useState<boolean>(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] =
    useState<boolean>(false);

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
      className={`${showOnMobile ? 'flex' : 'hidden'
        } md:flex flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white h-full overflow-hidden`}
    >
      {/* Header */}
      <div className='p-4 border-b border-gray-100 bg-white'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>Messages</h2>
          {totalUnreadCount > 0 && (
            <Badge className='bg-[#00B512] text-white hover:bg-green-700'>
              {totalUnreadCount} unread
            </Badge>
          )}
        </div>

        <QuickActions
          activeTab={activeQuickTab}
          onTabChange={setActiveQuickTab}
          onAddContact={onAddContact}
          onStartNewChat={() => setIsStartChatModalOpen(true)}
          onViewMyGroups={() => setActiveQuickTab('groups')}
          onCreateGroup={() => setIsCreateGroupModalOpen(true)}
          onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
          onViewContactRequests={onViewContactRequests}
          onStartChatWithContact={contact => {
            onStartNewChat?.(contact);
            setActiveQuickTab('conversations');
          }}
          onJoinGroup={group => {
            onJoinGroup?.(group);
            setActiveQuickTab('conversations');
          }}
          contactsCount={userCount}
          groupsCount={groupCount}
        />
      </div>

      {/* Search and Filters - Only show when on conversations tab */}
      {activeQuickTab === 'conversations' && (
        <div className='p-4 space-y-3 border-b border-gray-100'>
          <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          <ConversationFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            totalCount={conversations.length}
            userCount={userCount}
            groupCount={groupCount}
          />
        </div>
      )}

      {/* Content Area */}
      <div className='flex-1 overflow-y-auto'>
        {activeQuickTab === 'conversations' &&
          (activeFilter === 'groups' ? (
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
                            Group Conversations ({filteredConversations.length})
                          </p>
                        </div>
                        {filteredConversations.map(conversation => (
                          <div key={conversation.id} className='relative group'>
                            <ConversationItem
                              conversation={conversation}
                              isActive={
                                activeConversation.id === conversation.id
                              }
                              onClick={() => onConversationSelect(conversation)}
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
                            className='p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 transform hover:translate-x-1'
                            onClick={() => onJoinGroup?.(group)}
                          >
                            <div className='flex items-center gap-2 sm:gap-3'>
                              <div className='relative flex-shrink-0'>
                                <div className='bg-[#00B512] h-10 w-10 rounded-full flex items-center justify-center text-white'>
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
                      className='border-[#00B512] text-[#00B512] hover:bg-[#00B512] hover:text-white'
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
                {/* Section Header */}
                {searchTerm === '' && (
                  <div className='px-4 py-2 bg-gray-50 border-b border-gray-100'>
                    <p className='text-xs font-medium text-gray-600 uppercase tracking-wide'>
                      {activeFilter === 'all' && 'All Conversations'}
                      {activeFilter === 'users' && 'Direct Messages'}
                    </p>
                  </div>
                )}

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
                        className='absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100 h-8 w-8'
                        aria-label='Quick send money'
                      >
                        <Send size={14} className='text-[#00B512]' />
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
                onViewMyGroups={() => setActiveQuickTab('groups')}
                onJoinGroupByLink={() => setIsJoinGroupByLinkModalOpen(true)}
                onAddContact={onAddContact}
              />
            ))}
      </div>

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
