"use client"

import { useState } from "react"
import { QrCode, Copy, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"


interface QRCodeGeneratorProps {
    value: string
    size?: number
    title: string
    description?: string
}

export default function QRCodeGenerator({ value, size = 200, title, description }: QRCodeGeneratorProps) {
    const [copied, setCopied] = useState(false)

    // In a real app, you would use a proper QR code library
    // For this example, we're using a placeholder
    const qrCodeUrl = `/placeholder.svg?height=${size}&width=${size}`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast({
            title: "Link copied to clipboard",
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const downloadQRCode = () => {
        // In a real app, you would generate and download the actual QR code
        toast({
            title: "QR code downloaded",
        })
    }

    const shareQRCode = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: title,
                    text: description || "Scan this QR code",
                    url: value,
                })
                .catch((error) => {
                    throw error;
                })
        } else {
            copyToClipboard()
        }
    }

    return (
        <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4">
                <div className="relative">
                    <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" width={size} height={size} className="rounded-md" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <QrCode size={size / 2} className="text-gray-800 opacity-20" />
                    </div>
                </div>
            </div>

            <div className="text-center mb-4">
                <h3 className="font-medium text-lg">{title}</h3>
                {description && <p className="text-sm text-gray-500">{description}</p>}
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    <Copy size={16} className="mr-1" />
                    {copied ? "Copied!" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadQRCode}>
                    <Download size={16} className="mr-1" />
                    Download
                </Button>
                <Button variant="outline" size="sm" onClick={shareQRCode}>
                    <Share2 size={16} className="mr-1" />
                    Share
                </Button>
            </div>
        </div>
    )
}
