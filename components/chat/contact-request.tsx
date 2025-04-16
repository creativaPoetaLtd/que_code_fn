"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, UserPlus, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"


interface ContactRequest {
    id: number
    name: string
    avatar: string
    timestamp: string
}

interface ContactRequestModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ContactRequestModal({ isOpen, onClose }: ContactRequestModalProps) {
    // Mock contact requests data
    const [contactRequests, setContactRequests] = useState<ContactRequest[]>([
        {
            id: 1,
            name: "Alex Johnson",
            avatar: "/placeholder.svg?height=40&width=40",
            timestamp: "2 hours ago",
        },
        {
            id: 2,
            name: "Maya Rodriguez",
            avatar: "/placeholder.svg?height=40&width=40",
            timestamp: "Yesterday",
        },
        {
            id: 3,
            name: "Sam Taylor",
            avatar: "/placeholder.svg?height=40&width=40",
            timestamp: "2 days ago",
        },
    ])

    const handleAccept = (id: number) => {
        // In a real app, you would make an API call to accept the request
        setContactRequests(contactRequests.filter((request) => request.id !== id))
        toast({
            title: "Contact request accepted",
            description: "The user has been added to your contacts",
        })
    }

    const handleReject = (id: number) => {
        // In a real app, you would make an API call to reject the request
        setContactRequests(contactRequests.filter((request) => request.id !== id))
        toast({
            title: "Contact request rejected",
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <UserPlus size={20} className="text-blue-600 mr-2" />
                        <DialogTitle>Contact Requests</DialogTitle>
                        {contactRequests.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {contactRequests.length}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="py-4">
                    {contactRequests.length > 0 ? (
                        <div className="space-y-4">
                            {contactRequests.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center">
                                        <Avatar className="h-10 w-10 mr-3">
                                            <AvatarImage src={request.avatar || "/placeholder.svg"} alt={request.name} />
                                            <AvatarFallback>{request.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{request.name}</p>
                                            <p className="text-xs text-gray-500">{request.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleAccept(request.id)}
                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                            <CheckCircle size={20} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleReject(request.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <XCircle size={20} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-500">No pending contact requests</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
