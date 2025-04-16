"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Input from "../ui/Input-ant"
import { Scan, Link2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface QRCodeScannerProps {
    isOpen: boolean
    onClose: () => void
    onScanComplete: (result: string) => void
    title?: string
}

export default function QRCodeScanner({ isOpen, onClose, onScanComplete, title = "Scan QR Code" }: QRCodeScannerProps) {
    const [activeTab, setActiveTab] = useState("scan")
    const [link, setLink] = useState("")
    const [isScanning, setIsScanning] = useState(false)

    const handleScan = () => {
        // In a real app, this would use the device camera to scan a QR code
        // For this example, we'll simulate a scan after a delay
        setIsScanning(true)
        setTimeout(() => {
            setIsScanning(false)
            // Simulate a successful scan with a dummy result
            const dummyResult = "user:12345" // This could be a user ID or group ID
            onScanComplete(dummyResult)
            toast({
                title: "QR code scanned successfully",
            })
            onClose()
        }, 2000)
    }

    const handleLinkSubmit = () => {
        if (!link) {
            toast({
                title: "Please enter a valid link",
                variant: "destructive",
            })
            return
        }

        // Process the link - in a real app, you would validate the link format
        onScanComplete(link)
        toast({
            title: "Link processed successfully",
        })
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="scan" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="scan">Scan QR Code</TabsTrigger>
                        <TabsTrigger value="link">Enter Link</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scan" className="flex flex-col items-center py-4">
                        {isScanning ? (
                            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="animate-pulse text-center">
                                    <Scan size={48} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-500">Scanning...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <div className="text-center">
                                    <Scan size={48} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-500">Camera preview will appear here</p>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleScan} disabled={isScanning}>
                            {isScanning ? "Scanning..." : "Start Scanning"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="link" className="py-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <div className="flex items-center">
                                        <Link2 size={16} className="mr-2" />
                                        <span>Enter invitation link</span>
                                    </div>
                                </label>
                                <Input
                                    placeholder="Paste link here (e.g., https://app.com/invite/abc123)"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleLinkSubmit} className="w-full">
                                Process Link
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
