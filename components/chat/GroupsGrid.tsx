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
                <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green/10 dark:bg-brand-gold/10 rounded-full mb-4">
                    <div className="w-8 h-8 border-4 border-brand-green/20 dark:border-brand-gold/20 border-t-brand-green dark:border-t-brand-gold rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Loading Groups</h3>
                <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch your groups...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-darkBg-interactive rounded-full mb-4">
                    <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to Load Groups</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Something went wrong. Please try again.</p>
                <Button onClick={onRefetch} variant="outline" className="border-gray-200 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive">
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 dark:bg-darkBg-card rounded-full mb-4">
                            <Search size={32} className="text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Groups Found</h3>
                        <p className="text-gray-500 dark:text-gray-400">No groups match your search for "{searchTerm}"</p>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-green/10 dark:bg-brand-gold/10 rounded-full mb-4">
                            <Users size={32} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Groups Yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-2">You haven't joined any groups yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Ask to be invited to existing groups or create a new one</p>
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