'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  MessageCircle,
  UserPlus,
  Users,
  User,
  PlusCircle,
  Link,
  Search,
} from 'lucide-react';
import {
  useGetPendingInvitationsUnifiedQuery,
  useGetContactsEnhancedQuery,
} from '@/states/contactSlice';
import {
  useGetGroupsQuery,
  useLeaveGroupMutation,
  useRequestToJoinGroupMutation,
  useDeleteGroupMutation,
} from '@/states/groupSlice';
import { useAuthToken } from '@/hooks/use-auth-token';
import { toast } from '@/hooks/use-toast';
import GroupCard from './GroupCard';
import GroupDialogs from './GroupDialogs';
import GroupJoinRequestsModal from './group-join-requests-modal';
import InviteToGroupModal from './invite-to-group-modal';

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
  onJoinGroup: (group: any) => void;
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
  onJoinGroup,
  contactsCount = 0,
  groupsCount = 0,
}: QuickActionsProps) {
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [dialogState, setDialogState] = useState<{
    leave: { isOpen: boolean; groupId: string | null };
    delete: { isOpen: boolean; groupId: string | null };
  }>({
    leave: { isOpen: false, groupId: null },
    delete: { isOpen: false, groupId: null },
  });
  const [joinRequestsModal, setJoinRequestsModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [inviteModal, setInviteModal] = useState<any>(null);

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
  const {
    data: groupsData,
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups,
  } = useGetGroupsQuery(token as string, {
    skip: !token || activeTab !== 'groups',
  });

  const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation();
  const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation();
  const [requestToJoinGroup, { isLoading: isRequestingJoin }] =
    useRequestToJoinGroupMutation();

  const contactRequestsCount = pendingContactRequests?.invitations?.length || 0;
  const contacts = contactsData?.contacts || [];
  const groups = Array.isArray(groupsData?.data?.groups)
    ? groupsData.data.groups
    : [];

  // Filter groups based on search term
  const filteredGroups = groups.filter((group: any) => {
    const search = groupSearchTerm.toLowerCase();
    return (
      group?.name?.toLowerCase().includes(search) ||
      group?.description?.toLowerCase().includes(search)
    );
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to leave the group',
        variant: 'destructive',
      });
      return;
    }
    try {
      await leaveGroup({ groupId, token }).unwrap();
      toast({
        title: 'Left Group Successfully',
        description: `You have left "${groupName}". You can rejoin if invited again.`,
      });
      refetchGroups();
      setDialogState(prev => ({
        ...prev,
        leave: { isOpen: false, groupId: null },
      }));
    } catch (error: any) {
      toast({
        title: 'Failed to Leave Group',
        description:
          error?.data?.message ||
          error?.message ||
          'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to delete the group',
        variant: 'destructive',
      });
      return;
    }
    try {
      await deleteGroup({ groupId, token }).unwrap();
      toast({
        title: 'Group Deleted Successfully',
        description: `"${groupName}" has been permanently deleted.`,
      });
      refetchGroups();
      setDialogState(prev => ({
        ...prev,
        delete: { isOpen: false, groupId: null },
      }));
    } catch (error: any) {
      toast({
        title: 'Failed to Delete Group',
        description:
          error?.data?.message ||
          error?.message ||
          'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRequestToJoin = async (groupId: string, groupName: string) => {
    if (!token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to request to join a group',
        variant: 'destructive',
      });
      return;
    }
    try {
      await requestToJoinGroup({ groupId, token }).unwrap();
      toast({
        title: 'Request Sent Successfully',
        description: `Your request to join "${groupName}" has been sent to the group admin.`,
      });
      refetchGroups();
    } catch (error: any) {
      toast({
        title: 'Failed to Send Request',
        description:
          error?.data?.message ||
          error?.message ||
          'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleManageAction = (action: string, group: any) => {
    switch (action) {
      case 'leave':
        setDialogState(prev => ({
          ...prev,
          leave: { isOpen: true, groupId: group.id },
        }));
        break;
      case 'delete':
        setDialogState(prev => ({
          ...prev,
          delete: { isOpen: true, groupId: group.id },
        }));
        break;
      case 'info':
        toast({
          title: `${group.name} Details`,
          description: `${group.memberCount || 0} members • Created ${new Date(
            group.createdAt
          ).toLocaleDateString()}`,
        });
        break;
      case 'mute':
        toast({
          title: 'Notifications Muted',
          description: `You won't receive notifications from "${group.name}" anymore.`,
        });
        break;
      case 'unmute':
        toast({
          title: 'Notifications Enabled',
          description: `You'll now receive notifications from "${group.name}".`,
        });
        break;
      case 'invite':
        setInviteModal(group);
        break;
      case 'settings':
        toast({
          title: 'Group Settings',
          description: 'Group settings will be available soon.',
        });
        break;
      case 'view':
        toast({
          title: 'View Group',
          description: `Viewing details for "${group.name}".`,
        });
        break;
      default:
        break;
    }
  };

  const handleJoinGroup = (group: any) => {
    onJoinGroup(group);
    onTabChange('conversations'); // Switch to conversations tab
    toast({
      title: 'Opening Group Chat',
      description: `Welcome to ${group.name}! Opening your chat...`,
    });
  };

  return (
    <div className='space-y-3'>
      {/* Tab Navigation */}
      <div>
        <p className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2'>
          Quick Actions
        </p>
        <Tabs
          value={activeTab}
          onValueChange={value => onTabChange(value as QuickActionType)}
        >
          <TabsList className='grid w-full grid-cols-3 h-8'>
            <TabsTrigger
              value='conversations'
              className='text-xs'
            >
              Chats
            </TabsTrigger>
            <TabsTrigger
              value='contacts'
              className='text-xs relative'
            >
              <User size={12} className='mr-1' />
              Contacts
              {contactRequestsCount > 0 && (
                <Badge className='ml-1 bg-red-500 dark:bg-red-600 text-white text-xs scale-75 h-4 min-w-4 p-0'>
                  {contactRequestsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value='groups'
              className='text-xs'
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
              className='w-full h-8 text-xs justify-start border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green dark:hover:border-brand-gold transition-all'
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
                className='h-8 text-xs border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green dark:hover:border-brand-gold transition-all'
              >
                <UserPlus size={12} className='mr-1' />
                Add Contact
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={onViewContactRequests}
                className='h-8 text-xs relative border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green dark:hover:border-brand-gold transition-all'
              >
                Requests
                {contactRequestsCount > 0 && (
                  <Badge className='ml-1 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs scale-75 h-3 min-w-3 p-0'>
                    {contactRequestsCount}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Contacts List */}
            {contacts.length > 0 ? (
              <div className='space-y-1'>
                <p className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
                  Your Contacts ({contacts.length})
                </p>
                {contacts.slice(0, 8).map(contact => (
                  <div
                    key={contact.id}
                    className='flex items-center justify-between p-2 bg-gray-50 dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light rounded-lg hover:bg-gray-100 dark:hover:bg-darkBg-interactive hover:border-brand-green dark:hover:border-brand-gold transition-all'
                  >
                    <div className='flex items-center space-x-2 flex-1 min-w-0'>
                      <div className='w-6 h-6 bg-brand-green dark:bg-brand-gold rounded-full flex items-center justify-center text-xs text-white dark:text-darkBg-main font-medium'>
                        {getInitials(
                          contact.otherUser.firstName,
                          contact.otherUser.lastName
                        )}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-xs font-medium truncate text-gray-900 dark:text-white'>
                          {contact.otherUser.firstName}{' '}
                          {contact.otherUser.lastName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => onStartChatWithContact(contact)}
                      className='h-6 w-6 p-0 hover:bg-brand-green/10 dark:hover:bg-brand-gold/10'
                    >
                      <MessageCircle size={12} className='text-brand-green dark:text-brand-gold' />
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
            {/* Search Bar */}
            <div className='relative mb-3'>
              <Search
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={14}
              />
              <Input
                placeholder='Search groups...'
                value={groupSearchTerm}
                onChange={e => setGroupSearchTerm(e.target.value)}
                className='pl-9 h-8 text-xs'
              />
            </div>

            {/* Action Buttons */}
            <div className='grid grid-cols-2 gap-2 mb-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={onCreateGroup}
                className='h-8 text-xs border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green dark:hover:border-brand-gold transition-all'
              >
                <PlusCircle size={12} className='mr-1' />
                Create
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={onJoinGroupByLink}
                className='h-8 text-xs border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive hover:text-brand-green dark:hover:text-brand-gold hover:border-brand-green dark:hover:border-brand-gold transition-all'
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
            ) : groupsError ? (
              <div className='text-center py-4'>
                <p className='text-xs text-red-500 mb-2'>
                  Failed to load groups
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => refetchGroups()}
                  className='h-7 text-xs'
                >
                  Try Again
                </Button>
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className='space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-1'>
                <p className='text-xs text-gray-500 mb-2'>
                  {groupSearchTerm
                    ? `Found ${filteredGroups.length} group${filteredGroups.length !== 1 ? 's' : ''
                    }`
                    : `Your Groups (${filteredGroups.length})`}
                </p>
                {filteredGroups.map((group: any) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    onJoinGroup={handleJoinGroup}
                    onRequestToJoin={handleRequestToJoin}
                    onManageAction={handleManageAction}
                    onViewRequests={setJoinRequestsModal}
                    isRequestingJoin={isRequestingJoin}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-4'>
                {groupSearchTerm ? (
                  <>
                    <p className='text-xs text-gray-500 mb-2'>
                      No groups found for "{groupSearchTerm}"
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setGroupSearchTerm('')}
                      className='h-7 text-xs'
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <p className='text-xs text-gray-500 mb-2'>
                    You don't belong to any groups yet
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Group Dialogs */}
      <GroupDialogs
        leaveDialog={dialogState.leave}
        deleteDialog={dialogState.delete}
        groups={groups}
        isLeaving={isLeaving}
        isDeleting={isDeleting}
        onLeaveGroup={handleLeaveGroup}
        onDeleteGroup={handleDeleteGroup}
        onCloseLeaveDialog={() =>
          setDialogState(prev => ({
            ...prev,
            leave: { isOpen: false, groupId: null },
          }))
        }
        onCloseDeleteDialog={() =>
          setDialogState(prev => ({
            ...prev,
            delete: { isOpen: false, groupId: null },
          }))
        }
      />

      {/* Join Requests Modal */}
      {joinRequestsModal && (
        <GroupJoinRequestsModal
          isOpen={true}
          onClose={() => setJoinRequestsModal(null)}
          groupId={joinRequestsModal.id}
          groupName={joinRequestsModal.name}
          token={token as string}
        />
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <InviteToGroupModal
          isOpen={true}
          onClose={() => setInviteModal(null)}
          group={inviteModal}
          token={token}
        />
      )}
    </div>
  );
}
