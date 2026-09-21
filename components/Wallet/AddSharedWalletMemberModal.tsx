"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Users } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAddSharedWalletMemberMutation } from "@/states/sharedWalletSlice"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"

interface Contact {
    id: string
    otherUser: {
        id: string
        firstName: string
        lastName: string
        email: string
        avatar?: string
    }
}

interface AddSharedWalletMemberModalProps {
    isOpen: boolean
    onClose: () => void
    sharedWalletId: string
    existingMemberIds: string[]
}

export default function AddSharedWalletMemberModal({
    isOpen,
    onClose,
    sharedWalletId,
    existingMemberIds,
}: AddSharedWalletMemberModalProps) {
    const { getToken } = useAuthToken()
    const token = getToken()

    const [selected, setSelected] = useState<string[]>([])
    const [addMember, { isLoading: isAdding }] = useAddSharedWalletMemberMutation()
    const { data: contactsData, isLoading: isLoadingContacts } = useGetAcceptedContactsQuery(token!, {
        skip: !token || !isOpen,
    })

    const contacts: Contact[] = (contactsData?.contacts || []).filter(
        (c: Contact) => !existingMemberIds.includes(c.otherUser.id)
    )

    useEffect(() => {
        if (isOpen) setSelected([])
    }, [isOpen])

    const toggle = (userId: string) => {
        setSelected((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
    }

    const handleSubmit = async () => {
        try {
            for (const userId of selected) {
                await addMember({ sharedWalletId, userId }).unwrap()
            }
            toast({ title: selected.length === 1 ? "Invitation sent" : `${selected.length} invitations sent` })
            onClose()
        } catch (error: any) {
            toast({
                title: "Could not send invitation",
                description: error?.data?.message || "Something went wrong",
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Invite members</DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        Pick from your contacts who aren&apos;t already in this wallet. They&apos;ll need to accept before joining.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2">
                    {isLoadingContacts ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading contacts...
                        </div>
                    ) : contacts.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500 flex flex-col items-center gap-2">
                            <Users className="w-5 h-5 text-gray-400" />
                            No contacts available to add.
                        </div>
                    ) : (
                        <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                            {contacts.map((contact) => (
                                <div key={contact.id} className="flex items-center py-2">
                                    <Checkbox
                                        id={`add-member-contact-${contact.id}`}
                                        checked={selected.includes(contact.otherUser.id)}
                                        onCheckedChange={() => toggle(contact.otherUser.id)}
                                        className="mr-2"
                                    />
                                    <label
                                        htmlFor={`add-member-contact-${contact.id}`}
                                        className="flex items-center cursor-pointer flex-1"
                                        onClick={() => toggle(contact.otherUser.id)}
                                    >
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarImage
                                                src={contact.otherUser.avatar || "/placeholder.svg"}
                                                alt={`${contact.otherUser.firstName} ${contact.otherUser.lastName}`}
                                            />
                                            <AvatarFallback>
                                                {(contact.otherUser.firstName || '').charAt(0).toUpperCase()}
                                                {(contact.otherUser.lastName || '').charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">
                                            {contact.otherUser.firstName} {contact.otherUser.lastName}
                                        </span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isAdding || selected.length === 0}
                        className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                    >
                        {isAdding && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Invite {selected.length > 0 ? `(${selected.length})` : ""}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
