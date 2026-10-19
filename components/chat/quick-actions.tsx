'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageCircle,
  UserPlus,
  PlusCircle,
  Link,
  MoreVertical,
  ArrowLeft,
} from 'lucide-react';
import { useGetPendingInvitationsUnifiedQuery } from '@/states/contactSlice';
import { useAuthToken } from '@/hooks/use-auth-token';

interface QuickActionsProps {
  onAddContact: () => void;
  onStartNewChat: () => void;
  onCreateGroup: () => void;
  onJoinGroupByLink: () => void;
  onViewContactRequests: () => void;
}

export default function QuickActions({
  onAddContact,
  onStartNewChat,
  onCreateGroup,
  onJoinGroupByLink,
  onViewContactRequests,
}: QuickActionsProps) {
  const { getToken } = useAuthToken();
  const token = getToken();

  const { data: pendingContactRequests } = useGetPendingInvitationsUnifiedQuery(
    {
      token: token!,
      page: 1,
      limit: 20,
    },
    { skip: !token }
  );

  const contactRequestsCount = pendingContactRequests?.invitations?.length || 0;

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex min-w-0 items-center gap-1.5'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          onClick={() => window.history.back()}
          className='-ml-1.5 h-8 w-8 flex-shrink-0 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-darkBg-interactive'
          aria-label='Go back'
        >
          <ArrowLeft size={16} />
        </Button>
        <h2 className='truncate text-xl font-bold leading-tight text-gray-900 dark:text-white'>
          Messages
        </h2>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='-mr-1.5 h-8 w-8 flex-shrink-0 rounded-full hover:bg-gray-100 dark:hover:bg-darkBg-interactive'
            aria-label='More options'
          >
            <MoreVertical
              size={16}
              className='text-gray-600 dark:text-gray-400'
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-52'>
          <DropdownMenuItem onClick={onStartNewChat}>
            <MessageCircle size={14} className='mr-2' />
            Start New Chat
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onAddContact}>
            <UserPlus size={14} className='mr-2' />
            Add Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onViewContactRequests}>
            <UserPlus size={14} className='mr-2' />
            Contact Requests
            {contactRequestsCount > 0 && (
              <Badge className='ml-auto flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0 text-[10px] leading-none text-white dark:bg-red-600'>
                {contactRequestsCount}
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateGroup}>
            <PlusCircle size={14} className='mr-2' />
            Create Group
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onJoinGroupByLink}>
            <Link size={14} className='mr-2' />
            Join Group by Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
