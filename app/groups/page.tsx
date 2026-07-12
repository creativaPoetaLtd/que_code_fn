"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    UsersRound,
    Search,
    Plus,
    MessageSquare,
    MoreHorizontal,
    Settings2,
    X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, LastMessage } from "@/types/chat.types";
import { useAuthToken } from "@/hooks/use-auth-token";
import GroupSettingsModal from "@/components/chat/group-settings-modal";
import CreateGroupModal from "@/components/chat/create-group-modal";
import { BackButton } from "@/components/shared/BackButton";

const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

const formatLastMessage = (msg: LastMessage | null | undefined): string => {
    if (!msg) return "No messages yet";
    const prefix = typeof msg.sender === "object" ? `${msg.sender.firstName}: ` : "";
    switch (msg.messageType) {
        case "money": return `${prefix}💰 Money transfer`;
        case "image": return `${prefix}📷 Photo`;
        case "audio": return `${prefix}🎤 Voice message`;
        case "file":
        case "document": return `${prefix}📎 File`;
        default: return `${prefix}${msg.content || "Message"}`;
    }
};

export default function GroupsPage() {
    const { isExpanded } = useSidebar();
    const { conversations } = useChat();
    const router = useRouter();
    const { getToken } = useAuthToken();
    const token = getToken();

    const [settingsGroupId, setSettingsGroupId] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

    const groups = useMemo(() => conversations.filter((c) => c.isGroup), [conversations]);

    const filteredGroups = useMemo(() => {
        const bySearch = groups.filter((g) =>
            g.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (activeTab === "unread") return bySearch.filter((g) => g.unreadCount > 0);
        return bySearch;
    }, [groups, searchQuery, activeTab]);

    const unreadGroups = useMemo(() => groups.filter((g) => g.unreadCount > 0), [groups]);

    const handleChat = (group: Conversation) => {
        router.push(`/chat?chatId=${group.id}`);
    };

    const handleOpenSettings = (group: Conversation, e: React.MouseEvent) => {
        e.stopPropagation();
        setSettingsGroupId(group.groupId ?? group.id);
        setIsSettingsOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-darkBg-main">
            <Navigation />

            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <Header />
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
                        {/* Page header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <BackButton className="mb-4" />
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Click a group to open the chat</p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                <div className={cn(
                                    "flex items-center transition-all duration-300 overflow-hidden",
                                    isSearchExpanded ? "w-44 sm:w-64" : "w-10"
                                )}>
                                    {isSearchExpanded ? (
                                        <div className="relative w-full">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                            <Input
                                                autoFocus
                                                placeholder="Search groups..."
                                                className="pl-9 pr-8 bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onBlur={() => { if (!searchQuery.trim()) setIsSearchExpanded(false); }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => { setSearchQuery(""); setIsSearchExpanded(false); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setIsSearchExpanded(true)}
                                            className="bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light"
                                        >
                                            <Search className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    )}
                                </div>

                                <Button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="gap-2 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main shadow-sm"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Create Group</span>
                                </Button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-darkBorder-light mb-6 overflow-x-auto scrollbar-hide flex-shrink-0">
                            {(["all", "unread"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                        activeTab === tab
                                            ? "text-brand-green dark:text-brand-gold"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    {tab === "all" ? `All (${groups.length})` : `Unread (${unreadGroups.length})`}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green dark:bg-brand-gold" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Group list */}
                        <div className="flex-1 overflow-y-auto pr-1">
                            <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                {filteredGroups.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-darkBg-interactive flex items-center justify-center mb-3">
                                            <UsersRound size={24} className="text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {searchQuery ? "No results found" : activeTab === "unread" ? "No unread groups" : "No groups yet"}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                            {searchQuery
                                                ? `No groups match "${searchQuery}"`
                                                : activeTab === "unread"
                                                    ? "You're all caught up"
                                                    : "Create a group to get started"}
                                        </p>
                                        {!searchQuery && activeTab === "all" && (
                                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                                <Plus className="h-4 w-4 mr-1.5" /> Create Group
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-darkBorder-light">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                    Group
                                                </th>
                                                <th className="px-4 py-3 w-16" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredGroups.map((group) => {
                                                const initials = getInitials(group.name || "G");
                                                const lastMsg = formatLastMessage(group.lastMessage);
                                                const timeAgo = group.lastMessage?.createdAt
                                                    ? formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: true })
                                                    : null;

                                                return (
                                                    <tr
                                                        key={group.id}
                                                        onClick={() => handleChat(group)}
                                                        className="group cursor-pointer transition-colors border-b border-gray-100 dark:border-darkBorder-light last:border-0 hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex-shrink-0">
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarImage src={group.avatar} alt={group.name} />
                                                                        <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold text-sm">
                                                                            {initials}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    {group.unreadCount > 0 && (
                                                                        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-[9px] font-bold flex items-center justify-center">
                                                                            {group.unreadCount > 99 ? "99+" : group.unreadCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-baseline justify-between gap-2">
                                                                        <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                                                                            {group.name}
                                                                        </p>
                                                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                                                            {timeAgo ?? `${group.memberCount ?? 0} members`}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                                        {lastMsg}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td
                                                            className="px-4 py-3 text-right"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-40">
                                                                    <DropdownMenuItem onClick={() => handleChat(group)}>
                                                                        <MessageSquare className="h-4 w-4 mr-2" /> Open Chat
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => handleOpenSettings(group, e)}>
                                                                        <Settings2 className="h-4 w-4 mr-2" /> Settings
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <GroupSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => { setIsSettingsOpen(false); setSettingsGroupId(null); }}
                groupId={settingsGroupId}
            />
            <CreateGroupModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                token={token}
            />
        </div>
    );
}
