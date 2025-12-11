"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, Info, MessageCircle, UserPlus, Loader2, QrCode, Link2, Download, Copy, Check } from "lucide-react"
import { useGetGroupByIdQuery, useGetGroupMembersQuery } from "@/states/groupSlice"
import GroupProgressBar from "./group-progress-bar"
import DeadlineCounter from "./deadline-counter"
import GroupMembersList from "./group-members-list"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "../ui/badge"
import { socketService } from "@/services/socketService"

interface GroupProfileModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string | null
    token: string
}

export default function GroupProfileModal({ isOpen, onClose, groupId, token }: GroupProfileModalProps) {
    const { toast } = useToast()
    const [copiedLink, setCopiedLink] = useState(false)

    const { data: groupData, isLoading: isLoadingGroup, refetch: refetchGroup } = useGetGroupByIdQuery(
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

    // Listen for real-time fundraising progress updates
    useEffect(() => {
        if (!groupId || !isOpen) return;

        const handleProgressUpdate = (data: any) => {
            if (data.groupId === groupId) {
                toast({
                    title: "New Donation Received!",
                    description: `${data.donorName} donated ${new Intl.NumberFormat('en-RW', {
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    }).format(data.donationAmount)}. Progress: ${data.progress.toFixed(1)}%`,
                });
                // Refetch group data to update UI
                refetchGroup();
            }
        };

        socketService.onFundraisingProgress(handleProgressUpdate);

        return () => {
            socketService.offFundraisingProgress(handleProgressUpdate);
        };
    }, [groupId, isOpen, refetchGroup, toast]);

    const handleCopyLink = async () => {
        if (group?.accessLink) {
            try {
                await navigator.clipboard.writeText(group.accessLink)
                setCopiedLink(true)
                toast({
                    title: "Link copied!",
                    description: "Group access link copied to clipboard",
                })
                setTimeout(() => setCopiedLink(false), 2000)
            } catch (err) {
                toast({
                    title: "Failed to copy",
                    description: "Could not copy link to clipboard",
                    variant: "destructive"
                })
            }
        }
    }

    const handleDownloadQR = () => {
        if (group?.qrCode) {
            const link = document.createElement('a')
            link.href = group.qrCode
            link.download = `${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_QRCode.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast({
                title: "QR Code downloaded!",
                description: "QR code has been saved to your device",
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-center">
                        <Users size={20} className="text-gray-700 mr-2" />
                        <DialogTitle>Group Details</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="overflow-y-auto px-6 pb-6">{/* Scrollable content wrapper */}

                    {!groupId ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">No group selected</p>
                            <p className="text-sm">Please select a group chat to view details</p>
                        </div>
                    ) : isLoading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                        </div>
                    ) : group ? (
                        <div className="space-y-4 pt-4">
                            {/* Group Header */}
                            <div className="flex items-start gap-3">
                                {group.profilePictureUrl || group.picture ? (
                                    <Avatar className="h-14 w-14 shrink-0">
                                        <AvatarImage src={group.profilePictureUrl || group.picture} alt={group.name} />
                                        <AvatarFallback>{(group.name || 'G').charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="bg-[#00313A] h-14 w-14 shrink-0 rounded-full flex items-center justify-center text-white">
                                        <Users size={28} />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold mb-2 truncate">{group.name}</h3>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                                            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                                        </Badge>
                                        <Badge variant="outline" className={`text-xs ${group.privacyType === 'private'
                                            ? 'bg-gray-100 text-gray-700 border-gray-300'
                                            : group.privacyType === 'require_approval'
                                                ? 'bg-orange-50 text-orange-700 border-orange-200'
                                                : 'bg-gray-100 text-gray-700 border-gray-300'
                                            }`}>
                                            {group.privacyType === 'private' ? 'Private' : group.privacyType === 'require_approval' ? 'Approval Required' : 'Public'}
                                        </Badge>
                                        {group.userRole && (
                                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300 text-xs">
                                                {group.userRole.charAt(0).toUpperCase() + group.userRole.slice(1)}
                                            </Badge>
                                        )}
                                    </div>
                                    {group.ownerName && (
                                        <p className="text-xs text-gray-500 mt-1.5">
                                            Owner: {group.ownerName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Group Description */}
                            {group.description && (
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <h4 className="font-semibold text-xs text-gray-600 mb-1">About</h4>
                                    <p className="text-gray-700 text-sm leading-relaxed">{group.description}</p>
                                </div>
                            )}

                            {/* Fundraising Section */}
                            {group.hasFundraising && group.fundraisingTarget && (
                                <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-xs text-gray-700">Fundraising Progress</h4>
                                        {group.walletBalance !== undefined && (
                                            <span className="text-xs font-medium text-[#00313A]">
                                                {new Intl.NumberFormat('en-RW', {
                                                    style: 'currency',
                                                    currency: 'RWF',
                                                    minimumFractionDigits: 0,
                                                    maximumFractionDigits: 0
                                                }).format(group.walletBalance)}
                                            </span>
                                        )}
                                    </div>
                                    <GroupProgressBar
                                        currentAmount={group.walletBalance ?? group.fundraisingCurrentAmount}
                                        targetAmount={group.fundraisingTarget}
                                    />
                                    {group.expirationDate && (
                                        <DeadlineCounter expirationDate={group.expirationDate} />
                                    )}
                                </div>
                            )}

                            {/* Additional Info Prompt */}
                            {group.hasAdditionalInfo && group.additionalInfoPrompt && (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <Info size={14} className="text-orange-600 mt-0.5 shrink-0" />
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-xs text-orange-900 mb-1">Additional Information</h4>
                                            <p className="text-xs text-orange-800 leading-relaxed">{group.additionalInfoPrompt}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QR Code and Access Link Section */}
                            {(group.qrCode || group.accessLink) && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <h4 className="font-semibold text-xs mb-3 flex items-center text-gray-700">
                                        <QrCode size={14} className="mr-1.5 text-gray-600" />
                                        Share Group
                                    </h4>

                                    <div className="space-y-3">
                                        {/* QR Code */}
                                        {group.qrCode && (
                                            <div className="space-y-2">
                                                <div className="flex justify-center">
                                                    <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm">
                                                        <img
                                                            src={group.qrCode}
                                                            alt="Group QR Code"
                                                            className="w-32 h-32 sm:w-36 sm:h-36"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={handleDownloadQR}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full h-8 text-xs"
                                                >
                                                    <Download size={12} className="mr-1.5" />
                                                    Download QR Code
                                                </Button>
                                            </div>
                                        )}

                                        {/* Access Link */}
                                        {group.accessLink && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-700 block">Access Link</label>
                                                <div className="flex gap-2">
                                                    <div className="flex-1 bg-white border border-gray-300 rounded px-2.5 py-2 text-xs truncate min-w-0">
                                                        {group.accessLink}
                                                    </div>
                                                    <Button
                                                        onClick={handleCopyLink}
                                                        variant="outline"
                                                        size="sm"
                                                        className="shrink-0 h-9 w-9 p-0"
                                                        title="Copy link"
                                                    >
                                                        {copiedLink ? (
                                                            <Check size={14} className="text-[#00B512]" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Separator className="my-2" />

                            {/* Group Members */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm flex items-center">
                                        <Users size={14} className="mr-1.5" />
                                        Members ({members.length})
                                    </h4>
                                </div>

                                <GroupMembersList
                                    members={members}
                                    isLoading={isLoadingMembers}
                                    maxHeight="max-h-48"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-2">
                                <Button onClick={onClose} className="flex-1 bg-[#00B512] hover:bg-[#009E10] h-9 text-sm">
                                    <MessageCircle size={14} className="mr-1.5" />
                                    Message
                                </Button>
                                {(group.userRole === 'owner' || group.userRole === 'admin') && (
                                    <Button variant="outline" className="flex-1 h-9 text-sm">
                                        <UserPlus size={14} className="mr-1.5" />
                                        Add Members
                                    </Button>
                                )}
                            </div>

                            {/* Group Info Footer */}
                            <div className="text-xs text-gray-500 text-center space-y-0.5 pt-2 border-t">
                                <p>Created {new Date(group.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}</p>
                                {group.maxMembers && (
                                    <p>Max capacity: {group.maxMembers} members</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            Group not found
                        </div>
                    )}
                </div>{/* End scrollable wrapper */}
            </DialogContent>
        </Dialog>
    )
}