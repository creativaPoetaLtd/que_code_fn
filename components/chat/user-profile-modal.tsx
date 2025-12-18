"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, DollarSign, User as UserIcon, MessageCircle } from "lucide-react"
import type { User } from "@/types"

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    user: User | null
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <UserIcon size={20} className="text-brand-green dark:text-brand-gold mr-2" />
                        <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">User Profile</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        View user details and contact information
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center py-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.profile?.profileImage || "/placeholder.svg?height=80&width=80"} alt={`${user.firstName || ''} ${user.lastName || ''}`.trim()} />
                        <AvatarFallback>{((user.firstName || '') + (user.lastName || '')).charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 mb-1 text-xl font-semibold">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User'}</h3>
                    <div className="flex items-center mb-4">
                        <Badge variant={user.isOnline ? "default" : "secondary"} className={user.isOnline ? "bg-green-500" : ""}>
                            {user.isOnline ? "Online" : "Offline"}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-500">
                            {user.lastSeen
                                ? `Last seen ${new Date(user.lastSeen).toLocaleDateString()}`
                                : 'Member'
                            }
                        </span>
                    </div>

                    <Separator className="w-full my-4" />

                    <div className="w-full space-y-4">
                        <div className="flex items-center">
                            <Mail size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Email:</span>
                            <span className="font-medium">{user.email || 'Not provided'}</span>
                        </div>

                        <div className="flex items-center">
                            <Phone size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Phone:</span>
                            <span className="font-medium">{user.phone || 'Not provided'}</span>
                        </div>

                        <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Address:</span>
                            <span className="font-medium">{'Not provided'}</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={onClose} className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main">
                            <MessageCircle size={16} className="mr-2" />
                            Message
                        </Button>
                        <Button variant="outline">
                            <DollarSign size={16} className="mr-2" />
                            Send Money
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

