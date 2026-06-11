"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { Header } from "@/components/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    UsersRound,
    Search,
    Plus,
    MessageSquare,
    Target,
    MoreHorizontal,
    UserPlus,
    Settings2,
    LogOut,
    Trash2,
    X,
    Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation, LastMessage } from "@/types/chat.types";
import GroupDetailsContent from "@/components/chat/group-details-content";
import { useAuthToken } from "@/hooks/use-auth-token";
import AddMemberModal from "@/components/chat/add-member-modal";
import GroupSettingsModal from "@/components/chat/group-settings-modal";
import CreateGroupModal from "@/components/chat/create-group-modal";
import { BackButton } from "@/components/shared/BackButton";
import { getCurrentUserId } from "@/utils/tokenUtils";

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

// ── Recently Active horizontal scroll row ────────────────────────────────────

function RecentGroupsRow({
    groups,
    selectedId,
    onSelect,
}: {
    groups: Conversation[];
    selectedId: string | null;
    onSelect: (g: Conversation) => void;
}) {
    const recent = useMemo(
        () =>
            [...groups]
                .filter((g) => g.lastMessage)
                .sort((a, b) => {
                    const ta = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                    const tb = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                    return tb - ta;
                })
                .slice(0, 12),
        [groups]
    );

    if (recent.length === 0) return null;

    return (
        <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex w-max space-x-3 px-1">
                {recent.map((group) => {
                    const initials = getInitials(group.name || "G");
                    const isSelected = selectedId === (group.groupId ?? group.id);
                    return (
                        <button
                            key={group.id}
                            onClick={() => onSelect(group)}
                            className={cn(
                                "group flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all focus:outline-none",
                                isSelected
                                    ? "bg-brand-green/10 dark:bg-brand-gold/10"
                                    : "hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                            )}
                        >
                            <div className="relative">
                                <Avatar className={cn(
                                    "h-12 w-12 ring-2 transition-all",
                                    isSelected
                                        ? "ring-brand-green dark:ring-brand-gold"
                                        : "ring-white dark:ring-darkBg-card group-hover:scale-105"
                                )}>
                                    <AvatarImage src={group.avatar} alt={group.name} />
                                    <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                {group.unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-[9px] font-bold flex items-center justify-center">
                                        {group.unreadCount > 9 ? "9+" : group.unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-xs font-medium max-w-[68px] truncate",
                                isSelected
                                    ? "text-brand-green dark:text-brand-gold"
                                    : "text-gray-700 dark:text-gray-300"
                            )}>
                                {group.name}
                            </span>
                        </button>
                    );
                })}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

// ── Group row (desktop table row) ─────────────────────────────────────────────

function GroupRow({
    group,
    isSelected,
    onSelect,
    onChat,
    onContributions,
    onInvite,
    onSettings,
}: {
    group: Conversation;
    isSelected: boolean;
    onSelect: () => void;
    onChat: () => void;
    onContributions: () => void;
    onInvite: () => void;
    onSettings: () => void;
}) {
    const initials = getInitials(group.name || "G");
    const lastMsg = formatLastMessage(group.lastMessage);
    const timeAgo = group.lastMessage?.createdAt
        ? formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: false })
        : null;

    return (
        <tr
            onClick={onSelect}
            className={cn(
                "group cursor-pointer transition-colors border-b border-gray-100 dark:border-darkBorder-light last:border-0",
                isSelected
                    ? "bg-brand-green/5 dark:bg-brand-gold/5"
                    : "hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
            )}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
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

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className={cn(
                                "font-semibold text-sm truncate",
                                isSelected
                                    ? "text-brand-green dark:text-brand-gold"
                                    : "text-gray-900 dark:text-white"
                            )}>
                                {group.name}
                            </p>
                            {timeAgo && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0 hidden sm:block">
                                    {timeAgo}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{lastMsg}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {group.memberCount ?? 0} member{(group.memberCount ?? 0) !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-4 py-3 text-right">
                <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-gold hover:bg-brand-green/10 dark:hover:bg-brand-gold/10"
                            title="Open chat"
                            onClick={onChat}
                        >
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-gold hover:bg-brand-green/10 dark:hover:bg-brand-gold/10"
                            title="Contributions"
                            onClick={onContributions}
                        >
                            <Target className="h-4 w-4" />
                        </Button>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onChat}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Open Chat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onContributions}>
                                <Target className="h-4 w-4 mr-2" />
                                Contributions
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onInvite}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Invite Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onSettings}>
                                <Settings2 className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </tr>
    );
}

// ── Group card (mobile) ───────────────────────────────────────────────────────

