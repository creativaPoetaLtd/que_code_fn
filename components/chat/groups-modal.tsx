"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Search,
    Users,
    MessageCircle,
    Loader2,
    AlertCircle,
    Calendar,
    User,
    LogOut,
    Info,
    Bell,
    BellOff,
    MoreVertical,
    Trash2,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
    useGetGroupsQuery,
    useLeaveGroupMutation,
    useRequestToJoinGroupMutation,
    useDeleteGroupMutation,
} from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import type { Conversation } from "@/types"
import GroupJoinRequestsModal from "./group-join-requests-modal"

interface GroupsModalProps {
    isOpen: boolean
    onClose: () => void
    onJoinGroup: (group: any) => void
    existingConversations: Conversation[]
}

export default function GroupsModal({ isOpen, onClose, onJoinGroup, existingConversations }: GroupsModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null)
    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isJoinRequestsModalOpen, setIsJoinRequestsModalOpen] = useState(false)
    const [selectedGroupForRequests, setSelectedGroupForRequests] = useState<{ id: string; name: string } | null>(null)

    const { getToken } = useAuthToken()
    const token = getToken()

    const {
        data: groupsData,
        isLoading,
        error,
        refetch,
    } = useGetGroupsQuery(token as string, {
        skip: !token,
    })

    const [leaveGroup, { isLoading: isLeaving }] = useLeaveGroupMutation()
    const [deleteGroup, { isLoading: isDeleting }] = useDeleteGroupMutation()
    const [requestToJoinGroup, { isLoading: isRequestingJoin }] = useRequestToJoinGroupMutation()

    const groups = Array.isArray(groupsData?.data?.groups) ? groupsData.data.groups : []
    // Assuming the backend might return these properties on the group object
    // group.userHasPendingRequest: boolean
    // group.pendingRequestsCount: number
    // group.userRole: 'owner' | 'admin' | 'member' | 'pending' | 'none'

    // Filter groups based on search term
    const filteredGroups = Array.isArray(groups)
        ? groups.filter((group: any) => {
            const groupName = group?.name?.toLowerCase() || ""
            const groupDescription = (group?.description || "").toLowerCase()
            const search = searchTerm.toLowerCase()
            return groupName.includes(search) || groupDescription.includes(search)
        })
        : []

    const handleJoinGroup = (group: any) => {
        onJoinGroup(group)
        onClose()
        setSearchTerm("")
        toast({
            title: "Send Join Request",
            description: `You are about to join the group. Please wait for approval.`,
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
                title: "Left Group",
                description: `You have left ${groupName}`,
            })

            // Refetch groups to update the list
            refetch()
            setIsLeaveDialogOpen(false)
            setLeaveGroupId(null)
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || "Failed to leave group"
            toast({
                title: "Failed to Leave Group",
                description: errorMessage,
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
                title: "Group Deleted",
                description: `You have successfully deleted ${groupName}`,
            })

            // Refetch groups to update the list
            refetch()
            setIsDeleteDialogOpen(false)
            setDeleteGroupId(null)
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || "Failed to delete group"
            toast({
                title: "Failed to Delete Group",
                description: errorMessage,
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
                title: "Request Sent",
                description: `Your request to join "${groupName}" has been sent.`,
            })
            refetch() // Refetch groups to update status
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || "Failed to send join request"
            toast({
                title: "Failed to Send Request",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const handleViewJoinRequests = (group: any) => {
        setSelectedGroupForRequests({ id: group.id, name: group.name })
        setIsJoinRequestsModalOpen(true)
    }

    const handleManageAction = (action: string, group: any) => {
        switch (action) {
            case "leave":
                setLeaveGroupId(group.id)
                setIsLeaveDialogOpen(true)
                break
            case "delete": // New action for delete
                setDeleteGroupId(group.id)
                setIsDeleteDialogOpen(true)
                break
            case "info":
                toast({
                    title: "Group Info",
                    description: `${group.name} - ${group.memberCount || 0} members`,
                })
                break
            case "mute":
                toast({
                    title: "Group Muted",
                    description: `Notifications for ${group.name} have been muted`,
                })
                break
            case "unmute":
                toast({
                    title: "Group Unmuted",
                    description: `Notifications for ${group.name} have been enabled`,
                })
                break
            default:
                break
        }
    }

    const handleClose = () => {
        onClose()
        setSearchTerm("")
    }

    if (!token) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            My Groups
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center">
                        <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Please log in to view your groups</p>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users size={20} className="text-blue-600" />
                            My Groups
                            {groups.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">({groups.length} groups)</span>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search your groups..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Groups List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Loader2 size={40} className="mx-auto mb-2 animate-spin text-gray-400" />
                                    <p className="text-gray-500">Loading your groups...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8">
                                    <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
                                    <p className="text-red-500 mb-2">Failed to load groups</p>
                                    <Button onClick={() => refetch()} variant="outline" size="sm">
                                        Retry
                                    </Button>
                                </div>
                            ) : filteredGroups.length > 0 ? (
                                <div className="grid gap-4">
                                    {filteredGroups
                                        .map((group: any) => {
                                            if (!group || !group.id) {
                                                console.warn("Invalid group object:", group)
                                                return null
                                            }

                                            const isAlreadyInConversations = existingConversations.some(
                                                (conv) => conv.isGroup && conv.name === group.name,
                                            )

                                            return (
                                                <div
                                                    key={group.id}
                                                    className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-start flex-1">
                                                        <Avatar className="h-12 w-12 mr-4 flex-shrink-0">
                                                            <AvatarImage
                                                                src={group.avatar || `/placeholder.svg?height=48&width=48`}
                                                                alt={group.name}
                                                            />
                                                            <AvatarFallback className="bg-blue-100 text-blue-600">
                                                                {group.name?.charAt(0)?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-medium text-gray-900 truncate">{group.name}</h3>
                                                                {group.isPrivate && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Private
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {group.description && (
                                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Users size={12} />
                                                                    <span>{group.memberCount || 0} members</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                {group.createdBy && (
                                                                    <div className="flex items-center gap-1">
                                                                        <User size={12} />
                                                                        <span>by {group.createdBy}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        {group.userRole === "member" || group.userRole === "owner" || group.userRole === "admin" ? (
                                                            <Badge variant="default" className="bg-green-600">
                                                                <MessageCircle size={12} className="mr-1" />
                                                                Active Chat
                                                            </Badge>
                                                        ) : group.userHasPendingRequest ? (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                                <Loader2 size={12} className="mr-1 animate-spin" />
                                                                Request Sent
                                                            </Badge>
                                                        ) : group.isPrivate ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRequestToJoin(group.id, group.name)}
                                                                disabled={isRequestingJoin}
                                                                className="whitespace-nowrap"
                                                            >
                                                                {isRequestingJoin ? (
                                                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                                                ) : (
                                                                    <Users size={14} className="mr-2" />
                                                                )}
                                                                Request to Join
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleJoinGroup(group)}
                                                                className="whitespace-nowrap"
                                                            >
                                                                <MessageCircle size={14} className="mr-2" />
                                                                Start Chat
                                                            </Button>
                                                        )}
                                                        {group.userRole === "owner" ? ( // Only show for owner
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleViewJoinRequests(group)}
                                                                className="whitespace-nowrap relative"
                                                            >
                                                                <Users size={14} className="mr-2" />
                                                                View Requests
                                                                {group.pendingRequestsCount > 0 && (
                                                                    <Badge
                                                                        variant="destructive"
                                                                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                                                    >
                                                                        {group.pendingRequestsCount > 99 ? "99+" : group.pendingRequestsCount}
                                                                    </Badge>
                                                                )}
                                                            </Button>
                                                        ) : null}

                                                        {/* Group Management Dropdown */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                    <MoreVertical size={16} />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuItem onClick={() => handleManageAction("info", group)}>
                                                                    <Info size={16} className="mr-2" />
                                                                    Group Info
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleManageAction("mute", group)}>
                                                                    <BellOff size={16} className="mr-2" />
                                                                    Mute Notifications
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleManageAction("unmute", group)}>
                                                                    <Bell size={16} className="mr-2" />
                                                                    Unmute Notifications
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {group.userRole === "owner" ? (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleManageAction("delete", group)}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <Trash2 size={16} className="mr-2" />
                                                                        Delete Group
                                                                    </DropdownMenuItem>
                                                                ) : (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleManageAction("leave", group)}
                                                                        className="text-red-600 focus:text-red-600"
                                                                    >
                                                                        <LogOut size={16} className="mr-2" />
                                                                        Leave Group
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            )
                                        })
                                        .filter(Boolean)}
                                </div>
                            ) : searchTerm ? (
                                <div className="text-center py-8">
                                    <Search size={40} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-500">No groups found matching "{searchTerm}"</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users size={40} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-500 mb-2">You haven't joined any groups yet</p>
                                    <p className="text-sm text-gray-400">Ask to be invited to existing groups or create a new one</p>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Leave Group Confirmation Dialog */}
            <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to leave this group? You won't be able to see new messages unless someone adds you
                            back.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setLeaveGroupId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (leaveGroupId) {
                                    const group = groups.find((g: any) => g.id === leaveGroupId)
                                    handleLeaveGroup(leaveGroupId, group?.name || "group")
                                }
                            }}
                            disabled={isLeaving}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isLeaving ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Leaving...
                                </>
                            ) : (
                                "Leave Group"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Group Confirmation Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Group</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this group? This action cannot be undone and all group data will be
                            permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteGroupId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteGroupId) {
                                    const group = groups.find((g: any) => g.id === deleteGroupId)
                                    handleDeleteGroup(deleteGroupId, group?.name || "group")
                                }
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Group"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Group Join Requests Modal */}
            {selectedGroupForRequests && (
                <GroupJoinRequestsModal
                    isOpen={isJoinRequestsModalOpen}
                    onClose={() => setIsJoinRequestsModalOpen(false)}
                    groupId={selectedGroupForRequests.id}
                    groupName={selectedGroupForRequests.name}
                    token={token as string}
                />
            )}
        </>
    )
}
