"use client";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetUserChatsQuery } from '@/states/chatSlice';
import { MessageCircle, Send } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { parseMessageContent } from '@/utils/messageUtils';
import { cn } from '@/lib/utils';
import { DASHBOARD_SURFACE } from './Dashboard/DashboardCard';

interface ChatMessage {
    id: string;
    userId?: string;
    name: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        sender: string;
        messageType?: string;
    };
    avatar?: string;
}

export const RecentMessages: React.FC = () => {
    const router = useRouter();
    const { getToken } = useAuthToken();
    const token = getToken();
    const [conversations, setConversations] = useState<ChatMessage[]>([]);

    const { data: chatsData, isLoading, error } = useGetUserChatsQuery(undefined, {
        skip: !token
    });

    useEffect(() => {
        if (chatsData?.data) {
            const formattedChats = chatsData.data.slice(0, 5).map((chat: any) => ({
                id: chat.id,
                userId: chat.otherUser?.id,
                name: chat.name || 'Unknown Chat',
                lastMessage: chat.lastMessage ? {
                    content: parseMessageContent(
                        chat.lastMessage.content || '',
                        chat.lastMessage.messageType || 'text'
                    ),
                    createdAt: chat.lastMessage.createdAt,
                    sender: chat.lastMessage.sender || 'Unknown',
                    messageType: chat.lastMessage.messageType || 'text'
                } : undefined,
                avatar: chat.avatar
            }));
            setConversations(formattedChats);
        }
    }, [chatsData]);

    const getTimeDisplay = (createdAt: string) => {
        const messageDate = new Date(createdAt);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return messageDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const truncateText = (text: string, maxLength: number = 60) => {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    if (isLoading) {
        return (
            <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">
                        Recent messages
                    </h3>
                </div>
                <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512] mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-3">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">
                        Recent messages
                    </h3>
                </div>
                <div className="px-4 py-8 text-center">
                    <p className="text-red-500 font-medium">Failed to load messages</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please try again later</p>
                </div>
            </div>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
                <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">
                        Recent messages
                    </h3>
                </div>
                <div className="px-4 py-8 text-center">
                    <div className="w-16 h-16 bg-[#00B512]/10 dark:bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle size={32} className="text-[#00B512] dark:text-[#D4AF37]" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">No conversations yet</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Start a conversation to connect with your contacts</p>
                    <button
                        onClick={() => router.push('/chat')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00B512] dark:bg-[#D4AF37] text-white dark:text-[#00313A] rounded-full text-sm font-medium hover:bg-[#00B512]/90 dark:hover:bg-[#C9A530] transition-colors shadow-sm hover:shadow-md"
                    >
                        <Send size={16} />
                        Start messaging
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
                <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">
                    Recent messages
                </h3>
                <button
                    onClick={() => router.push('/chat')}
                    className="text-xs font-semibold text-brand-green transition-opacity hover:opacity-70 dark:text-brand-gold"
                >
                    View all
                </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-darkBorder-light">
                {conversations.map((chat) => (
                    <div
                        key={chat.id}
                        className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors duration-200 cursor-pointer"
                        onClick={() => router.push('/chat')}
                    >
                        <div className="flex items-start gap-2.5">
                            <UserAvatar
                                userId={chat.userId}
                                profileImage={chat.avatar}
                                firstName={chat.name.split(' ')[0]}
                                lastName={chat.name.split(' ')[1] || ''}
                                className="w-9 h-9"
                                userType="user"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{chat.name}</p>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                        {chat.lastMessage ? getTimeDisplay(chat.lastMessage.createdAt) : ''}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                    {chat.lastMessage ? truncateText(chat.lastMessage.content) : 'No messages yet'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentMessages;