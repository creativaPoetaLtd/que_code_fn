import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message, LegacyMessage, ReplyPreview, Reaction } from "@/types/chat.types"
import { useMemo, useRef, useState, useCallback } from "react"
import MediaMessageContent from "./media-message-content"
import { MoneyMessageCard } from "./money-message-card"
import { GroupContributionCard } from "./group-contribution-card"
import MessageText from "./message-text"
import LinkPreviewCard from "./link-preview-card"
import { extractUrls } from "@/utils/url-utils"
import { Check, CheckCheck, Clock, Reply, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import ReactionPicker from "./reaction-picker"
import { useChat } from "@/context/ChatContext"
import { useAuthToken } from "@/hooks/use-auth-token"

interface MessageItemProps {
    message: Message | LegacyMessage
    onReply?: (message: ReplyPreview) => void
}

const SWIPE_REPLY_TRIGGER = 56
const SWIPE_REPLY_MAX = 72

function isLegacyMessage(message: Message | LegacyMessage): message is LegacyMessage {
    return 'isMe' in message && 'message' in message;
}

export default function MessageItem({ message, onReply }: MessageItemProps) {
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

    let messageContent: any = isLegacy ? message.message : message.content;
    let moneyTransferData = null;
    let groupContributionData = null;
    let isOldMoneyMessage = false;

    // Parse money transfer/request data
    if (isMoneyMessage && messageContent) {
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

    if (!isMediaMessage && !moneyTransferData) {
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

    const { addReaction, removeReaction, activeChat, conversations } = useChat()
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
    const canSwipeReply = !isLegacy && !!onReply && !isTempMessage
    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/).filter(Boolean)
        const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
        return initials || "U"
    }

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

    const messageActions = (!isLegacy && (onReply || reactionsAllowed)) && !isTempMessage ? (
        <div className={cn(
            "relative z-10 flex shrink-0 items-center gap-0.5 self-end rounded-full border px-1 py-0.5 shadow-sm transition-opacity",
            "opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100",
            isMe
                ? "bg-[#d9fdd3]/95 dark:bg-[#2f5f46]/95 border-emerald-200/70 dark:border-emerald-900/50"
                : "bg-white/95 dark:bg-darkBg-interactive/95 border-gray-100 dark:border-darkBorder-light"
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
        return (
            <div className={cn("mb-4", isMe ? "ml-auto" : "mr-auto")}>
                <GroupContributionCard data={groupContributionData} isMe={isMe} chatId={!isLegacy ? message.chatId : undefined} />
            </div>
        );
    }

    // Render money transfer message as a special card
    if (isMoneyMessage && moneyTransferData) {
        return (
            <div className={cn("mb-4", isMe ? "ml-auto" : "mr-auto")}>
                <MoneyMessageCard data={moneyTransferData} isMe={isMe} chatId={!isLegacy ? message.chatId : undefined} />
            </div>
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
                            {replyTo.content || "(no text)"}
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
                {isMediaMessage ? (
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
                    <span>{timestamp}</span>
                    {StatusIcon && (
                        <StatusIcon
                            size={13}
                            className={statusTone}
                        />
                    )}
                </div>

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
