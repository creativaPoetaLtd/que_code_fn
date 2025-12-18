"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, UserPlus, AlertCircle, Clock, Users, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
    useGetPendingInvitationsUnifiedQuery,
    useGetAcceptedContactsQuery,
    useRespondToInvitationEnhancedMutation,
} from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"

interface ContactRequestModalProps {
    isOpen: boolean
    onClose: () => void
}

type FilterType = "pending" | "completed"

export default function ContactRequestModal({ isOpen, onClose }: ContactRequestModalProps) {
    const [activeFilter, setActiveFilter] = useState<FilterType>("pending")
    const { getToken } = useAuthToken()
    const token: string | null = getToken();

    // API hooks
    const {
        data: pendingInvitations,
        isLoading: isPendingLoading,
        error: pendingError,
        refetch: refetchPending,
    } = useGetPendingInvitationsUnifiedQuery({
        token: token as string,
        page: 1,
        limit: 20
    }, {
        skip: !token,
    })
    const {
        data: acceptedContacts,
        isLoading: isAcceptedLoading,
        error: acceptedError,
        refetch: refetchAccepted,
    } = useGetAcceptedContactsQuery(token as string, {
        skip: !token || activeFilter !== "completed",
    })


    const [respondToInvitation, { isLoading: isResponding }] = useRespondToInvitationEnhancedMutation()

    const handleResponse = async (invitationId: string, action: "accept" | "decline", inviterName: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to respond to invitations",
                variant: "destructive",
            })
            return
        }

        try {
            const result = await respondToInvitation({
                invitationId,
                action,
                token,
            }).unwrap()

            toast({
                title: action === "accept" ? "Contact Request Accepted" : "Contact Request Declined",
                description:
                    action === "accept"
                        ? `${inviterName} has been added to your contacts`
                        : `Contact request from ${inviterName} has been declined`,
            })

            // Refetch pending invitations to update the list
            refetchPending()

            // If we accepted, also refetch accepted contacts
            if (action === "accept") {
                refetchAccepted()
            }
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || `Failed to ${action} invitation`

            toast({
                title: "Response Failed",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        onClose()
    }

    // Extract data - Updated to match the new API response format
    const receivedInvitations = pendingInvitations?.invitations || []
    const sentInvitations: any[] = [] // We don't need sent invitations for this component
    const completedContacts = acceptedContacts?.contacts || []

    // Loading states
    const isLoading = isPendingLoading || (activeFilter === "completed" && isAcceptedLoading)

    // Error states
    const hasError = pendingError || (activeFilter === "completed" && acceptedError)

    if (!token) {
        return (
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Contact Requests</DialogTitle>
                    </DialogHeader>
                    <div className="py-8 text-center">
                        <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-gray-500">Please log in to view contact requests</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <UserPlus size={20} className="text-brand-green dark:text-brand-gold mr-2" />
                            <DialogTitle>Contact Requests</DialogTitle>
                        </div>
                        {receivedInvitations.length > 0 && <Badge variant="secondary">{receivedInvitations.length} pending</Badge>}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs
                        value={activeFilter}
                        onValueChange={(value) => setActiveFilter(value as FilterType)}
                        className="h-full flex flex-col"
                    >
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock size={16} />
                                Pending ({receivedInvitations.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <Users size={16} />
                                Completed ({completedContacts.length})
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-y-auto">
                            <TabsContent value="pending" className="mt-0 space-y-4">
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 size={40} className="mx-auto mb-2 animate-spin text-gray-400" />
                                        <p className="text-gray-500">Loading contact requests...</p>
                                    </div>
                                ) : hasError ? (
                                    <div className="text-center py-8">
                                        <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
                                        <p className="text-red-500 mb-2">Failed to load contact requests</p>
                                        <Button onClick={() => refetchPending()} variant="outline" size="sm">
                                            Retry
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Received Invitations (ones you need to respond to) */}
                                        {receivedInvitations.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                                                    <AlertCircle size={16} className="mr-2 text-yellow-600 dark:text-yellow-500" />
                                                    Requests to Respond ({receivedInvitations.length})
                                                </h3>
                                                <div className="space-y-3">
                                                    {receivedInvitations.map((invitation: any) => (
                                                        <div
                                                            key={invitation.id}
                                                            className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                                                        >
                                                            <div className="flex items-center">
                                                                <Avatar className="h-10 w-10 mr-3">
                                                                    <AvatarImage
                                                                        src={`/placeholder.svg?height=40&width=40`}
                                                                        alt={`${invitation.inviter.firstName} ${invitation.inviter.lastName}`}
                                                                    />
                                                                    <AvatarFallback>
                                                                        {invitation.inviter.firstName?.charAt(0)}
                                                                        {invitation.inviter.lastName?.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">
                                                                        {invitation.inviter.firstName} {invitation.inviter.lastName}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{invitation.inviter.email}</p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {new Date(invitation.invitedAt).toLocaleDateString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleResponse(
                                                                            invitation.id,
                                                                            "accept",
                                                                            `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
                                                                        )
                                                                    }
                                                                    disabled={isResponding}
                                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                >
                                                                    {isResponding ? (
                                                                        <Loader2 size={16} className="animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle size={20} />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleResponse(
                                                                            invitation.id,
                                                                            "decline",
                                                                            `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
                                                                        )
                                                                    }
                                                                    disabled={isResponding}
                                                                    className="text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                                                                >
                                                                    {isResponding ? (
                                                                        <Loader2 size={16} className="animate-spin" />
                                                                    ) : (
                                                                        <XCircle size={20} />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {receivedInvitations.length === 0 && (
                                            <div className="text-center py-8">
                                                <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
                                                <p className="text-gray-500">No pending contact requests</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="completed" className="mt-0">
                                {isLoading ? (
                                    <div className="text-center py-8">
                                        <Loader2 size={40} className="mx-auto mb-2 animate-spin text-gray-400" />
                                        <p className="text-gray-500">Loading contacts...</p>
                                    </div>
                                ) : hasError ? (
                                    <div className="text-center py-8">
                                        <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
                                        <p className="text-red-500 mb-2">Failed to load contacts</p>
                                        <Button onClick={() => refetchAccepted()} variant="outline" size="sm">
                                            Retry
                                        </Button>
                                    </div>
                                ) : completedContacts.length > 0 ? (
                                    <div className="space-y-3">
                                        {completedContacts.map((contact: any) => (
                                            <div
                                                key={contact.id}
                                                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <Avatar className="h-10 w-10 mr-3">
                                                        <AvatarImage
                                                            src={`/placeholder.svg?height=40&width=40`}
                                                            alt={`${contact.otherUser?.firstName} ${contact.otherUser?.lastName}`}
                                                        />
                                                        <AvatarFallback>
                                                            {contact.otherUser?.firstName?.charAt(0)}
                                                            {contact.otherUser?.lastName?.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">
                                                            {contact.otherUser?.firstName} {contact.otherUser?.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{contact.otherUser?.email}</p>
                                                        <p className="text-xs text-gray-400">
                                                            Connected: {new Date(contact.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="default" className="bg-green-600">
                                                    <CheckCircle size={12} className="mr-1" />
                                                    Connected
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Users size={40} className="mx-auto mb-2 text-gray-400" />
                                        <p className="text-gray-500">No completed contacts yet</p>
                                    </div>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
