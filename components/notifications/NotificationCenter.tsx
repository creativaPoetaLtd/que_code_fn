"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Users, UserPlus, Check, X, Clock, AlertCircle, Info, Loader2, MessageCircle, Image, Video, Music, File, DollarSign, UserMinus, UserCheck, UserX, ShieldCheck, ShieldAlert, Settings, Trash2, HandCoins } from "lucide-react"
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
    const router = useRouter()

    const [respondToJoinRequest, { isLoading: isResponding }] = useRespondToJoinRequestEnhancedMutation()
    const [respondToContactRequest, { isLoading: isRespondingToContact }] = useRespondToInvitationEnhancedMutation()
    const [respondToContactByToken, { isLoading: isRespondingByToken }] = useRespondToInvitationByTokenMutation()
    const [selectedTab, setSelectedTab] = useState<'all' | 'invitations' | 'requests' | 'contacts' | 'groups' | 'messages'>('all')
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
            // Group notifications
            case 'GROUP_INVITATION':
            case 'group_invitation':
                return <Users className="h-4 w-4 text-blue-500" />
            case 'GROUP_JOIN_REQUEST':
            case 'group_join_request':
                return <UserPlus className="h-4 w-4 text-green-500" />
            case 'GROUP_JOIN_APPROVED':
            case 'group_join_approved':
                return <Check className="h-4 w-4 text-green-500" />
            case 'GROUP_JOIN_REJECTED':
            case 'group_join_rejected':
                return <X className="h-4 w-4 text-red-500" />
            case 'GROUP_CREATED':
            case 'group_created':
                return <Users className="h-4 w-4 text-purple-500" />
            case 'GROUP_JOINED':
            case 'group_joined':
                return <UserCheck className="h-4 w-4 text-green-500" />
            case 'GROUP_MEMBER_LEFT':
            case 'group_member_left':
                return <UserMinus className="h-4 w-4 text-orange-500" />
            case 'MEMBER_REMOVED_FROM_GROUP':
            case 'member_removed_from_group':
                return <UserX className="h-4 w-4 text-red-500" />
            case 'GROUP_DELETED':
            case 'group_deleted':
                return <Trash2 className="h-4 w-4 text-red-500" />
            case 'GROUP_INVITATION_SENT':
            case 'group_invitation_sent':
                return <Users className="h-4 w-4 text-gray-500" />
            case 'GROUP_INVITATION_ACCEPTED':
            case 'group_invitation_accepted':
                return <Check className="h-4 w-4 text-green-500" />
            case 'GROUP_INVITATION_REJECTED':
            case 'group_invitation_rejected':
                return <X className="h-4 w-4 text-gray-500" />
            case 'GROUP_MEMBER_ADDED':
            case 'group_member_added':
                return <UserPlus className="h-4 w-4 text-green-500" />
            case 'GROUP_MEMBER_REMOVED':
            case 'group_member_removed':
                return <UserX className="h-4 w-4 text-red-500" />
            case 'GROUP_MEMBER_ROLE_CHANGED':
            case 'group_member_role_changed':
                return <ShieldCheck className="h-4 w-4 text-blue-500" />
            case 'GROUP_UPDATED':
            case 'group_updated':
                return <Settings className="h-4 w-4 text-blue-500" />
            case 'PAYMENT_REQUEST_RECEIVED':
            case 'payment_request_received':
                return <HandCoins className="h-4 w-4 text-green-500" />
                
            // Contact notifications
            case 'CONTACT_REQUEST_RECEIVED':
            case 'contact_request':
                return <UserPlus className="h-4 w-4 text-blue-500" />
            case 'CONTACT_INVITATION_SENT':
            case 'contact_invitation_sent':
                return <UserPlus className="h-4 w-4 text-gray-500" />
            case 'CONTACT_REQUEST_ACCEPTED':
            case 'contact_request_accepted':
                return <UserCheck className="h-4 w-4 text-green-500" />
            case 'CONTACT_REQUEST_REJECTED':
            case 'contact_request_rejected':
                return <UserX className="h-4 w-4 text-gray-500" />
            case 'CONTACT_ADDED':
            case 'contact_added':
                return <UserPlus className="h-4 w-4 text-green-500" />
            case 'CONTACT_BLOCKED':
            case 'contact_blocked':
                return <ShieldAlert className="h-4 w-4 text-red-500" />
            case 'CONTACT_UNBLOCKED':
            case 'contact_unblocked':
                return <ShieldCheck className="h-4 w-4 text-green-500" />
            case 'CONTACT_REMOVED':
            case 'contact_removed':
                return <UserMinus className="h-4 w-4 text-orange-500" />
                
            // Chat notification icons
            case 'CHAT_MESSAGE_TEXT':
            case 'CHAT_MESSAGE_RECEIVED':
            case 'chat_message_text':
                return <MessageCircle className="h-4 w-4 text-blue-500" />
            case 'CHAT_MESSAGE_IMAGE':
            case 'chat_message_image':
                return <Image className="h-4 w-4 text-green-500" />
            case 'CHAT_MESSAGE_VIDEO':
            case 'chat_message_video':
                return <Video className="h-4 w-4 text-purple-500" />
            case 'CHAT_MESSAGE_AUDIO':
            case 'chat_message_audio':
                return <Music className="h-4 w-4 text-orange-500" />
            case 'CHAT_MESSAGE_FILE':
            case 'chat_message_file':
                return <File className="h-4 w-4 text-gray-500" />
            case 'CHAT_MESSAGE_MONEY':
            case 'chat_message_money':
                return <DollarSign className="h-4 w-4 text-green-600" />
            case 'CHAT_DM_CREATED':
            case 'chat_dm_created':
                return <MessageCircle className="h-4 w-4 text-blue-500" />
            case 'CHAT_GROUP_CHAT_CREATED':
            case 'chat_group_chat_created':
                return <Users className="h-4 w-4 text-purple-500" />
            case 'CHAT_USER_ADDED':
            case 'chat_user_added':
                return <UserPlus className="h-4 w-4 text-green-500" />

            // Public contribution notifications
            case 'PUBLIC_CONTRIBUTION_RECEIVED':
            case 'public_contribution_received':
                return <HandCoins className="h-4 w-4 text-[#00B512]" />
            case 'PUBLIC_CONTRIBUTION_COMPLETED':
            case 'public_contribution_completed':
                return <Check className="h-4 w-4 text-green-500" />
            case 'PUBLIC_CONTRIBUTION_CLOSED':
            case 'public_contribution_closed':
                return <ShieldAlert className="h-4 w-4 text-orange-500" />

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
            case 'payment_request_received':
            case 'PAYMENT_REQUEST_RECEIVED':
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
            if (removeContactRequestNotification) {
                const invitation = pendingContactRequestsList.find(inv => inv.id === invitationId)
                if (invitation?.inviter?.id) {
                    removeContactRequestNotification(invitation.inviter.id)
                }
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

        // Handle navigation for chat notifications
        if (notification.data?.chatId && (
            notification.type.startsWith('CHAT_MESSAGE_') || 
            notification.type.startsWith('chat_message_') ||
            notification.type === 'CHAT_DM_CREATED' ||
            notification.type === 'CHAT_GROUP_CHAT_CREATED' ||
            notification.type === 'CHAT_USER_ADDED'
        )) {
            router.push(`/chat?chatId=${notification.data.chatId}`)
            onClose()
        } 
        // Handle navigation for group notifications
        else if (notification.data?.groupId && (
            notification.type.startsWith('GROUP_') ||
            notification.type.startsWith('group_')
        )) {
            router.push(`/groups/${notification.data.groupId}`)
            onClose()
        }
        // Handle navigation for contact notifications
        else if (notification.data?.contactId && (
            notification.type.startsWith('CONTACT_') ||
            notification.type.startsWith('contact_')
        )) {
            router.push(`/contacts`)
            onClose()
        }
        else if (notification.data?.url) {
            router.push(notification.data.url)
            onClose()
        }
    }

    const filterNotifications = (notifications: Notification[]) => {
        switch (selectedTab) {
            case 'invitations':
                return notifications.filter(n => n.type === 'group_invitation' || n.type === 'GROUP_INVITATION')
            case 'requests':
                return notifications.filter(n =>
                    n.type === 'group_join_request' ||
                    n.type === 'GROUP_JOIN_REQUEST' ||
                    n.type === 'payment_request_received' ||
                    n.type === 'PAYMENT_REQUEST_RECEIVED'
                )
            case 'contacts':
                return notifications.filter(n => 
                    n.type.toUpperCase().startsWith('CONTACT_') ||
                    n.type.startsWith('contact_')
                )
            case 'groups':
                return notifications.filter(n => 
                    n.type.toUpperCase().startsWith('GROUP_') ||
                    n.type.startsWith('group_')
                )
            case 'messages':
                return notifications.filter(n => 
                    n.type.startsWith('CHAT_MESSAGE_') || 
                    n.type.startsWith('chat_message_') ||
                    n.type === 'CHAT_DM_CREATED' ||
                    n.type === 'CHAT_GROUP_CHAT_CREATED' ||
                    n.type === 'CHAT_USER_ADDED'
                )
            default:
                return notifications
        }
    }

    const filteredNotifications = filterNotifications(notifications)
    const pendingRequestsList = pendingRequests?.data?.requests || []
    const pendingContactRequestsList = pendingContactRequests?.invitations || []

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col bg-white dark:bg-darkBg-card border-gray-200 dark:border-darkBorder-light p-0 gap-0">
                <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-200 dark:border-darkBorder-light">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-white">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">
                                {unreadCount}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 dark:border-darkBorder-light px-2 sm:px-4">
                    <Button
                        variant={selectedTab === 'all' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('all')}
                        className={`flex-shrink-0 min-w-[60px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'all' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        All
                    </Button>
                    <Button
                        variant={selectedTab === 'invitations' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('invitations')}
                        className={`flex-shrink-0 min-w-[80px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'invitations' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        <span className="hidden sm:inline">Invitations</span>
                        <span className="sm:hidden">Invites</span>
                    </Button>
                    <Button
                        variant={selectedTab === 'requests' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('requests')}
                        className={`flex-shrink-0 min-w-[70px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'requests' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        <span className="hidden sm:inline">Requests</span>
                        <span className="sm:hidden">Requests</span>
                        {pendingRequestsList.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                                {pendingRequestsList.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={selectedTab === 'groups' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('groups')}
                        className={`flex-shrink-0 min-w-[60px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'groups' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        Groups
                    </Button>
                    <Button
                        variant={selectedTab === 'contacts' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('contacts')}
                        className={`flex-shrink-0 min-w-[70px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'contacts' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        Contacts
                        {pendingContactRequestsList.length > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                                {pendingContactRequestsList.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={selectedTab === 'messages' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTab('messages')}
                        className={`flex-shrink-0 min-w-[70px] sm:flex-1 text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 ${selectedTab !== 'messages' ? 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive' : ''}`}
                    >
                        Messages
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto max-h-[calc(85vh-180px)] sm:max-h-[400px] overscroll-contain">
                    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                        {/* Show pending contact requests in contacts tab */}
                        {selectedTab === 'contacts' && pendingContactRequestsList.length > 0 && (
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Pending Contact Requests</span>
                                    <span className="sm:hidden">Contact Requests</span>
                                </div>
                                {pendingContactRequestsList.map((request: any) => (
                                    <div
                                        key={request.id}
                                        className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-blue-50 dark:bg-darkBg-interactive border border-blue-200 dark:border-darkBorder-light rounded-lg"
                                    >
                                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
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
                                            <div className="flex items-start sm:items-center justify-between gap-1 sm:gap-2">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {request.inviter?.firstName} {request.inviter?.lastName}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {formatDistanceToNow(new Date(request.invitedAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                                                wants to add you as a contact
                                            </p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {request.inviter?.email}
                                            </p>

                                            <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleContactRequestResponse(request.id, 'accept')}
                                                    disabled={isRespondingToContact || processingRequestId === request.id}
                                                    className="h-7 sm:h-8 text-xs px-2 sm:px-3"
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
                                                    className="h-7 sm:h-8 text-xs px-2 sm:px-3 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-darkBg-card"
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
                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="hidden sm:inline">Pending Join Requests</span>
                                    <span className="sm:hidden">Join Requests</span>
                                </div>
                                {pendingRequestsList.map((request: any) => (
                                    <div
                                        key={request.id}
                                        className="flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 bg-yellow-50 dark:bg-darkBg-interactive border border-yellow-200 dark:border-darkBorder-light rounded-lg"
                                    >
                                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
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
                                            <div className="flex items-start sm:items-center justify-between gap-1 sm:gap-2">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {request.user?.firstName} {request.user?.lastName}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                                                    {request.createdAt && !isNaN(new Date(request.createdAt).getTime())
                                                        ? formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })
                                                        : 'Recently'}
                                                </p>
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                                                wants to join "{request.group?.name}"
                                            </p>
                                            {request.additionalInfo && (
                                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 italic line-clamp-2">
                                                    "{request.additionalInfo}"
                                                </p>
                                            )}

                                            {showRejectionInput === request.id ? (
                                                <div className="mt-2 sm:mt-3 space-y-2">
                                                    <Textarea
                                                        placeholder="Reason for rejection (optional)"
                                                        value={rejectionReason}
                                                        onChange={(e) => setRejectionReason(e.target.value)}
                                                        rows={2}
                                                        className="text-xs dark:bg-darkBg-card dark:border-darkBorder-light dark:text-white"
                                                    />
                                                    <div className="flex gap-1.5 sm:gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => handleRespondToRequest(request.id, 'deny')}
                                                            disabled={isResponding || processingRequestId === request.id}
                                                            className="h-7 sm:h-8 text-xs px-2 sm:px-3"
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
                                                            className="h-7 sm:h-8 text-xs px-2 sm:px-3 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-darkBg-card"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRespondToRequest(request.id, 'approve')}
                                                        disabled={isResponding || processingRequestId === request.id}
                                                        className="h-7 sm:h-8 text-xs px-2 sm:px-3"
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
                                                        className="h-7 sm:h-8 text-xs px-2 sm:px-3"
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
                                    <Separator className="dark:bg-darkBorder-light" />
                                )}
                            </div>
                        )}

                        {/* Regular notifications */}
                        {filteredNotifications.length === 0 && pendingRequestsList.length === 0 ? (
                            <div className="text-center py-8 sm:py-12">
                                <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex items-start space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${notification.isRead
                                            ? 'bg-gray-50 dark:bg-darkBg-card'
                                            : 'bg-blue-50 dark:bg-darkBg-interactive border border-blue-200 dark:border-darkBorder-light'
                                        }`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start sm:items-center justify-between gap-1 sm:gap-2">
                                            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                                {notification.title}
                                            </p>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                <Badge variant={getNotificationVariant(notification.type)} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 whitespace-nowrap hidden sm:inline-flex">
                                                    {notification.type.replace('_', ' ')}
                                                </Badge>
                                                {!notification.isRead && (
                                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1 line-clamp-2">
                                            {notification.message || notification.data?.message}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>

                                        {/* Action buttons for actionable notifications */}
                                        {notification.data?.actions && notification.data.actions.length > 0 && (
                                            (notification.type === 'CONTACT_REQUEST_RECEIVED' || notification.type === 'contact_request' || 
                                             notification.type === 'PAYMENT_REQUEST_RECEIVED' || notification.type === 'payment_request_received') ? (
                                                <div className="flex gap-1.5 sm:gap-2 mt-2">
                                                    {notification.data.actions.map((action: any, index: number) => (
                                                        <Button
                                                            key={index}
                                                            size="sm"
                                                            variant={action.type === 'accept' || action.type === 'pay' ? 'default' : 'outline'}
                                                            className={`h-7 sm:h-8 text-xs px-2 sm:px-3 ${
                                                                (action.type !== 'accept' && action.type !== 'pay') 
                                                                    ? 'dark:text-gray-300 dark:border-gray-600 dark:hover:bg-darkBg-card' 
                                                                    : ''
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                if (notification.type === 'PAYMENT_REQUEST_RECEIVED' || notification.type === 'payment_request_received') {
                                                                    markAsRead(notification.id)
                                                                    router.push(action.url)
                                                                    onClose()
                                                                } else if (notification.data?.userId) {
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
                                                            {isRespondingToContact && (action.type === 'accept' || action.type === 'decline') ? (
                                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                            ) : null}
                                                            {action.label}
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : null
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default NotificationCenter