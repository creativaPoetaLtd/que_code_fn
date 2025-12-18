'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Users, 
    MessageCircle, 
    Loader2, 
    UserPlus,
    Send
} from 'lucide-react'

interface GroupActionsProps {
    group: any
    isActiveMember: boolean
    isRequestingJoin: boolean
    onJoinGroup: (group: any) => void
    onRequestToJoin: (groupId: string, groupName: string) => void
    onViewRequests: (group: { id: string; name: string }) => void
}

export default function GroupActions({ 
    group, 
    isActiveMember, 
    isRequestingJoin,
    onJoinGroup, 
    onRequestToJoin, 
    onViewRequests 
}: GroupActionsProps) {
    if (isActiveMember) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => onJoinGroup(group)}
                    className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main shadow-sm"
                >
                    <MessageCircle size={14} className="mr-2" />
                    Start Chat
                </Button>
                
                {group.userRole === "owner" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRequests({ id: group.id, name: group.name })}
                        className="relative border-gray-200 dark:border-darkBorder-light text-brand-green dark:text-brand-gold hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                    >
                        <Users size={14} className="mr-2" />
                        Requests
                        {group.pendingRequestsCount > 0 && (
                            <Badge 
                                variant="destructive" 
                                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs min-w-[20px] rounded-full"
                            >
                                {group.pendingRequestsCount > 99 ? "99+" : group.pendingRequestsCount}
                            </Badge>
                        )}
                    </Button>
                )}
            </div>
        )
    }

    if (group.userHasPendingRequest) {
        return (
            <Button
                variant="outline"
                size="sm"
                disabled
                className="border-yellow-200 text-yellow-600 bg-yellow-50"
            >
                <Loader2 size={14} className="mr-2 animate-spin" />
                Request Sent
            </Button>
        )
    }

    if (group.isPrivate) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestToJoin(group.id, group.name)}
                disabled={isRequestingJoin}
                className="border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-50"
            >
                {isRequestingJoin ? (
                    <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Sending...
                    </>
                ) : (
                    <>
                        <UserPlus size={14} className="mr-2" />
                        Request Join
                    </>
                )}
            </Button>
        )
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onJoinGroup(group)}
            className="border-gray-200 dark:border-darkBorder-light text-brand-green dark:text-brand-gold hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
        >
            <Send size={14} className="mr-2" />
            Join Group
        </Button>
    )
}