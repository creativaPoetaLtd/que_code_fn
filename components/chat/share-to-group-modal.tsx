"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search, Users, Loader2, AlertCircle, Check } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useGetGroupsQuery, useInviteToGroupMutation } from "@/states/groupSlice"

interface ShareToGroupModalProps {
    isOpen: boolean
    onClose: () => void
    token: string | null
    /** The person to invite — the other participant of the DM this was opened from */
    targetUserId: string
    targetName?: string
}

/**
 * Lets the user pick one of the groups they already belong to and invite the
 * current chat's other participant into it — the reverse of AddMemberModal,
 * which invites contacts into a group you're already viewing.
 */
export default function ShareToGroupModal({ isOpen, onClose, token, targetUserId, targetName }: ShareToGroupModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [invitedGroupIds, setInvitedGroupIds] = useState<string[]>([])
    const [invitingGroupId, setInvitingGroupId] = useState<string | null>(null)

    const { data, isLoading, error } = useGetGroupsQuery(token as string, {
        skip: !token || !isOpen,
    })
    const [inviteToGroup, { isLoading: isInviting }] = useInviteToGroupMutation()

    const groups = data?.data?.groups || []
    const filteredGroups = groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    useEffect(() => {
        if (isOpen) {
            setSearchTerm("")
            setInvitedGroupIds([])
        }
    }, [isOpen])

    const handleInvite = async (groupId: string, groupName: string) => {
        if (!token) return
        setInvitingGroupId(groupId)
        try {
            const result = await inviteToGroup({
                inviteData: { groupId, memberIds: [targetUserId] },
                token,
            }).unwrap()

            const failed = result.data?.failed
            if (failed && failed.length > 0) {
                toast({
                    title: "Could not invite",
                    description: failed[0]?.reason || `Could not add ${targetName || "this person"} to ${groupName}`,
                    variant: "destructive",
                })
            } else {
                setInvitedGroupIds((prev) => [...prev, groupId])
                toast({
                    title: "Invitation sent",
                    description: `${targetName || "They"} ${targetName ? "was" : "were"} invited to join ${groupName}`,
                })
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.data?.message || err?.message || "Failed to send the invitation",
                variant: "destructive",
            })
        } finally {
            setInvitingGroupId(null)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-semibold">
                        <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full">
                            <Users size={18} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <div>
                            <div>Invite to a group</div>
                            <div className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                                {targetName ? `Add ${targetName} to one of your groups` : "Add this contact to one of your groups"}
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col py-2">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                        <Input
                            placeholder="Search your groups..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-1">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <Loader2 size={32} className="mx-auto mb-2 animate-spin text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading your groups...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <AlertCircle size={32} className="mx-auto mb-2 text-red-400" />
                                <p className="text-sm text-red-500">Failed to load your groups</p>
                            </div>
                        ) : filteredGroups.length > 0 ? (
                            filteredGroups.map((group) => {
                                const alreadyInvited = invitedGroupIds.includes(group.id)
                                const isThisInviting = invitingGroupId === group.id
                                return (
                                    <button
                                        key={group.id}
                                        type="button"
                                        disabled={isInviting || alreadyInvited}
                                        onClick={() => handleInvite(group.id, group.name)}
                                        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:cursor-default disabled:hover:bg-transparent"
                                    >
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            {(group.picture || group.profilePictureUrl) && (
                                                <AvatarImage src={group.picture || group.profilePictureUrl} alt={group.name} />
                                            )}
                                            <AvatarFallback className="bg-brand-green/20 dark:bg-brand-gold/20 text-brand-green dark:text-brand-gold">
                                                {group.name?.charAt(0)?.toUpperCase() || "G"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white truncate">{group.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                        {isThisInviting ? (
                                            <Loader2 size={16} className="animate-spin text-gray-400 flex-shrink-0" />
                                        ) : alreadyInvited ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-brand-green dark:text-brand-gold flex-shrink-0">
                                                <Check size={14} /> Invited
                                            </span>
                                        ) : null}
                                    </button>
                                )
                            })
                        ) : searchTerm ? (
                            <div className="text-center py-8">
                                <Search size={32} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No groups found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users size={32} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">You're not in any groups yet</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500">Create a group first, then you can invite people to it from here</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
