"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Smartphone, Globe, Settings, Camera } from "lucide-react"

export default function CameraTroubleshooting() {
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <AlertCircle size={20} className="mr-2" />
                    Camera Troubleshooting Guide
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* HTTPS Requirement */}
                <div className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center mb-2">
                        <Globe size={16} className="mr-2 text-blue-500" />
                        <h3 className="font-semibold">HTTPS Required</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Modern browsers require HTTPS for camera access (except on localhost).
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Ensure your site is served over HTTPS</li>
                        <li>• Use localhost for development</li>
                        <li>• Check for mixed content warnings</li>
                    </ul>
                </div>

                {/* Mobile Browsers */}
                <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                        <Smartphone size={16} className="mr-2 text-green-500" />
                        <h3 className="font-semibold">Mobile Browser Issues</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Some mobile browsers have specific requirements:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li>
                            • <strong>iOS Safari:</strong> Requires user interaction to start camera
                        </li>
                        <li>
                            • <strong>Android Chrome:</strong> May need "Desktop site" disabled
                        </li>
                        <li>
                            • <strong>Samsung Internet:</strong> Check privacy settings
                        </li>
                        <li>• Try refreshing the page if camera doesn't start</li>
                    </ul>
                </div>

                {/* Permission Issues */}
                <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="flex items-center mb-2">
                        <Settings size={16} className="mr-2 text-yellow-500" />
                        <h3 className="font-semibold">Permission Problems</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">If camera permission is blocked:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Click the camera icon in the address bar</li>
                        <li>• Go to browser Settings → Privacy → Camera</li>
                        <li>• Clear site data and try again</li>
                        <li>• Check if camera is being used by another app</li>
                    </ul>
                </div>

                {/* Camera Hardware */}
                <div className="border-l-4 border-red-500 pl-4">
                    <div className="flex items-center mb-2">
                        <Camera size={16} className="mr-2 text-red-500" />
                        <h3 className="font-semibold">Hardware Issues</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Camera hardware problems:</p>
                    <ul className="text-xs text-gray-500 space-y-1">
                        <li>• Ensure camera is not covered or blocked</li>
                        <li>• Close other apps using the camera</li>
                        <li>• Restart your browser</li>
                        <li>• Try a different browser</li>
                    </ul>
                </div>

                {/* Browser Compatibility */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Browser Compatibility</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="font-medium text-green-600">✅ Supported:</p>
                            <ul className="text-gray-600">
                                <li>• Chrome 53+</li>
                                <li>• Firefox 36+</li>
                                <li>• Safari 11+</li>
                                <li>• Edge 12+</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-medium text-red-600">❌ Limited Support:</p>
                            <ul className="text-gray-600">
                                <li>• Internet Explorer</li>
                                <li>• Very old mobile browsers</li>
                                <li>• Some WebView implementations</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
