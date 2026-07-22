"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import GroupDetailsContent from "@/components/chat/group-details-content"
import GroupJoinRequestsModal from "@/components/chat/group-join-requests-modal"
import { useGetGroupByIdQuery } from "@/states/groupSlice"

interface GroupProfileModalProps {
    isOpen: boolean
    onClose: () => void
    groupId: string | null
    token: string
}

export default function GroupProfileModal({ isOpen, onClose, groupId, token }: GroupProfileModalProps) {
    const [isJoinRequestsOpen, setIsJoinRequestsOpen] = useState(false)

    const { data: groupData } = useGetGroupByIdQuery(
        { groupId: groupId!, token },
        { skip: !groupId || !token || !isOpen }
    )
    const groupName = groupData?.data?.name || ""

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <div className="flex items-center">
                            <Users size={20} className="text-gray-700 mr-2" />
                            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">Group Details</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="overflow-y-auto px-6 pb-6">
                        <GroupDetailsContent
                            groupId={groupId}
                            token={token}
                            isActive={isOpen}
                            onJoinRequests={() => setIsJoinRequestsOpen(true)}
                            renderActions={() => (
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main h-9 text-sm"
                                    >
                                        Back to Chat
                                    </Button>
                                </div>
                            )}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {groupId && (
                <GroupJoinRequestsModal
                    isOpen={isJoinRequestsOpen}
                    onClose={() => setIsJoinRequestsOpen(false)}
                    groupId={groupId}
                    groupName={groupName}
                    token={token}
                />
            )}
        </>
    )
}
