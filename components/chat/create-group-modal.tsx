"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Users, Coins, Upload, X, DollarSign } from "lucide-react"
import QRCodeGenerator from "./qr-code-generator"
import { toast } from "@/hooks/use-toast"
import Input from "../ui/Input-ant"

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    isContributionGroup?: boolean
}

interface Contact {
    id: number
    name: string
    avatar: string
}

export default function CreateGroupModal({ isOpen, onClose, isContributionGroup = false }: CreateGroupModalProps) {
    const [groupName, setGroupName] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [selectedContacts, setSelectedContacts] = useState<number[]>([])
    const [groupImage, setGroupImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [showQRCode, setShowQRCode] = useState<boolean>(false)
    const [groupId, setGroupId] = useState<string>("")

    // For contribution groups
    const [targetAmount, setTargetAmount] = useState<string>("")
    const [deadline, setDeadline] = useState<string>("")

    // Mock contacts data
    const contacts: Contact[] = [
        { id: 1, name: "Alex Johnson", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 2, name: "Maya Rodriguez", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 3, name: "Sam Taylor", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 4, name: "Jordan Lee", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 5, name: "Taylor Swift", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 6, name: "Chris Evans", avatar: "/placeholder.svg?height=40&width=40" },
    ]

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
            setGroupId("")
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

    const toggleContact = (contactId: number) => {
        setSelectedContacts((prev) =>
            prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
        )
    }

    const handleSubmit = () => {
        if (!groupName || selectedContacts.length === 0) {
            toast({
                title: "Error",
                description: "Please enter a group name and select at least one contact",
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

        // Generate a random group ID (in a real app, this would come from the server)
        const newGroupId = `group-${Math.random().toString(36).substring(2, 10)}`
        setGroupId(newGroupId)
        setShowQRCode(true)
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
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

                {showQRCode ? (
                    <div className="py-4">
                        <QRCodeGenerator
                            value={`https://app.example.com/join-group/${groupId}`}
                            title={`Join ${groupName}`}
                            description="Scan this QR code or share the link to invite others"
                        />
                        <div className="flex justify-center mt-6">
                            <Button onClick={onClose} className="mr-2">
                                Done
                            </Button>
                            <Button variant="outline" onClick={() => setShowQRCode(false)}>
                                Back to Group
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        {/* Group Image */}
                        <div className="flex justify-center mb-4">
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
                        <div className="mb-4">
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
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <Input
                                placeholder="What's this group about?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        {/* Contribution Group Fields */}
                        {isContributionGroup && (
                            <>
                                <div className="mb-4">
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

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
                                    <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* Select Contacts */}
                        <div className="mb-4">
                            <Separator className="my-4" />
                            <div className="flex items-center mb-2">
                                <Users size={16} className="mr-2" />
                                <span className="font-medium">Select Contacts ({selectedContacts.length} selected)</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                                {contacts.map((contact) => (
                                    <div key={contact.id} className="flex items-center py-2">
                                        <Checkbox
                                            id={`contact-${contact.id}`}
                                            checked={selectedContacts.includes(contact.id)}
                                            onCheckedChange={() => toggleContact(contact.id)}
                                            className="mr-2"
                                        />
                                        <label
                                            htmlFor={`contact-${contact.id}`}
                                            className="flex items-center cursor-pointer flex-1"
                                            onClick={() => toggleContact(contact.id)}
                                        >
                                            <Avatar className="h-8 w-8 mr-2">
                                                <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.name} />
                                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span>{contact.name}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {!showQRCode && (
                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit}>Create {isContributionGroup ? "Contribution Group" : "Group"}</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
