'use client';

import { Button } from '@/components/ui/button';
import { MessageCirclePlus, Users, Link, UserPlus, Search } from 'lucide-react';
import type { FilterType } from './conversation-filters';

interface EmptyStateProps {
  filterType: FilterType;
  hasSearchTerm: boolean;
  onStartNewChat: () => void;
  onViewMyGroups: () => void;
  onJoinGroupByLink: () => void;
  onAddContact: () => void;
}

export default function EmptyState({
  filterType,
  hasSearchTerm,
  onStartNewChat,
  onViewMyGroups,
  onJoinGroupByLink,
  onAddContact,
}: EmptyStateProps) {
  if (hasSearchTerm) {
    return (
      <div className='flex flex-col items-center justify-center h-full text-gray-500 p-6'>
        <Search size={40} className='mb-3 text-gray-400' />
        <p className='text-center mb-2'>No conversations found</p>
        <p className='text-sm text-gray-400 text-center'>
          Try searching with different keywords
        </p>
      </div>
    );
  }

  const getEmptyStateContent = () => {
    switch (filterType) {
      case 'users':
        return {
          icon: <MessageCirclePlus size={40} className='mb-3 text-gray-400' />,
          title: 'No direct messages',
          subtitle: 'Start a conversation with your contacts',
          actions: [
            {
              onClick: onStartNewChat,
              icon: MessageCirclePlus,
              label: 'Start New Chat',
              variant: 'default' as const,
            },
            {
              onClick: onAddContact,
              icon: UserPlus,
              label: 'Add Contact',
              variant: 'outline' as const,
            },
          ],
        };
      case 'groups':
        return {
          icon: <Users size={40} className='mb-3 text-gray-400' />,
          title: 'No group chats',
          subtitle: 'Join a group to get started',
          actions: [
            {
              onClick: onJoinGroupByLink,
              icon: Link,
              label: 'Join Group',
              variant: 'default' as const,
            },
          ],
        };
      default:
        return {
          icon: <MessageCirclePlus size={40} className='mb-3 text-gray-400' />,
          title: 'No conversations yet',
          subtitle: 'Start chatting with your contacts',
          actions: [
            {
              onClick: onStartNewChat,
              icon: MessageCirclePlus,
              label: 'Start New Chat',
              variant: 'default' as const,
            },
            {
              onClick: onViewMyGroups,
              icon: Users,
              label: 'My Groups',
              variant: 'outline' as const,
            },
            {
              onClick: onAddContact,
              icon: UserPlus,
              label: 'Add Contact',
              variant: 'outline' as const,
            },
          ],
        };
    }
  };

  const { icon, title, subtitle, actions } = getEmptyStateContent();

  return (
    <div className='flex flex-col items-center justify-center h-full text-gray-500 p-6'>
      {icon}
      <p className='text-center mb-2 font-medium'>{title}</p>
      <p className='text-sm text-gray-400 text-center mb-6'>{subtitle}</p>
      <div className='space-y-2 w-full max-w-48'>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            onClick={action.onClick}
            className='w-full'
            size='sm'
          >
            <action.icon size={16} className='mr-2' />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
