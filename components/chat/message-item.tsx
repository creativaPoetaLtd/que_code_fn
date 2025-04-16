import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message } from "@/types"

interface MessageItemProps {
    message: Message
}

export default function MessageItem({ message }: MessageItemProps) {
    const isMoneyMessage = message.message.includes("$")

    return (
        <div className={cn("flex mb-3 sm:mb-4", message.isMe ? "justify-end" : "justify-start")}>
            {!message.isMe && (
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 mt-1 mr-2 flex-shrink-0">
                    <AvatarImage src={message.avatar || "/placeholder.svg"} alt={message.sender} />
                    <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm text-sm sm:text-base",
                    message.isMe ? "bg-[#00B512] text-white" : "bg-white",
                    isMoneyMessage ? "border-2 border-green-200" : "",
                )}
            >
                {!message.isMe && <p className="text-xs font-semibold mb-1">{message.sender}</p>}
                <p className={message.isMe ? "text-white" : ""}>{message.message}</p>
                <p className={cn("text-right text-xs mt-1", message.isMe ? "text-green-100" : "text-gray-400")}>
                    {message.timestamp}
                </p>
            </div>

            {message.isMe && (
                <Avatar className="h-7 w-7 sm:h-9 sm:w-9 mt-1 ml-2 flex-shrink-0">
                    <AvatarImage src={message.avatar || "/placeholder.svg"} alt="You" />
                    <AvatarFallback>Y</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}
