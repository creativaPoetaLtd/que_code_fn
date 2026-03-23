"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import ChatHeader from "./chat-header"
import MessageItem from "./message-item"
import MessageInput from "./message-input"
import type { Conversation, Message, LegacyMessage } from "@/types/chat.types"

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getMidnight(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function formatDateLabel(date: Date): string {
    const now = new Date()
    const todayMs     = getMidnight(now)
    const yesterdayMs = todayMs - 86_400_000
    const msgMs       = getMidnight(date)

    if (msgMs === todayMs)     return "Today"
    if (msgMs === yesterdayMs) return "Yesterday"

    // e.g. "Friday, 20 March 2026"
    return date.toLocaleDateString("en-GB", {
        weekday: "long",
        day:     "numeric",
        month:   "long",
        year:    "numeric",
    })
}

function getMessageDate(message: Message | LegacyMessage): Date {
    if ("createdAt" in message && message.createdAt) return new Date(message.createdAt)
    if ("timestamp" in message && message.timestamp) return new Date(message.timestamp)
    return new Date()
}

// ─── DateSeparator component ──────────────────────────────────────────────────

function DateSeparator({ date }: { date: Date }) {
    return (
        <div className="flex items-center gap-3 my-5 px-1 select-none" aria-label={`Messages from ${formatDateLabel(date)}`}>
            <div className="flex-1 h-px bg-gray-200 dark:bg-darkBorder-medium" />
            <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light whitespace-nowrap tracking-wide">
                {formatDateLabel(date)}
            </span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-darkBorder-medium" />
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ChatAreaProps {
    conversation: Conversation
    messages: Message[] | LegacyMessage[]
    showOnMobile: boolean
    onBackClick: () => void
    onSendMoney: () => void
    onRequestMoney: () => void
    onViewProfile: () => void
    onInviteToGroup: () => void
    onGroupSettings?: () => void
    typingUsers?: any[]
    onlineUsers?: any[]
}

export default function ChatArea({
    conversation,
    messages,
    showOnMobile,
    onBackClick,
    onSendMoney,
    onRequestMoney,
    onViewProfile,
    onInviteToGroup,
    onGroupSettings,
    typingUsers = [],
    onlineUsers = [],
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    return (
        <div
            className={`
        ${showOnMobile ? "flex" : "hidden"}
        md:flex flex-col flex-1
        bg-gray-50 dark:bg-darkBg-main
        h-full relative
      `}
        >
            {/* Header */}
            <div className="flex-shrink-0">
                <ChatHeader
                    conversation={conversation}
                    onBackClick={onBackClick}
                    onViewProfile={onViewProfile}
                    onInviteToGroup={onInviteToGroup}
                    onGroupSettings={onGroupSettings}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card flex-shrink-0">
                <Button
                    onClick={onSendMoney}
                    className="bg-brand-green hover:bg-brand-green/90 dark:bg-brand-gold dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main text-xs sm:text-sm py-2 px-4 rounded-lg shadow-sm transition-all duration-200 flex-1 sm:flex-none"
                >
                    <Send size={14} className="mr-1.5 hidden sm:inline" />
                    Send Money
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {messages.length > 0 ? (
                    <>
                        {(() => {
                            let lastDateKey = ""
                            return (messages as Array<Message | LegacyMessage>).map((message) => {
                                const msgDate   = getMessageDate(message)
                                const dateKey   = `${msgDate.getFullYear()}-${msgDate.getMonth()}-${msgDate.getDate()}`
                                const showSep   = dateKey !== lastDateKey
                                lastDateKey     = dateKey

                                return (
                                    <div key={message.id}>
                                        {showSep && <DateSeparator date={msgDate} />}
                                        <div className="mb-4">
                                            <MessageItem message={message} />
                                        </div>
                                    </div>
                                )
                            })
                        })()}

                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-white dark:bg-darkBg-card rounded-lg border border-gray-100 dark:border-darkBorder-light mb-4">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-brand-green dark:bg-brand-gold rounded-full animate-bounce" />
                                    <div
                                        className="w-2 h-2 bg-brand-green dark:bg-brand-gold rounded-full animate-bounce"
                                        style={{ animationDelay: "0.1s" }}
                                    />
                                    <div
                                        className="w-2 h-2 bg-brand-green dark:bg-brand-gold rounded-full animate-bounce"
                                        style={{ animationDelay: "0.2s" }}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {typingUsers.length === 1
                                        ? "Someone is typing..."
                                        : `${typingUsers.length} people are typing...`}
                                </span>
                            </div>
                        )}

                        <div ref={messagesEndRef} className="h-4" />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                        <div className="bg-white dark:bg-darkBg-card rounded-lg p-8 shadow-md border border-gray-100 dark:border-darkBorder-light text-center max-w-md">
                            <div className="w-16 h-16 bg-brand-green/10 dark:bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send size={24} className="text-brand-green dark:text-brand-gold" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                No messages yet
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Send a message to start the conversation.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0">
                <MessageInput />
            </div>
        </div>
    )
}
