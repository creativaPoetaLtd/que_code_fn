'use client'

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Trash2, LogOut } from 'lucide-react'

interface GroupDialogsProps {
    leaveDialog: {
        isOpen: boolean
        groupId: string | null
    }
    deleteDialog: {
        isOpen: boolean
        groupId: string | null
    }
    groups: any[]
    isLeaving: boolean
    isDeleting: boolean
    onLeaveGroup: (groupId: string, groupName: string) => void
    onDeleteGroup: (groupId: string, groupName: string) => void
    onCloseLeaveDialog: () => void
    onCloseDeleteDialog: () => void
}

export default function GroupDialogs({
    leaveDialog,
    deleteDialog,
    groups,
    isLeaving,
    isDeleting,
    onLeaveGroup,
    onDeleteGroup,
    onCloseLeaveDialog,
    onCloseDeleteDialog
}: GroupDialogsProps) {
    const getGroupName = (groupId: string | null) => {
        if (!groupId) return "group"
        const group = groups.find((g: any) => g.id === groupId)
        return group?.name || "group"
    }

    return (
        <>
            {/* Leave Group Dialog */}
            <AlertDialog open={leaveDialog.isOpen} onOpenChange={(open) => !open && onCloseLeaveDialog()}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-full">
                                <LogOut size={20} className="text-orange-600" />
                            </div>
                            <AlertDialogTitle className="text-xl">Leave Group</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-gray-600 leading-relaxed">
                            Are you sure you want to leave <span className="font-medium">"{getGroupName(leaveDialog.groupId)}"</span>? 
                            <br /><br />
                            You won't be able to see new messages unless someone adds you back to the group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="border-gray-200 text-gray-600 hover:bg-gray-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (leaveDialog.groupId) {
                                    onLeaveGroup(leaveDialog.groupId, getGroupName(leaveDialog.groupId))
                                }
                            }}
                            disabled={isLeaving}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                            {isLeaving ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Leaving...
                                </>
                            ) : (
                                <>
                                    <LogOut size={16} className="mr-2" />
                                    Leave Group
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Group Dialog */}
            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && onCloseDeleteDialog()}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-full">
                                <Trash2 size={20} className="text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-xl">Delete Group</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription className="text-gray-600 leading-relaxed">
                            Are you sure you want to permanently delete <span className="font-medium">"{getGroupName(deleteDialog.groupId)}"</span>?
                            <br /><br />
                            <span className="text-red-600 font-medium">This action cannot be undone.</span> All group data, messages, and member information will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="border-gray-200 text-gray-600 hover:bg-gray-50">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteDialog.groupId) {
                                    onDeleteGroup(deleteDialog.groupId, getGroupName(deleteDialog.groupId))
                                }
                            }}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Group
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}