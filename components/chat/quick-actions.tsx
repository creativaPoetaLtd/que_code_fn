'use client'

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { MessageCirclePlus, UserPlus, Users, Link, ChevronDown, User } from 'lucide-react'

interface QuickActionsProps {
    onAddContact: () => void
    onStartNewChat: () => void
    onViewMyGroups: () => void
    onJoinGroupByLink: () => void
    onViewContactRequests: () => void
    pendingRequestsCount?: number
}

export default function QuickActions({
    onAddContact,
    onStartNewChat,
    onViewMyGroups,
    onJoinGroupByLink,
    onViewContactRequests,
    pendingRequestsCount = 0,
}: QuickActionsProps) {
    return (
        <div className="space-y-3">
            {/* Contact Requests - Prominently displayed if there are pending requests */}
            {pendingRequestsCount > 0 && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewContactRequests}
                    className="w-full h-9 text-xs bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 relative"
                >
                    <UserPlus size={14} className="mr-2" />
                    Contact Requests
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingRequestsCount}
                    </span>
                </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
                {/* Contacts Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 justify-between"
                        >
                            <div className="flex items-center">
                                <User size={14} className="mr-1.5" />
                                Contacts
                            </div>
                            <ChevronDown size={12} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={onStartNewChat} className="cursor-pointer">
                            <MessageCirclePlus size={14} className="mr-2" />
                            New Chat
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onAddContact} className="cursor-pointer">
                            <UserPlus size={14} className="mr-2" />
                            Add Contact
                        </DropdownMenuItem>
                        {pendingRequestsCount === 0 && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onViewContactRequests} className="cursor-pointer">
                                    <UserPlus size={14} className="mr-2" />
                                    Contact Requests
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Groups Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-9 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 justify-between"
                        >
                            <div className="flex items-center">
                                <Users size={14} className="mr-1.5" />
                                Groups
                            </div>
                            <ChevronDown size={12} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={onViewMyGroups} className="cursor-pointer">
                            <Users size={14} className="mr-2" />
                            My Groups
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onJoinGroupByLink} className="cursor-pointer">
                            <Link size={14} className="mr-2" />
                            Join Group
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}