"use client"

import { useRef, useEffect, useState } from "react"
import { Send } from "lucide-react"
import ChatHeader from "./chat-header"
import MessageItem from "./message-item"
import MessageInput from "./message-input"
import PinnedNotesBar from "./pinned-notes-bar"
import PinnedMessagesBar from "./pinned-messages-bar"
import PinsPanel from "./pins-panel"
import NotesPanel from "./notes-panel"
import SharedNoteDialog from "./shared-note-dialog"
import { useChatNotes } from "@/hooks/use-chat-notes"
import { useChatPins } from "@/hooks/use-chat-pins"
import { usePinMessageMutation, useUnpinMessageMutation } from "@/states/chatSlice"
import { toast } from "@/hooks/use-toast"
import type { Conversation, Message, LegacyMessage } from "@/types/chat.types"
import type { ReplyPreview } from "@/types/chat.types"

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
    onDeleteGroup?: () => void
    onVerifySecurity?: () => void
    onCreateContribution?: () => void
    onCreateGroup?: () => void
    onSendTicket?: () => void
    onShareAction?: () => void
    onCreatePoll?: () => void
    onCreateSharedNote?: () => void
    onLeaveGroup?: () => void
    isGroupAdmin?: boolean
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
    onDeleteGroup,
    onVerifySecurity,
    onCreateContribution,
    onCreateGroup,
    onSendTicket,
    onShareAction,
    onCreatePoll,
    onCreateSharedNote,
    onLeaveGroup,
    isGroupAdmin = false,
    typingUsers = [],
    onlineUsers = [],
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [replyToMessage, setReplyToMessage] = useState<ReplyPreview | null>(null)

    // Shared notes are chat furniture, not messages: the bar and the header badge read
    // the same cache entry, and the editor is mounted once here for both entry points.
    const { notes } = useChatNotes(conversation.id)
    const [openNoteId, setOpenNoteId] = useState<string | null>(null)
    const [notesPanelOpen, setNotesPanelOpen] = useState(false)

    // Pinned items: the bar, the list, and jumping back into the thread
    const { pins } = useChatPins(conversation.id, messages as Message[])
    const [pinsPanelOpen, setPinsPanelOpen] = useState(false)
    const [highlightedId, setHighlightedId] = useState<string | null>(null)
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const [pinMessage] = usePinMessageMutation()
    const [unpinMessage] = useUnpinMessageMutation()

    // In a group the pinned bar is shared furniture, so only admins may change it
    const canPin = !conversation.isGroup || isGroupAdmin
    const pinnedIds = new Set(pins.map(pin => pin.messageId))

    const handleTogglePin = async (messageId: string, nextPinned: boolean) => {
        try {
            if (nextPinned) {
                await pinMessage({ chatId: conversation.id, messageId }).unwrap()
            } else {
                await unpinMessage({ chatId: conversation.id, messageId }).unwrap()
            }
        } catch (err: any) {
            toast({
                title: nextPinned ? "Could not pin" : "Could not unpin",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            })
        }
    }

    /** Scroll a pinned message back into view and flash it so it's findable */
    const handleJumpTo = (messageId: string) => {
        const node = messageRefs.current[messageId]
        if (!node) {
            toast({
                title: "Not loaded yet",
                description: "Scroll up to load older messages, then try again.",
            })
            return
        }
        node.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightedId(messageId)
        setTimeout(() => setHighlightedId(current => (current === messageId ? null : current)), 2000)
    }

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
                    onDeleteGroup={onDeleteGroup}
                    onVerifySecurity={onVerifySecurity}
                    onSendMoney={onSendMoney}
                    onRequestMoney={onRequestMoney}
                    onCreateContribution={onCreateContribution}
                    onOpenNotes={() => setNotesPanelOpen(true)}
                    noteCount={notes.length}
                    onOpenPins={() => setPinsPanelOpen(true)}
                    pinCount={pins.length}
                    onLeaveGroup={onLeaveGroup}
                    isGroupAdmin={isGroupAdmin}
                />
                <PinnedMessagesBar
                    pins={pins}
                    onJumpTo={handleJumpTo}
                    onOpenList={() => setPinsPanelOpen(true)}
                    onUnpin={canPin ? messageId => handleTogglePin(messageId, false) : undefined}
                />
                <PinnedNotesBar
                    chatId={conversation.id}
                    onOpenNote={setOpenNoteId}
                    onOpenList={() => setNotesPanelOpen(true)}
                />
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

                                // LegacyMessage ids can be numeric; pins are keyed by string
                                const messageKey = String(message.id)

                                return (
                                    <div key={messageKey}>
                                        {showSep && <DateSeparator date={msgDate} />}
                                        <div
                                            ref={node => { messageRefs.current[messageKey] = node }}
                                            className={`mb-0.5 rounded-lg transition-colors duration-500 ${
                                                highlightedId === messageKey
                                                    ? "bg-emerald-100/60 dark:bg-emerald-900/20"
                                                    : ""
                                            }`}
                                        >
                                            <MessageItem
                                                message={message}
                                                onReply={(reply) => setReplyToMessage(reply)}
                                                isPinned={pinnedIds.has(messageKey)}
                                                onTogglePin={canPin ? handleTogglePin : undefined}
                                            />
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
                <MessageInput
                    chatId={conversation.id}
                    groupId={conversation.isGroup ? conversation.groupId : undefined}
                    isSecureChat={conversation.securityMode === "secure_dm_v1"}
                    secureConversation={conversation}
                    replyToMessage={replyToMessage}
                    onCancelReply={() => setReplyToMessage(null)}
                    onSendMoney={onSendMoney}
                    onRequestMoney={onRequestMoney}
                    onCreateContribution={onCreateContribution}
                    onCreateGroup={onCreateGroup}
                    onSendTicket={onSendTicket}
                    onShareAction={onShareAction}
                    onCreatePoll={onCreatePoll}
                    onCreateSharedNote={onCreateSharedNote}
                />
            </div>

            <PinsPanel
                isOpen={pinsPanelOpen}
                onClose={() => setPinsPanelOpen(false)}
                pins={pins}
                onJumpTo={handleJumpTo}
                onUnpin={canPin ? messageId => handleTogglePin(messageId, false) : undefined}
            />

            <NotesPanel
                isOpen={notesPanelOpen}
                onClose={() => setNotesPanelOpen(false)}
                chatId={conversation.id}
                onOpenNote={setOpenNoteId}
            />

            <SharedNoteDialog
                isOpen={Boolean(openNoteId)}
                onClose={() => setOpenNoteId(null)}
                noteId={openNoteId || undefined}
            />
        </div>
    )
}
