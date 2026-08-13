"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, UserPlus, Loader2, AlertCircle, Send } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useInviteToGroupMutation } from "@/states/groupSlice"
import { useGetAcceptedContactsQuery, Contact } from "@/states/contactSlice"
import type { Conversation } from "@/types"

interface InviteToGroupModalProps {
    isOpen: boolean
    onClose: () => void
    group: Conversation | null
    token: string | null
}

export default function InviteToGroupModal({ isOpen, onClose, group, token }: InviteToGroupModalProps) {
    const [selectedContacts, setSelectedContacts] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")

    // API hooks
    const [inviteToGroup, { isLoading: isInviting }] = useInviteToGroupMutation()
    const {
        data: contactsData,
        isLoading: isLoadingContacts,
        error,
    } = useGetAcceptedContactsQuery(token!, {
        skip: !token || !isOpen,
    })

    const contacts: Contact[] = contactsData?.contacts || []

    // Filter contacts based on search term
    const filteredContacts = contacts.filter((contact) => {
        const otherUser = contact.otherUser
        if (!otherUser) return false
        const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase()
        const email = otherUser.email.toLowerCase()
        const search = searchTerm.toLowerCase()
        return fullName.includes(search) || email.includes(search)
    })

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setSelectedContacts([])
            setSearchTerm("")
        }
    }, [isOpen])

    const toggleContact = (userId: string) => {
        setSelectedContacts((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        )
    }


    const handleSelectAll = () => {
        if (selectedContacts.length === filteredContacts.length) {
            setSelectedContacts([])
        } else {
            const allUserIds = filteredContacts
                .map((contact) => contact.otherUser?.id)
                .filter((id): id is string => Boolean(id))
            setSelectedContacts(allUserIds)
        }
    }
    const handleInvite = async () => {
        if (!group || !token) {
            toast({
                title: "Error",
                description: "Group or authentication information is missing",
                variant: "destructive",
            })
            return
        }

        if (selectedContacts.length === 0) {
            toast({
                title: "Error",
                description: "Please select at least one contact to invite",
                variant: "destructive",
            })
            return
        }

        try {
            const result = await inviteToGroup({
                inviteData: {
                    groupId: group.id.toString(),
                    memberIds: selectedContacts,
                },
                token,
            }).unwrap()

            // Handle the response with detailed feedback
            if (result.data) {
                const { successful, failed, totalInvited } = result.data

                if (failed && failed.length > 0) {
                    // Show specific failure reasons
                    const failureReasons = failed.map((f: any) => f.reason).join(', ')
                    
                    if (totalInvited === 0) {
                        // All failed
                        toast({
                            title: "Invitation Failed",
                            description: `Could not invite selected contacts. Reasons: ${failureReasons}`,
                            variant: "destructive",
                        })
                    } else {
                        // Partial success
                        toast({
                            title: "Partially Successful",
                            description: `${totalInvited} invitation${totalInvited > 1 ? "s" : ""} sent successfully. ${failed.length} failed (${failureReasons}).`,
                        })
                    }
                } else {
                    // All successful
                    toast({
                        title: "Invitations Sent",
                        description: `Successfully sent ${totalInvited} invitation${totalInvited > 1 ? "s" : ""} to ${group.name}`,
                    })
                }
            } else {
                // Fallback message
                toast({
                    title: "Invitations Sent",
                    description: `Successfully sent ${selectedContacts.length} invitation${selectedContacts.length > 1 ? "s" : ""} to ${group.name}`,
                })
            }

            onClose()
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || "Failed to send invitations"
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        setSelectedContacts([])
        setSearchTerm("")
        onClose()
    }

    if (!group) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-xl font-semibold">
                        <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full">
                            <UserPlus size={20} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <div>
                            <div>Invite to Group</div>
                            <div className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">Invite contacts to join "{group.name}"</div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col py-4">
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                        <Input
                            placeholder="Search contacts..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Selection Summary */}
                    {selectedContacts.length > 0 && (
                        <div className="mb-4 p-3 bg-brand-green/5 dark:bg-brand-gold/5 rounded-lg border border-brand-green/20 dark:border-brand-gold/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-brand-green dark:text-brand-gold" />
                                    <span className="text-sm font-medium text-brand-green dark:text-brand-gold">
                                        {selectedContacts.length} contact{selectedContacts.length > 1 ? "s" : ""} selected
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedContacts([])}
                                    className="text-brand-green dark:text-brand-gold hover:text-brand-green/80 dark:hover:text-brand-gold/80 h-auto p-1"
                                >
                                    Clear all
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Contacts List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingContacts ? (
                            <div className="text-center py-8">
                                <Loader2 size={40} className="mx-auto mb-2 animate-spin text-gray-400 dark:text-gray-500" />
                                <p className="text-gray-500 dark:text-gray-400">Loading contacts...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
                                <p className="text-red-500 mb-2">Failed to load contacts</p>
                                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                                    Retry
                                </Button>
                            </div>
                        ) : filteredContacts.length > 0 ? (
                            <div className="space-y-1">
                                {/* Select All Option */}
                                {filteredContacts.length > 1 && (
                                    <>
                                        <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-darkBg-interactive rounded-lg cursor-pointer">
                                            <Checkbox
                                                id="select-all"
                                                checked={selectedContacts.length === filteredContacts.length}
                                                onCheckedChange={handleSelectAll}
                                                className="mr-3"
                                            />
                                            <label htmlFor="select-all" className="cursor-pointer font-medium text-gray-700 dark:text-gray-200">
                                                Select All ({filteredContacts.length} contacts)
                                            </label>
                                        </div>
                                        <div className="border-t border-gray-100 dark:border-darkBorder-light my-2" />
                                    </>
                                )}

                                {/* Contact List */}
                                {filteredContacts.map((contact) => {
                                    const otherUser = contact.otherUser
                                    if (!otherUser) return null
                                    
                                    return (
                                        <div
                                            key={contact.id}
                                            className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-darkBg-interactive rounded-lg cursor-pointer transition-colors"
                                            onClick={() => toggleContact(otherUser.id)}
                                        >
                                            <Checkbox
                                                id={`contact-${otherUser.id}`}
                                                checked={selectedContacts.includes(otherUser.id)}
                                                onCheckedChange={() => toggleContact(otherUser.id)}
                                                className="mr-3"
                                            />
                                            <Avatar className="h-10 w-10 mr-3">
                                                <AvatarImage
                                                    src={(otherUser as any).avatar || "/placeholder.svg?height=40&width=40"}
                                                    alt={`${otherUser.firstName} ${otherUser.lastName}`}
                                                />
                                                <AvatarFallback className="bg-brand-green/20 dark:bg-brand-gold/20 text-brand-green dark:text-brand-gold">
                                                    {(otherUser.firstName || '').charAt(0).toUpperCase()}
                                                    {(otherUser.lastName || '').charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {otherUser.firstName} {otherUser.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{otherUser.email}</p>
                                            </div>
                                            {selectedContacts.includes(otherUser.id) && (
                                                <Badge variant="default" className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main">
                                                    Selected
                                                </Badge>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : searchTerm ? (
                            <div className="text-center py-8">
                                <Search size={40} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-gray-500 dark:text-gray-400">No contacts found matching "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users size={40} className="mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No contacts available</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Add some contacts first to invite them to groups</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={isInviting || selectedContacts.length === 0}>
                        {isInviting ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={16} className="mr-2" />
                                Send {selectedContacts.length > 0 ? `${selectedContacts.length} ` : ""}Invitation
                                {selectedContacts.length > 1 ? "s" : ""}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}