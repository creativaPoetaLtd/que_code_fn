"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Conversation } from "@/types"
import { 
    ArrowLeft, 
    Info, 
    Phone, 
    Video, 
    MoreVertical, 
    UserPlus, 
    Settings,
    Users,
    Circle
} from "lucide-react"

interface ChatHeaderProps {
    conversation: Conversation
    onBackClick: () => void
    onViewProfile: () => void
    onInviteToGroup?: () => void
}

export default function ChatHeader({ 
    conversation, 
    onBackClick, 
    onViewProfile, 
    onInviteToGroup 
}: ChatHeaderProps) {
    const getOnlineStatus = () => {
        if (conversation.isGroup) {
            return `${conversation.online || 0} online`
        }
        return conversation.online ? 'Online' : 'Last seen recently'
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(word => word[0]).join('').toUpperCase()
    }

    return (
        <div className="flex items-center justify-between px-3 sm:px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
            {/* Back Button - Mobile Only */}
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBackClick} 
                className="h-9 w-9 md:hidden hover:bg-gray-100 transition-colors"
                aria-label="Back to conversations"
            >
                <ArrowLeft size={18} />
            </Button>

            {/* Conversation Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative">
                    <Avatar className="h-10 w-10 border-2 border-gray-100">
                        <AvatarImage src={conversation.avatar} alt={conversation.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                            {getInitials(conversation.name)}
                        </AvatarFallback>
                    </Avatar>
                    {!conversation.isGroup && conversation.online && (
                        <Circle 
                            size={10} 
                            className="absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500 border-2 border-white rounded-full" 
                        />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {conversation.name}
                        </h1>
                        {conversation.isGroup && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                <Users size={10} className="mr-1" />
                                {conversation.members}
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {getOnlineStatus()}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
                {/* Quick Actions - Desktop */}
                <div className="hidden sm:flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-gray-100 transition-colors"
                        aria-label="Voice call"
                    >
                        <Phone size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 hover:bg-gray-100 transition-colors"
                        aria-label="Video call"
                    >
                        <Video size={16} />
                    </Button>
                </div>

                {/* Profile/Info Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onViewProfile}
                    className="h-9 w-9 hover:bg-gray-100 transition-colors"
                    aria-label="View profile"
                >
                    <Info size={16} />
                </Button>

                {/* More Actions Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 hover:bg-gray-100 transition-colors"
                            aria-label="More options"
                        >
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onViewProfile} className="cursor-pointer">
                            <Info size={14} className="mr-2" />
                            View Profile
                        </DropdownMenuItem>
                        
                        <div className="sm:hidden">
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer">
                                <Phone size={14} className="mr-2" />
                                Voice Call
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <Video size={14} className="mr-2" />
                                Video Call
                            </DropdownMenuItem>
                        </div>

                        {conversation.isGroup && onInviteToGroup && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onInviteToGroup} className="cursor-pointer">
                                    <UserPlus size={14} className="mr-2" />
                                    Invite Members
                                </DropdownMenuItem>
                            </>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <Settings size={14} className="mr-2" />
                            Chat Settings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
