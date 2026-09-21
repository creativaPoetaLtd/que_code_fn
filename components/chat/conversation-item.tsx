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

  return (
    <div
      className={cn(
        'relative h-[48px] border-b border-gray-100 px-3 dark:border-darkBorder-light cursor-pointer hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-all duration-200',
        isSupport &&
          !isActive &&
          'bg-emerald-50/70 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500',
        isActive
          ? 'bg-brand-green/10 dark:bg-brand-gold/10 border-l-4 border-l-brand-green dark:border-l-brand-gold'
          : hasUnread
            ? 'bg-gray-50 dark:bg-darkBg-card border-l-2 border-l-brand-green dark:border-l-brand-gold'
            : ''
      )}
      onClick={onClick}
    >
      <div className='grid h-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-2.5'>
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

        <div className='flex h-10 min-w-0 flex-col justify-center'>
          <p
            className={cn(
              'm-0 truncate text-[14px] font-semibold leading-[15px]',
              hasUnread && !isActive && 'font-bold text-gray-900 dark:text-white'
            )}
          >
            {conversation.name || 'Unknown Contact'}
          </p>
          <p
            className={cn(
              'm-0 mt-1 min-w-0 truncate text-[12px] leading-[14px]',
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
              <span className='mr-1.5 hidden rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-darkBg-interactive dark:text-gray-400 sm:inline-block'>
                {conversation.isOnline ? 1 : 0}/{conversation.memberCount}
              </span>
            )}
            {MediaPreviewIcon && (
              <MediaPreviewIcon className='mr-1.5 inline h-3.5 w-3.5 align-[-2px]' />
            )}
            {lastMessagePreview}
          </p>
        </div>

        <div className='flex h-full min-w-[44px] flex-col items-end justify-start pt-[7px] leading-none'>
          <span
            className={cn(
              'whitespace-nowrap text-[10px] leading-[11px]',
              hasUnread
                ? 'font-semibold text-brand-green dark:text-brand-gold'
                : 'text-gray-500'
            )}
          >
            {formatTimestampWithoutSeconds(conversation.timestamp) || ''}
          </span>
          {hasUnread && (
            <Badge className='mt-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-green px-1.5 py-0 text-[10px] text-white dark:bg-brand-gold dark:text-darkBg-main'>
              {conversation.unreadCount}
            </Badge>
          )}
          {isMuted && !hasUnread && (
            <BellOff className='mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-gray-500' />
          )}
        </div>
      </div>
    </div>
  );
}