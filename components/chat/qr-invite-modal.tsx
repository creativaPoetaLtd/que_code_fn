"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Input from "../ui/Input-ant"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UserPlus, QrCode, Link, Loader2, CheckCircle, AlertCircle, Camera, Scan } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import QRCodeScanner from "./qr-code-scanner"
import { useSendContactInvitationByPublicIdMutation } from "@/states/contactSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import { extractPublicIdFromLink, validatePublicId } from "@/utils/profile-link"

interface QRInviteModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function QRInviteModal({ isOpen, onClose }: QRInviteModalProps) {
    const [profileLink, setProfileLink] = useState<string>("")
    const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false)
    const [extractedPublicId, setExtractedPublicId] = useState<string>("")
    const [step, setStep] = useState<"input" | "scanning" | "success">("input")
    const [inviteeName, setInviteeName] = useState<string>("")

    // Redux hooks
    const [sendInvitationByPublicId, { isLoading: isInviting }] = useSendContactInvitationByPublicIdMutation()
    const { getToken } = useAuthToken()
    const token = getToken()

    const handleProfileLinkSubmit = () => {
        if (!profileLink.trim()) {
            toast({
                title: "Error",
                description: "Please enter a profile link or scan a QR code",
                variant: "destructive",
            })
            return
        }

        const publicId = extractPublicIdFromLink(profileLink.trim())

        if (!publicId || !validatePublicId(publicId)) {
            toast({
                title: "Invalid Link",
                description: "Please enter a valid profile link or public ID",
                variant: "destructive",
            })
            return
        }

        setExtractedPublicId(publicId)
        handleInviteByPublicId(publicId)
    }

    const handleInviteByPublicId = async (publicId: string) => {
        if (!token) {
            toast({
                title: "Authentication Error",
                description: "Please log in to send invitations",
                variant: "destructive",
            })
            return
        }

        try {
            const result = await sendInvitationByPublicId({
                publicId,
                token,
            }).unwrap()

            setInviteeName(result.data.inviteeName)
            setStep("success")

            toast({
                title: "Invitation Sent Successfully",
                description: `Contact invitation sent to ${result.data.inviteeName}`,
            })

            // Auto close after 3 seconds
            setTimeout(() => {
                handleClose()
            }, 3000)
        } catch (error: any) {
            console.error("Invitation error:", error)

            const errorMessage = error?.data?.message || error?.message || "Failed to send invitation"

            toast({
                title: "Invitation Failed",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    const handleClose = () => {
        // Reset state when closing
        setProfileLink("")
        setExtractedPublicId("")
        setStep("input")
        setInviteeName("")
        onClose()
    }

    const handleScanComplete = (result: string) => {
        setIsQRScannerOpen(false)

        // The QR code should contain a profile link
        const publicId = extractPublicIdFromLink(result)

        if (!publicId || !validatePublicId(publicId)) {
            toast({
                title: "Invalid QR Code",
                description: "The scanned QR code does not contain a valid profile link",
                variant: "destructive",
            })
            return
        }

        setExtractedPublicId(publicId)
        setProfileLink(result)
        setStep("scanning")

        // Automatically send invitation
        handleInviteByPublicId(publicId)
    }

    const renderContent = () => {
        switch (step) {
            case "input":
                return (
                    <div className="py-4">
                        {/* Profile Link Input Section */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                <div className="flex items-center">
                                    <Link size={16} className="mr-2 text-blue-600" />
                                    <span>Profile Link or Public ID</span>
                                </div>
                            </label>
                            <div className="space-y-3">
                                <Input
                                    placeholder="Enter profile link (e.g., http://localhost:3000/welcome/41317198-27e2-4c65-bbd8-97a92b6b665c)"
                                    value={profileLink}
                                    onChange={(e) => setProfileLink(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleProfileLinkSubmit()}
                                    className="w-full"
                                />
                                <Button
                                    onClick={handleProfileLinkSubmit}
                                    disabled={isInviting || !profileLink.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    {isInviting ? (
                                        <>
                                            <Loader2 size={16} className="mr-2 animate-spin" />
                                            Sending Invitation...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus size={16} className="mr-2" />
                                            Send Invitation
                                        </>
                                    )}
                                </Button>
                            </div>
                            {extractedPublicId && (
                                <p className="text-xs text-green-600 mt-2 flex items-center">
                                    <CheckCircle size={12} className="mr-1" />
                                    Extracted ID: {extractedPublicId.substring(0, 8)}...
                                </p>
                            )}
                        </div>

                        <Separator className="my-6" />

                        {/* QR Code Scanner Section */}
                        <div className="text-center">
                            <div className="mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <QrCode size={24} className="text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Scan QR Code</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Point your camera at someone's profile QR code to instantly send a contact invitation
                                </p>
                            </div>
                            <Button 
                                onClick={() => setIsQRScannerOpen(true)} 
                                variant="outline" 
                                disabled={isInviting}
                                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                                <Camera size={16} className="mr-2" />
                                Open Camera Scanner
                            </Button>
                        </div>
                    </div>
                )

            case "scanning":
                return (
                    <div className="py-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Loader2 size={24} className="text-blue-600 animate-spin" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing QR Code</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Sending contact invitation...
                            </p>
                            {extractedPublicId && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-full inline-block">
                                    Contact ID: {extractedPublicId.substring(0, 8)}...
                                </p>
                            )}
                        </div>
                    </div>
                )

            case "success":
                return (
                    <div className="py-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Invitation Sent!</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Contact invitation successfully sent to{" "}
                                <span className="font-medium text-gray-800">{inviteeName}</span>
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-green-800">
                                    They will receive a notification and can accept or decline your invitation. 
                                    You'll be notified once they respond.
                                </p>
                            </div>
                            <Button 
                                onClick={handleClose}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle size={16} className="mr-2" />
                                Done
                            </Button>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center">
                            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-full mr-3">
                                <UserPlus size={20} className="text-blue-600" />
                            </div>
                            <DialogTitle className="text-xl font-semibold text-gray-800">
                                {step === "success" ? "Invitation Sent" : "Add Contact via QR Code"}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    {renderContent()}

                    {step === "input" && (
                        <DialogFooter>
                            <Button 
                                variant="outline" 
                                onClick={handleClose} 
                                disabled={isInviting}
                                className="border-gray-300"
                            >
                                Cancel
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            {/* QR Code Scanner Modal */}
            <QRCodeScanner
                isOpen={isQRScannerOpen}
                onClose={() => setIsQRScannerOpen(false)}
                onScanComplete={handleScanComplete}
                title="Scan Contact QR Code"
            />
        </>
    )
}