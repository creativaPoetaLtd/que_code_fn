'use client'

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Info,
    Bell,
    BellOff,
    MoreVertical,
    Trash2,
    LogOut,
    UserPlus,
    Settings,
    Eye
} from 'lucide-react'

interface GroupMenuProps {
    group: any
    isActiveMember: boolean
    onManageAction: (action: string, group: any) => void
}

export default function GroupMenu({ group, isActiveMember, onManageAction }: GroupMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                >
                    <MoreVertical size={16} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-lg border-gray-200 dark:border-darkBorder-light">
                                <DropdownMenuItem onClick={() => onManageAction("info", group)}>
                    <Info size={16} className="text-green-500" />
                    Group Info
                </DropdownMenuItem>
                
                {isActiveMember && (
                    <>
                        <DropdownMenuItem 
                            onClick={() => onManageAction("invite", group)}
                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                        >
                            <UserPlus size={16} className="text-green-500" />
                            <span>Invite Members</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        <DropdownMenuItem 
                            onClick={() => onManageAction("mute", group)}
                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                        >
                            <BellOff size={16} className="text-orange-500" />
                            <span>Mute Notifications</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                            onClick={() => onManageAction("unmute", group)}
                            className="flex items-center gap-3 py-2.5 cursor-pointer"
                        >
                            <Bell size={16} className="text-green-500" />
                            <span>Unmute Notifications</span>
                        </DropdownMenuItem>
                        
                        {(group.userRole === "owner" || group.userRole === "admin") && (
                            <>
                                <DropdownMenuSeparator className="my-1" />
                                <DropdownMenuItem 
                                    onClick={() => onManageAction("settings", group)}
                                    className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                                >
                                    <Settings size={16} className="text-brand-green dark:text-brand-gold" />
                                    <span>Group Settings</span>
                                </DropdownMenuItem>
                            </>
                        )}
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        {group.userRole === "owner" ? (
                            <DropdownMenuItem
                                onClick={() => onManageAction("delete", group)}
                                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-darkBg-interactive text-gray-700 dark:text-gray-300 focus:text-gray-700 dark:focus:text-gray-300"
                            >
                                <Trash2 size={16} />
                                <span>Delete Group</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => onManageAction("leave", group)}
                                className="flex items-center gap-3 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-darkBg-interactive text-gray-700 dark:text-gray-300 focus:text-gray-700 dark:focus:text-gray-300"
                            >
                                <LogOut size={16} />
                                <span>Leave Group</span>
                            </DropdownMenuItem>
                        )}
                    </>
                )}
                
                {!isActiveMember && (
                    <DropdownMenuItem 
                        onClick={() => onManageAction("view", group)}
                        className="flex items-center gap-3 py-2.5 cursor-pointer"
                    >
                        <Eye size={16} className="text-gray-500 dark:text-gray-400" />
                        <span>View Group</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}