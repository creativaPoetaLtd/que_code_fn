'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BellOff,
  Check,
  CheckCheck,
  FileText,
  Headphones,
  Image as ImageIcon,
  Music,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat.types';
import { formatTimestampWithoutSeconds } from '@/utils/timeUtils';
import { getChatPreviewText } from '@/utils/chatPreview';
import { getInitials, isPlaceholderAvatar } from '@/utils/avatar';
import GalleryRing from '@/components/ui/gallery-ring';
import { useAuthToken } from '@/hooks/use-auth-token';

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
  const { getUserId } = useAuthToken();
  const currentUserId = getUserId();
  const hasUnread = (conversation.unreadCount || 0) > 0;
  const isSupport = conversation.type === 'support';
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const readMutedState = () => {
      if (typeof window === 'undefined') return;
      const muted = JSON.parse(
        localStorage.getItem('qc-muted-conversations') || '{}'
      ) as Record<string, boolean>;
      setIsMuted(Boolean(muted[conversation.id]));
    };

    readMutedState();
    window.addEventListener('qc-muted-conversations-changed', readMutedState);
    return () =>
      window.removeEventListener(
        'qc-muted-conversations-changed',
        readMutedState
      );
  }, [conversation.id]);

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
  const isOutgoingPreview = conversation.lastMessage?.sender === 'You';
  const isReadPreview = Boolean(
    conversation.lastMessage?.readBy?.some(
      receipt => receipt.userId && receipt.userId !== currentUserId
    )
  );
  const isDeliveredPreview = Boolean(
    conversation.lastMessage?.deliveryConfirmed ||
      conversation.lastMessage?.deliveredAt ||
      isReadPreview
  );
  const PreviewStatusIcon = isOutgoingPreview
    ? isReadPreview || isDeliveredPreview
      ? CheckCheck
      : Check
    : null;

  // The timestamp / unread column sits where the hover "quick send" button appears,
  // so in DMs it fades out instead of being covered by it.
  const metaFadeOnHover = conversation.isGroup
    ? ''
    : 'transition-opacity duration-150 group-hover:opacity-0';

  return (
    <div
      className={cn(
        // The selected/unread accent is painted as an inset bar rather than a left
        // border so switching rows never nudges the row content sideways.
        'relative cursor-pointer border-b border-gray-100 px-3 py-2 transition-colors duration-150 dark:border-darkBorder-light',
        'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-transparent',
        'hover:bg-gray-50 dark:hover:bg-darkBg-interactive',
        isSupport &&
          !isActive &&
          'bg-emerald-50/70 dark:bg-emerald-950/20 before:bg-emerald-500',
        isActive
          ? 'bg-brand-green/10 dark:bg-brand-gold/10 before:bg-brand-green dark:before:bg-brand-gold'
          : hasUnread
            ? 'bg-gray-50 dark:bg-darkBg-card before:bg-brand-green dark:before:bg-brand-gold'
            : ''
      )}
      onClick={onClick}
    >
      <div className='flex items-center gap-3'>
        <div className='relative h-10 w-10 flex-shrink-0'>
          {isSupport ? (
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white'>
              <Headphones size={18} />
            </div>
          ) : conversation.isGroup ? (
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-700'>
              <Users size={18} />
            </div>
          ) : (
            <>
              <GalleryRing
                active={Boolean(conversation.hasGallery)}
                gapClassName='bg-white dark:bg-darkBg-main'
              >
                <Avatar className={cn(conversation.hasGallery ? 'h-[34px] w-[34px]' : 'h-10 w-10')}>
                  {!isPlaceholderAvatar(conversation.avatar) && (
                    <AvatarImage
                      src={conversation.avatar}
                      alt={conversation.name || 'User'}
                    />
                  )}
                  <AvatarFallback className='text-sm font-semibold'>
                    {getInitials(conversation.name)}
                  </AvatarFallback>
                </Avatar>
              </GalleryRing>
              {conversation.isOnline && (
                <span className='absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-darkBg-card'></span>
              )}
            </>
          )}
        </div>

        <div className='min-w-0 flex-1'>
          {/* Name + time share a baseline */}
          <div className='flex items-baseline gap-2'>
            <p
              className={cn(
                'm-0 min-w-0 flex-1 truncate text-[14px] leading-[18px]',
                hasUnread && !isActive
                  ? 'font-bold text-gray-900 dark:text-white'
                  : 'font-semibold'
              )}
            >
              {conversation.name || 'Unknown Contact'}
            </p>
            <span
              className={cn(
                'shrink-0 whitespace-nowrap text-[11px] leading-[14px]',
                metaFadeOnHover,
                hasUnread
                  ? 'font-semibold text-brand-green dark:text-brand-gold'
                  : 'text-gray-500'
              )}
            >
              {formatTimestampWithoutSeconds(conversation.timestamp) || ''}
            </span>
          </div>

          {/* Preview + unread/mute indicators */}
          <div className='mt-0.5 flex items-center gap-2'>
            <p
              className={cn(
                'm-0 min-w-0 flex-1 truncate text-[12px] leading-[16px]',
                hasUnread && !isActive
                  ? 'font-semibold text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {PreviewStatusIcon && (
                <PreviewStatusIcon
                  className={cn(
                    'mr-1 inline h-3.5 w-3.5 align-[-2px]',
                    isReadPreview ? 'text-[#34b7f1]' : 'text-gray-500'
                  )}
                />
              )}
              {conversation.isGroup && conversation.memberCount && (
                <span className='mr-1.5 hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600 dark:bg-darkBg-interactive dark:text-gray-400 sm:inline-block'>
                  {conversation.isOnline ? 1 : 0}/{conversation.memberCount}
                </span>
              )}
              {MediaPreviewIcon && (
                <MediaPreviewIcon className='mr-1.5 inline h-3.5 w-3.5 align-[-2px]' />
              )}
              {lastMessagePreview}
            </p>

            <div
              className={cn(
                'flex shrink-0 items-center gap-1',
                metaFadeOnHover
              )}
            >
              {hasUnread && (
                <Badge className='flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-green px-1.5 py-0 text-[10px] leading-none text-white dark:bg-brand-gold dark:text-darkBg-main'>
                  {conversation.unreadCount}
                </Badge>
              )}
              {isMuted && (
                <BellOff className='h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500' />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}