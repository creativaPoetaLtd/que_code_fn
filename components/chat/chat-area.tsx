"use client"

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Send } from "lucide-react"
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
import { useAuthToken } from "@/hooks/use-auth-token"

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

function getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// ─── Message grouping ─────────────────────────────────────────────────────────

/** Consecutive messages from one sender within this window read as a single turn */
const GROUP_WINDOW_MS = 5 * 60 * 1000

/** Identifies who sent a message, so a run from one person can be grouped */
function getSenderKey(message: Message | LegacyMessage): string {
    if ((message as any).isMe === true) return "self"
    const sender: any = (message as any).sender
    if (sender && typeof sender === "object") {
        return String(sender.id ?? sender.userId ?? sender.username ?? sender.email ?? "unknown")
    }
    return String(sender ?? "unknown")
}

/**
 * Money transfers, polls, locations and the like render as full cards rather than
 * bubbles, so they stand alone: they neither join the run above them nor let the
 * message below them join one.
 */
function isStandaloneMessage(message: Message | LegacyMessage): boolean {
    const messageType = (message as any).messageType
    if (messageType && messageType !== "text") return true
    const content = (message as any).content
    return typeof content === "string" && content.trimStart().startsWith("{")
}

interface MessageRow {
    message: Message | LegacyMessage
    key: string
    date: Date
    showDateSeparator: boolean
    isFirstInGroup: boolean
    isLastInGroup: boolean
}

// ─── DateSeparator component ──────────────────────────────────────────────────

/**
 * Sticks to the top of the thread while its day scrolls past, so you always know
 * what day you're reading. Relies on being a direct child of the scroll container —
 * a sticky element can't escape its parent's box.
 */
