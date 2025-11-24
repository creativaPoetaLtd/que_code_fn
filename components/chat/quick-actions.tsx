'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageCircle,
  UserPlus,
  Users,
  User,
  PlusCircle,
  Link,
} from 'lucide-react';
import {
  useGetPendingInvitationsUnifiedQuery,
  useGetContactsEnhancedQuery,
} from '@/states/contactSlice';
import { useGetGroupsQuery } from '@/states/groupSlice';
import { useAuthToken } from '@/hooks/use-auth-token';

export type QuickActionType = 'conversations' | 'contacts' | 'groups';

interface QuickActionsProps {
  activeTab: QuickActionType;
  onTabChange: (tab: QuickActionType) => void;
  onAddContact: () => void;
  onStartNewChat: () => void;
  onViewMyGroups: () => void;
  onCreateGroup: () => void;
  onJoinGroupByLink: () => void;
  onViewContactRequests: () => void;
  onStartChatWithContact: (contact: any) => void;
  contactsCount?: number;
  groupsCount?: number;
}

export default function QuickActions({
  activeTab,
  onTabChange,
  onAddContact,
  onStartNewChat,
  onViewMyGroups,
  onCreateGroup,
  onJoinGroupByLink,
  onViewContactRequests,
  onStartChatWithContact,
  contactsCount = 0,
  groupsCount = 0,
}: QuickActionsProps) {
  const { getToken } = useAuthToken();
  const token = getToken();

  // Get pending contact requests count
  const { data: pendingContactRequests } = useGetPendingInvitationsUnifiedQuery(
    {
      token: token!,
      page: 1,
      limit: 20,
    },
    { skip: !token }
  );

  // Get contacts list when contacts tab is active
  const { data: contactsData } = useGetContactsEnhancedQuery(
    { token: token || '', status: 'active' },
    { skip: !token || activeTab !== 'contacts' }
  );

  // Get groups list when groups tab is active
  const { data: groupsData, isLoading: groupsLoading } = useGetGroupsQuery(
    token as string,
    { skip: !token || activeTab !== 'groups' }
  );

  const contactRequestsCount = pendingContactRequests?.invitations?.length || 0;
  const contacts = contactsData?.contacts || [];
  const groups = groupsData?.data?.groups || [];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className='space-y-3'>
      {/* Tab Navigation */}
      <div>
        <p className='text-xs font-medium text-gray-600 uppercase tracking-wide mb-2'>
          Quick Actions
        </p>
        <Tabs
          value={activeTab}
          onValueChange={value => onTabChange(value as QuickActionType)}
        >
          <TabsList className='grid w-full grid-cols-3 h-8 bg-gray-100'>
            <TabsTrigger
              value='conversations'
              className='text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512]'
            >
              Chats
            </TabsTrigger>
            <TabsTrigger
              value='contacts'
              className='text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512] relative'
            >
              <User size={12} className='mr-1' />
              Contacts
              {contactRequestsCount > 0 && (
                <Badge className='ml-1 bg-red-500 text-white text-xs scale-75 h-4 min-w-4 p-0'>
                  {contactRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value='groups'
              className='text-xs data-[state=active]:bg-white data-[state=active]:text-[#00B512]'
            >
              <Users size={12} className='mr-1' />
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className=' overflow-y-auto'>
        {activeTab === 'conversations' && (
          <div className='space-y-2'>
            {/* <p className="text-xs text-gray-500 mb-3">Quick conversation actions</p> */}
            <Button
              variant='outline'
              size='sm'
              onClick={onStartNewChat}
              className='w-full h-8 text-xs justify-start'
            >
              <MessageCircle size={14} className='mr-2' />
              Start New Chat
            </Button>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className='space-y-2'>
            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-2 mb-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={onAddContact}
                className='h-8 text-xs'
              >
                <UserPlus size={12} className='mr-1' />
                Add Contact
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={onViewContactRequests}
                className='h-8 text-xs relative'
              >
                Requests
                {contactRequestsCount > 0 && (
                  <Badge className='ml-1 bg-red-500 text-white text-xs scale-75 h-3 min-w-3 p-0'>
                    {contactRequestsCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Contacts List */}
            {contacts.length > 0 ? (
              <div className='space-y-1'>
                <p className='text-xs text-gray-500 mb-2'>
                  Your Contacts ({contacts.length})
                </p>
                {contacts.slice(0, 8).map(contact => (
                  <div
                    key={contact.id}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center space-x-2 flex-1 min-w-0'>
                      <div className='w-6 h-6 bg-[#00B512] rounded-full flex items-center justify-center text-xs text-white font-medium'>
                        {getInitials(
                          contact.otherUser.firstName,
                          contact.otherUser.lastName
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium truncate'>
                          {contact.otherUser.firstName}{' '}
                          {contact.otherUser.lastName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onStartChatWithContact(contact)}
                      className='h-6 w-6 p-0 hover:bg-green-100'
                    >
                      <MessageCircle size={12} className='text-[#00B512]' />
                    </Button>
                  </div>
                ))}
                {contacts.length > 8 && (
                  <p className='text-xs text-gray-400 text-center mt-2'>
                    +{contacts.length - 8} more contacts
                  </p>
                )}
              </div>
            ) : (
              <div className='text-center py-4'>
                <p className='text-xs text-gray-500 mb-2'>No contacts yet</p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={onAddContact}
                  className='h-7 text-xs'
                >
                  <UserPlus size={12} className='mr-1' />
                  Add Your First Contact
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className='space-y-2'>
            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-2 mb-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={onCreateGroup}
                className='h-8 text-xs'
              >
                <PlusCircle size={12} className='mr-1' />
                Create Group
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={onJoinGroupByLink}
                className='h-8 text-xs'
              >
                <Link size={12} className='mr-1' />
                Join Group
              </Button>
            </div>

            {/* Groups List */}
            {groupsLoading ? (
              <div className='flex items-center justify-center py-4'>
                <div className='animate-spin rounded-full h-4 w-4 border-2 border-[#00B512] border-t-transparent'></div>
                <span className='ml-2 text-xs text-gray-500'>
                  Loading groups...
                </span>
              </div>
            ) : groups.length > 0 ? (
              <div className='space-y-1'>
                <p className='text-xs text-gray-500 mb-2'>
                  Your Groups ({groups.length})
                </p>
                {groups.slice(0, 8).map((group: any) => (
                  <div
                    key={group.id}
                    className='flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors'
                  >
                    <div className='flex items-center space-x-2 flex-1 min-w-0'>
                      <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white font-medium'>
                        <Users size={12} />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium truncate'>
                          {group.name}
                        </p>
                        <p className='text-xs text-gray-400 truncate'>
                          {group.memberCount || 0} members
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onViewMyGroups?.()}
                      className='h-6 w-6 p-0 hover:bg-green-100'
                    >
                      <MessageCircle size={12} className='text-green-600' />
                    </Button>
                  </div>
                ))}
                {groups.length > 8 && (
                  <p className='text-xs text-gray-400 text-center mt-2'>
                    +{groups.length - 8} more groups
                  </p>
                )}
              </div>
            ) : (
              <div className='text-center py-4'>
                <p className='text-xs text-gray-500 mb-2'>
                  You don't belong to any groups yet
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
