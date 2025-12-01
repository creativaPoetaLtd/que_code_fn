"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Users, Info, MessageCircle, UserPlus, Loader2 } from "lucide-react"
import { useGetGroupByIdQuery, useGetGroupMembersQuery } from "@/states/groupSlice"
import GroupProgressBar from "./group-progress-bar"
import DeadlineCounter from "./deadline-counter"
import GroupMembersList from "./group-members-list"

interface GroupProfileModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string | null
    token: string
}

export default function GroupProfileModal({ isOpen, onClose, groupId, token }: GroupProfileModalProps) {
    const { data: groupData, isLoading: isLoadingGroup } = useGetGroupByIdQuery(
        { groupId: groupId!, token },
        { skip: !groupId || !token }
    )
    // Fetch group members
    const { data: membersData, isLoading: isLoadingMembers } = useGetGroupMembersQuery(
        { groupId: groupId!, token },
        { skip: !groupId || !token }
    )

    const group = groupData?.data
    const members = membersData?.data?.members || []

    const isLoading = isLoadingGroup || isLoadingMembers

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center">
                        <Users size={20} className="text-blue-600 mr-2" />
                        <DialogTitle>Group Details</DialogTitle>
                    </div>
                </DialogHeader>

                {!groupId ? (
                    <div className="text-center py-8 text-gray-500">
                        <Users size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium mb-2">No group selected</p>
                        <p className="text-sm">Please select a group chat to view details</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : group ? (
                    <div className="flex flex-col py-6 space-y-4">
                        {/* Group Header */}
                        <div className="flex items-center mb-4">
                            {group.profilePictureUrl || group.picture ? (
                                <Avatar className="h-16 w-16 mr-4">
                                    <AvatarImage src={group.profilePictureUrl || group.picture} alt={group.name} />
                                    <AvatarFallback>{(group.name || 'G').charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="bg-[#00313A] h-16 w-16 rounded-full flex items-center justify-center text-white mr-4">
                                    <Users size={32} />
                                </div>
                            )}

                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-1">{group.name}</h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                    </Badge>
                                    <Badge variant="outline" className={
                                        group.privacyType === 'private'
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : group.privacyType === 'require_approval'
                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                : 'bg-green-50 text-green-700 border-green-200'
                                    }>
                                        {group.privacyType === 'private' ? 'Private' : group.privacyType === 'require_approval' ? 'Approval Required' : 'Public'}
                                    </Badge>
                                    {group.userRole && (
                                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            {group.userRole.charAt(0).toUpperCase() + group.userRole.slice(1)}
                                        </Badge>
                                    )}
                                </div>
                                {group.ownerName && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Owner: {group.ownerName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Group Description */}
                        {group.description && (
                            <div>
                                <h4 className="font-semibold text-sm mb-1">About</h4>
                                <p className="text-gray-700 text-sm">{group.description}</p>
                            </div>
                        )}

                        {/* Fundraising Section */}
                        {group.hasFundraising && group.fundraisingTarget && (
                            <div className="space-y-2">
                                <GroupProgressBar
                                    currentAmount={group.fundraisingCurrentAmount}
                                    targetAmount={group.fundraisingTarget}
                                />
                                {group.expirationDate && (
                                    <DeadlineCounter expirationDate={group.expirationDate} />
                                )}
                            </div>
                        )}

                        {/* Additional Info Prompt */}
                        {group.hasAdditionalInfo && group.additionalInfoPrompt && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <Info size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-sm text-amber-900 mb-1">Additional Information</h4>
                                        <p className="text-sm text-amber-800">{group.additionalInfoPrompt}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <Separator className="my-4" />

                        {/* Group Members */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold flex items-center">
                                    <Users size={16} className="mr-2" />
                                    Members ({members.length})
                                </h4>
                            </div>

                            <GroupMembersList
                                members={members}
                                isLoading={isLoadingMembers}
                                maxHeight="max-h-64"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3 mt-6 flex-wrap">
                            <Button onClick={onClose} className="bg-[#00B512] hover:bg-[#009E10]">
                                <MessageCircle size={16} className="mr-2" />
                                Message Group
                            </Button>
                            {(group.userRole === 'owner' || group.userRole === 'admin') && (
                                <Button variant="outline">
                                    <UserPlus size={16} className="mr-2" />
                                    Add Members
                                </Button>
                            )}
                        </div>

                        {/* Group Info Footer */}
                        <div className="text-xs text-gray-500 text-center space-y-1">
                            <p>Created {new Date(group.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</p>
                            {group.maxMembers && (
                                <p>Max capacity: {group.maxMembers} members</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        Group not found
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}