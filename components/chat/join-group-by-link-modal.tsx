"use client"

import type React from "react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Link, QrCode } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useJoinGroupByLinkMutation } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"

interface JoinGroupByLinkModalProps {
    isOpen: boolean
    onClose: () => void
    onGroupJoined: (group: any) => void
}

const JoinGroupByLinkModal: React.FC<JoinGroupByLinkModalProps> = ({ isOpen, onClose, onGroupJoined }) => {
    const [linkOrQrData, setLinkOrQrData] = useState("")
    const [joinGroupByLink, { isLoading }] = useJoinGroupByLinkMutation()
    const { getToken } = useAuthToken()
    const token = getToken()

    const handleJoin = async () => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to join a group.",
                variant: "destructive",
            })
            return
        }

        if (!linkOrQrData.trim()) {
            toast({
                title: "Input Required",
                description: "Please enter a group link or QR code data.",
                variant: "destructive",
            })
            return
        }

        try {
            // Determine if it's an access token or a full QR code URL
            const requestBody: { accessToken?: string; qrCodeData?: string } = {}


            if (linkOrQrData.includes("token=")) {
                const url = new URL(linkOrQrData)
                const accessToken = url.searchParams.get("token")
                if (accessToken) {
                    requestBody.accessToken = accessToken
                } else {
                    throw new Error("Invalid access token in URL.")
                }
            } else {
                // Assume it's raw QR code data or a full URL that needs parsing by backend
                requestBody.qrCodeData = linkOrQrData
            }
            const result = await joinGroupByLink({ joinData: requestBody, token }).unwrap()

            toast({
                title: "Success",
                description: result.message,
            })
            onGroupJoined(result.data)
            setLinkOrQrData("")
        } catch (error: any) {
            const errorMessage = error?.data?.message || error?.message || "Failed to join group."
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        setLinkOrQrData("")
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Link size={20} className="text-blue-600" />
                        Join Group by Link/QR
                    </DialogTitle>
                    <DialogDescription>Enter the group's access link or QR code data to join.</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div>
                        <label htmlFor="group-link" className="block text-sm font-medium text-gray-700 mb-1">
                            Group Link or QR Code Data
                        </label>
                        <Input
                            id="group-link"
                            placeholder="e.g., https://your-app.com/groups/join?access_token=xyz..."
                            value={linkOrQrData}
                            onChange={(e) => setLinkOrQrData(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Paste the full group access link or the extracted QR code data.
                        </p>
                    </div>

                    {/* Placeholder for QR code scanner if needed in the future */}
                    <div className="flex items-center justify-center text-gray-400 text-sm">
                        <QrCode size={20} className="mr-2" />
                        <span>(QR code scanning feature coming soon)</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleJoin} disabled={isLoading || !linkOrQrData.trim()}>
                        {isLoading ? (
                            <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Joining...
                            </>
                        ) : (
                            "Join Group"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default JoinGroupByLinkModal
