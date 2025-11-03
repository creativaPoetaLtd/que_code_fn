'use client'

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { AlertCircle } from 'lucide-react'
import { toast } from "@/hooks/use-toast"
import {
    useGetGroupsQuery,
    useLeaveGroupMutation,
    useRequestToJoinGroupMutation,
    useDeleteGroupMutation,
} from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import type { Conversation } from "@/types"

import GroupsHeader from './GroupsHeader'
import GroupsGrid from './GroupsGrid'
import GroupDialogs from './GroupDialogs'
import GroupJoinRequestsModal from "./group-join-requests-modal"
import InviteToGroupModal from "./invite-to-group-modal"

interface GroupsModalProps {
    isOpen: boolean
    onClose: () => void
    onJoinGroup: (group: any) => void
    existingConversations: Conversation[]
}

type DialogState = {
    leave: { isOpen: boolean; groupId: string | null }
    delete: { isOpen: boolean; groupId: string | null }
}

export default function GroupsModal({ isOpen, onClose, onJoinGroup, existingConversations }: GroupsModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [dialogState, setDialogState] = useState<DialogState>({
        leave: { isOpen: false, groupId: null },
        delete: { isOpen: false, groupId: null },
    })
    const [joinRequestsModal, setJoinRequestsModal] = useState<{ id: string; name: string } | null>(null)
    const [inviteModal, setInviteModal] = useState<any>(null)

    const { getToken } = useAuthToken()
    const token = getToken()

    const { data: groupsData, isLoading, error, refetch } = useGetGroupsQuery(token as string, { skip: !token })
    const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation()
    const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation()
    const [requestToJoinGroup, { isLoading: isRequestingJoin }] = useRequestToJoinGroupMutation()

    const groups = Array.isArray(groupsData?.data?.groups) ? groupsData.data.groups : []

    // Filter groups based on search term
    const filteredGroups = groups.filter((group: any) => {
        const search = searchTerm.toLowerCase()
        return group?.name?.toLowerCase().includes(search) || group?.description?.toLowerCase().includes(search)
    })

    const handleClose = () => {
        onClose()
        setSearchTerm("")
    }

    const handleJoinGroup = (group: any) => {
        onJoinGroup(group)
        handleClose()
        toast({
            title: "Opening Group Chat",
            description: `Welcome to ${group.name}! Opening your chat...`,
        })
    }

    const handleLeaveGroup = async (groupId: string, groupName: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to leave the group",
                variant: "destructive",
            })
            return
        }
        try {
            await leaveGroup({ groupId, token }).unwrap()
            toast({
                title: "Left Group Successfully",
                description: `You have left "${groupName}". You can rejoin if invited again.`,
            })
            refetch()
            setDialogState(prev => ({ ...prev, leave: { isOpen: false, groupId: null } }))
        } catch (error: any) {
            toast({
                title: "Failed to Leave Group",
                description: error?.data?.message || error?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleDeleteGroup = async (groupId: string, groupName: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to delete the group",
                variant: "destructive",
            })
            return
        }
        try {
            await deleteGroup({ groupId, token }).unwrap()
            toast({
                title: "Group Deleted Successfully",
                description: `"${groupName}" has been permanently deleted.`,
            })
            refetch()
            setDialogState(prev => ({ ...prev, delete: { isOpen: false, groupId: null } }))
        } catch (error: any) {
            toast({
                title: "Failed to Delete Group",
                description: error?.data?.message || error?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleRequestToJoin = async (groupId: string, groupName: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to request to join a group",
                variant: "destructive",
            })
            return
        }
        try {
            await requestToJoinGroup({ groupId, token }).unwrap()
            toast({
                title: "Request Sent Successfully",
                description: `Your request to join "${groupName}" has been sent to the group admin.`,
            })
            refetch()
        } catch (error: any) {
            toast({
                title: "Failed to Send Request",
                description: error?.data?.message || error?.message || "Something went wrong. Please try again.",
                variant: "destructive",
            })
        }
    }

    const handleManageAction = (action: string, group: any) => {
        switch (action) {
            case "leave":
                setDialogState(prev => ({ ...prev, leave: { isOpen: true, groupId: group.id } }))
                break
            case "delete":
                setDialogState(prev => ({ ...prev, delete: { isOpen: true, groupId: group.id } }))
                break
            case "info":
                toast({
                    title: `${group.name} Details`,
                    description: `${group.memberCount || 0} members • Created ${new Date(group.createdAt).toLocaleDateString()}`,
                })
                break
            case "mute":
                toast({
                    title: "Notifications Muted",
                    description: `You won't receive notifications from "${group.name}" anymore.`,
                })
                break
            case "unmute":
                toast({
                    title: "Notifications Enabled",
                    description: `You'll now receive notifications from "${group.name}".`,
                })
                break
            case "invite":
                setInviteModal(group)
                break
            case "settings":
                toast({
                    title: "Group Settings",
                    description: "Group settings will be available soon.",
                })
                break
            case "view":
                toast({
                    title: "View Group",
                    description: `Viewing details for "${group.name}".`,
                })
                break
            default:
                break
        }
    }

    const renderContent = () => {
        if (!token) {
            return (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
                    <p className="text-gray-500">Please log in to view your groups</p>
                </div>
            )
        }

        return (
            <GroupsGrid
                groups={filteredGroups}
                searchTerm={searchTerm}
                isLoading={isLoading}
                error={error}
                isRequestingJoin={isRequestingJoin}
                onJoinGroup={handleJoinGroup}
                onRequestToJoin={handleRequestToJoin}
                onManageAction={handleManageAction}
                onViewRequests={setJoinRequestsModal}
                onRefetch={refetch}
            />
        )
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200 bg-white">
                        <GroupsHeader
                            groupsCount={groups.length}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                        {renderContent()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialogs */}
            <GroupDialogs
                leaveDialog={dialogState.leave}
                deleteDialog={dialogState.delete}
                groups={groups}
                isLeaving={isLeaving}
                isDeleting={isDeleting}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteGroup}
                onCloseLeaveDialog={() => setDialogState(prev => ({ ...prev, leave: { isOpen: false, groupId: null } }))}
                onCloseDeleteDialog={() => setDialogState(prev => ({ ...prev, delete: { isOpen: false, groupId: null } }))}
            />

            {/* Join Requests Modal */}
            {joinRequestsModal && (
                <GroupJoinRequestsModal
                    isOpen={true}
                    onClose={() => setJoinRequestsModal(null)}
                    groupId={joinRequestsModal.id}
                    groupName={joinRequestsModal.name}
                    token={token as string}
                />
            )}

            {/* Invite Modal */}
            {inviteModal && (
                <InviteToGroupModal
                    isOpen={true}
                    onClose={() => setInviteModal(null)}
                    group={inviteModal}
                    token={token}
                />
            )}
        </>
    )
}
