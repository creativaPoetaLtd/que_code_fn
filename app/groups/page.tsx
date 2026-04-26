"use client"

import React from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import { Header } from "@/components/Header"
import { useSidebar } from "@/context/SidebarContext"
import { useChat } from "@/context/ChatContext"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UsersRound, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Conversation, LastMessage } from "@/types/chat.types"

const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

const formatLastMessage = (msg: LastMessage | null | undefined): string => {
    if (!msg) return "No messages yet"
    const prefix = typeof msg.sender === "object"
        ? `${msg.sender.firstName}: `
        : ""
    switch (msg.messageType) {
        case "money": return `${prefix}💰 Money transfer`
        case "image": return `${prefix}📷 Photo`
        case "audio": return `${prefix}🎤 Voice message`
        case "file":
        case "document": return `${prefix}📎 File`
        default: return `${prefix}${msg.content || "Message"}`
    }
}

function GroupCard({ group, onClick }: { group: Conversation; onClick: () => void }) {
    const initials = getInitials(group.name || "G")
    const lastMsg = formatLastMessage(group.lastMessage)
    const timeAgo = group.lastMessage?.createdAt
        ? formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: false })
        : null

    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-brand-green/20 dark:hover:border-brand-gold/20 transition-all text-left"
        >
            <Avatar className="w-12 h-12 border-2 border-gray-50 dark:border-darkBg-interactive shadow-sm flex-shrink-0">
                <AvatarImage src={group.avatar} alt={group.name} />
                <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold text-sm">
                    {initials}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{group.name}</p>
                    {timeAgo && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{timeAgo}</span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lastMsg}</p>
                    {group.unreadCount > 0 && (
                        <span className="min-w-5 h-5 px-1.5 rounded-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {group.unreadCount > 99 ? "99+" : group.unreadCount}
                        </span>
                    )}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {group.memberCount ?? 0} member{(group.memberCount ?? 0) !== 1 ? "s" : ""}
                </p>
            </div>

            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
        </button>
    )
}

export default function GroupsPage() {
    const { isExpanded } = useSidebar()
    const { conversations } = useChat()
    const router = useRouter()

    const groups = conversations.filter((c) => c.isGroup)

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-transparent">
            <Navigation />
            <main className={cn(
                "flex-1 flex flex-col p-4 sm:p-6 lg:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-28 sm:pb-24 lg:pb-8">
                    <Header />

                    <div className="max-w-2xl mx-auto mt-6">
                        {/* Page header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                                <UsersRound size={20} className="text-brand-green dark:text-brand-gold" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Groups</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {groups.length} group{groups.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>

                        {/* Group list */}
                        {groups.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-darkBg-card flex items-center justify-center mx-auto mb-4">
                                    <UsersRound size={28} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">No groups yet</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    You&apos;re not a member of any groups
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {groups.map((group) => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        onClick={() => router.push(`/chat?chatId=${group.id}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
