'use client'

import { Search, Users, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import GroupCard from './GroupCard'

interface GroupsGridProps {
    groups: any[]
    searchTerm: string
    isLoading: boolean
    error: any
    isRequestingJoin: boolean
    onJoinGroup: (group: any) => void
    onRequestToJoin: (groupId: string, groupName: string) => void
    onManageAction: (action: string, group: any) => void
    onViewRequests: (group: { id: string; name: string }) => void
    onRefetch: () => void
}

export default function GroupsGrid({
    groups,
    searchTerm,
    isLoading,
    error,
    isRequestingJoin,
    onJoinGroup,
    onRequestToJoin,
    onManageAction,
    onViewRequests,
    onRefetch
}: GroupsGridProps) {
    if (isLoading) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Groups</h3>
                <p className="text-gray-500">Please wait while we fetch your groups...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Groups</h3>
                <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
                <Button onClick={onRefetch} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                    Try Again
                </Button>
            </div>
        )
    }

    if (groups.length === 0) {
        return (
            <div className="text-center py-16">
                {searchTerm ? (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                            <Search size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Found</h3>
                        <p className="text-gray-500">No groups match your search for "{searchTerm}"</p>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-50 rounded-full mb-4">
                            <Users size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Yet</h3>
                        <p className="text-gray-500 mb-2">You haven't joined any groups yet</p>
                        <p className="text-sm text-gray-400">Ask to be invited to existing groups or create a new one</p>
                    </>
                )}
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1">
            {groups.map((group) => (
                <GroupCard
                    key={group.id}
                    group={group}
                    onJoinGroup={onJoinGroup}
                    onRequestToJoin={onRequestToJoin}
                    onManageAction={onManageAction}
                    onViewRequests={onViewRequests}
                    isRequestingJoin={isRequestingJoin}
                />
            ))}
        </div>
    )
}