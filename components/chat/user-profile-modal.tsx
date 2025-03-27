"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, MapPin, DollarSign, User, MessageCircle } from "lucide-react"
import type { Contact } from "@/types"

interface UserProfileModalProps {
    isOpen: boolean
    onClose: () => void
    user: Contact | null
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
    if (!user) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <User size={20} className="text-blue-600 mr-2" />
                        <DialogTitle>User Profile</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center py-6">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 mb-1 text-xl font-semibold">{user.name}</h3>
                    <div className="flex items-center mb-4">
                        <Badge variant={user.online ? "default" : "secondary"} className={user.online ? "bg-green-500" : ""}>
                            {user.online ? "Online" : "Offline"}
                        </Badge>
                        <span className="ml-2 text-sm text-gray-500">Member since {user.joinedAt}</span>
                    </div>

                    <Separator className="w-full my-4" />

                    <div className="w-full space-y-4">
                        <div className="flex items-center">
                            <Mail size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Email:</span>
                            <span className="font-medium">{user.email}</span>
                        </div>

                        <div className="flex items-center">
                            <Phone size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Phone:</span>
                            <span className="font-medium">{user.phone}</span>
                        </div>

                        <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-gray-500" />
                            <span className="text-sm text-gray-500 w-20">Address:</span>
                            <span className="font-medium">{user.address}</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={onClose} className="bg-[#00B512] hover:bg-[#009E10]">
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

