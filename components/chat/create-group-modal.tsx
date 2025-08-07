"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Users, Coins, Upload, X, DollarSign, Loader2 } from "lucide-react"
import QRCodeGenerator from "./qr-code-generator"
import { toast } from "@/hooks/use-toast"
import { useCreateGroupMutation } from "@/states/groupSlice"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    isContributionGroup?: boolean
    token: string | null
}

interface Contact {
    id: string
    contactUser: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone?: string
        avatar?: string
        publicId?: string
    }
}


export default function CreateGroupModalUpdated({
    isOpen,
    onClose,
    isContributionGroup = false,
    token,
}: CreateGroupModalProps) {

    const [groupName, setGroupName] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [selectedContacts, setSelectedContacts] = useState<string[]>([])
    const [groupImage, setGroupImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [showQRCode, setShowQRCode] = useState<boolean>(false)
    const [createdGroup, setCreatedGroup] = useState<any>(null)
    const [isPrivate, setIsPrivate] = useState<boolean>(false)
    const [maxMembers, setMaxMembers] = useState<number>(100)

    // For contribution groups
    const [targetAmount, setTargetAmount] = useState<string>("")
    const [deadline, setDeadline] = useState<string>("")

    // API hooks
    const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation()
    const { data: contactsData, isLoading: isLoadingContacts } = useGetAcceptedContactsQuery(token!, {
        skip: !token
    })

    console.log("Contacts Data:", contactsData);
    const contacts: Contact[] = contactsData?.data || []

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setGroupName("")
            setDescription("")
            setSelectedContacts([])
            setGroupImage(null)
            setImagePreview("")
            setTargetAmount("")
            setDeadline("")
            setShowQRCode(false)
            setCreatedGroup(null)
            setIsPrivate(false)
            setMaxMembers(100)
        }
    }, [isOpen])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setGroupImage(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setGroupImage(null)
        setImagePreview("")
    }

    const toggleContact = (publicId: string) => {
        setSelectedContacts((prev) =>
            prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId],
        )
    }

    const handleSubmit = async () => {
        if (!groupName || groupName.trim().length < 2) {
            toast({
                title: "Error",
                description: "Group name is required and must be at least 2 characters",
                variant: "destructive",
            })
            return
        }

        if (isContributionGroup && !targetAmount) {
            toast({
                title: "Error",
                description: "Please enter a target amount for the contribution group",
                variant: "destructive",
            })
            return
        }

        try {
            const groupData = {
                name: groupName.trim(),
                description: description?.trim(),
                isPrivate,
                maxMembers,
                memberIds: selectedContacts,
            }


            if (!token) {
                toast({
                    title: "Error",
                    description: "You must logged in to create a group",
                    variant: "destructive"
                })
                return;
            }
            const result = await createGroup({ groupData, token }).unwrap()

            setCreatedGroup(result.data)
            setShowQRCode(true)

            toast({
                title: "Success",
                description: result.message,
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error?.data?.message || "Failed to create group",
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        setShowQRCode(false)
        setCreatedGroup(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center">
                        <div className={`${isContributionGroup ? "bg-green-100" : "bg-blue-100"} p-2 rounded-full mr-3`}>
                            {isContributionGroup ? (
                                <Coins size={20} className="text-green-600" />
                            ) : (
                                <Users size={20} className="text-blue-600" />
                            )}
                        </div>
                        <DialogTitle>{isContributionGroup ? "Create Contribution Group" : "Create Group"}</DialogTitle>
                    </div>
                </DialogHeader>

                {showQRCode && createdGroup ? (
                    <div className="py-4">
                        <QRCodeGenerator
                            value={createdGroup.accessLink}
                            title={`Join ${createdGroup.name}`}
                            description="Scan this QR code or share the link to invite others"
                        />
                        <div className="flex justify-center mt-6 gap-2">
                            <Button onClick={handleClose}>Done</Button>
                            <Button variant="outline" onClick={() => setShowQRCode(false)}>
                                Back to Group
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 space-y-4">
                        {/* Group Image */}
                        <div className="flex justify-center">
                            {imagePreview ? (
                                <div className="relative">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={imagePreview || "/placeholder.svg"} alt="Group avatar" />
                                        <AvatarFallback>GP</AvatarFallback>
                                    </Avatar>
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6"
                                        onClick={removeImage}
                                    >
                                        <X size={12} />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <label htmlFor="group-image" className="cursor-pointer">
                                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                                            <Upload size={24} className="text-gray-500" />
                                        </div>
                                        <span className="text-sm text-gray-500 mt-2 block text-center">Upload Image</span>
                                    </label>
                                    <input
                                        id="group-image"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Group Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {isContributionGroup ? "Contribution Group Name" : "Group Name"}
                            </label>
                            <Input
                                placeholder="Enter a name for your group"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                            />
                        </div>

                        {/* Group Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <Textarea
                                placeholder="What's this group about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        {/* Group Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={maxMembers}
                                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-6">
                                <Checkbox
                                    id="private-group"
                                    checked={isPrivate}
                                    onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
                                />
                                <label htmlFor="private-group" className="text-sm font-medium">
                                    Private Group
                                </label>
                            </div>
                        </div>

                        {/* Contribution Group Fields */}
                        {isContributionGroup && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                                            <DollarSign size={16} className="text-gray-500" />
                                        </div>
                                        <Input
                                            type="number"
                                            min={0}
                                            step={0.01}
                                            placeholder="0.00"
                                            className="pl-8"
                                            value={targetAmount}
                                            onChange={(e) => setTargetAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
                                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Select Contacts */}
                        <div>
                            <Separator className="my-4" />
                            <div className="flex items-center mb-2">
                                <Users size={16} className="mr-2" />
                                <span className="font-medium">Select Contacts ({selectedContacts.length} selected)</span>
                            </div>

                            {isLoadingContacts ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Loading contacts...
                                </div>
                            ) : contacts.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No contacts available. Add some contacts first.</div>
                            ) : (
                                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                                    {contacts.map((contact) => (
                                        <div key={contact.id} className="flex items-center py-2">
                                            <Checkbox
                                                id={`contact-${contact.id}`}
                                                checked={contact.contactUser.publicId ? selectedContacts.includes(contact.contactUser.publicId) : false}
                                                onCheckedChange={() => toggleContact(contact.contactUser.publicId!)}
                                                className="mr-2"
                                            />
                                            <label
                                                htmlFor={`contact-${contact.id}`}
                                                className="flex items-center cursor-pointer flex-1"
                                                onClick={() => toggleContact(contact.id)}
                                            >
                                                <Avatar className="h-8 w-8 mr-2">
                                                    <AvatarImage
                                                        src={contact.contactUser.avatar || "/placeholder.svg"}
                                                        alt={`${contact.contactUser.firstName} ${contact.contactUser.lastName}`}
                                                    />
                                                    <AvatarFallback>
                                                        {contact.contactUser.firstName.charAt(0)}
                                                        {contact.contactUser.lastName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <span className="font-medium">
                                                        {contact.contactUser.firstName} {contact.contactUser.lastName}
                                                    </span>
                                                    <div className="text-sm text-gray-500">{contact.contactUser.email}</div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!showQRCode && (
                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isCreating}>
                            {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Create {isContributionGroup ? "Contribution Group" : "Group"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
