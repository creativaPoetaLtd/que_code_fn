"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, Users, Phone, Video, MoreVertical, Info } from "lucide-react"
import type { Conversation } from "@/types"

interface ChatHeaderProps {
    conversation: Conversation
    onBackClick: () => void
    onViewProfile: () => void
}

export default function ChatHeader({ conversation, onBackClick, onViewProfile }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between p-3 sm:p-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBackClick}
                    className="md:hidden text-gray-600 h-8 w-8 sm:h-9 sm:w-9"
                >
                    <ChevronLeft size={20} />
                </Button>

                {conversation.isGroup ? (
                    <div className="bg-[#00313A] h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white">
                        <Users size={16} className="sm:size-20" />
                    </div>
                ) : (
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={conversation.avatar || "/placeholder.svg"} alt={conversation.name} />
                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}

                <div>
                    <p className="font-medium text-sm sm:text-base line-clamp-1">{conversation.name}</p>
                    <p className="text-xs text-gray-500">
                        {conversation.isGroup
                            ? `${conversation.online} online • ${conversation.members} members`
                            : conversation.online
                                ? "Online"
                                : "Offline"}
                    </p>
                </div>
            </div>

            <div className="flex gap-1 sm:gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onViewProfile}
                    title="View profile"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                >
                    <Info size={16} className="sm:size-20" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <Phone size={16} className="sm:size-20" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex">
                    <Video size={16} className="sm:size-20" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <MoreVertical size={16} className="sm:size-20" />
                </Button>
            </div>
        </div>
    )
}
