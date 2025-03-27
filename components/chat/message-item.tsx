import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Message } from "@/types"

interface MessageItemProps {
    message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
    const isMoneyMessage = message.message.includes("$")

    return (
        <div className={cn("flex mb-4", message.isMe ? "justify-end" : "justify-start")}>
            {!message.isMe && (
                <Avatar className="h-9 w-9 mt-1 mr-2">
                    <AvatarImage src={message.avatar} alt={message.sender} />
                    <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm",
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
                <Avatar className="h-9 w-9 mt-1 ml-2">
                    <AvatarImage src={message.avatar} alt="You" />
                    <AvatarFallback>Y</AvatarFallback>
                </Avatar>
            )}
        </div>
    )
}
