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
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={onBackClick} className="md:hidden text-gray-600">
                    <ChevronLeft size={24} />
                </Button>

                {conversation.isGroup ? (
                    <div className="bg-[#00313A] h-10 w-10 rounded-full flex items-center justify-center text-white">
                        <Users size={20} />
                    </div>
                ) : (
                    <Avatar>
                        <AvatarImage src={conversation.avatar} alt={conversation.name} />
                        <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}

                <div>
                    <p className="font-medium">{conversation.name}</p>
                    <p className="text-xs text-gray-500">
                        {conversation.isGroup
                            ? `${conversation.online} online • ${conversation.members} members`
                            : conversation.online
                                ? "Online"
                                : "Offline"}
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="ghost" size="icon" onClick={onViewProfile} title="View profile">
                    <Info size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                    <Phone size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                    <Video size={20} />
                </Button>
                <Button variant="ghost" size="icon">
                    <MoreVertical size={20} />
                </Button>
            </div>
        </div>
    )
}

