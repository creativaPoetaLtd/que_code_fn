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
                    className: "bg-yellow-50 text-yellow-700 border-yellow-300",
                    label: "Owner"
                }
            case 'admin':
                return {
                    icon: Shield,
                    className: "bg-blue-50 text-blue-700 border-blue-300",
                    label: "Admin"
                }
            default:
                return {
                    icon: User,
                    className: "bg-gray-50 text-gray-600 border-gray-200",
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
            <div className={`space-y-2 ${className}`}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gray-200 rounded-full" />
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!members || members.length === 0) {
        return (
            <div className={`text-center py-8 text-gray-500 ${className}`}>
                No members found
            </div>
        )
    }

    // Sort members: owner first, then admins, then regular members
    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 }
        return roleOrder[a.role] - roleOrder[b.role]
    })

    return (
        <div className={`space-y-2 ${maxHeight} overflow-y-auto ${className}`}>
            {sortedMembers.map((member) => {
                const roleConfig = getRoleBadgeConfig(member.role)
                const RoleIcon = roleConfig.icon

                return (
                    <div
                        key={member.id}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <div className="flex items-center gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.userName}`} alt={member.userName} />
                                <AvatarFallback>{getInitials(member.userName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">
                                        {member.userName}
                                    </span>
                                    <Badge
                                        variant="outline"
                                        className={`${roleConfig.className} text-xs flex items-center gap-1`}
                                    >
                                        <RoleIcon size={12} />
                                        {roleConfig.label}
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {member.userEmail}
                                </p>
                                {member.joinedAt && (
                                    <p className="text-xs text-gray-400">
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
                                className="shrink-0"
                            >
                                <MessageCircle size={16} />
                            </Button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
