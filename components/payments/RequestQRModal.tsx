"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { QrCode, Copy, Download, Share2, Loader2, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getPaymentRequestQR } from "@/helpers/api"

interface RequestQRModalProps {
    isOpen: boolean
    onClose: () => void
    requestId: string
}

interface QRData {
    qrCode: string
    deepLink: string
    amount: number
    currency: string
    note: string | null
    senderName: string
    allowEditAmount: boolean
}

export default function RequestQRModal({ isOpen, onClose, requestId }: RequestQRModalProps) {
    const [qrData, setQrData] = useState<QRData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const fetchQR = useCallback(async () => {
        if (!requestId) return
        setLoading(true)
        setError(null)
        try {
            const res: any = await getPaymentRequestQR(requestId)
            const payload = res?.data ?? res
            if (payload?.success && payload.data) {
                setQrData(payload.data)
            } else {
                setError(payload?.message || "Failed to generate QR code")
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to generate QR code")
        } finally {
            setLoading(false)
        }
    }, [requestId])

    useEffect(() => {
        if (isOpen && requestId) {
            fetchQR()
        } else {
            setQrData(null)
            setError(null)
        }
    }, [isOpen, requestId, fetchQR])

    const handleCopyLink = async () => {
        if (!qrData?.deepLink) return
        await navigator.clipboard.writeText(qrData.deepLink)
        setCopied(true)
        toast({ title: "Link copied to clipboard" })
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownload = () => {
        if (!qrData?.qrCode) return
        const link = document.createElement("a")
        link.href = qrData.qrCode
        link.download = `payment-request-${requestId}.png`
        link.click()
        toast({ title: "QR code downloaded" })
    }

    const handleShare = async () => {
        if (!qrData) return
        const shareText = `Pay me ${qrData.currency} ${Number(qrData.amount).toLocaleString()}${qrData.note ? ` — ${qrData.note}` : ""}`
        if (navigator.share) {
            try {
                await navigator.share({ title: "Payment Request", text: shareText, url: qrData.deepLink })
            } catch {
                handleCopyLink()
            }
        } else {
            handleCopyLink()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm dark:bg-darkBg-card dark:border-darkBorder-light">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full">
                            <QrCode size={20} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <div>
                            <DialogTitle className="text-gray-900 dark:text-white text-lg font-semibold">
                                Share QR Code
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs">
                                Anyone who scans this will be taken directly to pay you
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center py-2">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 py-10">
                            <Loader2 className="animate-spin text-brand-green dark:text-brand-gold" size={28} />
                            <p className="text-sm text-gray-500">Generating QR code...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="flex flex-col items-center gap-3 py-8 text-center">
                            <AlertCircle className="text-red-500" size={28} />
                            <p className="text-sm text-red-500">{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchQR}>Try again</Button>
                        </div>
                    )}

                    {qrData && !loading && (
                        <>
                            <div className="bg-white p-4 rounded-2xl shadow-md mb-4 border border-gray-100">
                                <img
                                    src={qrData.qrCode}
                                    alt="Payment request QR code"
                                    width={220}
                                    height={220}
                                    className="rounded-lg"
                                />
                            </div>

                            <div className="text-center mb-4 space-y-0.5">
                                <p className="text-base font-semibold text-gray-900 dark:text-white">
                                    {qrData.currency} {Number(qrData.amount).toLocaleString()}
                                </p>
                                {qrData.note && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{qrData.note}</p>
                                )}
                                {qrData.allowEditAmount && (
                                    <p className="text-xs text-blue-500 dark:text-blue-400">Payer can adjust the amount</p>
                                )}
                            </div>

                            <div className="flex gap-2 w-full">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                                    onClick={handleCopyLink}
                                >
                                    <Copy size={14} className="mr-1.5" />
                                    {copied ? "Copied!" : "Copy Link"}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                                    onClick={handleDownload}
                                >
                                    <Download size={14} className="mr-1.5" />
                                    Save
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                    onClick={handleShare}
                                >
                                    <Share2 size={14} className="mr-1.5" />
                                    Share
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
