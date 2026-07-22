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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "../ui/label"
import { Users, Coins, Upload, X, DollarSign, Loader2, Calendar, Shield, Settings, UserCheck } from "lucide-react"
import QRCodeGenerator from "./qr-code-generator"
import { toast } from "@/hooks/use-toast"
import { useCreateGroupMutation } from "@/states/groupSlice"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import { CreateGroupRequest } from "@/types/group.types"

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    isContributionGroup?: boolean
    token: string | null
}

interface Contact {
    id: string
    userAId: string
    userBId: string
    status: string
    createdAt: string
    updatedAt: string
    otherUser: {
        id: string
        firstName: string
        lastName: string
        email: string
        phone?: string
        avatar?: string
        publicId?: string
    }
}

type PrivacyType = 'private' | 'public' | 'require_approval'
type ExpirationType = 'custom_date' | 'target_reached' | 'deadline_reached' | 'never'


export default function CreateGroupModalUpdated({
    isOpen,
    onClose,
    isContributionGroup = false,
    token,
}: CreateGroupModalProps) {

    const [groupName, setGroupName] = useState<string>("")
    const [description, setDescription] = useState<string>("")
    const [selectedContacts, setSelectedContacts] = useState<string[]>([])
    const [selectedAdmin, setSelectedAdmin] = useState<string>("")
    const [groupImage, setGroupImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>("")
    const [showQRCode, setShowQRCode] = useState<boolean>(false)
    const [createdGroup, setCreatedGroup] = useState<any>(null)

    // Enhanced Group Settings
    const [privacyType, setPrivacyType] = useState<PrivacyType>('public')
    const [maxMembers, setMaxMembers] = useState<number>(100)
    const [hasFundraising, setHasFundraising] = useState<boolean>(isContributionGroup)
    const [fundraisingTarget, setFundraisingTarget] = useState<string>("")
    const [expirationType, setExpirationType] = useState<ExpirationType>('never')
    const [expirationDate, setExpirationDate] = useState<string>("")
    const [hasAdditionalInfo, setHasAdditionalInfo] = useState<boolean>(false)
    const [additionalInfoPrompt, setAdditionalInfoPrompt] = useState<string>("")

    // For contribution groups (legacy support)
    const [targetAmount, setTargetAmount] = useState<string>("")
    const [deadline, setDeadline] = useState<string>("")

    // API hooks
    const [createGroup, { isLoading: isCreating }] = useCreateGroupMutation()
    const { data: contactsData, isLoading: isLoadingContacts } = useGetAcceptedContactsQuery(token!, {
        skip: !token
    })

    const contacts: Contact[] = contactsData?.contacts || []

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setGroupName("")
            setDescription("")
            setSelectedContacts([])
            setSelectedAdmin("")
            setGroupImage(null)
            setImagePreview("")
            setTargetAmount("")
            setDeadline("")
            setShowQRCode(false)
            setCreatedGroup(null)

            // Enhanced settings reset
            setPrivacyType('public')
            setMaxMembers(100)
            setHasFundraising(isContributionGroup)
            setFundraisingTarget("")
            setExpirationType('never')
            setExpirationDate("")
            setHasAdditionalInfo(false)
            setAdditionalInfoPrompt("")
        }
    }, [isOpen, isContributionGroup])

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

    const toggleContact = (userId: string) => {
        setSelectedContacts((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
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

        if (hasFundraising && !fundraisingTarget && !targetAmount) {
            toast({
                title: "Error",
                description: "Please enter a target amount for the fundraising group",
                variant: "destructive",
            })
            return
        }

        if (expirationType === 'custom_date' && !expirationDate) {
            toast({
                title: "Error",
                description: "Please select an expiration date",
                variant: "destructive",
            })
            return
        }

        if (hasAdditionalInfo && !additionalInfoPrompt.trim()) {
            toast({
                title: "Error",
                description: "Please provide the additional information prompt",
                variant: "destructive",
            })
            return
        }

        if (!token) {
            toast({
                title: "Error",
                description: "You must be logged in to create a group",
                variant: "destructive"
            })
            return;
        }

        try {
            // Check if we need to send as JSON or FormData based on whether we have a file
            if (groupImage) {
                // Create FormData for file upload
                const formData = new FormData()

                // Basic group data
                formData.append('name', groupName.trim())
                if (description?.trim()) {
                    formData.append('description', description.trim())
                }

                // Enhanced settings
                formData.append('privacyType', privacyType)
                formData.append('maxMembers', maxMembers.toString())
                formData.append('hasFundraising', hasFundraising.toString())

                if (hasFundraising) {
                    const target = fundraisingTarget || targetAmount
                    if (target) {
                        formData.append('fundraisingTarget', target)
                    }
                }

                formData.append('expirationType', expirationType)
                if (expirationType === 'custom_date' && expirationDate) {
                    formData.append('expirationDate', expirationDate)
                }

                formData.append('hasAdditionalInfo', hasAdditionalInfo.toString())
                if (hasAdditionalInfo && additionalInfoPrompt.trim()) {
                    formData.append('additionalInfoPrompt', additionalInfoPrompt.trim())
                }

                // Admin selection
                if (selectedAdmin && selectedAdmin.trim()) {
                    formData.append('adminId', selectedAdmin)
                }

                // Members - append each member ID individually to create an array
                if (selectedContacts.length > 0) {
                    selectedContacts.forEach((memberId) => {
                        formData.append('memberIds[]', memberId)
                    })
                }

                // Profile picture
                formData.append('profilePicture', groupImage)

                const result = await createGroup({ groupData: formData, token }).unwrap()

                setCreatedGroup(result.data)
                setShowQRCode(true)

                toast({
                    title: "Success",
                    description: result.message,
                })
            } else {
                // Send as JSON when no file upload is needed
                const groupData: CreateGroupRequest = {
                    name: groupName.trim(),
                    description: description?.trim(),
                    privacyType,
                    maxMembers,
                    hasFundraising,
                    fundraisingTarget: hasFundraising ? parseFloat(fundraisingTarget || targetAmount || '0') : undefined,
                    expirationType,
                    expirationDate: expirationType === 'custom_date' ? expirationDate : undefined,
                    hasAdditionalInfo,
                    additionalInfoPrompt: hasAdditionalInfo ? additionalInfoPrompt.trim() : undefined,
                    adminId: selectedAdmin && selectedAdmin.trim() ? selectedAdmin : undefined,
                    memberIds: selectedContacts.length > 0 ? selectedContacts : undefined
                }

                // Remove undefined values safely
                const cleanedGroupData = Object.fromEntries(
                    Object.entries(groupData).filter(([_, value]) => value !== undefined)
                ) as CreateGroupRequest

                const result = await createGroup({ groupData: cleanedGroupData, token }).unwrap()

                setCreatedGroup(result.data)
                setShowQRCode(true)

                toast({
                    title: "Success",
                    description: result.message,
                })
            }
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
                        <div className={`${isContributionGroup ? "bg-green-100" : "bg-green-100"} p-2 rounded-full mr-3`}>
                            {isContributionGroup ? (
                                <Coins size={20} className="text-green-600" />
                            ) : (
                                <Users size={20} className="text-brand-green dark:text-brand-gold" />
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
                    <div className="py-4 space-y-6">
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
                                        <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-darkBg-interactive flex items-center justify-center hover:bg-gray-200 dark:hover:bg-darkBg-hover transition-colors">
                                            <Upload size={24} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 block text-center">Upload Picture</span>
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
                                Group Name <span className="text-red-500">*</span>
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

                        {/* Privacy Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-gray-600" />
                                <label className="text-sm font-medium text-gray-700">Privacy Settings</label>
                            </div>
                            <RadioGroup value={privacyType} onValueChange={(value: PrivacyType) => setPrivacyType(value)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="public" id="public" />
                                    <Label htmlFor="public" className="text-sm">
                                        <span className="font-medium">Public</span>
                                        <span className="text-gray-500 block text-xs">Anyone can find and join this group</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="private" id="private" />
                                    <Label htmlFor="private" className="text-sm">
                                        <span className="font-medium">Private</span>
                                        <span className="text-gray-500 block text-xs">Only invited members can join</span>
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="require_approval" id="require_approval" />
                                    <Label htmlFor="require_approval" className="text-sm">
                                        <span className="font-medium">Require Admin Approval</span>
                                        <span className="text-gray-500 block text-xs">Anyone can request to join, but admin must approve</span>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        {/* Max Members */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Members</label>
                            <Input
                                type="number"
                                min={1}
                                max={1000}
                                value={maxMembers}
                                onChange={(e) => setMaxMembers(Number(e.target.value))}
                            />
                        </div>

                        {/* Fundraising Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="has-fundraising"
                                    checked={hasFundraising}
                                    onCheckedChange={(checked) => setHasFundraising(checked as boolean)}
                                />
                                <div className="flex items-center gap-2">
                                    <Coins size={16} className="text-green-600" />
                                    <label htmlFor="has-fundraising" className="text-sm font-medium">
                                        Enable Fundraising Activity
                                    </label>
                                </div>
                            </div>

                            {hasFundraising && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fundraising Target</label>
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
                                            value={fundraisingTarget || targetAmount}
                                            onChange={(e) => {
                                                setFundraisingTarget(e.target.value)
                                                setTargetAmount(e.target.value) // For legacy support
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expiration Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-600" />
                                <label className="text-sm font-medium text-gray-700">Group Expiration</label>
                            </div>
                            <Select value={expirationType} onValueChange={(value: ExpirationType) => setExpirationType(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select expiration type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="never">Never Expire</SelectItem>
                                    <SelectItem value="custom_date">Set Custom Expiration Date</SelectItem>
                                    {hasFundraising && (
                                        <>
                                            <SelectItem value="target_reached">When Fundraising Target is Reached</SelectItem>
                                            <SelectItem value="deadline_reached">When Fundraising Deadline is Reached</SelectItem>
                                        </>
                                    )}
                                </SelectContent>
                            </Select>

                            {expirationType === 'custom_date' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
                                    <Input
                                        type="date"
                                        value={expirationDate}
                                        onChange={(e) => setExpirationDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Additional Information Requirement */}
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="has-additional-info"
                                    checked={hasAdditionalInfo}
                                    onCheckedChange={(checked) => setHasAdditionalInfo(checked as boolean)}
                                />
                                <div className="flex items-center gap-2">
                                    <Settings size={16} className="text-gray-600" />
                                    <label htmlFor="has-additional-info" className="text-sm font-medium">
                                        Require Additional Information from Members
                                    </label>
                                </div>
                            </div>

                            {hasAdditionalInfo && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Information Prompt <span className="text-red-500">*</span>
                                    </label>
                                    <Textarea
                                        placeholder="What additional information should members provide when joining?"
                                        value={additionalInfoPrompt}
                                        onChange={(e) => setAdditionalInfoPrompt(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Select Admin */}
                        {contacts.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <UserCheck size={16} className="text-gray-600" />
                                    <label className="text-sm font-medium text-gray-700">Select Group Admin (Optional)</label>
                                </div>
                                <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose an admin from your contacts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contacts.map((contact) => (
                                            <SelectItem key={contact.id} value={contact.otherUser.id}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage
                                                            src={contact.otherUser.avatar || "/placeholder.svg"}
                                                            alt={`${contact.otherUser.firstName} ${contact.otherUser.lastName}`}
                                                        />
                                                        <AvatarFallback>
                                                            {(contact.otherUser.firstName || '').charAt(0).toUpperCase()}
                                                            {(contact.otherUser.lastName || '').charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>
                                                        {contact.otherUser.firstName} {contact.otherUser.lastName}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Select Contacts */}
                        <div>
                            <Separator className="my-4" />
                            <div className="flex items-center mb-2">
                                <Users size={16} className="mr-2" />
                                <span className="font-medium">Invite Contacts ({selectedContacts.length} selected)</span>
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
                                                checked={selectedContacts.includes(contact.otherUser.id)}
                                                onCheckedChange={() => toggleContact(contact.otherUser.id)}
                                                className="mr-2"
                                            />
                                            <label
                                                htmlFor={`contact-${contact.id}`}
                                                className="flex items-center cursor-pointer flex-1"
                                                onClick={() => toggleContact(contact.otherUser.id)}
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
                                                <div>
                                                    <span className="font-medium">
                                                        {contact.otherUser.firstName} {contact.otherUser.lastName}
                                                    </span>
                                                    <div className="text-sm text-gray-500">{contact.otherUser.email}</div>
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
                        <Button onClick={handleSubmit} disabled={isCreating}
                        className='bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90'
                        >
                            {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Create {hasFundraising ? "Fundraising Group" : "Group"}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}
