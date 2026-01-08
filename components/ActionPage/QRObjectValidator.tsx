"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Scan, CheckCircle2, XCircle, Loader2, Camera, X, Upload, FileText, ExternalLink, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import baseUrl from "@/helpers/baseUrl";
import { useAuthToken } from "@/hooks/use-auth-token";

interface QRObjectValidatorProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
}

interface QRObjectValidationResult {
    id: string;
    type: string;
    status: string;
    buyerId?: string;
    buyer?: {
        id?: string;
        fullName?: string;
        name?: string;
        email?: string;
        [key: string]: any;
    };
    metadata?: {
        actionName?: string;
        subActionName?: string;
        quantity?: number;
        seatType?: string;
        benefits?: string[];
        buyerName?: string;
        ownerName?: string;
        [key: string]: any;
    };
    issuedAt?: string;
    validUntil?: string;
    usedAt?: string | null;
}

export default function QRObjectValidator({ isOpen, onClose, organizationId }: QRObjectValidatorProps) {
    const router = useRouter();
    const { getToken, getUserId } = useAuthToken();
    const [isScanning, setIsScanning] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [error, setError] = useState<string>("");
    const [scanResult, setScanResult] = useState<string>("");
    const [validating, setValidating] = useState(false);
    const [markingAsUsed, setMarkingAsUsed] = useState(false);
    const [validationResult, setValidationResult] = useState<QRObjectValidationResult | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [uploadingPDF, setUploadingPDF] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const processingRef = useRef<boolean>(false);
    const [QrScanner, setQrScanner] = useState<any>(null);

    useEffect(() => {
        const isSecureContext = window.location.protocol === "https:" || window.location.hostname === "localhost";

        if (!isSecureContext) {
            setError("Camera access requires HTTPS. Please use a secure connection.");
            return;
        }

        const loadQrScanner = async () => {
            try {
                const { default: QrScannerLib } = await import("qr-scanner");
                setQrScanner(() => QrScannerLib);

                const hasCamera = await QrScannerLib.hasCamera();
                if (!hasCamera) {
                    setError("No camera found on this device");
                }
            } catch (err) {
                setError("QR scanner library failed to load");
            }
        };

        if (isOpen) {
            loadQrScanner();
        }

        return () => {
            stopCamera();
        };
    }, [isOpen]);


    const startCamera = async (useFacingMode?: "user" | "environment") => {
        try {
            setError("");
            // Stop existing camera if any
            stopCamera();
            
            const currentFacingMode = useFacingMode || facingMode;
            const constraints = {
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                // Set camera active first so video element is rendered
                setCameraActive(true);
                
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.setAttribute('autoplay', 'true');
                // Apply mirror effect for front camera
                if (currentFacingMode === "user") {
                    videoRef.current.style.transform = "scaleX(-1)";
                } else {
                    videoRef.current.style.transform = "none";
                }
                
                // Wait for video to be ready
                const playVideo = async () => {
                    try {
                        await videoRef.current?.play();
                        setIsScanning(true);
                        // Wait a bit for video to start before starting QR detection
                        setTimeout(() => {
                            startQRDetection();
                        }, 500);
                    } catch (err) {
                        console.error("Video play error:", err);
                        setError("Failed to start video preview");
                    }
                };
                
                if (videoRef.current.readyState >= 2) {
                    // Video metadata already loaded
                    playVideo();
                } else {
                    // Wait for metadata to load
                    videoRef.current.onloadedmetadata = playVideo;
                }
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            setError(err.message || "Failed to access camera");
            setCameraActive(false);
            setIsScanning(false);
        }
    };

    const stopCamera = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
        setIsScanning(false);
        processingRef.current = false;
    };

    const startQRDetection = () => {
        if (!QrScanner || !videoRef.current || !canvasRef.current) return;

        const scan = async () => {
            if (!videoRef.current || !canvasRef.current || processingRef.current) return;

            try {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                
                if (!ctx) return;
                
                // Set canvas size to match video
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                
                // Draw current video frame to canvas
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                
                // Convert canvas to image data URL
                const imageData = canvas.toDataURL("image/png");
                
                // Create image element
                const img = new Image();
                img.src = imageData;
                
                // Wait for image to load
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    setTimeout(reject, 1000);
                });

                // Try scanning image element first (like PDF method)
                try {
                    const result = await QrScanner.scanImage(img);
                    if (result) {
                        processingRef.current = true;
                        stopCamera();
                        await processScannedResult(result);
                        return;
                    }
                } catch (err) {
                    // Try scanning data URL
                    try {
                        const result = await QrScanner.scanImage(imageData);
                        if (result) {
                            processingRef.current = true;
                            stopCamera();
                            await processScannedResult(result);
                            return;
                        }
                    } catch (err2) {
                        // Try canvas directly
                        try {
                            const result = await QrScanner.scanImage(canvas);
                            if (result) {
                                processingRef.current = true;
                                stopCamera();
                                await processScannedResult(result);
                                return;
                            }
                        } catch (err3) {
                            // No QR code found, continue scanning
                        }
                    }
                }
            } catch (err) {
                // Silently continue scanning on error
            }
        };

        scanIntervalRef.current = setInterval(scan, 500);
    };

    // State for external URL detection
    const [externalUrl, setExternalUrl] = useState<string | null>(null);

    // UUID regex pattern for QR object IDs
    const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Helper function to check if a string is a valid UUID
    const isValidUUID = (str: string): boolean => {
        return UUID_PATTERN.test(str.trim());
    };

    // Helper function to check if string is a valid URL
    const isValidUrl = (str: string): boolean => {
        try {
            const url = new URL(str);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    };

    // Paths that contain QR object IDs (tickets)
    const QR_OBJECT_PATHS = ['/action/', '/qr-objects/', '/ticket/', '/qr/'];
    
    // Helper function to check if URL is a QR object/ticket URL
    const isQRObjectUrl = (url: string): boolean => {
        try {
            const parsedUrl = new URL(url);
            const path = parsedUrl.pathname.toLowerCase();
            return QR_OBJECT_PATHS.some(p => path.includes(p));
        } catch {
            return false;
        }
    };

    // Helper function to extract ID from scanned data (URL or direct ID)
    const extractQRObjectId = (scannedData: string): string | null => {
        let id = scannedData.trim();
        
        // Remove any whitespace
        id = id.replace(/\s+/g, '');
        
        // If it's already a valid UUID (raw ID, not a URL), return it
        if (isValidUUID(id)) {
            return id;
        }
        
        // Check if it's a URL
        try {
            const url = new URL(id);
            // Extract ID from URL path (last segment)
            const pathParts = url.pathname.split("/").filter(p => p && p.length > 0);
            if (pathParts.length > 0) {
                const lastSegment = pathParts[pathParts.length - 1].split('?')[0].split('#')[0].trim();
                if (isValidUUID(lastSegment)) {
                    return lastSegment;
                }
            }
        } catch {
            // Not a full URL, might be a relative path or just an ID
            if (id.includes('/')) {
                const parts = id.split('/').filter(p => p && p.length > 0);
                if (parts.length > 0) {
                    const lastPart = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
                    if (isValidUUID(lastPart)) {
                        return lastPart;
                    }
                }
            }
        }
        
        // No valid UUID found
        return null;
    };

    // Reusable function to process scanned QR data (for both camera and PDF scanning)
    const processScannedResult = async (scannedData: string): Promise<boolean> => {
        setScanResult(scannedData);
        setExternalUrl(null);

        // Check if it's a URL first
        if (isValidUrl(scannedData)) {
            // Check if this URL is specifically for QR objects/tickets
            if (isQRObjectUrl(scannedData)) {
                // This is a ticket/action URL - extract and validate
                const extractedId = extractQRObjectId(scannedData);
                if (extractedId) {
                    await validateQRObject(extractedId);
                    return true;
                }
            }
            
            // Check if this is a /welcome/ URL from our app
            try {
                const parsedUrl = new URL(scannedData);
                const path = parsedUrl.pathname.toLowerCase();
                
                if (path.includes('/welcome/')) {
                    // Extract userId from /welcome/userId path
                    const pathParts = parsedUrl.pathname.split('/').filter(p => p && p.length > 0);
                    const welcomeIndex = pathParts.findIndex(p => p.toLowerCase() === 'welcome');
                    
                    if (welcomeIndex !== -1 && pathParts[welcomeIndex + 1]) {
                        const userId = pathParts[welcomeIndex + 1];
                        console.log("Welcome URL detected, navigating to /action/" + userId);
                        
                        toast({
                            title: "User Profile Scanned",
                            description: "Navigating to user's QR objects...",
                        });
                        
                        // Close the modal and navigate
                        onClose();
                        router.push(`/action/${userId}`);
                        return true;
                    }
                }
            } catch {
                // URL parsing failed, continue to external handling
            }
            
            // Not a QR object URL and not a welcome URL - treat as external
            setExternalUrl(scannedData);
            
            // Automatically open the external URL in a new tab
            window.open(scannedData, '_blank', 'noopener,noreferrer');
            
            toast({
                title: "External QR Code Detected",
                description: "Opening link in a new tab...",
            });
            return true;
        }
        
        // Not a URL - check if it's a raw UUID (direct QR object ID)
        if (isValidUUID(scannedData.trim())) {
            await validateQRObject(scannedData.trim());
            return true;
        }
        
        // Not a URL and not a UUID - show error
        setError("Invalid QR code. Could not find a valid ticket ID.");
        toast({
            title: "Invalid QR Code",
            description: "This QR code does not contain a valid ticket ID.",
            variant: "destructive",
        });
        return false;
    };

    const handleScanSuccess = async (scannedData: string) => {
        // Prevent concurrent processing of multiple detections
        if (processingRef.current) return;
        processingRef.current = true;
        
        stopCamera();
        await processScannedResult(scannedData);
    };

    const validateQRObject = async (qrObjectId: string) => {
        try {
            setValidating(true);
            setError("");
            const token = getToken();
            
            if (!token) {
                setError("Authentication required");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            // Backend handles both qrObjectId and actionPurchaseId
            const response = await axios.get(
                `${baseUrl}/qr-objects/${qrObjectId}/validate`, 
                { headers }
            );

            if (response.data) {
                setValidationResult(response.data.data || response.data);
                toast({
                    title: "QR Object Validated",
                    description: "QR code is valid and ready to use.",
                });
            }
        } catch (err: any) {
            console.error("Validation error:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to validate QR object";
            const statusCode = err?.response?.status;
            
            let displayMessage = errorMessage;
            if (statusCode === 404) {
                displayMessage = `QR Object not found. ID: ${qrObjectId}. Please check if the QR code is correct.`;
            }
            
            setError(displayMessage);
            setValidationResult(null);
            toast({
                title: "Validation Failed",
                description: displayMessage,
                variant: "destructive",
            });
        } finally {
            setValidating(false);
        }
    };

    const markAsUsed = async () => {
        if (!validationResult) return;

        try {
            setMarkingAsUsed(true);
            setError("");
            const token = getToken();
            if (!token) {
                setError("Authentication required");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            const response = await axios.post(`${baseUrl}/qr-objects/${validationResult.id}/use`, {}, { headers });

            if (response.data) {
                toast({
                    title: "QR Object Marked as Used",
                    description: "The QR code has been successfully marked as used.",
                });
                
                // Update validation result
                setValidationResult({
                    ...validationResult,
                    status: "used",
                    usedAt: new Date().toISOString(),
                });
            }
        } catch (err: any) {
            console.error("Mark as used error:", err);
            const errorMessage = err?.response?.data?.message || err?.message || "Failed to mark QR object as used";
            setError(errorMessage);
            toast({
                title: "Failed to Mark as Used",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setMarkingAsUsed(false);
        }
    };

    const handleClose = () => {
        processingRef.current = false;
        stopCamera();
        setScanResult("");
        setValidationResult(null);
        setError("");
        setExternalUrl(null);
        setIsScanning(false);
        onClose();
    };

    const handleScanAgain = () => {
        setScanResult("");
        setValidationResult(null);
        setError("");
        setExternalUrl(null);
        processingRef.current = false;
        stopCamera();
    };

    const handleOpenExternalUrl = () => {
        if (externalUrl) {
            window.open(externalUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setError("Please upload a PDF file");
            toast({
                title: "Invalid File Type",
                description: "Please upload a PDF file",
                variant: "destructive",
            });
            return;
        }

        try {
            setUploadingPDF(true);
            setError("");
            stopCamera();

            // Load QR Scanner first
            let scanner = QrScanner;
            if (!scanner) {
                const { default: QrScannerLib } = await import("qr-scanner");
                scanner = QrScannerLib;
                setQrScanner(() => QrScannerLib);
            }

            // Load PDF.js
            let pdfjsLib: any;
            try {
                pdfjsLib = await import("pdfjs-dist");
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            } catch {
                // Load from CDN if import fails
                if (!(window as any).pdfjsLib) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
                        script.onload = () => {
                            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
                            resolve(null);
                        };
                        script.onerror = reject;
                        document.head.appendChild(script);
                        setTimeout(reject, 10000);
                    });
                }
                pdfjsLib = (window as any).pdfjsLib;
            }

            // Load PDF
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let qrCodeFound = false;

            // Process each page
            for (let pageNum = 1; pageNum <= pdf.numPages && !qrCodeFound; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // Use high scale for better QR detection
                const scale = 4.0;
                const viewport = page.getViewport({ scale });

                // Create canvas
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render PDF page to canvas
                await page.render({
                    canvasContext: ctx,
                    viewport: viewport,
                }).promise;

                // Wait for rendering
                await new Promise(resolve => setTimeout(resolve, 200));

                // Convert canvas to image data URL
                const imageData = canvas.toDataURL("image/png");

                // Create image element
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imageData;
                    setTimeout(reject, 5000);
                });

                        // Scan for QR code - try image element first
                try {
                    const result = await scanner.scanImage(img);
                    if (result) {
                        qrCodeFound = true;
                        
                        // Process the scanned result (handles both internal and external URLs)
                        await processScannedResult(result);
                        break;
                    }
                } catch (err) {
                    // Try scanning data URL directly
                    try {
                        const result = await scanner.scanImage(imageData);
                        if (result) {
                            qrCodeFound = true;
                            
                            // Process the scanned result (handles both internal and external URLs)
                            await processScannedResult(result);
                            break;
                        }
                    } catch (err2) {
                        // Try canvas directly
                        try {
                            const result = await scanner.scanImage(canvas);
                            if (result) {
                                qrCodeFound = true;
                                
                                // Process the scanned result (handles both internal and external URLs)
                                await processScannedResult(result);
                                break;
                            }
                        } catch (err3) {
                            // No QR code on this page
                            continue;
                        }
                    }
                }
            }

            if (!qrCodeFound) {
                setError("No QR code found in the PDF");
                toast({
                    title: "No QR Code Found",
                    description: "Could not find a QR code in the uploaded PDF. Please make sure the PDF contains a valid QR code.",
                    variant: "destructive",
                });
            }
        } catch (err: any) {
            console.error("PDF processing error:", err);
            setError(err.message || "Failed to process PDF");
            toast({
                title: "PDF Processing Failed",
                description: err.message || "Failed to process PDF file",
                variant: "destructive",
            });
        } finally {
            setUploadingPDF(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-[#00313A] flex items-center gap-2">
                        <Scan className="w-6 h-6 text-[#00B512]" />
                        Validate QR Object
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Camera Section */}
                    {!validationResult && (
                        <div className="space-y-4">
                            {/* Always render video element but show/hide based on state */}
                            <div className={`relative bg-black rounded-lg overflow-hidden ${cameraActive ? 'block' : 'hidden'}`}>
                                <video
                                    ref={videoRef}
                                    className="w-full h-auto max-h-[500px] object-cover"
                                    playsInline
                                    autoPlay
                                    muted
                                />
                                <canvas ref={canvasRef} className="hidden" />
                                {/* Scanning overlay */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-4 border-[#00B512] rounded-lg shadow-lg">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00B512]"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00B512]"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00B512]"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00B512]"></div>
                                    </div>
                                </div>
                                {/* Scanning indicator */}
                                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#00B512]/90 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 z-10">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    Scanning...
                                </div>
                                <div className="mt-4 flex justify-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={stopCamera}
                                        className="border-[#00B512] text-[#00B512] hover:bg-[#00B512] hover:text-white"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Stop Camera
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            const newFacingMode = facingMode === "environment" ? "user" : "environment";
                                            setFacingMode(newFacingMode);
                                            // Restart camera with new facing mode
                                            await startCamera(newFacingMode);
                                        }}
                                        className="border-[#00B512] text-[#00B512] hover:bg-[#00B512] hover:text-white"
                                    >
                                        <Camera className="w-4 h-4 mr-2" />
                                        Switch Camera
                                    </Button>
                                </div>
                            </div>

                            {!cameraActive && !validating && !uploadingPDF && (
                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] rounded-xl border-2 border-[#00B512]/10">
                                        <Camera className="w-16 h-16 text-[#00B512] mb-4" />
                                        <p className="text-lg font-semibold text-[#00313A] mb-2">Ready to Scan</p>
                                        <p className="text-sm text-[#00313A]/70 mb-4">Choose how you want to scan the QR code</p>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md px-4">
                                            <Button
                                                onClick={() => startCamera()}
                                                className="flex-1 bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white hover:shadow-lg"
                                                disabled={!QrScanner || !!error}
                                            >
                                                <Camera className="w-4 h-4 mr-2" />
                                                Start Camera
                                            </Button>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="application/pdf"
                                                onChange={handlePDFUpload}
                                                className="hidden"
                                                id="pdf-upload-input"
                                            />
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                variant="outline"
                                                className="flex-1 border-2 border-[#00B512] text-[#00B512] hover:bg-[#00B512] hover:text-white"
                                                disabled={!QrScanner || !!error}
                                            >
                                                <Upload className="w-4 h-4 mr-2" />
                                                Upload PDF
                                            </Button>
                                        </div>
                                        {error && (
                                            <p className="text-sm text-red-600 mt-2">{error}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {uploadingPDF && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-12 h-12 text-[#00B512] animate-spin mb-4" />
                                    <p className="text-lg font-semibold text-[#00313A]">Processing PDF...</p>
                                    <p className="text-sm text-[#00313A]/70 mt-2">Scanning for QR codes in the document</p>
                                </div>
                            )}

                            {validating && (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="w-12 h-12 text-[#00B512] animate-spin mb-4" />
                                    <p className="text-lg font-semibold text-[#00313A]">Validating QR Object...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Validation Result */}
                    {validationResult && (
                        <div className="space-y-4">
                            <div className={`p-6 rounded-xl border-2 ${
                                validationResult.status === "valid" 
                                    ? "bg-green-50 border-green-200" 
                                    : validationResult.status === "used"
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-red-50 border-red-200"
                            }`}>
                                <div className="flex items-start gap-4">
                                    {validationResult.status === "valid" ? (
                                        <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                                    ) : (
                                        <XCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                                    )}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-[#00313A] mb-2">
                                            {validationResult.metadata?.actionName || "QR Object"}
                                        </h3>
                                        {validationResult.metadata?.subActionName && (
                                            <p className="text-sm text-[#00313A]/70 mb-3">
                                                {validationResult.metadata.subActionName}
                                            </p>
                                        )}
                                        <div className="space-y-2">
                                            {(validationResult.buyer?.fullName || validationResult.buyer?.name || validationResult.metadata?.buyerName || validationResult.metadata?.ownerName) && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[#00313A]">Owner:</span>
                                                    <span className="text-sm text-[#00313A]/70">
                                                        {validationResult.buyer?.fullName || 
                                                         validationResult.buyer?.name || 
                                                         validationResult.metadata?.buyerName || 
                                                         validationResult.metadata?.ownerName}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-[#00313A]">Status:</span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                                    validationResult.status === "valid"
                                                        ? "bg-green-100 text-green-700"
                                                        : validationResult.status === "used"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-red-100 text-red-700"
                                                }`}>
                                                    {validationResult.status}
                                                </span>
                                            </div>
                                            {validationResult.metadata?.quantity && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[#00313A]">Quantity:</span>
                                                    <span className="text-sm text-[#00313A]/70">{validationResult.metadata.quantity}</span>
                                                </div>
                                            )}
                                            {validationResult.metadata?.seatType && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[#00313A]">Seat Type:</span>
                                                    <span className="text-sm text-[#00313A]/70 capitalize">{validationResult.metadata.seatType}</span>
                                                </div>
                                            )}
                                            {validationResult.validUntil && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[#00313A]">Valid Until:</span>
                                                    <span className="text-sm text-[#00313A]/70">
                                                        {new Date(validationResult.validUntil).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {validationResult.usedAt && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[#00313A]">Used At:</span>
                                                    <span className="text-sm text-[#00313A]/70">
                                                        {new Date(validationResult.usedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {Array.isArray(validationResult.metadata?.benefits) && validationResult.metadata.benefits.length > 0 && (
                                <div className="bg-white rounded-xl p-4 border border-[#00B512]/10">
                                    <h4 className="text-sm font-semibold text-[#00B512] mb-2">Benefits:</h4>
                                    <ul className="list-disc list-inside space-y-1">
                                        {validationResult.metadata.benefits.map((benefit: string, index: number) => (
                                            <li key={index} className="text-sm text-[#00313A]/70">{benefit}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}

                    {/* External URL Result */}
                    {externalUrl && (
                        <div className="space-y-4">
                            <div className="p-6 rounded-xl border-2 bg-blue-50 border-blue-200">
                                <div className="flex items-start gap-4">
                                    <ExternalLink className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-[#00313A] mb-2">
                                            External QR Code
                                        </h3>
                                        <p className="text-sm text-[#00313A]/70 mb-3">
                                            This QR code links to an external website:
                                        </p>
                                        <div className="bg-white rounded-lg p-3 border border-blue-200 break-all">
                                            <p className="text-sm text-blue-600 font-mono">{externalUrl}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleOpenExternalUrl}
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Open Link
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleScanAgain}
                                    className="flex-1 border-[#00B512] text-[#00B512]"
                                >
                                    <Scan className="w-4 h-4 mr-2" />
                                    Scan Another
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex gap-3">
                    {validationResult && validationResult.status === "valid" && (
                        <Button
                            onClick={markAsUsed}
                            disabled={markingAsUsed}
                            className="bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white hover:shadow-lg"
                        >
                            {markingAsUsed ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Marking...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark as Used
                                </>
                            )}
                        </Button>
                    )}
                    {validationResult && (
                        <Button
                            variant="outline"
                            onClick={handleScanAgain}
                            className="border-[#00B512] text-[#00B512]"
                        >
                            <Scan className="w-4 h-4 mr-2" />
                            Scan Another
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        className="border-gray-300"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

