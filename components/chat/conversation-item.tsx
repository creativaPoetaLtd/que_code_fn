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
                "p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 transform hover:translate-x-1",
                isActive ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-l-4 border-l-blue-500 shadow-sm" : "",
            )}
            onClick={onClick}
        >
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-shrink-0">
                    {conversation.isGroup ? (
                        <div className="bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white">
                            <Users size={18} />
                        </div>
                    ) : (
                        <div className="relative">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
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
                        <p className="font-medium truncate text-sm sm:text-base">{conversation.name}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-1">{conversation.timestamp}</span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[70%]">
                            {conversation.isGroup && (
                                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 mr-1.5 hidden sm:inline-block">
                                    {conversation.online}/{conversation.members}
                                </span>
                            )}
                            {conversation.lastMessage}
                        </p>
                        {conversation.unread && conversation.unread > 0 && (
                            <Badge variant="default" className="bg-[#00B512] text-xs ml-1">
                                {conversation.unread}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
