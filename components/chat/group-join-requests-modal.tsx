"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, AlertCircle, Check, X, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useGetGroupJoinRequestsQuery, useRespondToJoinRequestEnhancedMutation } from "@/states/groupSlice"
import type { GroupJoinRequest } from "@/types/group.types"

interface GroupJoinRequestsModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string
    groupName: string
    token: string
}

const GroupJoinRequestsModal: React.FC<GroupJoinRequestsModalProps> = ({
    isOpen,
    onClose,
    groupId,
    groupName,
    token,
}) => {
    const {
        data: requestsData,
        isLoading,
        error,
        refetch,
    } = useGetGroupJoinRequestsQuery(
        { groupId, token },
        {
            skip: !token || !groupId || !isOpen,
        },
    )

    const [respondToJoinRequest, { isLoading: isResponding }] = useRespondToJoinRequestEnhancedMutation()
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

    const requests: GroupJoinRequest[] = requestsData?.data?.requests || []

    const handleRespond = async (requestId: string, action: "approve" | "reject") => {
        setProcessingRequestId(requestId)
        try {
            await respondToJoinRequest({ 
                requestId, 
                action: action === "reject" ? "deny" : "approve", 
                token 
            }).unwrap()
            toast({
                title: "Success",
                description: `Request ${action === "approve" ? "approved" : "rejected"} successfully.`,
            })
            refetch() // Refetch requests to update the list
        } catch (err: any) {
            toast({
                title: "Error",
                description: err?.message || "Failed to respond to join request",
                variant: "destructive"
            })
        } finally {
            setProcessingRequestId(null)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Join Requests for "{groupName}"
                    </DialogTitle>
                    <DialogDescription>Review and manage pending requests to join this group.</DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 size={40} className="mx-auto mb-2 animate-spin text-gray-400" />
                            <p className="text-gray-500">Loading join requests...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
                            <p className="text-red-500 mb-2">Failed to load join requests</p>
                            <Button onClick={() => refetch()} variant="outline" size="sm">
                                Retry
                            </Button>
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-8">
                            <Users size={40} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500 mb-2">No pending join requests</p>
                            <p className="text-sm text-gray-400">All clear for now!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                                >
                                    <div className="flex items-center flex-1">
                                        <Avatar className="h-10 w-10 mr-3">
                                            <AvatarImage
                                                src={request.userPicture || `/placeholder.svg?height=40&width=40`}
                                                alt={request.userName}
                                            />
                                            <AvatarFallback className="bg-gray-100 text-gray-600">
                                                {request.userName?.charAt(0)?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{request.userName}</p>
                                            <p className="text-sm text-gray-500">{request.userEmail}</p>
                                            <p className="text-xs text-gray-400">
                                                Requested {new Date(request.requestedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRespond(request.id, "approve")}
                                            disabled={isResponding && processingRequestId === request.id}
                                            className="bg-green-50 text-green-700 hover:bg-green-100"
                                        >
                                            {isResponding && processingRequestId === request.id ? (
                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                            ) : (
                                                <Check size={16} className="mr-2" />
                                            )}
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRespond(request.id, "reject")}
                                            disabled={isResponding && processingRequestId === request.id}
                                            className="bg-red-50 text-red-700 hover:bg-red-100"
                                        >
                                            {isResponding && processingRequestId === request.id ? (
                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                            ) : (
                                                <X size={16} className="mr-2" />
                                            )}
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default GroupJoinRequestsModal
