'use client';

import { useState, useEffect } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { Inbox } from 'lucide-react';
import type { OutsideMessage } from '@/types/chat.types';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OutsideMessagesTabProps {
  selectedMessageId?: string | null;
  onSelectMessage: (msg: OutsideMessage) => void;
}

export default function OutsideMessagesTab({
  selectedMessageId,
  onSelectMessage,
}: OutsideMessagesTabProps) {
  const { getToken } = useAuthToken();
  const [outsideMessages, setOutsideMessages] = useState<OutsideMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchOutsideMessages();
  }, []);

  const fetchOutsideMessages = async () => {
    try {
      setIsLoading(true);
      const token = getToken();
      const response = await axios.get(`${baseUrl}/outside-messages/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = response.data.data ?? response.data;
      const raw = payload?.items ?? payload;
      setOutsideMessages(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error('Failed to fetch outside messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const token = getToken();
      await axios.patch(`${baseUrl}/outside-messages/${messageId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutsideMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, status: 'read' } : m)
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleSelect = (msg: OutsideMessage) => {
    onSelectMessage(msg);
    if (msg.status === 'unread') {
      markAsRead(msg.id);
    }
  };

  const unreadCount = outsideMessages.filter(m => m.status === 'unread').length;

  const getInitials = (name: string) =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const formatTime = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512]'></div>
        <span className='ml-2 text-gray-500'>Loading messages...</span>
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
      {/* Section header */}
      <div className='px-4 py-2 bg-gray-50 dark:bg-darkBg-interactive border-b border-gray-100 dark:border-darkBorder-light flex items-center justify-between flex-shrink-0'>
        <p className='text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide'>
          Inbox {unreadCount > 0 && `· ${unreadCount} unread`}
        </p>
        <button
          onClick={fetchOutsideMessages}
          className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
        >
          Refresh
        </button>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {outsideMessages.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full py-12 text-center'>
            <Inbox size={32} className='text-gray-300 dark:text-gray-600 mb-2' />
            <p className='text-sm text-gray-500 dark:text-gray-400'>No outside messages</p>
          </div>
        ) : (
          outsideMessages.map(msg => {
            const isUnread = msg.status === 'unread';
            const isActive = selectedMessageId === msg.id;
            return (
              <div
                key={msg.id}
                onClick={() => handleSelect(msg)}
                className={cn(
                  'p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-darkBg-interactive',
                  isActive
                    ? 'bg-brand-green/10 dark:bg-brand-gold/10 border-l-4 border-l-brand-green dark:border-l-brand-gold shadow-sm'
                    : isUnread
                      ? 'bg-gray-50 dark:bg-darkBg-card border-l-2 border-l-brand-green dark:border-l-brand-gold'
                      : ''
                )}
              >
                <div className='flex items-center gap-2 sm:gap-3'>
                  <Avatar className='h-10 w-10 flex-shrink-0'>
                    <AvatarFallback className='bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium'>
                      {getInitials(msg.senderName || '?')}
                    </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-center'>
                      <p className={cn(
                        'truncate text-sm sm:text-base',
                        isUnread && !isActive
                          ? 'font-bold text-gray-900 dark:text-white'
                          : 'font-medium'
                      )}>
                        {msg.senderName}
                      </p>
                      <div className='flex items-center gap-2 ml-1 flex-shrink-0'>
                        {isUnread && (
                          <Badge className='bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center'>
                            1
                          </Badge>
                        )}
                        <span className='text-xs text-gray-500 whitespace-nowrap'>
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className={cn(
                      'text-xs sm:text-sm truncate mt-1',
                      isUnread && !isActive
                        ? 'text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {msg.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
