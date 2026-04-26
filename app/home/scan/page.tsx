"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import { Header } from "@/components/Header"
import { BackButton } from "@/components/shared/BackButton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useSidebar } from "@/context/SidebarContext"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ScanLine, Camera, FlipHorizontal, Loader2, AlertCircle, QrCode } from "lucide-react"

export default function ScanQRPage() {
    const router = useRouter()
    const { isExpanded } = useSidebar()

    const [QrScanner, setQrScanner] = useState<any>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [scanning, setScanning] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
    const [loading, setLoading] = useState(false)

    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Load qr-scanner library dynamically (SSR safe)
    useEffect(() => {
        const load = async () => {
            try {
                const { default: lib } = await import("qr-scanner")
                setQrScanner(() => lib)
            } catch {
                setError("QR scanner failed to load")
            }
        }
        load()

        return () => stopCamera()
    }, [])

    const stopCamera = useCallback(() => {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setCameraActive(false)
        setScanning(false)
    }, [])

    const handleScanResult = useCallback((rawText: string) => {
        stopCamera()
        try {
            // Support both absolute URLs and relative paths encoded in QR
            let url: URL
            try {
                url = new URL(rawText)
            } catch {
                // Try prepending origin for relative paths
                url = new URL(rawText, window.location.origin)
            }

            const requestId = url.searchParams.get("requestId")
            if (requestId) {
                toast({ title: "QR scanned", description: "Loading payment request..." })
                router.push(`/home/transfer/amount?requestId=${requestId}`)
                return
            }

            // Not a payment QR — show raw value
            toast({
                title: "QR code scanned",
                description: "This QR code is not a payment request.",
                variant: "destructive",
            })
            setError(`Scanned: ${rawText.slice(0, 80)}`)
        } catch {
            toast({
                title: "Invalid QR code",
                description: "Could not read this QR code as a payment request.",
                variant: "destructive",
            })
            setError(`Scanned: ${rawText.slice(0, 80)}`)
        }
    }, [router, stopCamera])

    const startCamera = useCallback(async () => {
        if (!QrScanner) {
            setError("QR scanner not ready yet")
            return
        }
        setError(null)
        setLoading(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
            })
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            setCameraActive(true)
            setScanning(true)

            // Poll with qr-scanner every 300ms
            scanIntervalRef.current = setInterval(async () => {
                if (!videoRef.current || !QrScanner) return
                try {
                    const result = await QrScanner.scanImage(videoRef.current, { returnDetailedScanResult: true })
                    if (result?.data) {
                        clearInterval(scanIntervalRef.current!)
                        handleScanResult(result.data)
                    }
                } catch {
                    // No QR found in frame — keep scanning
                }
            }, 300)
        } catch (err: any) {
            const msg =
                err.name === "NotAllowedError"
                    ? "Camera access denied. Please allow camera access."
                    : err.name === "NotFoundError"
                    ? "No camera found on this device."
                    : "Could not start camera."
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [QrScanner, facingMode, handleScanResult])

    const flipCamera = useCallback(() => {
        stopCamera()
        setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
    }, [stopCamera])

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-transparent">
            <Navigation />
            <main
                className={cn(
                    "flex-1 transition-all duration-300 pb-24 lg:pb-8",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}
            >
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <Header />
                </div>

                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="max-w-lg mx-auto">
                        <BackButton className="mb-4" />
                        <Card className="p-4 sm:p-6 bg-white dark:bg-darkBg-card border-gray-100 dark:border-darkBorder-light">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full">
                                    <QrCode size={20} className="text-brand-green dark:text-brand-gold" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Scan QR Code</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Scan a payment request QR to pay instantly</p>
                                </div>
                            </div>

                            {/* Camera viewport */}
                            <div className="relative bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: "1 / 1" }}>
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    muted
                                    playsInline
                                    autoPlay
                                />

                                {!cameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900">
                                        <Camera size={48} className="text-gray-500" />
                                        <p className="text-gray-400 text-sm">Camera is off</p>
                                    </div>
                                )}

                                {scanning && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Corner brackets */}
                                        <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-brand-green dark:border-brand-gold rounded-tl-lg" />
                                        <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-brand-green dark:border-brand-gold rounded-tr-lg" />
                                        <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-brand-green dark:border-brand-gold rounded-bl-lg" />
                                        <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-brand-green dark:border-brand-gold rounded-br-lg" />
                                        {/* Scan line animation */}
                                        <div className="absolute left-8 right-8 h-0.5 bg-brand-green dark:bg-brand-gold opacity-80 animate-scan-line" style={{ top: "50%" }} />
                                        <ScanLine className="absolute bottom-3 right-3 text-brand-green/60 dark:text-brand-gold/60" size={16} />
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20 mb-4">
                                    <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {cameraActive ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={stopCamera}
                                            className="flex-1 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                                        >
                                            Stop Camera
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={flipCamera}
                                            className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                                            title="Flip camera"
                                        >
                                            <FlipHorizontal size={18} />
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={startCamera}
                                        disabled={loading || !QrScanner}
                                        className="flex-1 bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 size={16} className="mr-2 animate-spin" />
                                                Starting camera...
                                            </>
                                        ) : (
                                            <>
                                                <Camera size={16} className="mr-2" />
                                                Start Camera
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>

                            <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                                Point your camera at a payment request QR code to pay instantly
                            </p>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
