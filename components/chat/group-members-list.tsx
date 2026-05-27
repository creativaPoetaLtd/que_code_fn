"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Crown, Shield, User } from "lucide-react"
import type { GroupMember } from "@/types/group.types"

interface GroupMembersListProps {
    members: GroupMember[]
    isLoading?: boolean
    onMessageMember?: (memberId: string) => void
    className?: string
    maxHeight?: string
}

export default function GroupMembersList({
    members,
    isLoading = false,
    onMessageMember,
    className = "",
    maxHeight = "max-h-96"
}: GroupMembersListProps) {
    const getRoleBadgeConfig = (role: string) => {
        switch (role) {
            case 'owner':
                return {
                    icon: Crown,
                    className: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                    label: "Owner"
                }
            case 'admin':
                return {
                    icon: Shield,
                    className: "bg-slate-100 dark:bg-darkBg-interactive text-slate-600 dark:text-slate-300 border-slate-200 dark:border-darkBorder-light",
                    label: "Admin"
                }
            default:
                return {
                    icon: User,
                    className: "bg-gray-50 dark:bg-darkBg-interactive text-gray-500 dark:text-gray-400 border-gray-200 dark:border-darkBorder-light",
                    label: "Member"
                }
        }
    }

    const getInitials = (name: string): string => {
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    if (isLoading) {
        return (
            <div className={`space-y-1 ${className}`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="h-9 w-9 bg-gray-200 dark:bg-darkBg-interactive rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3.5 w-28 bg-gray-200 dark:bg-darkBg-interactive rounded" />
                            <div className="h-3 w-20 bg-gray-100 dark:bg-darkBg-interactive/60 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!members || members.length === 0) {
        return (
            <div className={`text-center py-8 text-gray-400 dark:text-gray-500 text-sm ${className}`}>
                No members found
            </div>
        )
    }

    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 }
        return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3)
    })

    return (
        <div className={`${maxHeight} overflow-y-auto ${className}`}>
            {sortedMembers.map((member) => {
                const roleConfig = getRoleBadgeConfig(member.role)
                const RoleIcon = roleConfig.icon

                return (
                    <div
                        key={member.id}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                    >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                                <AvatarImage
                                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.userName}`}
                                    alt={member.userName}
                                />
                                <AvatarFallback className="text-xs bg-gray-200 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300">
                                    {getInitials(member.userName)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                                        {member.userName}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`${roleConfig.className} text-[10px] flex items-center gap-1 flex-shrink-0 py-0`}
                                    >
                                        <RoleIcon size={10} />
                                        {roleConfig.label}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                    {member.userEmail}
                                </p>
                                {member.joinedAt && (
                                    <p className="text-[11px] text-gray-400 dark:text-gray-600">
                                        Joined {new Date(member.joinedAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                        {onMessageMember && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onMessageMember(member.userId)}
                                className="shrink-0 h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                <MessageCircle size={15} />
                            </Button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
