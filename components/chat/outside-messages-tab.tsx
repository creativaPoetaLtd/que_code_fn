'use client';

import { useState, useEffect } from 'react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { Mail, Mail as MailOpen, Trash2, MoreVertical } from 'lucide-react';
import type { OutsideMessage } from '@/types/chat.types';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { Button } from '@/components/ui/button';

export default function OutsideMessagesTab() {
  const { getToken } = useAuthToken();
  const [outsideMessages, setOutsideMessages] = useState<OutsideMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<OutsideMessage | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

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
      setOutsideMessages(response.data.data || response.data);
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
      setOutsideMessages(messages =>
        messages.map(msg =>
          msg.id === messageId ? { ...msg, status: 'read' } : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const token = getToken();
      await axios.delete(`${baseUrl}/outside-messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutsideMessages(messages => messages.filter(msg => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const unreadCount = outsideMessages.filter(msg => msg.status === 'unread').length;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-32'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512]'></div>
      </div>
    );
  }

  return (
    <div className='flex h-full'>
      {/* Messages List */}
      <div className='flex-1 flex flex-col border-r border-gray-100 dark:border-darkBorder-light'>
        {/* Header */}
        <div className='flex-shrink-0 p-4 border-b border-gray-100 dark:border-darkBorder-light'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Outside Messages</h3>
              {unreadCount > 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  {unreadCount} unread
                </p>
              )}
            </div>
            <button
              onClick={fetchOutsideMessages}
              className='text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className='flex-1 overflow-y-auto'>
          {outsideMessages.length === 0 ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <Mail size={32} className='mx-auto text-gray-300 dark:text-gray-600 mb-2' />
                <p className='text-gray-500 dark:text-gray-400'>No outside messages</p>
              </div>
            </div>
          ) : (
            <div>
              {outsideMessages.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (msg.status === 'unread') {
                      markAsRead(msg.id);
                    }
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-darkBorder-light cursor-pointer transition-colors ${msg.status === 'unread'
                    ? 'bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                    : 'bg-white dark:bg-darkBg-card hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                    }`}
                >
                  <div className='flex items-start gap-3'>
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${msg.status === 'unread'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      {msg.status === 'unread' ? (
                        <MailOpen size={18} />
                      ) : (
                        <Mail size={18} />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between'>
                        <p className='font-medium text-gray-900 dark:text-white truncate'>
                          {msg.senderName}
                        </p>
                        {msg.status === 'unread' && (
                          <span className='ml-2 inline-block h-2 w-2 bg-blue-500 rounded-full flex-shrink-0'></span>
                        )}
                      </div>
                      <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>
                        {msg.senderContact}
                      </p>
                      <p className='text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2'>
                        {msg.message}
                      </p>
                      <p className='text-xs text-gray-400 dark:text-gray-500 mt-1'>
                        {new Date(msg.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Panel */}
      {selectedMessage && (
        <div className='hidden md:flex flex-col w-80 bg-gray-50 dark:bg-darkBg-main border-l border-gray-100 dark:border-darkBorder-light'>
          {/* Header */}
          <div className='flex-shrink-0 p-4 border-b border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='font-semibold text-gray-900 dark:text-white'>Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className='text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {/* Sender Info */}
            <div className='bg-white dark:bg-darkBg-card p-4 rounded-lg'>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1'>
                From
              </p>
              <p className='font-semibold text-gray-900 dark:text-white'>
                {selectedMessage.senderName}
              </p>
              <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                {selectedMessage.senderContact}
              </p>
            </div>

            {/* Message */}
            <div className='bg-white dark:bg-darkBg-card p-4 rounded-lg'>
              <p className='text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2'>
                Message
              </p>
              <p className='text-gray-900 dark:text-white whitespace-pre-wrap break-words'>
                {selectedMessage.message}
              </p>
            </div>

            {/* Metadata */}
            <div className='bg-white dark:bg-darkBg-card p-4 rounded-lg text-xs text-gray-500 dark:text-gray-400 space-y-1'>
              <div className='flex justify-between'>
                <span>Received:</span>
                <span>
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </span>
              </div>
              {selectedMessage.readAt && (
                <div className='flex justify-between'>
                  <span>Read:</span>
                  <span>
                    {new Date(selectedMessage.readAt).toLocaleString()}
                  </span>
                </div>
              )}
              <div className='flex justify-between'>
                <span>Status:</span>
                <span className='capitalize'>
                  {selectedMessage.status}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex-shrink-0 p-4 border-t border-gray-100 dark:border-darkBorder-light space-y-2'>
            <Button
              onClick={() => deleteMessage(selectedMessage.id)}
              variant='outline'
              className='w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10'
            >
              <Trash2 size={16} className='mr-2' />
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
