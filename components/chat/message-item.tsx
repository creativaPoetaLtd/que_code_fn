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
import { Reply, Smile } from "lucide-react"
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
    const reactionsAllowed = activeConversation?.securityMode !== "secure_dm_v1"

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
        <div className={cn("flex mb-3 sm:mb-4", isMe ? "justify-end" : "justify-start")}>
            {!isMe && (
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 mt-1 mr-2 flex-shrink-0">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt={senderDisplayName} />
                    <AvatarFallback>{senderDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}

            <div className="relative">
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
                                isMe ? "text-white/90" : "text-brand-green dark:text-brand-gold"
                            )}
                        />
                    </div>
                )}

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
                        "relative max-w-[18rem] sm:max-w-md rounded-xl px-3 py-2 shadow-sm",
                        isMe ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main" : "bg-white dark:bg-darkBg-card border border-gray-100 dark:border-darkBorder-light text-gray-900 dark:text-white",
                        isOldMoneyMessage ? "border-2 border-yellow-400 dark:border-yellow-600" : ""
                    )}
                >
                {!isMe && <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">{senderDisplayName}</p>}

                {replyTo && (
                    <div className={cn(
                        "mb-2 rounded-md border px-2 py-1",
                        isMe
                            ? "border-white/30 bg-white/15"
                            : "border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive"
                    )}>
                        <p className={cn(
                            "text-[11px] font-semibold truncate",
                            isMe ? "text-white/90" : "text-brand-green dark:text-brand-gold"
                        )}>
                            {replyTo.senderName}
                        </p>
                        <p className={cn(
                            "text-[11px] truncate",
                            isMe ? "text-white/80" : "text-gray-600 dark:text-gray-400"
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

                <p className={cn("text-right text-xs mt-1", isMe ? "text-white/80 dark:text-darkBg-main/80" : "text-gray-500 dark:text-gray-500")}>
                    {timestamp}
                </p>

                {(!isLegacy && (onReply || reactionsAllowed)) && !isTempMessage && (
                    <div className="mt-1 flex items-center justify-end gap-1">
                        {/* Reaction trigger */}
                        {reactionsAllowed && (
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowReactionPicker((v) => !v)}
                                className={cn(
                                    "h-6 w-6 p-0",
                                    isMe
                                        ? "text-white/70 hover:text-white hover:bg-white/15"
                                        : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                )}
                                aria-label="Add reaction"
                            >
                                <Smile size={12} />
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
                                className={cn(
                                    "h-6 px-2 text-[11px]",
                                    isMe
                                        ? "text-white/90 hover:text-white hover:bg-white/15"
                                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                )}
                            >
                                <Reply size={12} className="mr-1" />
                                Reply
                            </Button>
                        )}
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
            </div>

            {isMe && (
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 mt-1 ml-2 flex-shrink-0">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt="You" />
                    <AvatarFallback>Y</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}
