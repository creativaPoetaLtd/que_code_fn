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
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-sm"
                >
                    <MessageCircle size={14} className="mr-2" />
                    Start Chat
                </Button>
                
                {group.userRole === "owner" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRequests({ id: group.id, name: group.name })}
                        className="relative border-green-200 text-green-600 hover:bg-green-50"
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
                className="border-purple-200 text-purple-600 hover:bg-purple-50 disabled:opacity-50"
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
            className="border-green-200 text-green-600 hover:bg-green-50"
        >
            <Send size={14} className="mr-2" />
            Join Group
        </Button>
    )
}