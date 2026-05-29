'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Headphones, Image as ImageIcon, Music, Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat.types';
import { formatTimestampWithoutSeconds } from '@/utils/timeUtils';
import { getChatPreviewText } from '@/utils/chatPreview';

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
  const isSupport = conversation.type === 'support';
  const getInitials = (name?: string) => {
    const parts = (name || 'User').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  };
  const lastMessageType = conversation.lastMessage?.messageType;
  const lastMessagePreview = getChatPreviewText({
    content: conversation.lastMessage?.content,
    messageType: lastMessageType,
  });
  const MediaPreviewIcon =
    lastMessageType === 'image'
      ? ImageIcon
      : lastMessageType === 'video'
        ? Video
        : lastMessageType === 'audio'
          ? Music
          : lastMessageType === 'document' || lastMessageType === 'file'
            ? FileText
            : null;

  return (
    <div
      className={cn(
        'p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light cursor-pointer hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-all duration-200',
        isSupport && !isActive &&
          'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500',
        isActive
          ? 'bg-brand-green/10 dark:bg-brand-gold/10 border-l-4 border-l-brand-green dark:border-l-brand-gold shadow-sm'
          : hasUnread
            ? 'bg-gray-50 dark:bg-darkBg-card border-l-2 border-l-brand-green dark:border-l-brand-gold'
            : ''
      )}
      onClick={onClick}
    >
      <div className='flex items-center gap-2 sm:gap-3'>
        <div className='relative flex-shrink-0'>
          {isSupport ? (
            <div className='bg-emerald-600 h-10 w-10 rounded-full flex items-center justify-center text-white'>
              <Headphones size={18} />
            </div>
          ) : conversation.isGroup ? (
            <div className='bg-gray-900 dark:bg-gray-700 h-10 w-10 rounded-full flex items-center justify-center text-white'>
              <Users size={18} />
            </div>
          ) : (
            <div className='relative'>
              <Avatar className='h-10 w-10'>
                {conversation.avatar && (
                  <AvatarImage
                    src={conversation.avatar}
                    alt={conversation.name || 'User'}
                  />
                )}
                <AvatarFallback className='font-semibold text-sm'>
                  {getInitials(conversation.name)}
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
              hasUnread && !isActive && 'font-bold text-gray-900 dark:text-white'
            )}>
              {conversation.name || 'Unknown Contact'}
            </p>
            <div className='flex items-center gap-2'>
              {/* {isSupport && (
                <Badge className='bg-emerald-600 text-white text-[10px] px-2 py-0.5 h-5'>
                  Support
                </Badge>
              )} */}
              {hasUnread && (
                <Badge className='bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center'>
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
              hasUnread && !isActive ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'
            )}>
              {conversation.isGroup && conversation.memberCount && (
                <span className='text-xs bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400 rounded-full px-1.5 py-0.5 mr-1.5 hidden sm:inline-block'>
                  {conversation.isOnline ? 1 : 0}/{conversation.memberCount}
                </span>
              )}
              {MediaPreviewIcon && (
                <MediaPreviewIcon className='mr-1.5 inline h-3.5 w-3.5 align-[-2px]' />
              )}
              {lastMessagePreview}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
