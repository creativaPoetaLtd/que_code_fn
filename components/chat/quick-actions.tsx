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
} from 'lucide-react';
import {
  useGetPendingInvitationsUnifiedQuery,
} from '@/states/contactSlice';
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
    <div>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='text-xl font-bold text-gray-900 dark:text-white'>Messages</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-darkBg-interactive'
            >
              <MoreVertical size={14} className='text-gray-600 dark:text-gray-400' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-48'>
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
                <Badge className='ml-auto bg-red-500 dark:bg-red-600 text-white text-xs scale-75 h-4 min-w-4 p-0'>
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
    </div>
  );
}