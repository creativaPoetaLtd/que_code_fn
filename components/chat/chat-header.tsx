'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Conversation } from '@/types/chat.types';
import { useChat } from '@/context/ChatContext';
import { useGetGroupByIdQuery } from '@/states/groupSlice';
import { useAuthToken } from '@/hooks/use-auth-token';
import FundraisingProgressBadge from './fundraising-progress-badge';
import { socketService } from '@/services/socketService';
import {
  ArrowLeft,
  Info,
  UserPlus,
  MoreVertical,
  Settings,
  Users,
  Circle,
  Wifi,
  Lock,
  Trash2,
} from 'lucide-react';

interface ChatHeaderProps {
  conversation: Conversation;
  onBackClick: () => void;
  onViewProfile: () => void;
  onInviteToGroup?: () => void;
  onGroupSettings?: () => void;
}

export default function ChatHeader({
  conversation,
  onBackClick,
  onViewProfile,
  onInviteToGroup,
  onGroupSettings,
}: ChatHeaderProps) {
  const chat = useChat();
  const { getToken } = useAuthToken();
  const token = getToken();

  // Fetch group details if it's a group chat
  const { data: groupData, refetch: refetchGroupData } = useGetGroupByIdQuery(
    { groupId: conversation.groupId!, token: token! },
    { skip: !conversation.isGroup || !conversation.groupId || !token }
  );

  const group = groupData?.data;

  // Listen for real-time fundraising progress updates
  useEffect(() => {
    if (!conversation.isGroup || !conversation.groupId) return;

    const handleProgressUpdate = (data: any) => {
      // Check if the update is for this group
      if (data.groupId === conversation.groupId) {
        // Refetch group data to get latest progress
        refetchGroupData();
      }
    };

    socketService.onFundraisingProgress(handleProgressUpdate);

    return () => {
      socketService.offFundraisingProgress(handleProgressUpdate);
    };
  }, [conversation.isGroup, conversation.groupId, refetchGroupData]);

  const getOnlineStatus = () => {
    if (conversation.isGroup) {
      return `${conversation.isOnline ? 1 : 0} online`;
    }
    return conversation.isOnline ? 'Online' : 'Last seen recently';
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className='flex items-center justify-between px-3 sm:px-4 py-3 bg-white dark:bg-darkBg-card border-b border-gray-100 dark:border-darkBorder-light shadow-sm'>
      {/* Back Button - Mobile Only */}
      <Button
        variant='ghost'
        size='icon'
        onClick={onBackClick}
        className='h-9 w-9 md:hidden hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors'
        aria-label='Back to conversations'
      >
        <ArrowLeft size={18} />
      </Button>

      {/* Conversation Info */}
      <div className='flex items-center gap-3 flex-1 min-w-0'>
        <div className='relative'>
          <Avatar className='h-10 w-10 border-2 border-gray-100'>
            <AvatarImage
              src={conversation.avatar}
              alt={conversation.name || 'User'}
            />
            <AvatarFallback className='bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-medium'>
              {getInitials(conversation.name)}
            </AvatarFallback>
          </Avatar>
          {!conversation.isGroup && conversation.isOnline && (
            <Circle
              size={10}
              className='absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500 border-2 border-white rounded-full'
            />
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <h1 className='text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate'>
              {conversation.name || 'Unknown Contact'}
            </h1>
          </div>

          {/* Fundraising Progress for Groups */}
          {conversation.isGroup && group?.hasFundraising && group.fundraisingTarget && (
            <div className="mt-1">
              <FundraisingProgressBadge
                currentAmount={group.walletBalance ?? group.fundraisingCurrentAmount ?? 0}
                targetAmount={group.fundraisingTarget}
              />
            </div>
          )}

          {/* Online Status (only show if not fundraising) */}
          {!(conversation.isGroup && group?.hasFundraising) && (
            <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate'>
              {getOnlineStatus()}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex items-center gap-1'>
        {/* Quick Actions - Desktop */}
        <div className='hidden sm:flex items-center gap-1'>
          {conversation.isGroup && onInviteToGroup && (
            <Button
              variant='ghost'
              size='icon'
              onClick={onInviteToGroup}
              className='h-9 w-9 hover:bg-gray-100 transition-colors'
              aria-label='Add members'
            >
              <UserPlus size={16} />
            </Button>
          )}
        </div>

        {/* Profile/Info Button */}
        <Button
          variant='ghost'
          size='icon'
          onClick={onViewProfile}
          className='h-9 w-9 hover:bg-gray-100 transition-colors'
          aria-label='View profile'
        >
          <Info size={16} />
        </Button>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-9 w-9 hover:bg-gray-100 transition-colors'
              aria-label='More options'
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
            <DropdownMenuItem
              onClick={onViewProfile}
              className='cursor-pointer'
            >
              <Info size={14} className='mr-2' />
              View Profile
            </DropdownMenuItem>
            {conversation.isGroup && onInviteToGroup && (
              <>
                <DropdownMenuItem
                  onClick={onInviteToGroup}
                  className='cursor-pointer'
                >
                  <UserPlus size={14} className='mr-2' />
                  Add Members
                </DropdownMenuItem>

                {onGroupSettings && (
                  <DropdownMenuItem
                    onClick={onGroupSettings}
                    className='cursor-pointer'
                  >
                    <Settings size={14} className='mr-2' />
                    Group Settings
                  </DropdownMenuItem>
                )}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem className='cursor-pointer'>
              <Settings size={14} className='mr-2' />
              Chat Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => chat.initializeEncryption()}
              className='cursor-pointer'
            >
              <Lock size={14} className='mr-2' />
              Initialize Encryption
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                chat.activeChat && chat.deleteChat(chat.activeChat)
              }
              className='cursor-pointer text-red-600 hover:text-red-700'
            >
              <Trash2 size={14} className='mr-2' />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
