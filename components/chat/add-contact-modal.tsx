"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { UserPlus, Search, User, Mail, Phone } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Input } from "../ui/input"

interface AddContactModalProps {
    isOpen: boolean
    onClose: () => void
}

interface ContactSearchResult {
    id: number
    name: string
    email: string
    phone: string
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [phone, setPhone] = useState<string>("")
    const [step, setStep] = useState<number>(1)
    const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([])

    // Mock search function
    const handleSearch = () => {
        if (searchTerm.length < 3) {
            toast({
                title: "Error",
                description: "Please enter at least 3 characters to search",
                variant: "destructive",
            })
            return
        }

        // Simulate search results
        setSearchResults([
            { id: 101, name: "John Smith", email: "john.smith@example.com", phone: "+1 555-123-4567" },
            { id: 102, name: "Jane Doe", email: "jane.doe@example.com", phone: "+1 555-987-6543" },
        ])
    }

    const selectContact = (contact: ContactSearchResult) => {
        setName(contact.name)
        setEmail(contact.email)
        setPhone(contact.phone)
        setStep(2)
    }

    const handleAddManually = () => {
        setName("")
        setEmail("")
        setPhone("")
        setStep(2)
    }

    const handleSubmit = () => {
        if (!name || (!email && !phone)) {
            toast({
                title: "Error",
                description: "Please provide at least a name and either an email or phone number",
                variant: "destructive",
            })
            return
        }

        toast({
            title: "Contact added",
            description: `${name} has been added to your contacts`,
        })

        // Reset and close
        setSearchTerm("")
        setName("")
        setEmail("")
        setPhone("")
        setStep(1)
        setSearchResults([])
        onClose()
    }

    const handleClose = () => {
        // Reset state when closing
        setSearchTerm("")
        setName("")
        setEmail("")
        setPhone("")
        setStep(1)
        setSearchResults([])
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <UserPlus size={20} className="text-blue-600" />
                        </div>
                        <DialogTitle>Add Contact</DialogTitle>
                    </div>
                </DialogHeader>

                {step === 1 ? (
                    <div className="py-4">
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
                                <Input
                                    placeholder="Search by name, email or phone"
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                />
                            </div>
                            <div className="flex justify-end mt-2">
                                <Button onClick={handleSearch}>Search</Button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Search Results</h3>
                                <div className="space-y-2">
                                    {searchResults.map((contact) => (
                                        <div
                                            key={contact.id}
                                            className="flex items-center p-3 rounded-md cursor-pointer hover:bg-gray-50 border border-gray-200"
                                            onClick={() => selectContact(contact)}
                                        >
                                            <Avatar className="mr-3">
                                                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{contact.name}</p>
                                                <p className="text-sm text-gray-500">{contact.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator className="my-4" />

                        <div className="text-center">
                            <p className="text-sm text-gray-500 mb-2">Can't find who you're looking for?</p>
                            <Button onClick={handleAddManually}>Add Contact Manually</Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <User size={16} className="mr-2" />
                                    <span>Name</span>
                                </div>
                            </label>
                            <Input placeholder="Enter contact name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <Mail size={16} className="mr-2" />
                                    <span>Email</span>
                                </div>
                            </label>
                            <Input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center">
                                    <Phone size={16} className="mr-2" />
                                    <span>Phone</span>
                                </div>
                            </label>
                            <Input placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 1 ? (
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                    ) : (
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                Back
                            </Button>
                            <Button onClick={handleSubmit}>Add Contact</Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

