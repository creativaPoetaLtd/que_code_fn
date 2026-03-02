"use client";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetUserChatsQuery } from '@/states/chatSlice';
import { MessageCircle, Send } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';

interface ChatMessage {
    id: string;
    name: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        sender: string;
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
                name: chat.name || 'Unknown Chat',
                lastMessage: chat.lastMessage ? {
                    content: chat.lastMessage.content || '',
                    createdAt: chat.lastMessage.createdAt,
                    sender: chat.lastMessage.sender || 'Unknown'
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
            <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
                        Recent messages
                    </h3>
                </div>
                <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B512] mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-3">Loading messages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
                        Recent messages
                    </h3>
                </div>
                <div className="p-6 text-center">
                    <p className="text-red-500 font-medium">Failed to load messages</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Please try again later</p>
                </div>
            </div>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
                <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
                        Recent messages
                    </h3>
                </div>
                <div className="p-8 text-center">
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
        <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden\">
            <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light\">
                <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">
                    Recent messages
                </h3>
                <button
                    onClick={() => router.push('/chat')}
                    className="relative text-sm text-[#00B512] dark:text-[#D4AF37] hover:text-[#00B512]/80 dark:hover:text-[#C9A530] transition-colors duration-200 font-medium group"
                >
                    View all
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#00B512] dark:bg-[#D4AF37] group-hover:w-full transition-all duration-300 ease-out"></span>
                </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-darkBorder-light">
                {conversations.map((chat) => (
                    <div
                        key={chat.id}
                        className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors duration-200 cursor-pointer"
                        onClick={() => router.push('/chat')}
                    >
                        <div className="flex items-start gap-2.5">
                            <UserAvatar
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