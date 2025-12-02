"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
    Search,
    Users,
    UserPlus,
    Loader2,
    QrCode,
    Link2,
    Download,
    Copy,
    Check,
    Share2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useInviteToGroupMutation, useGetGroupByIdQuery } from "@/states/groupSlice"
import { useGetAcceptedContactsQuery, Contact } from "@/states/contactSlice"

interface AddMemberModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string | null
    groupName: string
    token: string | null
}


export default function AddMemberModal({
    isOpen,
    onClose,
    groupId,
    groupName,
    token
}: AddMemberModalProps) {

    const [selectedContacts, setSelectedContacts] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [copiedLink, setCopiedLink] = useState(false)
    const [activeTab, setActiveTab] = useState("invite")

    // Fetch group data to get accessLink and qrCode
    const { data: groupData, isLoading: isLoadingGroup } = useGetGroupByIdQuery(
        { groupId: groupId!, token: token! },
        { skip: !groupId || !token }
    )

    const group = groupData?.data
    const accessLink = group?.accessLink
    const qrCode = group?.qrCode

    const [inviteToGroup, { isLoading: isInviting }] = useInviteToGroupMutation()
    const {
        data: contactsData,
        isLoading: isLoadingContacts,
    } = useGetAcceptedContactsQuery(token!, {
        skip: !token || !isOpen,
    })

    const contacts = contactsData?.contacts || []

    const filteredContacts = contacts.filter((contact: Contact) => {
        const otherUser = contact.otherUser
        if (!otherUser) return false
        const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase()
        const email = otherUser.email.toLowerCase()
        const search = searchTerm.toLowerCase()
        return fullName.includes(search) || email.includes(search)
    })

    useEffect(() => {
        if (isOpen) {
            setSelectedContacts([])
            setSearchTerm("")
            setActiveTab("invite")
        }
    }, [isOpen])

    const toggleContact = (publicId: string) => {
        setSelectedContacts((prev) =>
            prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId]
        )
    }

    const handleSelectAll = () => {
        if (selectedContacts.length === filteredContacts.length) {
            setSelectedContacts([])
        } else {
            const allContactIds = filteredContacts
                .map((contact: Contact) => contact.otherUser?.id)
                .filter((id: string | undefined): id is string => Boolean(id))
            setSelectedContacts(allContactIds)
        }
    }

    const handleInvite = async () => {
        if (!groupId || !token) {
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
                    groupId: groupId.toString(),
                    memberIds: selectedContacts,
                },
                token,
            }).unwrap()

            if (result.data) {
                const { totalInvited, failed } = result.data

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
                    toast({
                        title: "Invitations Sent",
                        description: `Successfully sent ${totalInvited} invitation${totalInvited > 1 ? "s" : ""} to ${groupName}`,
                    })
                }
            } else {
                toast({
                    title: "Invitations Sent",
                    description: `Successfully sent ${selectedContacts.length} invitation${selectedContacts.length > 1 ? "s" : ""}`,
                })
            }

            setSelectedContacts([])
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

    const handleCopyLink = async () => {
        if (accessLink) {
            try {
                await navigator.clipboard.writeText(accessLink)
                setCopiedLink(true)
                toast({
                    title: "Link copied!",
                    description: "Group access link copied to clipboard",
                })
                setTimeout(() => setCopiedLink(false), 2000)
            } catch (err) {
                toast({
                    title: "Failed to copy",
                    description: "Could not copy link to clipboard",
                    variant: "destructive"
                })
            }
        }
    }

    const handleDownloadQR = () => {
        if (qrCode) {
            const link = document.createElement('a')
            link.href = qrCode
            link.download = `${groupName.replace(/[^a-zA-Z0-9]/g, '_')}_QRCode.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast({
                title: "QR Code downloaded!",
                description: "QR code has been saved to your device",
            })
        }
    }

    const handleShare = async () => {
        if (navigator.share && accessLink) {
            try {
                await navigator.share({
                    title: `Join ${groupName}`,
                    text: `Join our group "${groupName}" on QueCode`,
                    url: accessLink,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            handleCopyLink()
        }
    }

    const getInitials = (firstName: string, lastName: string): string => {
        return `${firstName[0]}${lastName[0]}`.toUpperCase()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <div className="bg-gray-100 p-2 rounded-full">
                            <UserPlus size={20} className="text-gray-700" />
                        </div>
                        <div>
                            <div>Add Members</div>
                            <div className="text-sm font-normal text-gray-500 mt-0.5">
                                Invite people to "{groupName}"
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="w-full grid grid-cols-2 mx-6 mt-4" style={{ width: 'calc(100% - 3rem)' }}>
                        <TabsTrigger value="invite" className="flex items-center gap-2">
                            <Users size={14} />
                            From Contacts
                        </TabsTrigger>
                        <TabsTrigger value="share" className="flex items-center gap-2">
                            <Share2 size={14} />
                            Share Link
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        {/* Invite from Contacts Tab */}
                        <TabsContent value="invite" className="mt-4 space-y-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <Input
                                    placeholder="Search contacts..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Selection Summary */}
                            {selectedContacts.length > 0 && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            {selectedContacts.length} contact{selectedContacts.length > 1 ? "s" : ""} selected
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedContacts([])}
                                            className="h-auto p-1 text-xs"
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Select All */}
                            {filteredContacts.length > 0 && (
                                <div className="flex items-center gap-2 py-2 border-b">
                                    <Checkbox
                                        checked={selectedContacts.length === filteredContacts.length}
                                        onCheckedChange={handleSelectAll}
                                        id="select-all"
                                    />
                                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                                        Select All ({filteredContacts.length})
                                    </label>
                                </div>
                            )}

                            {/* Contacts List */}
                            <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                {isLoadingContacts ? (
                                    <div className="flex justify-center items-center py-12">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                                    </div>
                                ) : filteredContacts.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="font-medium">No contacts found</p>
                                        <p className="text-sm mt-1">
                                            {searchTerm ? "Try a different search term" : "Add contacts to invite them"}
                                        </p>
                                    </div>
                                ) : (
                                    filteredContacts.map((contact: Contact) => {
                                        const otherUser = contact.otherUser
                                        if (!otherUser) return null

                                        return (
                                            <div
                                                key={contact.id}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                                                onClick={() => toggleContact(otherUser.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedContacts.includes(otherUser.id)}
                                                    onCheckedChange={() => toggleContact(otherUser.id)}
                                                />
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={(otherUser as any).avatar} alt={otherUser.firstName} />
                                                    <AvatarFallback>
                                                        {getInitials(otherUser.firstName, otherUser.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {otherUser.firstName} {otherUser.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {otherUser.email}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>

                            {/* Action Buttons */}
                            {selectedContacts.length > 0 && (
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleInvite}
                                        disabled={isInviting}
                                        className="flex-1 bg-[#00B512] hover:bg-[#009E10]"
                                    >
                                        {isInviting ? (
                                            <>
                                                <Loader2 size={14} className="mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus size={14} className="mr-2" />
                                                Invite {selectedContacts.length > 0 && `(${selectedContacts.length})`}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        {/* Share Link Tab */}
                        <TabsContent value="share" className="mt-4 space-y-4">
                            {(qrCode || accessLink) ? (
                                <>
                                    {/* QR Code Section */}
                                    {qrCode && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-700">
                                                <QrCode size={16} className="mr-2 text-gray-600" />
                                                QR Code
                                            </h4>
                                            <div className="flex justify-center mb-3">
                                                <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm">
                                                    <img
                                                        src={qrCode}
                                                        alt="Group QR Code"
                                                        className="w-48 h-48"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 text-center mb-3">
                                                Scan this QR code to join the group
                                            </p>
                                            <Button
                                                onClick={handleDownloadQR}
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                <Download size={14} className="mr-2" />
                                                Download QR Code
                                            </Button>
                                        </div>
                                    )}

                                    {/* Access Link Section */}
                                    {accessLink && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-700">
                                                <Link2 size={16} className="mr-2 text-gray-600" />
                                                Invite Link
                                            </h4>
                                            <p className="text-xs text-gray-600 mb-3">
                                                Share this link with people you want to invite to the group
                                            </p>
                                            <div className="flex gap-2 mb-3">
                                                <div className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 text-sm truncate">
                                                    {accessLink}
                                                </div>
                                                <Button
                                                    onClick={handleCopyLink}
                                                    variant="outline"
                                                    size="sm"
                                                    className="shrink-0"
                                                >
                                                    {copiedLink ? (
                                                        <Check size={14} className="text-[#00B512]" />
                                                    ) : (
                                                        <Copy size={14} />
                                                    )}
                                                </Button>
                                            </div>
                                            {'share' in navigator && (
                                                <Button
                                                    onClick={handleShare}
                                                    className="w-full bg-[#00B512] hover:bg-[#009E10]"
                                                >
                                                    <Share2 size={14} className="mr-2" />
                                                    Share Link
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <Link2 size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="font-medium">No sharing options available</p>
                                    <p className="text-sm mt-1">
                                        Contact the group admin to enable sharing
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
