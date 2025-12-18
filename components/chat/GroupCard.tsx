'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Users,
    MessageCircle,
    Loader2,
    Calendar,
    User,
    Crown,
    Shield,
    Clock
} from 'lucide-react'
import GroupActions from './GroupActions'
import GroupMenu from './GroupMenu'

interface GroupCardProps {
    group: any
    onJoinGroup: (group: any) => void
    onRequestToJoin: (groupId: string, groupName: string) => void
    onManageAction: (action: string, group: any) => void
    onViewRequests: (group: { id: string; name: string }) => void
    isRequestingJoin: boolean
}

export default function GroupCard({
    group,
    onJoinGroup,
    onRequestToJoin,
    onManageAction,
    onViewRequests,
    isRequestingJoin
}: GroupCardProps) {
    if (!group?.id) return null

    const isActiveMember = ["member", "owner", "admin"].includes(group.userRole)
    const isOwner = group.userRole === "owner"
    const isAdmin = group.userRole === "admin"

    const getRoleIcon = () => {
        if (isOwner) return <Crown size={14} className="text-yellow-500" />
        if (isAdmin) return <Shield size={14} className="text-green-500" />
        return null
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) return 'Today'
        if (diffDays <= 7) return `${diffDays} days ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="group relative bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-xl p-6 hover:shadow-lg hover:border-brand-green dark:hover:border-brand-gold transition-all duration-200 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="h-14 w-14 ring-2 ring-gray-100 dark:ring-darkBorder-light group-hover:ring-brand-green/20 dark:group-hover:ring-brand-gold/20 transition-colors">
                        <AvatarImage
                            src={group.picture || group.avatar}
                            alt={group.name}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-semibold text-lg">
                            {group.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">{group.name}</h3>
                            {getRoleIcon()}
                            {group.isPrivate && (
                                <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400">
                                    Private
                                </Badge>
                            )}
                        </div>
                        {group.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                {group.description}
                            </p>
                        )}
                    </div>
                </div>
                <GroupMenu
                    group={group}
                    onManageAction={onManageAction}
                    isActiveMember={isActiveMember}
                />
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-brand-green dark:text-brand-gold" />
                    <span className="font-medium">{group.memberCount || 0}</span>
                    <span>member{(group.memberCount || 0) !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-brand-green dark:text-brand-gold" />
                    <span>Created {formatDate(group.createdAt)}</span>
                </div>
                {group.createdBy && (
                    <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-500 dark:text-gray-400" />
                        <span>by {group.createdBy}</span>
                    </div>
                )}
                {group.lastActivity && (
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-500 dark:text-gray-400" />
                        <span>Active {formatDate(group.lastActivity)}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <GroupActions
                    group={group}
                    isActiveMember={isActiveMember}
                    isRequestingJoin={isRequestingJoin}
                    onJoinGroup={onJoinGroup}
                    onRequestToJoin={onRequestToJoin}
                    onViewRequests={onViewRequests}
                />

                {group.userHasPendingRequest && !isActiveMember && (
                    <Badge variant="secondary" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-800">
                        <Loader2 size={12} className="mr-1 animate-spin" />
                        Pending
                    </Badge>
                )}
            </div>
        </div>
    )
}