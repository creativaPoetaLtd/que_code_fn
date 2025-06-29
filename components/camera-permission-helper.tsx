"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera, AlertCircle, CheckCircle, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function CameraPermissionHelper() {
    const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown")
    const [isSecure, setIsSecure] = useState(false)
    const [hasCamera, setHasCamera] = useState(false)
    const [browserInfo, setBrowserInfo] = useState("")

    useEffect(() => {
        checkEnvironment()
    }, [])

    const checkEnvironment = async () => {
        // Check if HTTPS or localhost
        const secure = window.location.protocol === "https:" || window.location.hostname === "localhost"
        setIsSecure(secure)

        // Get browser info
        setBrowserInfo(navigator.userAgent)

        // Check camera availability
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = devices.filter((device) => device.kind === "videoinput")
            setHasCamera(videoDevices.length > 0)
        } catch (err) {
            setHasCamera(false)
        }

        // Check permission status
        try {
            if ("permissions" in navigator) {
                const permission = await navigator.permissions.query({ name: "camera" as PermissionName })
                setPermissionStatus(permission.state)
            } else {
                setPermissionStatus("unknown")
            }
        } catch (err) {
            setPermissionStatus("unknown")
        }
    }

    const requestPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            })

            // Stop the stream immediately
            stream.getTracks().forEach((track) => track.stop())

            setPermissionStatus("granted")
            toast({
                title: "Permission Granted",
                description: "Camera access has been granted successfully",
            })
        } catch (err: any) {
            console.error("Permission request failed:", err)
            setPermissionStatus("denied")

            let message = "Camera permission was denied"
            if (err.name === "NotFoundError") {
                message = "No camera found on this device"
            } else if (err.name === "NotAllowedError") {
                message = "Camera permission was denied by user"
            }

            toast({
                title: "Permission Denied",
                description: message,
                variant: "destructive",
            })
        }
    }

    const openBrowserSettings = () => {
        toast({
            title: "Browser Settings",
            description: "Look for camera/microphone permissions in your browser settings",
        })
    }

    const getStatusColor = () => {
        switch (permissionStatus) {
            case "granted":
                return "text-green-600"
            case "denied":
                return "text-red-600"
            case "prompt":
                return "text-yellow-600"
            default:
                return "text-gray-600"
        }
    }

    const getStatusIcon = () => {
        switch (permissionStatus) {
            case "granted":
                return <CheckCircle size={20} className="text-green-600" />
            case "denied":
                return <AlertCircle size={20} className="text-red-600" />
            default:
                return <Camera size={20} className="text-gray-600" />
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Camera size={20} className="mr-2" />
                    Camera Status
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Security Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Secure Connection</span>
                    <div className="flex items-center">
                        {isSecure ? (
                            <CheckCircle size={16} className="text-green-600 mr-2" />
                        ) : (
                            <AlertCircle size={16} className="text-red-600 mr-2" />
                        )}
                        <span className={`text-sm ${isSecure ? "text-green-600" : "text-red-600"}`}>
                            {isSecure ? "HTTPS" : "HTTP"}
                        </span>
                    </div>
                </div>

                {/* Camera Availability */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Camera Available</span>
                    <div className="flex items-center">
                        {hasCamera ? (
                            <CheckCircle size={16} className="text-green-600 mr-2" />
                        ) : (
                            <AlertCircle size={16} className="text-red-600 mr-2" />
                        )}
                        <span className={`text-sm ${hasCamera ? "text-green-600" : "text-red-600"}`}>
                            {hasCamera ? "Yes" : "No"}
                        </span>
                    </div>
                </div>

                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium">Camera Permission</span>
                    <div className="flex items-center">
                        {getStatusIcon()}
                        <span className={`text-sm ml-2 ${getStatusColor()}`}>
                            {permissionStatus.charAt(0).toUpperCase() + permissionStatus.slice(1)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                    {!isSecure && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">Camera access requires HTTPS. Please use a secure connection.</p>
                        </div>
                    )}

                    {!hasCamera && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">No camera detected on this device.</p>
                        </div>
                    )}

                    {permissionStatus === "denied" && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800 mb-2">
                                Camera permission was denied. Please enable it in your browser settings.
                            </p>
                            <Button onClick={openBrowserSettings} size="sm" variant="outline">
                                <Settings size={16} className="mr-2" />
                                Browser Settings
                            </Button>
                        </div>
                    )}

                    {permissionStatus === "prompt" && isSecure && hasCamera && (
                        <Button onClick={requestPermission} className="w-full">
                            <Camera size={16} className="mr-2" />
                            Request Camera Permission
                        </Button>
                    )}

                    {permissionStatus === "granted" && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">✅ Camera is ready for QR code scanning!</p>
                        </div>
                    )}
                </div>

                {/* Debug Info */}
                <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer">Debug Info</summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                        <p>
                            <strong>URL:</strong> {window.location.href}
                        </p>
                        <p>
                            <strong>Protocol:</strong> {window.location.protocol}
                        </p>
                        <p>
                            <strong>User Agent:</strong> {browserInfo}
                        </p>
                    </div>
                </details>
            </CardContent>
        </Card>
    )
}
