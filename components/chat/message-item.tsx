import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message, LegacyMessage, ReplyPreview, Reaction } from "@/types/chat.types"
import { useMemo, useRef, useState, useCallback } from "react"
import MediaMessageContent from "./media-message-content"
import { MoneyMessageCard } from "./money-message-card"
import { EscrowMessageCard } from "./escrow-message-card"
import { ActionMessageCard, type ActionMessageData } from "./action-message-card"
import { PollMessageCard, type PollMessageData } from "./poll-message-card"
import { SharedNoteMessageCard, type SharedNoteMessageData } from "./shared-note-message-card"
import { GroupContributionCard } from "./group-contribution-card"
import MessageText from "./message-text"
import LinkPreviewCard from "./link-preview-card"
import { extractUrls } from "@/utils/url-utils"
import { getChatPreviewText } from "@/utils/chatPreview"
import { Ban, Check, CheckCheck, Clock, Pencil, Pin, PinOff, Reply, Smile, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactionPicker from "./reaction-picker"
import { useChat } from "@/context/ChatContext"
import { useDeleteMessageMutation } from "@/states/chatSlice"
import { toast } from "@/hooks/use-toast"
import { useAuthToken } from "@/hooks/use-auth-token"

interface MessageItemProps {
    message: Message | LegacyMessage
    onReply?: (message: ReplyPreview) => void
    /** Whether this message is currently pinned in the conversation */
    isPinned?: boolean
    /** Absent when the viewer may not pin here (a group member who isn't an admin) */
    onTogglePin?: (messageId: string, nextPinned: boolean) => void
}

const SWIPE_REPLY_TRIGGER = 56
const SWIPE_REPLY_MAX = 72

function isLegacyMessage(message: Message | LegacyMessage): message is LegacyMessage {
    return 'isMe' in message && 'message' in message;
}

export default function MessageItem({ message, onReply, isPinned = false, onTogglePin }: MessageItemProps) {
    const isLegacy = isLegacyMessage(message);
    const isMe = isLegacy ? message.isMe : (message as any).isMe || false;

    const senderDisplayName = useMemo(() => {
        if (isLegacy) {
            return String(message.sender || 'Unknown User');
        }

        const sender = message.sender as any;

        if (typeof sender === 'string') {
            return sender;
        }

        if (!sender || typeof sender !== 'object') {
            return 'Unknown User';
        }

        if (sender.name) return String(sender.name);
        if (sender.firstName && sender.lastName) return `${sender.firstName} ${sender.lastName}`.trim();
        if (sender.firstName) return String(sender.firstName);
        if (sender.lastName) return String(sender.lastName);
        if (sender.username) return String(sender.username);
        if (sender.email) return String(sender.email);
        if (sender.id) return `User ${String(sender.id).substring(0, 8)}`;

        return 'Unknown User';
    }, [isLegacy, message.sender]);

    const isMediaMessage = !isLegacy && message.messageType &&
        ['image', 'video', 'audio', 'document'].includes(message.messageType);

    const isMoneyMessage = !isLegacy && message.messageType === "money";
    const isEscrowMessage = !isLegacy && message.messageType === "escrow";

    // A deleted message keeps its slot in the thread but loses everything it carried,
    // so this is checked before any of the rich-card branches below.
    const isDeleted = !isLegacy && Boolean((message as Message).deletedAt);

    let messageContent: any = isLegacy ? message.message : message.content;
    let moneyTransferData = null;
    let groupContributionData = null;
    let escrowData = null;
    let isOldMoneyMessage = false;

    // Parse escrow hold data
    if (!isDeleted && isEscrowMessage && messageContent) {
        try {
            const parsed = JSON.parse(messageContent);
            if (parsed.type === 'escrow' && parsed.escrowId) {
                escrowData = parsed;
            }
        } catch (e) {
            // Parsing failed - ignore, falls through to plain text rendering
        }
    }

    // Action cards (a ticket handover, or an action shared to the chat) travel as text
    // so they work in both legacy and end-to-end encrypted conversations.
    let actionData: ActionMessageData | null = null;
    let pollData: PollMessageData | null = null;
    let sharedNoteData: SharedNoteMessageData | null = null;
    const isTextMessage = isLegacy || !message.messageType || message.messageType === "text";
    if (!isDeleted && isTextMessage && typeof messageContent === "string" && messageContent.startsWith("{")) {
        try {
            const parsed = JSON.parse(messageContent);
            if (parsed?.type === "action_transfer" || parsed?.type === "action_share") {
                actionData = parsed as ActionMessageData;
            } else if (parsed?.type === "poll" && parsed.pollId) {
                pollData = parsed as PollMessageData;
            } else if (parsed?.type === "shared_note" && parsed.noteId) {
                sharedNoteData = parsed as SharedNoteMessageData;
            }
        } catch (e) {
            // Not JSON — an ordinary text message
        }
    }

    // Parse money transfer/request data
    if (!isDeleted && isMoneyMessage && messageContent) {
        try {
            const parsed = JSON.parse(messageContent);
            const isTransferLike = (parsed.type === 'money_transfer' || parsed.type === 'group_donation') && parsed.transactionId && parsed.amount;
            const isRequestLike = parsed.type === 'money_request' && parsed.requestId && parsed.amount;
            const isContributionLike = parsed.type === 'group_contribution' && parsed.contributionId && parsed.groupId;

            if (isContributionLike) {
                groupContributionData = parsed;
            } else if (isTransferLike || isRequestLike) {
                moneyTransferData = parsed;
            } else {
                // Old format - just has note text
                isOldMoneyMessage = true;
            }
        } catch (e) {
            // Parsing failed - it's plain text (old format)
            isOldMoneyMessage = true;
        }
    }

    if (!isMediaMessage && !moneyTransferData && !escrowData && !actionData && !pollData && !sharedNoteData) {
        if (typeof messageContent === 'object' && messageContent !== null) {
            if (messageContent.content) {
                messageContent = messageContent.content;
            } else if (messageContent.text) {
                messageContent = messageContent.text;
            } else if (messageContent.message) {
                messageContent = messageContent.message;
            } else {
                messageContent = JSON.stringify(messageContent);
            }
        }
    }

    messageContent = String(messageContent || '');

    const avatar = isLegacy ? message.avatar : (message.sender as any)?.avatar || (message.sender as any)?.profile?.profileImage;
    const timestamp = isLegacy ? message.timestamp : new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });

    const replyTo = !isLegacy ? (message as Message).replyTo : null;
    const rawReactions = !isLegacy ? (message as Message).reactions ?? [] : [];
    const [swipeOffset, setSwipeOffset] = useState(0)
    const [isSwiping, setIsSwiping] = useState(false)
    const [showReactionPicker, setShowReactionPicker] = useState(false)
    const startXRef = useRef(0)
    const startYRef = useRef(0)
    const horizontalLockRef = useRef(false)
    const gestureActiveRef = useRef(false)

    const { addReaction, removeReaction, activeChat, conversations, editMessage } = useChat()
    const { getUserId } = useAuthToken()
    const currentUserId = getUserId()
    const activeConversation = activeChat
        ? conversations.find((conversation) => conversation.id === activeChat)
        : null
    const shouldShowSenderName = Boolean(activeConversation?.isGroup && !isMe)
    const shouldShowIncomingAvatar = Boolean(activeConversation?.isGroup && !isMe)
    const reactionsAllowed = true

    // Aggregate raw reaction rows into display format
    const aggregatedReactions: Reaction[] = useMemo(() => {
        const map = new Map<string, { count: number; userIds: string[] }>()
        for (const row of rawReactions) {
            const entry = map.get(row.emoji) ?? { count: 0, userIds: [] }
            entry.count++
            entry.userIds.push(row.userId)
            map.set(row.emoji, entry)
        }
        return Array.from(map.entries()).map(([emoji, { count, userIds }]) => ({
            emoji,
            count,
            userIds,
            hasReacted: false, // will be determined by parent via context userId — see below
        }))
    }, [rawReactions])

    const handleReactionSelect = useCallback((emoji: string) => {
        if (!activeChat || isLegacy) return
        const msg = message as Message
        // If the user already has this exact emoji, remove it; otherwise add/replace
        const existing = currentUserId ? rawReactions.find(r => r.userId === currentUserId) : undefined
        if (existing?.emoji === emoji) {
            removeReaction(activeChat, msg.id)
        } else {
            addReaction(activeChat, msg.id, emoji)
        }
    }, [activeChat, isLegacy, message, rawReactions, currentUserId, addReaction, removeReaction])

    const handleReply = () => {
        if (isLegacy || !onReply) return;
        const msg = message as Message;
        // Don't allow replying to optimistic (temp) messages – the real ID isn't persisted yet
        if (msg.id.startsWith('temp_')) return;
        onReply({
            id: msg.id,
            content: messageContent,
            messageType: msg.messageType,
            senderName: senderDisplayName,
        });
    };

    const isTempMessage = !isLegacy && (message as Message).id.startsWith('temp_')

    // ── Delete / edit (own messages only) ─────────────────────────────────────
    const [deleteMessageMutation, { isLoading: deleting }] = useDeleteMessageMutation()
    const [confirmingDelete, setConfirmingDelete] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [draft, setDraft] = useState("")
    const [savingEdit, setSavingEdit] = useState(false)

    const messageType = !isLegacy ? (message as Message).messageType : undefined
    // Only plain text can be edited — cards carry structured payloads and media has
    // no text to change.
    const isPlainText = (!messageType || messageType === "text")
        && !isMediaMessage && !moneyTransferData && !escrowData && !actionData
        && !pollData && !sharedNoteData
    const canModify = !isLegacy && isMe && !isTempMessage && !isDeleted
    const canDelete = canModify
    const canEdit = canModify && isPlainText
    // Anything in the conversation can be pinned - yours or theirs, text or card
    const canPin = !isLegacy && Boolean(onTogglePin) && !isTempMessage && !isDeleted

    const handleDelete = async () => {
        if (isLegacy) return
        try {
            await deleteMessageMutation({
                chatId: (message as Message).chatId,
                messageId: (message as Message).id,
            }).unwrap()
            setConfirmingDelete(false)
        } catch (err: any) {
            toast({
                title: "Could not delete",
                description: err?.data?.message || "Please try again.",
                variant: "destructive",
            })
        }
    }

    const startEditing = () => {
        setDraft(messageContent)
        setIsEditing(true)
    }

    const handleSaveEdit = async () => {
        if (isLegacy) return
        const next = draft.trim()
        if (!next || next === messageContent) {
            setIsEditing(false)
            return
        }
        setSavingEdit(true)
        try {
            await editMessage((message as Message).chatId, (message as Message).id, next)
            setIsEditing(false)
        } catch (err: any) {
            toast({
                title: "Could not save the edit",
                description: err?.message || "Please try again.",
                variant: "destructive",
            })
        } finally {
            setSavingEdit(false)
        }
    }

    const canSwipeReply = !isLegacy && !!onReply && !isTempMessage
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/).filter(Boolean)
        const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
        return initials || "U"
    }

    // Deleting a card takes its resource with it, so the confirmation says so rather
    // than letting someone discover it afterwards.
    const deleteConsequence = sharedNoteData
        ? "Delete this note for everyone? Everyone loses access to it."
        : pollData
            ? "Delete this poll for everyone? The votes go with it."
            : "Delete this for everyone?";

    /**
     * Cards return early, before the hover actions a text bubble gets — so they carry
     * their own delete control. Anything you sent can be taken back, not just text.
     */
    const renderCard = (card: React.ReactNode) => (
        <div className={cn("mb-4 flex", isMe ? "justify-end" : "justify-start")}>
            <div className="group/message relative">
                {card}

                {canPin && (
                    <button
                        type="button"
                        onClick={() => onTogglePin!((message as Message).id, !isPinned)}
                        aria-label={isPinned ? "Unpin message" : "Pin message"}
                        className={cn(
                            "absolute -top-1.5 h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-opacity hover:text-emerald-600 dark:border-darkBorder-light dark:bg-darkBg-card dark:text-gray-300 dark:hover:text-emerald-400 opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 flex items-center justify-center",
                            canDelete ? "-right-8" : "-right-1.5"
                        )}
                    >
                        {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                    </button>
                )}

                {canDelete && (
                    <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        aria-label="Delete message"
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-opacity hover:text-red-600 dark:border-darkBorder-light dark:bg-darkBg-card dark:text-gray-300 dark:hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 flex items-center justify-center"
                    >
                        <Trash2 size={11} />
                    </button>
                )}

                {confirmingDelete && (
                    <div className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 dark:border-red-900/40 dark:bg-red-900/20">
                        <p className="text-[11px] text-red-700 dark:text-red-300">
                            {deleteConsequence}
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={deleting}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-2.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold disabled:opacity-40"
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const messageStatus = !isLegacy ? (message as Message).status : undefined
    const hasReadProof = !isLegacy && Boolean(
        (message as Message).readBy?.some((receipt) => receipt.userId && receipt.userId !== currentUserId)
    )
    const hasDeliveryProof = !isLegacy && Boolean((message as any).deliveryConfirmed || hasReadProof)
    const visualStatus = isTempMessage
        ? "pending"
        : hasReadProof
            ? "read"
            : hasDeliveryProof
                ? "delivered"
                : "sent"
    const StatusIcon = (() => {
        if (!isMe || isLegacy) return null
        if (visualStatus === "pending") return Clock
        if (visualStatus === "read") return CheckCheck
        if (visualStatus === "delivered") return CheckCheck
        return Check
    })()
    const statusTone = visualStatus === "read"
        ? "text-[#34b7f1]"
        : "text-gray-500 dark:text-gray-300"

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!canSwipeReply) return
        const touch = e.touches[0]
        startXRef.current = touch.clientX
        startYRef.current = touch.clientY
        horizontalLockRef.current = false
        gestureActiveRef.current = true
        setIsSwiping(false)
    }

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!canSwipeReply || !gestureActiveRef.current) return
        const touch = e.touches[0]
        const dx = touch.clientX - startXRef.current
        const dy = touch.clientY - startYRef.current

        if (!horizontalLockRef.current) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
            if (Math.abs(dy) > Math.abs(dx)) {
                gestureActiveRef.current = false
                setIsSwiping(false)
                setSwipeOffset(0)
                return
            }
            horizontalLockRef.current = true
            setIsSwiping(true)
        }

        e.preventDefault()
        const nextOffset = Math.max(0, Math.min(dx, SWIPE_REPLY_MAX))
        setSwipeOffset(nextOffset)
    }

    const handleTouchEnd = () => {
        if (!canSwipeReply) return

        if (swipeOffset >= SWIPE_REPLY_TRIGGER) {
            handleReply()
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                navigator.vibrate(8)
            }
        }

        gestureActiveRef.current = false
        horizontalLockRef.current = false
        setIsSwiping(false)
        setSwipeOffset(0)
    }

    const messageActions = (!isLegacy && (onReply || reactionsAllowed || canDelete || canPin)) && !isTempMessage && !isDeleted && !isEditing ? (
        <div className={cn(
            "relative z-10 flex shrink-0 items-center gap-0.5 self-end rounded-full border px-1 py-0.5 shadow-sm transition-opacity",
            "opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100",
            isMe
                ? "bg-[#d9fdd3]/95 dark:bg-[#2f5f46]/95 border-emerald-200/70 dark:border-emerald-900/50"
                : "bg-white/95 dark:bg-darkBg-interactive border-gray-100 dark:border-darkBorder-light"
        )}>
            {reactionsAllowed && (
                <div className="relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReactionPicker((v) => !v)}
                        className={cn(
                            "h-5 w-5 p-0",
                            isMe
                                ? "text-gray-500 hover:text-gray-700 hover:bg-emerald-100/80 dark:text-gray-200 dark:hover:text-white dark:hover:bg-white/10"
                                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        )}
                        aria-label="Add reaction"
                    >
                        <Smile size={11} />
                    </Button>
                    {showReactionPicker && (
                        <ReactionPicker
                            isMe={isMe}
                            onSelect={handleReactionSelect}
                            onClose={() => setShowReactionPicker(false)}
                        />
                    )}
                </div>
            )}

            {canPin && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onTogglePin!((message as Message).id, !isPinned)}
                    aria-label={isPinned ? "Unpin message" : "Pin message"}
                    className={cn(
                        "h-5 w-5 p-0",
                        isMe
                            ? "text-gray-600 hover:text-gray-800 hover:bg-emerald-100/80 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    )}
                >
                    {isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                </Button>
            )}

            {canEdit && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    aria-label="Edit message"
                    className="h-5 w-5 p-0 text-gray-600 hover:text-gray-800 hover:bg-emerald-100/80 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
                >
                    <Pencil size={11} />
                </Button>
            )}

            {canDelete && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingDelete(true)}
                    aria-label="Delete message"
                    className="h-5 w-5 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-100 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                >
                    <Trash2 size={11} />
                </Button>
            )}

            {onReply && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReply}
                    aria-label="Reply"
                    className={cn(
                        "h-5 w-5 p-0",
                        isMe
                            ? "text-gray-600 hover:text-gray-800 hover:bg-emerald-100/80 dark:text-gray-100 dark:hover:text-white dark:hover:bg-white/10"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    )}
                >
                    <Reply size={11} />
                </Button>
            )}
        </div>
    ) : null
    // Render group contribution card
    if (isMoneyMessage && groupContributionData) {
        return renderCard(
            <GroupContributionCard data={groupContributionData} isMe={isMe} chatId={!isLegacy ? message.chatId : undefined} />
        );
    }

    // Render money transfer message as a special card
    if (isMoneyMessage && moneyTransferData) {
        return renderCard(
            <MoneyMessageCard data={moneyTransferData} isMe={isMe} chatId={!isLegacy ? message.chatId : undefined} />
        );
    }

    // A deleted message: same slot in the thread, nothing left of what it said
    if (isDeleted) {
        return (
            <div className={cn("flex mb-1.5 sm:mb-2", isMe ? "justify-end" : "justify-start")}>
                {shouldShowIncomingAvatar && (
                    <Avatar className="h-7 w-7 mt-0.5 mr-2 flex-shrink-0">
                        {avatar && <AvatarImage src={avatar} alt={senderDisplayName} />}
                        <AvatarFallback className="text-[10px] font-semibold">
                            {getInitials(senderDisplayName)}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div
                    className={cn(
                        "max-w-[18rem] sm:max-w-md rounded-lg border border-dashed px-2.5 py-1.5",
                        isMe
                            ? "border-emerald-300/70 bg-[#d9fdd3]/40 dark:border-emerald-800/60 dark:bg-[#2f5f46]/40"
                            : "border-gray-200 bg-gray-50 dark:border-darkBorder-light dark:bg-darkBg-interactive"
                    )}
                >
                    {shouldShowSenderName && (
                        <p className="text-[11px] leading-3 font-semibold mb-0.5 text-gray-700 dark:text-gray-300">
                            {senderDisplayName}
                        </p>
                    )}
                    <p className="flex items-center gap-1.5 text-[13px] italic text-gray-500 dark:text-gray-400">
                        <Ban size={12} className="flex-shrink-0" />
                        {isMe ? "You deleted this message" : "This message was deleted"}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] leading-3 mt-0.5 text-gray-400 dark:text-gray-500">
                        <span>{timestamp}</span>
                    </div>
                </div>
            </div>
        );
    }

    // Render a shared note as a card that opens the collaborative editor
    if (sharedNoteData) {
        return renderCard(<SharedNoteMessageCard data={sharedNoteData} isMe={isMe} />);
    }

    // Render a poll as a live, votable card
    if (pollData) {
        return renderCard(<PollMessageCard data={pollData} isMe={isMe} />);
    }

    // Render a transferred ticket / shared action as a special card
    if (actionData) {
        return renderCard(<ActionMessageCard data={actionData} isMe={isMe} />);
    }

    // Render escrow hold message as a special card
    if (isEscrowMessage && escrowData) {
        return renderCard(
            <EscrowMessageCard data={escrowData} isMe={isMe} chatId={!isLegacy ? message.chatId : undefined} />
        );
    }

    return (
        <div className={cn("flex mb-1.5 sm:mb-2", isMe ? "justify-end" : "justify-start")}>
            {shouldShowIncomingAvatar && (
                <Avatar className="h-7 w-7 mt-0.5 mr-2 flex-shrink-0">
                    {avatar && <AvatarImage src={avatar} alt={senderDisplayName} />}
                    <AvatarFallback className="text-[10px] font-semibold">
                        {getInitials(senderDisplayName)}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className="relative group/message flex items-end gap-1">
                {!isLegacy && onReply && (
                    <div
                        className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-150",
                            swipeOffset > 12 ? "opacity-100" : "opacity-0"
                        )}
                    >
                        <Reply
                            size={16}
                            className={cn(
                                isMe ? "text-gray-700 dark:text-gray-100" : "text-brand-green dark:text-brand-gold"
                            )}
                        />
                    </div>
                )}

                {isMe && messageActions}

                <div
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: isSwiping ? "none" : "transform 180ms ease-out",
                        touchAction: "pan-y",
                    }}
                    className={cn(
                        "relative max-w-[18rem] sm:max-w-md rounded-lg px-2.5 py-1.5 shadow-sm",
                        isMe ? "bg-[#d9fdd3] text-gray-950 dark:bg-[#2f5f46] dark:text-gray-50" : "bg-white dark:bg-[#1f2c26] border border-gray-100 dark:border-darkBorder-light text-gray-900 dark:text-gray-50",
                        isOldMoneyMessage ? "border-2 border-yellow-400 dark:border-yellow-600" : ""
                    )}
                >
                {shouldShowSenderName && <p className="text-[11px] leading-3 font-semibold mb-0.5 text-gray-700 dark:text-gray-300">{senderDisplayName}</p>}

                {replyTo && (
                    <div className={cn(
                        "mb-2 rounded-md border px-2 py-1",
                        isMe
                            ? "border-emerald-300/60 bg-white/35 dark:border-emerald-200/30 dark:bg-white/10"
                            : "border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive"
                    )}>
                        <p className={cn(
                            "text-[11px] font-semibold truncate",
                            isMe ? "text-gray-700 dark:text-gray-100" : "text-brand-green dark:text-brand-gold"
                        )}>
                            {replyTo.senderName}
                        </p>
                        <p className={cn(
                            "text-[11px] truncate",
                            isMe ? "text-gray-600 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"
                        )}>
                            {getChatPreviewText({ content: replyTo.content }) || "(no text)"}
                        </p>
                    </div>
                )}

                {/* Old money message indicator */}
                {isOldMoneyMessage && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                        <span>💰</span>
                        <span className="font-semibold">Money Transfer</span>
                    </div>
                )}

                {/* Render media content or rich text with link previews */}
                {isEditing ? (
                    <div className="w-[16rem] sm:w-[20rem] space-y-1.5">
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Escape") { setIsEditing(false); return }
                                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit() }
                            }}
                            rows={2}
                            autoFocus
                            className="w-full resize-none rounded-md border border-gray-200 bg-white/90 px-2 py-1.5 text-[13px] text-gray-900 outline-none focus:border-brand-green dark:border-darkBorder-light dark:bg-darkBg-card dark:text-white dark:focus:border-brand-gold"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                disabled={savingEdit}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={savingEdit || !draft.trim()}
                                className="px-2.5 py-0.5 rounded bg-brand-green dark:bg-brand-gold text-white text-[11px] font-bold disabled:opacity-40"
                            >
                                {savingEdit ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>
                ) : isMediaMessage ? (
                    <MediaMessageContent
                        content={messageContent}
                        mediaUrl={message.mediaUrl}
                        mediaType={message.mediaType}
                        thumbnailUrl={message.thumbnailUrl}
                        fileName={message.fileName}
                        fileSize={message.fileSize}
                        duration={message.duration}
                        mimeType={message.mimeType}
                        secureMediaKey={message.secureMediaKey}
                        secureMediaIv={message.secureMediaIv}
                        isSecureMedia={message.isSecureMedia}
                    />
                ) : (
                    <>
                        <MessageText
                            content={messageContent}
                            isMe={isMe}
                            mentions={!isLegacy ? (message as any).mentions : undefined}
                        />
                        {extractUrls(messageContent).map((url) => (
                            <LinkPreviewCard key={url} url={url} isMe={isMe} />
                        ))}
                    </>
                )}

                <div className={cn("flex items-center justify-end gap-1 text-[10px] leading-3 mt-0.5", isMe ? "text-gray-600 dark:text-gray-200" : "text-gray-500 dark:text-gray-500")}>
                    {!isLegacy && (message as Message).editedAt && (
                        <span className="italic opacity-70">edited</span>
                    )}
                    <span>{timestamp}</span>
                    {StatusIcon && (
                        <StatusIcon
                            size={13}
                            className={statusTone}
                        />
                    )}
                </div>

                {confirmingDelete && (
                    <div className="mt-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 dark:border-red-900/40 dark:bg-red-900/20">
                        <p className="text-[11px] text-red-700 dark:text-red-300">
                            Delete this message for everyone?
                        </p>
                        <div className="mt-1 flex items-center justify-end gap-1.5">
                            <button
                                type="button"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={deleting}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-40"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-2.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold disabled:opacity-40"
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Aggregated reaction bubbles */}
                {aggregatedReactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                        {aggregatedReactions.map(({ emoji, count, userIds }) => {
                            const iReacted = !isLegacy && !!currentUserId && rawReactions.some(
                                r => r.emoji === emoji && r.userId === currentUserId
                            )
                            return (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                        if (!activeChat || isLegacy) return
                                        const msg = message as Message
                                        if (iReacted) {
                                            removeReaction(activeChat, msg.id)
                                        } else {
                                            addReaction(activeChat, msg.id, emoji)
                                        }
                                    }}
                                    className={cn(
                                        "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                                        iReacted
                                            ? "bg-brand-green/15 border-brand-green dark:bg-brand-gold/15 dark:border-brand-gold"
                                            : "bg-white dark:bg-darkBg-interactive border-gray-200 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-darkBg-card"
                                    )}
                                    title={`${count} reaction${count !== 1 ? "s" : ""}`}
                                >
                                    <span>{emoji}</span>
                                    <span className={cn(
                                        "font-medium",
                                        iReacted ? "text-brand-green dark:text-brand-gold" : "text-gray-600 dark:text-gray-400"
                                    )}>{count}</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* {!isLegacy && message.readBy && message.readBy.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                        Read by {message.readBy.length} {message.readBy.length === 1 ? 'person' : 'people'}
                    </div>
                )} */}
                </div>

                {!isMe && messageActions}
            </div>

        </div>
    )
}
