"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import Input from "../ui/Input-ant"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, Users, Calendar } from "lucide-react"
import type { Conversation } from "@/types"
import { toast } from "@/hooks/use-toast"

interface RequestMoneyModalProps {
    isOpen: boolean
    onClose: () => void
    conversation: Conversation
}

interface Participant {
    id: number
    name: string
    avatar: string
}

export default function RequestMoneyModal({ isOpen, onClose, conversation }: RequestMoneyModalProps) {
    const [amount, setAmount] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [dueDate, setDueDate] = useState<string>("")
    const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
    const [splitEqually, setSplitEqually] = useState<boolean>(true)

    // Mock participants data
    const participants: Participant[] = [
        { id: 1, name: "Alex Johnson", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 2, name: "Maya Rodriguez", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 3, name: "Sam Taylor", avatar: "/placeholder.svg?height=40&width=40" },
        { id: 4, name: "Jordan Lee", avatar: "/placeholder.svg?height=40&width=40" },
    ]

    useEffect(() => {
        if (isOpen) {
            // Reset form when modal opens
            setAmount("")
            setNote("")
            setDueDate("")
            setSelectedParticipants([])
            setSplitEqually(true)
        }
    }, [isOpen])

    const handleSubmit = () => {
        if (!amount || selectedParticipants.length === 0) {
            toast({
                title: "Error",
                description: "Please enter an amount and select at least one participant",
                variant: "destructive",
            })
            return
        }

        toast({
            title: "Money requested",
            description: `Requested $${amount} from ${selectedParticipants.length} people`,
        })
        onClose()
    }

    const toggleParticipant = (participantId: number) => {
        setSelectedParticipants((prev) =>
            prev.includes(participantId) ? prev.filter((id) => id !== participantId) : [...prev, participantId],
        )
    }

    const amountPerPerson =
        splitEqually && selectedParticipants.length > 0 && amount
            ? (Number(amount) / selectedParticipants.length).toFixed(2)
            : "0.00"

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
                            <DollarSign size={20} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">Request Money</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
                        Request money from group members or contacts
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
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
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex items-center">
                                <Users size={16} className="mr-2" />
                                <span>Select Participants</span>
                            </div>
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {participants.map((participant) => (
                                <div key={participant.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`participant-${participant.id}`}
                                        checked={selectedParticipants.includes(participant.id)}
                                        onCheckedChange={() => toggleParticipant(participant.id)}
                                    />
                                    <label
                                        htmlFor={`participant-${participant.id}`}
                                        className="flex items-center cursor-pointer py-1"
                                        onClick={() => toggleParticipant(participant.id)}
                                    >
                                        <Avatar className="mr-2 h-8 w-8">
                                            <AvatarImage src={participant.avatar} alt={participant.name} />
                                            <AvatarFallback>{(participant.name || 'P').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span>{participant.name}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedParticipants.length > 1 && (
                        <div className="mb-4 flex items-center">
                            <Checkbox
                                id="split-equally"
                                checked={splitEqually}
                                onCheckedChange={(checked) => setSplitEqually(checked as boolean)}
                            />
                            <label
                                htmlFor="split-equally"
                                className="ml-2 cursor-pointer"
                                onClick={() => setSplitEqually(!splitEqually)}
                            >
                                Split equally ({selectedParticipants.length} people, ${amountPerPerson} each)
                            </label>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <div className="flex items-center">
                                <Calendar size={16} className="mr-2" />
                                <span>Due Date (Optional)</span>
                            </div>
                        </label>
                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                        <Input placeholder="What's this request for?" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!amount || selectedParticipants.length === 0}>
                        Request Money
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