function GroupCard({
    group,
    isSelected,
    onSelect,
    onChat,
    onContributions,
    onInvite,
    onSettings,
}: {
    group: Conversation;
    isSelected: boolean;
    onSelect: () => void;
    onChat: (e: React.MouseEvent) => void;
    onContributions: (e: React.MouseEvent) => void;
    onInvite: () => void;
    onSettings: () => void;
}) {
    const initials = getInitials(group.name || "G");
    const lastMsg = formatLastMessage(group.lastMessage);
    const timeAgo = group.lastMessage?.createdAt
        ? formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: false })
        : null;

    return (
        <div
            onClick={onSelect}
            className={cn(
                "flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 dark:border-darkBorder-light last:border-0",
                isSelected
                    ? "bg-brand-green/5 dark:bg-brand-gold/5"
                    : "hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
            )}
        >
            <div className="relative flex-shrink-0">
                <Avatar className="h-11 w-11">
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

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                        "font-semibold text-sm truncate",
                        isSelected ? "text-brand-green dark:text-brand-gold" : "text-gray-900 dark:text-white"
                    )}>
                        {group.name}
                    </p>
                    {timeAgo && (
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo}</span>
                    )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lastMsg}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {group.memberCount ?? 0} member{(group.memberCount ?? 0) !== 1 ? "s" : ""}
                </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-brand-green dark:hover:text-brand-gold"
                    onClick={onChat}
                >
                    <MessageSquare className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-brand-green dark:hover:text-brand-gold"
                    onClick={onContributions}
                >
                    <Target className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onInvite}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Invite Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onSettings}>
                            <Settings2 className="h-4 w-4 mr-2" />
                            Settings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// ── Group details slide-in panel ──────────────────────────────────────────────

