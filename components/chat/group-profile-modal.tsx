"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, Calendar, DollarSign, Info, MessageCircle, UserPlus } from "lucide-react"
import type { Group } from "@/types"

interface GroupProfileModalProps {
    isOpen: boolean
    onClose: () => void
    group: Group | null
}

interface GroupMember {
    id: number
    name: string
    avatar: string
    role: string
}

export default function GroupProfileModal({ isOpen, onClose, group }: GroupProfileModalProps) {
    if (!group) return null

    // Mock group members
    const groupMembers: GroupMember[] = [
        { id: 1, name: "Alex Johnson", avatar: "/placeholder.svg?height=40&width=40", role: "Admin" },
        { id: 2, name: "Maya Rodriguez", avatar: "/placeholder.svg?height=40&width=40", role: "Member" },
        { id: 3, name: "Sam Taylor", avatar: "/placeholder.svg?height=40&width=40", role: "Member" },
        { id: 4, name: "Jordan Lee", avatar: "/placeholder.svg?height=40&width=40", role: "Member" },
    ]

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center">
                        <Users size={20} className="text-blue-600 mr-2" />
                        <DialogTitle>{group.isContributionGroup ? "Contribution Group" : "Group"} Details</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex flex-col py-6">
                    <div className="flex items-center mb-4">
                        {group.isGroup ? (
                            <div className="bg-[#00313A] h-16 w-16 rounded-full flex items-center justify-center text-white mr-4">
                                <Users size={32} />
                            </div>
                        ) : (
                            <Avatar className="h-16 w-16 mr-4">
                                <AvatarImage src={group.avatar} alt={group.name} />
                                <AvatarFallback>{(group.name || 'G').charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        )}

                        <div>
                            <h3 className="text-xl font-semibold mb-0">{group.name}</h3>
                            <div className="flex items-center">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {group.members} members
                                </Badge>
                                <span className="ml-2 text-sm text-gray-500">Created {group.createdAt}</span>
                            </div>
                        </div>
                    </div>

                    <p className="mb-4 text-gray-700">{group.description || "No description available."}</p>

                    {group.isContributionGroup && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Contribution Progress</span>
                                <span>
                                    ${group.collectedAmount} of ${group.targetAmount}
                                </span>
                            </div>
                            <Progress value={group.contributionProgress} className="h-2" />
                            <div className="flex justify-between items-center mt-2">
                                <div className="flex items-center">
                                    <Calendar size={16} className="text-gray-500 mr-2" />
                                    <span className="text-sm text-gray-500">Deadline: {group.deadline}</span>
                                </div>
                                <Button size="sm" className="bg-[#00B512] hover:bg-[#009E10]">
                                    <DollarSign size={14} className="mr-1" />
                                    Contribute
                                </Button>
                            </div>
                        </div>
                    )}

                    <Separator className="my-4" />

                    <div>
                        <div className="flex items-center mb-2">
                            <Users size={16} className="mr-2" />
                            <h4 className="font-medium">Members</h4>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {groupMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                    <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-2">
                                            <AvatarImage src={member.avatar} alt={member.name} />
                                            <AvatarFallback>{(member.name || 'M').charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="font-medium">{member.name}</span>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    member.role === "Admin" ? "bg-amber-50 text-amber-700 border-amber-200 ml-2" : "ml-2"
                                                }
                                            >
                                                {member.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <MessageCircle size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={onClose} className="bg-[#00B512] hover:bg-[#009E10]">
                            <MessageCircle size={16} className="mr-2" />
                            Message Group
                        </Button>
                        <Button variant="outline">
                            <UserPlus size={16} className="mr-2" />
                            Add Members
                        </Button>
                        {group.isContributionGroup && (
                            <Button variant="outline">
                                <Info size={16} className="mr-2" />
                                Contribution Details
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

