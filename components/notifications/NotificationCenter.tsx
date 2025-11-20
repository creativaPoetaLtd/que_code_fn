"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Users, UserPlus, Check, X, Clock, AlertCircle, Info, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useNotifications } from "@/context/NotificationContext"
import { useAuthToken } from "@/hooks/use-auth-token"
import { 
    useRespondToJoinRequestEnhancedMutation, 
    useGetPendingJoinRequestsQuery,
    useGetPendingInvitationsQuery 
} from "@/states/groupSlice"
import { 
    useGetPendingInvitationsUnifiedQuery,
    useRespondToInvitationEnhancedMutation,
    useRespondToInvitationByTokenMutation 
} from "@/states/contactSlice"
import type { Notification } from "@/types/notification.types"
import { formatDistanceToNow } from "date-fns"

interface NotificationCenterProps {
    isOpen: boolean
    onClose: () => void
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, markAsRead, removeContactRequestNotification } = useNotifications()
    const { getToken } = useAuthToken()
    const token = getToken()

    const [respondToJoinRequest, { isLoading: isResponding }] = useRespondToJoinRequestEnhancedMutation()
    const [respondToContactRequest, { isLoading: isRespondingToContact }] = useRespondToInvitationEnhancedMutation()
    const [respondToContactByToken, { isLoading: isRespondingByToken }] = useRespondToInvitationByTokenMutation()
    const [selectedTab, setSelectedTab] = useState<'all' | 'invitations' | 'requests' | 'contacts'>('all')
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState<string>("")
    const [showRejectionInput, setShowRejectionInput] = useState<string | null>(null)

    // Fetch pending requests and invitations
    const { data: pendingRequests, refetch: refetchRequests } = useGetPendingJoinRequestsQuery(
        token!, 
        { skip: !token }
    )
    const { data: pendingInvitations } = useGetPendingInvitationsQuery(
        token!,
        { skip: !token }
    )
    const { data: pendingContactRequests, refetch: refetchContactRequests } = useGetPendingInvitationsUnifiedQuery({
        token: token!,
        page: 1,
        limit: 20
    }, { skip: !token })

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'group_invitation':
                return <Users className="h-4 w-4 text-blue-500" />
            case 'group_join_request':
                return <UserPlus className="h-4 w-4 text-green-500" />
            case 'group_join_approved':
                return <Check className="h-4 w-4 text-green-500" />
            case 'group_join_rejected':
                return <X className="h-4 w-4 text-red-500" />
            case 'group_created':
                return <Users className="h-4 w-4 text-purple-500" />
            case 'CONTACT_REQUEST_RECEIVED':
            case 'contact_request':
                return <UserPlus className="h-4 w-4 text-blue-500" />
            default:
                return <Bell className="h-4 w-4 text-gray-500" />
        }
    }

    const getNotificationVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
        switch (type) {
            case 'group_join_approved':
            case 'group_created':
                return 'default' // Using default instead of success
            case 'group_join_rejected':
                return 'destructive'
            case 'group_invitation':
            case 'group_join_request':
                return 'outline'
            default:
                return 'secondary'
        }
    }

    const handleRespondToRequest = async (requestId: string, action: 'approve' | 'deny') => {
        if (action === 'deny' && !rejectionReason.trim()) {
            setShowRejectionInput(requestId)
            return
        }

        setProcessingRequestId(requestId)
        try {
            await respondToJoinRequest({
                requestId,
                action,
                rejectionReason: action === 'deny' ? rejectionReason : undefined,
                token: token!
            }).unwrap()

            toast({
                title: "Success",
                description: `Join request ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            })

            setRejectionReason("")
            setShowRejectionInput(null)
            refetchRequests()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || `Failed to ${action} request`,
                variant: "destructive",
            })
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleContactRequestResponse = async (invitationId: string, action: 'accept' | 'decline') => {
        setProcessingRequestId(invitationId)
        try {
            await respondToContactRequest({
                invitationId,
                action,
                token: token!
            }).unwrap()

            toast({
                title: "Success",
                description: `Contact request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
            })

            refetchContactRequests()
            
            // Remove the contact request notification after successful response
            // Find the invitation to get the inviter's userId
            const invitation = pendingContactRequestsList.find(inv => inv.id === invitationId)
            if (invitation?.inviter?.id) {
                removeContactRequestNotification(invitation.inviter.id)
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || `Failed to ${action} contact request`,
                variant: "destructive",
            })
        } finally {
            setProcessingRequestId(null)
        }
    }

    const handleContactRequestResponseByToken = async (invitationToken: string, action: 'accept' | 'decline') => {
        try {
            await respondToContactByToken({
                token: invitationToken,
                action
            }).unwrap()

            toast({
                title: "Success",
                description: `Contact request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
            })

            refetchContactRequests()
            
            // Note: For token-based responses, we don't have direct access to userId here
            // The notification will be removed when the pending requests are refetched
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || `Failed to ${action} contact request`,
                variant: "destructive",
            })
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id)
        }
    }

    const filterNotifications = (notifications: Notification[]) => {
        switch (selectedTab) {
            case 'invitations':
                return notifications.filter(n => n.type === 'group_invitation')
            case 'requests':
                return notifications.filter(n => n.type === 'group_join_request')
            case 'contacts':
                return notifications.filter(n => n.type === 'CONTACT_REQUEST_RECEIVED' || n.type === 'contact_request')
            default:
                return notifications
        }
    }

    const filteredNotifications = filterNotifications(notifications)
    const pendingRequestsList = pendingRequests?.data?.requests || []
    const pendingContactRequestsList = pendingContactRequests?.invitations || []

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex space-x-1 border-b">
                    <Button
                        variant={selectedTab === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('all')}
                        className="flex-1"
                    >
                        All
                    </Button>
                    <Button
                        variant={selectedTab === 'invitations' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('invitations')}
                        className="flex-1"
                    >
                        Invitations
                    </Button>
                    <Button
                        variant={selectedTab === 'requests' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('requests')}
                        className="flex-1"
                    >
                        Join Requests
                        {pendingRequestsList.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {pendingRequestsList.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={selectedTab === 'contacts' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('contacts')}
                        className="flex-1"
                    >
                        Contacts
                        {pendingContactRequestsList.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {pendingContactRequestsList.length}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 max-h-96">
                    <div className="space-y-4 p-4">
                        {/* Show pending contact requests in contacts tab */}
                        {selectedTab === 'contacts' && pendingContactRequestsList.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <AlertCircle className="h-4 w-4" />
                                    Pending Contact Requests
                                </div>
                                {pendingContactRequestsList.map((request: any) => (
                                    <div
                                        key={request.id}
                                        className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={request.inviter?.avatar || "/placeholder.svg"}
                                                alt={request.inviter?.firstName}
                                            />
                                            <AvatarFallback>
                                                {request.inviter?.firstName?.charAt(0)}
                                                {request.inviter?.lastName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.inviter?.firstName} {request.inviter?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(request.invitedAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                wants to add you as a contact
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {request.inviter?.email}
                                            </p>
                                            
                                            <div className="flex gap-2 mt-3">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleContactRequestResponse(request.id, 'accept')}
                                                    disabled={isRespondingToContact || processingRequestId === request.id}
                                                    className="h-8"
                                                >
                                                    {processingRequestId === request.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3 w-3" />
                                                    )}
                                                    <span className="ml-1">Accept</span>
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleContactRequestResponse(request.id, 'decline')}
                                                    disabled={isRespondingToContact || processingRequestId === request.id}
                                                    className="h-8"
                                                >
                                                    {processingRequestId === request.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                    <span className="ml-1">Decline</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show pending join requests in requests tab */}
                        {selectedTab === 'requests' && pendingRequestsList.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <AlertCircle className="h-4 w-4" />
                                    Pending Join Requests
                                </div>
                                {pendingRequestsList.map((request: any) => (
                                    <div
                                        key={request.id}
                                        className="flex items-start space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage
                                                src={request.user?.avatar || "/placeholder.svg"}
                                                alt={request.user?.firstName}
                                            />
                                            <AvatarFallback>
                                                {request.user?.firstName?.charAt(0)}
                                                {request.user?.lastName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {request.user?.firstName} {request.user?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                wants to join "{request.group?.name}"
                                            </p>
                                            {request.additionalInfo && (
                                                <p className="text-xs text-gray-500 mt-1 italic">
                                                    "{request.additionalInfo}"
                                                </p>
                                            )}
                                            
                                            {showRejectionInput === request.id ? (
                                                <div className="mt-3 space-y-2">
                                                    <Textarea
                                                        placeholder="Reason for rejection (optional)"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        rows={2}
                                                        className="text-xs"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleRespondToRequest(request.id, 'deny')}
                                                            disabled={isResponding || processingRequestId === request.id}
                                                        >
                                                            {processingRequestId === request.id ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <X className="h-3 w-3" />
                                                            )}
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setShowRejectionInput(null)
                                                                setRejectionReason("")
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2 mt-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRespondToRequest(request.id, 'approve')}
                                                        disabled={isResponding || processingRequestId === request.id}
                                                    >
                                                        {processingRequestId === request.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setShowRejectionInput(request.id)}
                                                        disabled={isResponding}
                                                    >
                                                        <X className="h-3 w-3" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {pendingRequestsList.length > 0 && filteredNotifications.length > 0 && (
                                    <Separator />
                                )}
                            </div>
                        )}

                        {/* Regular notifications */}
                        {filteredNotifications.length === 0 && pendingRequestsList.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                        notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'
                                    }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getNotificationVariant(notification.type)} className="text-xs">
                                                    {notification.type.replace('_', ' ')}
                                                </Badge>
                                                {!notification.isRead && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.message || notification.data?.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                        
                                        {/* Action buttons for actionable notifications */}
                                        {notification.data?.actions && notification.data.actions.length > 0 && 
                                         (notification.type === 'CONTACT_REQUEST_RECEIVED' || notification.type === 'contact_request') && (
                                            <div className="flex gap-2 mt-2">
                                                {notification.data.actions.map((action: any, index: number) => (
                                                    <Button
                                                        key={index}
                                                        size="sm"
                                                        variant={action.type === 'accept' ? 'default' : 'outline'}
                                                        className="text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (notification.data?.userId) {
                                                                // Extract token from URL if available
                                                                const urlMatch = action.url.match(/invitation\/([^?]+)/)
                                                                if (urlMatch) {
                                                                    const token = urlMatch[1]
                                                                    handleContactRequestResponseByToken(token, action.type as 'accept' | 'decline')
                                                                }
                                                            }
                                                        }}
                                                        disabled={isRespondingToContact}
                                                    >
                                                        {isRespondingToContact ? (
                                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                        ) : null}
                                                        {action.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

export default NotificationCenter