function GroupDetailsPanel({
    group,
    isOpen,
    token,
    onClose,
    onInvite,
    onSettings,
}: {
    group: Conversation | null;
    isOpen: boolean;
    token: string;
    onClose: () => void;
    onInvite: () => void;
    onSettings: () => void;
}) {
    const router = useRouter();
    const panelRef = useRef<HTMLDivElement | null>(null);
    const groupId = group ? (group.groupId ?? group.id) : null;

    useEffect(() => {
        if (!isOpen) return;
        const handle = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (panelRef.current && target && !panelRef.current.contains(target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [isOpen, onClose]);

    return (
        <>
            {isOpen && (
                <button
                    type="button"
                    aria-label="Close group details"
                    className="fixed inset-0 z-[100] bg-black/30"
                    onClick={onClose}
                />
            )}
            <div
                ref={panelRef}
                className={cn(
                    "fixed bg-white dark:bg-darkBg-card shadow-2xl transform transition-transform duration-300 ease-in-out z-[110] flex flex-col",
                    "bottom-0 inset-x-0 h-[90vh] rounded-t-2xl border-t border-gray-200 dark:border-darkBorder-light",
                    "sm:inset-y-0 sm:right-0 sm:inset-x-auto sm:w-96 sm:h-full sm:rounded-none sm:border-t-0 sm:border-l sm:border-gray-200 sm:dark:border-darkBorder-light",
                    isOpen
                        ? "translate-y-0 sm:translate-y-0 sm:translate-x-0"
                        : "translate-y-full sm:translate-y-0 sm:translate-x-full"
                )}
            >
                {/* Mobile drag handle */}
                <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-darkBorder-light flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Group Details</h2>
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            className="gap-1.5 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main h-8 text-xs"
                            onClick={() => {
                                onClose();
                                router.push(`/chat?chatId=${group?.id}`);
                            }}
                        >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Open Chat
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-darkBg-hover rounded-full ml-1"
                        >
                            <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6">
                    <GroupDetailsContent
                        groupId={groupId}
                        token={token}
                        isActive={isOpen}
                        membersMaxHeight="max-h-56"
                        renderActions={(grp) => (
                            (grp.userRole === "owner" || grp.userRole === "admin") ? (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onInvite}
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <UserPlus size={13} />
                                        Invite Members
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={onSettings}
                                        className="flex items-center gap-1.5 text-xs"
                                    >
                                        <Settings2 size={13} />
                                        Settings
                                    </Button>
                                </div>
                            ) : null
                        )}
                    />
                </div>
            </div>
        </>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GroupsPage() {
    const { isExpanded } = useSidebar();
    const { conversations } = useChat();
    const router = useRouter();
    const { getToken } = useAuthToken();
    const token = getToken();

    const [selectedGroup, setSelectedGroup] = useState<Conversation | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "active">("all");

    const groups = useMemo(() => conversations.filter((c) => c.isGroup), [conversations]);

    const filteredGroups = useMemo(() => {
        const bySearch = groups.filter((g) =>
            g.name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (activeTab === "active") return bySearch.filter((g) => g.unreadCount > 0);
        return bySearch;
    }, [groups, searchQuery, activeTab]);

    const activeGroups = useMemo(() => groups.filter((g) => g.unreadCount > 0), [groups]);

    const selectedGroupId = selectedGroup ? (selectedGroup.groupId ?? selectedGroup.id) : null;

    // Sync selectedGroup if conversations update
    useEffect(() => {
        if (!selectedGroup) return;
        const still = groups.find((g) => g.id === selectedGroup.id);
        if (!still) {
            setSelectedGroup(null);
            setIsDetailOpen(false);
        }
    }, [groups, selectedGroup]);

    const handleSelectGroup = (group: Conversation) => {
        setSelectedGroup(group);
        setIsDetailOpen(true);
    };

    const handleChat = (group: Conversation) => {
        router.push(`/chat?chatId=${group.id}`);
    };

    const handleContributions = (group: Conversation) => {
        const userId = getCurrentUserId();
        const gid = group.groupId ?? group.id;
        router.push(`/action/${userId}?tab=contributions&group=${gid}`);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-darkBg-main">
            <Navigation />

            <main className={cn(
                "flex-1 flex flex-col transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                    {/* App header bar */}
                    <div className="px-4 sm:px-6 lg:px-8 py-4">
                        <Header />
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 pb-4">
                        {/* Page header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                            <div>
                                <BackButton className="mb-3" />
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Manage your groups and fundraising campaigns
                                </p>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 sm:mt-1 self-start sm:self-auto">
                                {/* Expandable search */}
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
                                                className="pl-9 pr-8 bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light focus:bg-white transition-colors"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onBlur={() => {
                                                    if (!searchQuery.trim()) setIsSearchExpanded(false);
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setIsSearchExpanded(false);
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                aria-label="Close search"
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
                                            aria-label="Open search"
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
                        <div className="flex border-b border-gray-200 dark:border-darkBorder-light mb-4 overflow-x-auto scrollbar-hide flex-shrink-0">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === "all"
                                        ? "text-brand-green dark:text-brand-gold"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                All ({groups.length})
                                {activeTab === "all" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green dark:bg-brand-gold" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("active")}
                                className={cn(
                                    "px-4 py-3 text-sm font-medium transition-all relative whitespace-nowrap",
                                    activeTab === "active"
                                        ? "text-brand-green dark:text-brand-gold"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                )}
                            >
                                Unread ({activeGroups.length})
                                {activeTab === "active" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-green dark:bg-brand-gold" />
                                )}
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                            {/* Recently active row */}
                            {activeTab === "all" && groups.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                        Recently Active
                                    </h2>
                                    <RecentGroupsRow
                                        groups={groups}
                                        selectedId={selectedGroupId}
                                        onSelect={handleSelectGroup}
                                    />
                                </section>
                            )}

                            {/* Groups table / list */}
                            <section>
                                <div className="bg-white dark:bg-darkBg-card rounded-xl shadow-sm border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                                    {filteredGroups.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-darkBg-interactive flex items-center justify-center mb-3">
                                                <UsersRound size={24} className="text-gray-400 dark:text-gray-500" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {searchQuery ? "No results found" : activeTab === "active" ? "No unread groups" : "No groups yet"}
                                            </p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {searchQuery
                                                    ? `No groups match "${searchQuery}"`
                                                    : activeTab === "active"
                                                        ? "You're all caught up"
                                                        : "Create a group to get started"}
                                            </p>
                                            {!searchQuery && activeTab === "all" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="mt-4"
                                                    onClick={() => setIsCreateOpen(true)}
                                                >
                                                    <Plus className="h-4 w-4 mr-1.5" />
                                                    Create Group
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {/* Desktop table */}
                                            <table className="w-full hidden sm:table">
                                                <thead>
                                                    <tr className="border-b border-gray-100 dark:border-darkBorder-light">
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Group
                                                        </th>
                                                        <th className="px-4 py-3 w-32" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredGroups.map((group) => (
                                                        <GroupRow
                                                            key={group.id}
                                                            group={group}
                                                            isSelected={selectedGroup?.id === group.id}
                                                            onSelect={() => handleSelectGroup(group)}
                                                            onChat={() => handleChat(group)}
                                                            onContributions={() => handleContributions(group)}
                                                            onInvite={() => {
                                                                setSelectedGroup(group);
                                                                setIsInviteOpen(true);
                                                            }}
                                                            onSettings={() => {
                                                                setSelectedGroup(group);
                                                                setIsSettingsOpen(true);
                                                            }}
                                                        />
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Mobile cards */}
                                            <div className="sm:hidden">
                                                {filteredGroups.map((group) => (
                                                    <GroupCard
                                                        key={group.id}
                                                        group={group}
                                                        isSelected={selectedGroup?.id === group.id}
                                                        onSelect={() => handleSelectGroup(group)}
                                                        onChat={(e) => { e.stopPropagation(); handleChat(group); }}
                                                        onContributions={(e) => { e.stopPropagation(); handleContributions(group); }}
                                                        onInvite={() => {
                                                            setSelectedGroup(group);
                                                            setIsInviteOpen(true);
                                                        }}
                                                        onSettings={() => {
                                                            setSelectedGroup(group);
                                                            setIsSettingsOpen(true);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            {/* Slide-in group details panel */}
            <GroupDetailsPanel
                group={selectedGroup}
                isOpen={isDetailOpen}
                token={token || ""}
                onClose={() => setIsDetailOpen(false)}
                onInvite={() => setIsInviteOpen(true)}
                onSettings={() => setIsSettingsOpen(true)}
            />

            {/* Modals */}
            <AddMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                groupId={selectedGroupId}
                groupName={selectedGroup?.name || ""}
                token={token || ""}
            />

            <GroupSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                groupId={selectedGroupId}
            />

            <CreateGroupModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                token={token}
            />
        </div>
    );
}