function DateSeparator({ date }: { date: Date }) {
    return (
        <div className="sticky top-0 z-20 flex justify-center py-1 select-none pointer-events-none">
            {/* Fully opaque, not translucent: messages scroll underneath it, and a
                see-through pill just read as two overlapping labels. */}
            <span
                className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-gray-500 shadow-sm whitespace-nowrap dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-gray-400"
                aria-label={`Messages from ${formatDateLabel(date)}`}
            >
                {formatDateLabel(date)}
            </span>
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
    onSendMultiple?: () => void
    onCreateSharedWallet?: () => void
    onSendTicket?: () => void
    onShareAction?: () => void
    onCreatePoll?: () => void
    onCreateSharedNote?: () => void
    onCreateWhiteboard?: () => void
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
    onSendMultiple,
    onCreateSharedWallet,
    onSendTicket,
    onShareAction,
    onCreatePoll,
    onCreateSharedNote,
    onCreateWhiteboard,
    onLeaveGroup,
    isGroupAdmin = false,
    typingUsers = [],
    onlineUsers = [],
}: ChatAreaProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [replyToMessage, setReplyToMessage] = useState<ReplyPreview | null>(null)

    // The other person in a DM — who "Group" in the attachment menu offers to invite
    // into one of your existing groups. Not resolvable (or not useful) in a group chat.
    const { getUserId } = useAuthToken()
    const currentUserId = getUserId()
    const shareTargetParticipant = !conversation.isGroup
        ? conversation.participants?.find(p => p.userId !== currentUserId)
        : undefined
    const shareTargetUserId = shareTargetParticipant?.userId
    const shareTargetName = shareTargetParticipant?.user
        ? `${shareTargetParticipant.user.firstName || ""} ${shareTargetParticipant.user.lastName || ""}`.trim() || undefined
        : undefined

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

    // Precompute where each message sits in its sender's run, so a burst of messages
    // reads as one turn instead of a stack of identical islands.
    const rows = useMemo<MessageRow[]>(() => {
        const list = messages as Array<Message | LegacyMessage>
        return list.map((message, index) => {
            const date = getMessageDate(message)
            const dateKey = getDateKey(date)
            const previous = list[index - 1]
            const next = list[index + 1]
            const standalone = isStandaloneMessage(message)

            const showDateSeparator =
                !previous || getDateKey(getMessageDate(previous)) !== dateKey

            const joinsPrevious =
                Boolean(previous) &&
                !showDateSeparator &&
                !standalone &&
                !isStandaloneMessage(previous) &&
                getSenderKey(previous) === getSenderKey(message) &&
                date.getTime() - getMessageDate(previous).getTime() < GROUP_WINDOW_MS

            const nextStartsNewDay =
                Boolean(next) && getDateKey(getMessageDate(next)) !== dateKey

            const joinsNext =
                Boolean(next) &&
                !nextStartsNewDay &&
                !standalone &&
                !isStandaloneMessage(next) &&
                getSenderKey(next) === getSenderKey(message) &&
                getMessageDate(next).getTime() - date.getTime() < GROUP_WINDOW_MS

            return {
                message,
                // LegacyMessage ids can be numeric; pins are keyed by string
                key: String(message.id),
                date,
                showDateSeparator,
                isFirstInGroup: !joinsPrevious,
                isLastInGroup: !joinsNext,
            }
        })
    }, [messages])

    // ── Scroll position ───────────────────────────────────────────────────────
    // Following the thread should not mean being yanked away from history: new
    // messages only pull the view down when you were already at the bottom.
    const scrollRef = useRef<HTMLDivElement>(null)
    const atBottomRef = useRef(true)
    const openConversationRef = useRef<string | null>(null)
    const [isAwayFromLatest, setIsAwayFromLatest] = useState(false)
    const [hasUnseenBelow, setHasUnseenBelow] = useState(false)

    const handleScroll = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
        atBottomRef.current = atBottom
        setIsAwayFromLatest(!atBottom)
        if (atBottom) setHasUnseenBelow(false)
    }, [])

    const jumpToLatest = useCallback(() => {
        atBottomRef.current = true
        setIsAwayFromLatest(false)
        setHasUnseenBelow(false)
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, [])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        // Opening a conversation lands at the latest message outright — animating
        // through the whole history is just a long crawl.
        if (openConversationRef.current !== conversation.id) {
            openConversationRef.current = conversation.id
            atBottomRef.current = true
            setIsAwayFromLatest(false)
            setHasUnseenBelow(false)
            el.scrollTop = el.scrollHeight
            return
        }

        if (atBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
        } else {
            setHasUnseenBelow(true)
        }
    }, [messages, conversation.id])

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
            <div className="relative flex min-h-0 flex-1">
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    // overflow-x-hidden: nothing in a thread should scroll sideways,
                    // and a single overhanging control shouldn't be able to cause it
                    className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2.5 py-2 sm:px-4 sm:py-2.5"
                >
                    {messages.length > 0 ? (
                        <>
                            {rows.map(({ message, key, date, showDateSeparator, isFirstInGroup, isLastInGroup }) => (
                                // Separator and message are siblings, not nested: sticky
                                // positioning is bounded by the parent element's box.
                                <Fragment key={key}>
                                    {showDateSeparator && <DateSeparator date={date} />}
                                    <div
                                        ref={node => { messageRefs.current[key] = node }}
                                        className={`rounded-lg transition-colors duration-500 ${
                                            highlightedId === key
                                                ? "bg-emerald-100/60 dark:bg-emerald-900/20"
                                                : ""
                                        }`}
                                    >
                                        <MessageItem
                                            message={message}
                                            onReply={(reply) => setReplyToMessage(reply)}
                                            isPinned={pinnedIds.has(key)}
                                            onTogglePin={canPin ? handleTogglePin : undefined}
                                            isFirstInGroup={isFirstInGroup}
                                            isLastInGroup={isLastInGroup}
                                        />
                                    </div>
                                </Fragment>
                            ))}

                            {typingUsers.length > 0 && (
                                <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-white dark:bg-darkBg-card px-3 py-1.5 border border-gray-100 dark:border-darkBorder-light">
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
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {typingUsers.length === 1
                                            ? "Someone is typing..."
                                            : `${typingUsers.length} people are typing...`}
                                    </span>
                                </div>
                            )}

                            <div ref={messagesEndRef} className="h-1" />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full px-4 text-gray-600 dark:text-gray-400">
                            <div className="bg-white dark:bg-darkBg-card rounded-xl px-6 py-5 shadow-sm border border-gray-100 dark:border-darkBorder-light text-center max-w-sm">
                                <div className="w-11 h-11 bg-brand-green/10 dark:bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-2.5">
                                    <Send size={18} className="text-brand-green dark:text-brand-gold" />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    No messages yet
                                </h3>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    Send a message to start the conversation.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back to the latest message, with a nudge when something arrived
                    while you were reading further up */}
                {isAwayFromLatest && messages.length > 0 && (
                    <button
                        type="button"
                        onClick={jumpToLatest}
                        aria-label={hasUnseenBelow ? "Jump to new messages" : "Jump to latest message"}
                        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 shadow-md transition-colors hover:bg-gray-50 dark:border-darkBorder-light dark:bg-darkBg-card dark:hover:bg-darkBg-interactive"
                    >
                        <ChevronDown
                            size={16}
                            className={
                                hasUnseenBelow
                                    ? "text-brand-green dark:text-brand-gold"
                                    : "text-gray-500 dark:text-gray-400"
                            }
                        />
                        {hasUnseenBelow && (
                            <span className="text-[11px] font-semibold text-brand-green dark:text-brand-gold">
                                New
                            </span>
                        )}
                    </button>
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
                    onSendMultiple={onSendMultiple}
                    onCreateSharedWallet={onCreateSharedWallet}
                    shareTargetUserId={shareTargetUserId}
                    shareTargetName={shareTargetName}
                    onSendTicket={onSendTicket}
                    onShareAction={onShareAction}
                    onCreatePoll={onCreatePoll}
                    onCreateSharedNote={onCreateSharedNote}
                    onCreateWhiteboard={onCreateWhiteboard}
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
