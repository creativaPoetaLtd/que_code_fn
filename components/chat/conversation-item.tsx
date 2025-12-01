'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat.types';
import { formatTimestampWithoutSeconds } from '@/utils/timeUtils';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const hasUnread = (conversation.unreadCount || 0) > 0;

  return (
    <div
      className={cn(
        'p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 transform hover:translate-x-1',
        isActive
          ? 'bg-green-50 border-l-4 border-l-[#00B512] shadow-sm'
          : hasUnread
          ? 'bg-blue-50 border-l-2 border-l-blue-400'
          : ''
      )}
      onClick={onClick}
    >
      <div className='flex items-center gap-2 sm:gap-3'>
        <div className='relative flex-shrink-0'>
          {conversation.isGroup ? (
            <div className='bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white'>
              <Users size={18} />
            </div>
          ) : (
            <div className='relative'>
              <Avatar className='h-10 w-10'>
                <AvatarImage
                  src={conversation.avatar || '/placeholder.svg'}
                  alt={conversation.name || 'User'}
                />
                <AvatarFallback>
                  {(conversation.name || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {conversation.isOnline && (
                <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full'></span>
              )}
            </div>
          )}
        </div>

        <div className='flex-1 min-w-0'>
          <div className='flex justify-between items-center'>
            <p className={cn(
              'font-medium truncate text-sm sm:text-base',
              hasUnread && !isActive && 'font-bold text-gray-900'
            )}>
              {conversation.name || 'Unknown Contact'}
            </p>
            <div className='flex items-center gap-2'>
              {hasUnread && (
                <Badge className='bg-[#00B512] text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center'>
                  {conversation.unreadCount}
                </Badge>
              )}
              <span className='text-xs text-gray-500 whitespace-nowrap'>
                {(formatTimestampWithoutSeconds(conversation.timestamp)) || ''}
              </span>
            </div>
          </div>

          <div className='flex justify-between items-center mt-1'>
            <p className={cn(
              'text-xs sm:text-sm truncate max-w-[70%]',
              hasUnread && !isActive ? 'text-gray-900 font-semibold' : 'text-gray-500'
            )}>
              {conversation.isGroup && conversation.memberCount && (
                <span className='text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 mr-1.5 hidden sm:inline-block'>
                  {conversation.isOnline ? 1 : 0}/{conversation.memberCount}
                </span>
              )}
              {conversation.lastMessage?.content || ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
