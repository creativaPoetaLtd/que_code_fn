import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message, LegacyMessage } from "@/types/chat.types"
import { useMemo } from "react"
import MediaMessageContent from "./media-message-content"

interface MessageItemProps {
    message: Message | LegacyMessage
}

function isLegacyMessage(message: Message | LegacyMessage): message is LegacyMessage {
    return 'isMe' in message && 'message' in message;
}

export default function MessageItem({ message }: MessageItemProps) {
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

    let messageContent: any = isLegacy ? message.message : message.content;

    if (!isMediaMessage) {
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

    const isMoneyMessage = messageContent.includes("$") || (!isLegacy && message.messageType === "money");
    
    return (
        <div className={cn("flex mb-3 sm:mb-4", isMe ? "justify-end" : "justify-start")}>
            {!isMe && (
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 mt-1 mr-2 flex-shrink-0">
                    <AvatarImage src={avatar || "/placeholder.svg"} alt={senderDisplayName} />
                    <AvatarFallback>{senderDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "relative max-w-[18rem] sm:max-w-md rounded-xl px-3 py-2",
                    isMe ? "bg-[#00B512] text-white" : "bg-white",
                    isMoneyMessage ? "border-2 border-yellow-400" : "shadow-md"
                )}
            >
                {!isMe && <p className="text-xs font-semibold mb-1">{senderDisplayName}</p>}

                {/* Render media content or regular text */}
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
                    />
                ) : (
                    <p className={isMe ? "text-white" : ""}>{messageContent}</p>
                )}

                <p className={cn("text-right text-xs mt-1", isMe ? "text-green-100" : "text-gray-400")}>
                    {timestamp}
                </p>

                {/* {!isLegacy && message.readBy && message.readBy.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                        Read by {message.readBy.length} {message.readBy.length === 1 ? 'person' : 'people'}
                    </div>
                )} */}
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