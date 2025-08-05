"use client"
import { Button } from "@/components/ui/button"
import { Conversation } from "@/types"
import { Info, Phone, Video, MoreVertical, UserPlus } from "lucide-react"

interface ChatHeaderProps {
    conversation: Conversation
    onBackClick: () => void
    onViewProfile: () => void
    onInviteToGroup?: () => void // Add this prop
}

export default function ChatHeader({ conversation, onBackClick, onViewProfile, onInviteToGroup }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <Button variant="ghost" size="icon" onClick={onBackClick} className="h-8 w-8 sm:h-9 sm:w-9">
                {/* ArrowLeft icon here */}
            </Button>
            <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold">{conversation.name}</h1>
                {/* Other conversation details here */}
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
                {conversation.isGroup &&
                    onInviteToGroup && ( // Conditionally render for groups
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onInviteToGroup}
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            title="Invite members"
                        >
                            <UserPlus size={16} className="sm:size-20" />
                        </Button>
                    )}
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <MoreVertical size={16} className="sm:size-20" />
                </Button>
            </div>
        </div>
    )
}
