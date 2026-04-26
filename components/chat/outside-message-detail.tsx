'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import type { OutsideMessage } from '@/types/chat.types';

interface OutsideMessageDetailProps {
  message: OutsideMessage;
  showOnMobile: boolean;
  onBackClick: () => void;
  onDelete: (id: string) => void;
}

export default function OutsideMessageDetail({
  message,
  showOnMobile,
  onBackClick,
}: OutsideMessageDetailProps) {
  const getInitials = (name: string) =>
    name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Re: Your message');
    const body = encodeURIComponent(`Hi ${message.senderName},\n\n`);
    window.open(`mailto:${message.senderContact}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className={`
      ${showOnMobile ? 'flex' : 'hidden'}
      md:flex flex-col flex-1
      bg-gray-50 dark:bg-darkBg-main
      h-full
    `}>
      {/* Header — matches ChatHeader style */}
      <div className='flex items-center justify-between px-3 sm:px-4 py-3 bg-white dark:bg-darkBg-card border-b border-gray-100 dark:border-darkBorder-light shadow-sm flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onBackClick}
            className='md:hidden h-8 w-8 text-gray-600 dark:text-gray-400'
          >
            <ArrowLeft size={18} />
          </Button>

          <Avatar className='h-9 w-9'>
            <AvatarFallback className='bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium'>
              {getInitials(message.senderName || '?')}
            </AvatarFallback>
          </Avatar>

          <div>
            <p className='font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight'>
              {message.senderName}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              {message.senderContact}
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <span className='flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-darkBg-interactive px-2 py-1 rounded-full'>
            <Mail size={12} />
            Outside Message
          </span>
        </div>
      </div>

      {/* Message body */}
      <div className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-4'>
        <div className='flex flex-col gap-1'>
          {/* Bubble on left — it's an inbound message */}
          <div className='max-w-[75%] sm:max-w-[60%] bg-white dark:bg-darkBg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-darkBorder-light'>
            <p className='text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words'>
              {message.message}
            </p>
          </div>
          <span className='text-xs text-gray-400 dark:text-gray-500 ml-1'>
            {new Date(message.createdAt).toLocaleString()}
            {message.readAt && (
              <span className='ml-2'>· Read {new Date(message.readAt).toLocaleString()}</span>
            )}
          </span>
        </div>
      </div>

      {/* Footer — reply via email */}
      <div className='flex-shrink-0 p-3 sm:p-4 border-t border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card'>
        <Button
          onClick={handleSendEmail}
          className='bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main text-xs sm:text-sm py-2 px-4 rounded-lg shadow-sm transition-all duration-200'
        >
          <Send size={14} className='mr-2' />
          Send Email to {message.senderContact}
        </Button>
      </div>
    </div>
  );
}
