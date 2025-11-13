import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message, LegacyMessage } from "@/types"
import { useMemo } from "react"

interface MessageItemProps {
    message: Message | LegacyMessage
}

// Type guard to check if message is legacy format
function isLegacyMessage(message: Message | LegacyMessage): message is LegacyMessage {
    return 'isMe' in message && 'message' in message;
}

export default function MessageItem({ message }: MessageItemProps) {
    // Handle both message formats
    const isLegacy = isLegacyMessage(message);

    let messageContent: any = isLegacy ? message.message : message.content;
    const isMe = isLegacy ? message.isMe : (message as any).isMe || false;

    // Simple sender name extraction since message transformation now handles the complex logic
    const senderDisplayName = useMemo(() => {
        if (isLegacy) {
            return String(message.sender || 'Unknown User');
        }

        const sender = message.sender as any;
        
        // At this point, sender should be a string due to the transformation in real-chat-page.tsx
        if (typeof sender === 'string') {
            return sender;
        }
        
        // Fallback handling for any edge cases
        if (!sender || typeof sender !== 'object') {
            return 'Unknown User';
        }

        // If somehow an object made it through, extract the name
        if (sender.name) return String(sender.name);
        if (sender.firstName && sender.lastName) return `${sender.firstName} ${sender.lastName}`.trim();
        if (sender.firstName) return String(sender.firstName);
        if (sender.lastName) return String(sender.lastName);
        if (sender.username) return String(sender.username);
        if (sender.email) return String(sender.email);
        if (sender.id) return `User ${String(sender.id).substring(0, 8)}`;
        
        return 'Unknown User';
    }, [isLegacy, message.sender]);



    // Handle case where content might be an object instead of string
    if (typeof messageContent === 'object' && messageContent !== null) {
        // If it's an object, try to extract the actual content
        if (messageContent.content) {
            messageContent = messageContent.content;
        } else if (messageContent.text) {
            messageContent = messageContent.text;
        } else if (messageContent.message) {
            messageContent = messageContent.message;
        } else {
            // If we can't find a reasonable text field, stringify it
            messageContent = JSON.stringify(messageContent);
        }
    }

    // Ensure messageContent is always a string
    messageContent = String(messageContent || '');

    const avatar = isLegacy ? message.avatar : (message.sender as any)?.avatar || (message.sender as any)?.profile?.profileImage;
    const timestamp = isLegacy ? message.timestamp : new Date(message.createdAt).toLocaleTimeString();

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
                    "relative max-w-[18rem] sm:max-w-sm rounded-xl px-3 py-2",
                    isMe ? "bg-[#00B512] text-white" : "bg-white",
                    isMoneyMessage ? "border-2 border-yellow-400" : "shadow-md"
                )}
            >
                {!isMe && <p className="text-xs font-semibold mb-1">{senderDisplayName}</p>}
                <p className={isMe ? "text-white" : ""}>{messageContent}</p>
                <p className={cn("text-right text-xs mt-1", isMe ? "text-green-100" : "text-gray-400")}>
                    {timestamp}
                </p>

                {/* Show read receipts for new message format */}
                {!isLegacy && message.readBy.length > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                        Read by {message.readBy.length} {message.readBy.length === 1 ? 'person' : 'people'}
                    </div>
                )}
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