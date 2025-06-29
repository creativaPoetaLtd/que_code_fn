"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Scan, Camera, X, AlertCircle, RotateCcw, Flashlight, Focus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { extractPublicIdFromLink, validatePublicId } from "@/utils/profile-link"

interface QRCodeScannerProps {
    isOpen: boolean
    onClose: () => void
    onScanComplete: (result: string) => void
    title?: string
}

export default function QRCodeScanner({ isOpen, onClose, onScanComplete, title = "Scan QR Code" }: QRCodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false)
    const [cameraActive, setCameraActive] = useState(false)
    const [error, setError] = useState<string>("")
    const [scanResult, setScanResult] = useState<string>("")
    const [extractedPublicId, setExtractedPublicId] = useState<string>("")
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
    const [hasFlash, setHasFlash] = useState(false)
    const [flashOn, setFlashOn] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt")
    const [scanningActive, setScanningActive] = useState(false)
    const [detectedQRPosition, setDetectedQRPosition] = useState<{
        x: number
        y: number
        width: number
        height: number
    } | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // Import QR code scanner dynamically (client-side only)
    const [QrScanner, setQrScanner] = useState<any>(null)

    useEffect(() => {
        // Check if we're on HTTPS or localhost
        const isSecureContext = window.location.protocol === "https:" || window.location.hostname === "localhost"

        if (!isSecureContext) {
            setError("Camera access requires HTTPS. Please use a secure connection.")
            return
        }

        // Dynamically import qr-scanner library
        const loadQrScanner = async () => {
            try {
                const { default: QrScannerLib } = await import("qr-scanner")
                setQrScanner(() => QrScannerLib)

                // Check if QR scanner is supported
                const hasCamera = await QrScannerLib.hasCamera()
                if (!hasCamera) {
                    setError("No camera found on this device")
                }
            } catch (err) {
                console.error("Failed to load QR scanner:", err)
                setError("QR scanner library failed to load")
            }
        }

        if (isOpen) {
            loadQrScanner()
            checkCameraPermission()
        }
    }, [isOpen])

    // Check camera permission status
    const checkCameraPermission = async () => {
        try {
            if ("permissions" in navigator) {
                const permission = await navigator.permissions.query({ name: "camera" as PermissionName })
                setPermissionStatus(permission.state)

                permission.addEventListener("change", () => {
                    setPermissionStatus(permission.state)
                })
            }
        } catch (err) {
            console.log("Permission API not supported")
        }
    }

    // Get camera constraints for mobile devices
    const getCameraConstraints = () => {
        const baseConstraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                aspectRatio: { ideal: 16 / 9 },
            },
        }

        // Add mobile-specific constraints
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            return {
                video: {
                    ...baseConstraints.video,
                    focusMode: "continuous",
                    whiteBalanceMode: "continuous",
                    exposureMode: "continuous",
                },
            }
        }

        return baseConstraints
    }

    // Start camera preview
    const startCameraPreview = async () => {
        if (!QrScanner) {
            setError("QR scanner not loaded yet")
            return
        }

        setError("")
        setScanResult("")
        setExtractedPublicId("")

        try {
            // Stop any existing stream first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop())
            }

            const constraints = getCameraConstraints()
            console.log("Requesting camera with constraints:", constraints)

            const stream = await navigator.mediaDevices.getUserMedia(constraints)
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream

                // Wait for video to be ready
                await new Promise((resolve, reject) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = resolve
                        videoRef.current.onerror = reject
                    }
                })

                await videoRef.current.play()
                setCameraActive(true)

                // Check for flash capability
                const videoTrack = stream.getVideoTracks()[0]
                const capabilities: any = videoTrack.getCapabilities?.()
                setHasFlash(capabilities?.torch === true)

                // Start preview rendering
                startPreviewRendering()

                toast({
                    title: "Camera Started",
                    description: "Camera preview is active. Click 'Start Scanning' to begin QR detection",
                })
            }
        } catch (err: any) {
            console.error("Camera access error:", err)

            let errorMessage = "Unable to access camera"

            if (err.name === "NotAllowedError") {
                errorMessage = "Camera permission denied. Please allow camera access and try again."
                setPermissionStatus("denied")
            } else if (err.name === "NotFoundError") {
                errorMessage = "No camera found on this device"
            } else if (err.name === "NotReadableError") {
                errorMessage = "Camera is already in use by another application"
            } else if (err.name === "OverconstrainedError") {
                errorMessage = "Camera doesn't support the required settings"
            } else if (err.name === "SecurityError") {
                errorMessage = "Camera access blocked by security policy"
            }

            setError(errorMessage)
            setCameraActive(false)

            toast({
                title: "Camera Error",
                description: errorMessage,
                variant: "destructive",
            })
        }
    }

    // Start preview rendering (shows camera feed without scanning)
    const startPreviewRendering = () => {
        if (!videoRef.current || !previewCanvasRef.current) return

        const video = videoRef.current
        const canvas = previewCanvasRef.current
        const context = canvas.getContext("2d")

        if (!context) return

        const renderFrame = () => {
            if (!video.videoWidth || !video.videoHeight || video.paused || video.ended) {
                animationFrameRef.current = requestAnimationFrame(renderFrame)
                return
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight

            // Clear canvas
            context.clearRect(0, 0, canvas.width, canvas.height)

            // Draw video frame
            context.drawImage(video, 0, 0, canvas.width, canvas.height)

            // Draw scanning overlay if scanning is active
            if (scanningActive) {
                drawScanningOverlay(context, canvas.width, canvas.height)
            }

            // Draw detected QR code outline if found
            if (detectedQRPosition) {
                drawQROutline(context, detectedQRPosition)
            }

            animationFrameRef.current = requestAnimationFrame(renderFrame)
        }

        renderFrame()
    }

    // Draw scanning overlay
    const drawScanningOverlay = (context: CanvasRenderingContext2D, width: number, height: number) => {
        // Semi-transparent overlay
        context.fillStyle = "rgba(0, 0, 0, 0.3)"
        context.fillRect(0, 0, width, height)

        // Clear center scanning area
        const centerX = width / 2
        const centerY = height / 2
        const scanSize = Math.min(width, height) * 0.6

        context.globalCompositeOperation = "destination-out"
        context.fillRect(centerX - scanSize / 2, centerY - scanSize / 2, scanSize, scanSize)
        context.globalCompositeOperation = "source-over"

        // Draw scanning frame
        context.strokeStyle = "#3B82F6"
        context.lineWidth = 3
        context.strokeRect(centerX - scanSize / 2, centerY - scanSize / 2, scanSize, scanSize)

        // Draw corner markers
        const cornerSize = 20
        const corners = [
            { x: centerX - scanSize / 2, y: centerY - scanSize / 2 }, // Top-left
            { x: centerX + scanSize / 2, y: centerY - scanSize / 2 }, // Top-right
            { x: centerX - scanSize / 2, y: centerY + scanSize / 2 }, // Bottom-left
            { x: centerX + scanSize / 2, y: centerY + scanSize / 2 }, // Bottom-right
        ]

        context.strokeStyle = "#3B82F6"
        context.lineWidth = 4

        corners.forEach((corner, index) => {
            context.beginPath()
            if (index === 0) {
                // Top-left
                context.moveTo(corner.x, corner.y + cornerSize)
                context.lineTo(corner.x, corner.y)
                context.lineTo(corner.x + cornerSize, corner.y)
            } else if (index === 1) {
                // Top-right
                context.moveTo(corner.x - cornerSize, corner.y)
                context.lineTo(corner.x, corner.y)
                context.lineTo(corner.x, corner.y + cornerSize)
            } else if (index === 2) {
                // Bottom-left
                context.moveTo(corner.x, corner.y - cornerSize)
                context.lineTo(corner.x, corner.y)
                context.lineTo(corner.x + cornerSize, corner.y)
            } else {
                // Bottom-right
                context.moveTo(corner.x - cornerSize, corner.y)
                context.lineTo(corner.x, corner.y)
                context.lineTo(corner.x, corner.y - cornerSize)
            }
            context.stroke()
        })

        // Animated scanning line
        const time = Date.now() / 1000
        const lineY = centerY - scanSize / 2 + ((time % 2) / 2) * scanSize
        context.strokeStyle = "#3B82F6"
        context.lineWidth = 2
        context.setLineDash([5, 5])
        context.beginPath()
        context.moveTo(centerX - scanSize / 2, lineY)
        context.lineTo(centerX + scanSize / 2, lineY)
        context.stroke()
        context.setLineDash([])
    }

    // Draw QR code outline
    const drawQROutline = (
        context: CanvasRenderingContext2D,
        position: { x: number; y: number; width: number; height: number },
    ) => {
        context.strokeStyle = "#10B981"
        context.lineWidth = 3
        context.strokeRect(position.x, position.y, position.width, position.height)

        // Draw success indicator
        context.fillStyle = "rgba(16, 185, 129, 0.2)"
        context.fillRect(position.x, position.y, position.width, position.height)
    }

    // Start QR code scanning
    const startScanning = () => {
        if (!cameraActive) {
            startCameraPreview()
            return
        }

        setScanningActive(true)
        setIsScanning(true)
        startQRDetection()

        toast({
            title: "Scanning Started",
            description: "Point your camera at a QR code",
        })
    }

    // Stop scanning but keep preview
    const stopScanning = () => {
        setScanningActive(false)
        setIsScanning(false)
        setDetectedQRPosition(null)

        // Clear scan interval
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }

        toast({
            title: "Scanning Stopped",
            description: "Camera preview is still active",
        })
    }

    // Toggle camera (front/back)
    const toggleCamera = async () => {
        const newFacingMode = facingMode === "environment" ? "user" : "environment"
        setFacingMode(newFacingMode)

        if (cameraActive) {
            stopCamera()
            // Small delay to ensure cleanup
            setTimeout(() => {
                startCameraPreview()
            }, 100)
        }
    }

    // Toggle flashlight
    const toggleFlash = async () => {
        if (!streamRef.current) return

        try {
            const videoTrack = streamRef.current.getVideoTracks()[0]
            const capabilities: any = videoTrack.getCapabilities?.()

            if (capabilities?.torch) {
                await videoTrack.applyConstraints({
                    advanced: [{ torch: !flashOn } as any],
                })
                setFlashOn(!flashOn)
            }
        } catch (err) {
            console.error("Flash toggle error:", err)
            toast({
                title: "Flash Error",
                description: "Unable to control flashlight",
                variant: "destructive",
            })
        }
    }

    // QR code detection using canvas
    const startQRDetection = () => {
        if (!videoRef.current || !canvasRef.current || !QrScanner) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext("2d")

        if (!context) return

        const detectQR = async () => {
            if (!video.videoWidth || !video.videoHeight || video.paused || video.ended || !scanningActive) return

            try {
                // Set canvas size to match video
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight

                // Draw video frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height)

                // Scan for QR code in the canvas
                const result = await QrScanner.scanImage(canvas, {
                    returnDetailedScanResult: true,
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                })

                if (result && result.data) {
                    // Set detected QR position for visual feedback
                    if (result.cornerPoints) {
                        const minX = Math.min(...result.cornerPoints.map((p: any) => p.x))
                        const minY = Math.min(...result.cornerPoints.map((p: any) => p.y))
                        const maxX = Math.max(...result.cornerPoints.map((p: any) => p.x))
                        const maxY = Math.max(...result.cornerPoints.map((p: any) => p.y))

                        setDetectedQRPosition({
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY,
                        })
                    }

                    handleScanSuccess(result.data)
                    return
                } else {
                    setDetectedQRPosition(null)
                }
            } catch (err) {
                // No QR code found in this frame, continue scanning
                setDetectedQRPosition(null)
            }
        }

        // Scan every 150ms for better performance on mobile
        scanIntervalRef.current = setInterval(detectQR, 150)
    }

    // Handle successful QR scan
    const handleScanSuccess = (scannedData: string) => {
        console.log("QR Code scanned:", scannedData)

        setScanResult(scannedData)

        // Try to extract publicId from the scanned data
        const publicId = extractPublicIdFromLink(scannedData)

        if (publicId && validatePublicId(publicId)) {
            setExtractedPublicId(publicId)

            toast({
                title: "QR Code Scanned Successfully",
                description: `Found profile: ${publicId}`,
            })

            // Stop scanning but keep preview
            stopScanning()

            // Call the completion handler with the original scanned data
            onScanComplete(scannedData)

            // Close the modal after a short delay
            setTimeout(() => {
                handleClose()
            }, 1500)
        } else {
            // Invalid QR code format
            setError("This QR code doesn't contain a valid profile link")
            toast({
                title: "Invalid QR Code",
                description: "This QR code doesn't contain a valid profile link",
                variant: "destructive",
            })

            // Continue scanning for a valid code
            setTimeout(() => {
                setError("")
            }, 3000)
        }
    }

    // Stop camera completely
    const stopCamera = () => {
        setScanningActive(false)
        setIsScanning(false)
        setCameraActive(false)
        setFlashOn(false)
        setDetectedQRPosition(null)

        // Clear intervals and animation frames
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
        }

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
        }

        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }

    // Handle dialog close
    const handleClose = () => {
        stopCamera()
        setError("")
        setScanResult("")
        setExtractedPublicId("")
        onClose()
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera()
        }
    }, [])

    // Request permission explicitly
    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            stream.getTracks().forEach((track) => track.stop())
            setPermissionStatus("granted")
            toast({
                title: "Permission Granted",
                description: "Camera access has been granted",
            })
        } catch (err) {
            setPermissionStatus("denied")
            toast({
                title: "Permission Denied",
                description: "Please allow camera access in your browser settings",
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center">
                            <Scan size={20} className="mr-2" />
                            {title}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={handleClose}>
                            <X size={16} />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex flex-col items-center py-4">
                    {/* Camera Preview */}
                    <div className="w-80 h-80 bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden border-2 border-dashed border-gray-300">
                        {cameraActive ? (
                            <>
                                {/* Hidden video element */}
                                <video
                                    ref={videoRef}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{
                                        transform: facingMode === "user" ? "scaleX(-1)" : "none",
                                        opacity: 0, // Hide the video element, show canvas instead
                                    }}
                                />

                                {/* Preview canvas - this shows the camera feed with overlays */}
                                <canvas
                                    ref={previewCanvasRef}
                                    className="w-full h-full object-cover rounded-lg"
                                    style={{
                                        transform: facingMode === "user" ? "scaleX(-1)" : "none",
                                    }}
                                />

                                {/* Camera controls */}
                                <div className="absolute bottom-2 right-2 flex gap-1">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        className="h-8 w-8 bg-black/50 hover:bg-black/70"
                                        onClick={toggleCamera}
                                    >
                                        <RotateCcw size={14} className="text-white" />
                                    </Button>
                                    {hasFlash && (
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            className={`h-8 w-8 ${flashOn ? "bg-yellow-500 hover:bg-yellow-600" : "bg-black/50 hover:bg-black/70"}`}
                                            onClick={toggleFlash}
                                        >
                                            <Flashlight size={14} className="text-white" />
                                        </Button>
                                    )}
                                </div>

                                {/* Scanning status indicator */}
                                {scanningActive && (
                                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs flex items-center">
                                        <Focus size={12} className="mr-1 animate-pulse" />
                                        Scanning...
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center w-full">
                                <Camera size={48} className="mx-auto mb-2 text-gray-400" />
                                <p className="text-gray-500 text-sm px-4">Click "Start Preview" to activate camera</p>
                            </div>
                        )}
                    </div>

                    {/* Hidden canvas for QR detection */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center text-red-600 text-sm mb-4 p-2 bg-red-50 rounded-lg w-full">
                            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                            <span className="text-xs">{error}</span>
                        </div>
                    )}

                    {/* Permission Request */}
                    {permissionStatus === "denied" && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 w-full">
                            <p className="text-sm text-yellow-800 mb-2">Camera permission is required to scan QR codes.</p>
                            <Button onClick={requestCameraPermission} size="sm" variant="outline">
                                Request Permission
                            </Button>
                        </div>
                    )}

                    {/* Scan Result */}
                    {scanResult && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200 w-full">
                            <p className="text-sm text-green-800 font-medium mb-1">Scanned Successfully!</p>
                            {extractedPublicId && <p className="text-xs text-green-600">Public ID: {extractedPublicId}</p>}
                            <p className="text-xs text-gray-600 break-all">{scanResult}</p>
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-3 flex-wrap justify-center">
                        {!cameraActive ? (
                            <Button
                                onClick={startCameraPreview}
                                disabled={!QrScanner || permissionStatus === "denied"}
                                className="flex items-center"
                            >
                                <Camera size={16} className="mr-2" />
                                {QrScanner ? "Start Preview" : "Loading..."}
                            </Button>
                        ) : (
                            <>
                                {!scanningActive ? (
                                    <Button onClick={startScanning} className="flex items-center">
                                        <Scan size={16} className="mr-2" />
                                        Start Scanning
                                    </Button>
                                ) : (
                                    <Button onClick={stopScanning} variant="outline" className="flex items-center bg-transparent">
                                        <X size={16} className="mr-2" />
                                        Stop Scanning
                                    </Button>
                                )}
                                <Button onClick={stopCamera} variant="outline" className="flex items-center bg-transparent">
                                    <Camera size={16} className="mr-2" />
                                    Stop Camera
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Instructions */}
                    <div className="mt-4 text-center">
                        {!cameraActive ? (
                            <p className="text-xs text-gray-500">Start the camera preview to see the live feed</p>
                        ) : !scanningActive ? (
                            <p className="text-xs text-gray-500">
                                Camera preview is active. Click "Start Scanning" to detect QR codes
                            </p>
                        ) : (
                            <>
                                <p className="text-xs text-gray-500">Point your camera at a QR code containing a profile link</p>
                                <p className="text-xs text-gray-400 mt-1">Make sure the QR code is well-lit and clearly visible</p>
                            </>
                        )}
                        {facingMode === "environment" && cameraActive && (
                            <p className="text-xs text-gray-400 mt-1">Using back camera - tap rotate to switch</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
