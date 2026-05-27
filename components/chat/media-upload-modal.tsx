"use client"

import { useState, useRef, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2, Image as ImageIcon, Video, Music, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { validateMediaFile, formatFileSize, getFileType } from "@/services/mediaService"

interface MediaUploadModalProps {
    isOpen: boolean
    onClose: () => void
    onUpload: (file: File, caption: string) => void
    uploading?: boolean
    uploadProgress?: number
}

export default function MediaUploadModal({
    isOpen,
    onClose,
    onUpload,
    uploading = false,
    uploadProgress = 0
}: MediaUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [caption, setCaption] = useState<string>("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file
        const validation = validateMediaFile(file)
        if (!validation.valid) {
            toast({
                title: "Invalid File",
                description: validation.error,
                variant: "destructive"
            })
            return
        }

        setSelectedFile(file)

        // Generate preview for images and videos
        const fileType = getFileType(file.type)
        if (fileType === 'image' || fileType === 'video') {
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        } else {
            setPreviewUrl(null)
        }
    }

    const handleUpload = () => {
        if (!selectedFile) return
        onUpload(selectedFile, caption)
    }

    const handleClose = () => {
        if (uploading) return // Prevent closing during upload
        
        // Cleanup
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setSelectedFile(null)
        setPreviewUrl(null)
        setCaption("")
        onClose()
    }

    const getFileIcon = () => {
        if (!selectedFile) return <FileText className="h-16 w-16 text-gray-400" />
        
        const fileType = getFileType(selectedFile.type)
        switch (fileType) {
            case 'image':
                return <ImageIcon className="h-16 w-16 text-brand-green dark:text-brand-gold" />
            case 'video':
                return <Video className="h-16 w-16 text-brand-green dark:text-brand-gold" />
            case 'audio':
                return <Music className="h-16 w-16 text-brand-green dark:text-brand-gold" />
            case 'document':
                return <FileText className="h-16 w-16 text-gray-600 dark:text-gray-400" />
            default:
                return <FileText className="h-16 w-16 text-gray-400" />
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Upload Media</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        disabled={uploading}
                        className="h-8 w-8"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!selectedFile ? (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-brand-green dark:hover:border-brand-gold transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-gray-700">
                                        Click to upload media
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Images, videos, audio, or documents
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Max size: Images (10MB), Videos (100MB), Audio (20MB), Documents (50MB)
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Preview */}
                            <div className="relative bg-gray-50 rounded-lg overflow-hidden">
                                {previewUrl && getFileType(selectedFile.type) === 'image' ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full max-h-96 object-contain"
                                    />
                                ) : previewUrl && getFileType(selectedFile.type) === 'video' ? (
                                    <video
                                        src={previewUrl}
                                        controls
                                        className="w-full max-h-96"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-12">
                                        {getFileIcon()}
                                        <p className="mt-4 font-medium text-gray-700">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Loader2 className="h-5 w-5 animate-spin text-brand-green dark:text-brand-gold" />
                                                <span className="font-medium">Uploading...</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-brand-green dark:bg-brand-gold h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 text-center mt-2">
                                                {uploadProgress}%
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Caption Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Caption (optional)
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Add a caption..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B512] resize-none"
                                    rows={3}
                                    disabled={uploading}
                                />
                            </div>

                            {/* File Info */}
                            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                <span className="font-medium">{selectedFile.name}</span>
                                <span>{formatFileSize(selectedFile.size)}</span>
                            </div>

                            {/* Change File Button */}
                            {!uploading && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (previewUrl) URL.revokeObjectURL(previewUrl)
                                        setSelectedFile(null)
                                        setPreviewUrl(null)
                                        setCaption("")
                                    }}
                                    className="w-full"
                                >
                                    Choose Different File
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {selectedFile && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={uploading}
                            className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                "Send"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
