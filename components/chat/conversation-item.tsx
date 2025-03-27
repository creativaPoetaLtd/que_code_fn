"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation } from "@/types"

interface ConversationItemProps {
    conversation: Conversation
    isActive: boolean
    onClick: () => void
}

export default function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
    return (
        <div
            className={cn(
                "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                isActive ? "bg-gray-50" : "",
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-3">
                <div className="relative">
                    {conversation.isGroup ? (
                        <div className="bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white">
                            <Users size={20} />
                        </div>
                    ) : (
                        <div className="relative">
                            <Avatar>
                                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                                <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {conversation.online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className="font-medium truncate">{conversation.name}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{conversation.timestamp}</span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-500 truncate">
                            {conversation.isGroup && (
                                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 mr-2">
                                    {conversation.online}/{conversation.members}
                                </span>
                            )}
                            {conversation.lastMessage}
                        </p>
                        {conversation.unread && conversation.unread > 0 && (
                            <Badge variant="default" className="bg-[#00B512]">
                                {conversation.unread}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

