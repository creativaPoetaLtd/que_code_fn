"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { FileText, UploadIcon, Paperclip, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"


interface DocumentModalProps {
    isOpen: boolean
    onClose: () => void
}

interface FileItem {
    name: string
    size: number
    type: string
    lastModified: number
}

export default function DocumentModal({ isOpen, onClose }: DocumentModalProps) {
    const [fileList, setFileList] = useState<FileItem[]>([])
    const [title, setTitle] = useState<string>("")
    const [category, setCategory] = useState<string>("general")
    const [currentStep, setCurrentStep] = useState<number>(1)
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [uploadComplete, setUploadComplete] = useState<boolean>(false)

    // Reset the form when the modal opens
    useEffect(() => {
        if (isOpen) {
            setFileList([])
            setTitle("")
            setCategory("general")
            setCurrentStep(1)
            setUploading(false)
            setUploadProgress(0)
            setUploadComplete(false)
        }
    }, [isOpen])

    // Simulate upload progress
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (uploading && uploadProgress < 100) {
            timer = setTimeout(() => {
                const nextProgress = Math.min(uploadProgress + 10, 100)
                setUploadProgress(nextProgress)
                if (nextProgress === 100) {
                    setUploading(false)
                    setUploadComplete(true)
                }
            }, 300)
        }
        return () => clearTimeout(timer)
    }, [uploading, uploadProgress])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file) => ({
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
            }))
            setFileList([...fileList, ...newFiles])
        }
    }

    const handleNext = () => {
        if (currentStep === 1 && fileList.length > 0) {
            setCurrentStep(2)
        } else if (currentStep === 2 && title) {
            setCurrentStep(3)
            simulateUpload()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const simulateUpload = () => {
        setUploading(true)
        setUploadProgress(0)
    }

    const handleFinish = () => {
        toast({
            title: "Files uploaded",
            description: `${fileList.length} files uploaded as "${title}"`,
        })
        onClose()
    }

    const renderStep1 = () => (
        <div className="flex flex-col items-center py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Upload Documents</h3>
                <p className="text-gray-500">Select files to share in the conversation</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full text-center hover:border-gray-400 transition-colors cursor-pointer">
                <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadIcon size={48} className="mx-auto mb-4 text-green-600" />
                    <p className="text-lg font-medium">Drag files here or click to browse</p>
                    <p className="text-sm text-gray-500 mt-1">Support for PDF, Word, Excel, PowerPoint, and images</p>
                    <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>
            </div>

            {fileList.length > 0 && (
                <div className="mt-4 w-full">
                    <p className="font-medium">Selected files ({fileList.length}):</p>
                    <div className="max-h-32 overflow-y-auto mt-2">
                        {fileList.map((file, index) => (
                            <div key={index} className="flex items-center py-1">
                                <Paperclip size={16} className="text-gray-500 mr-2" />
                                <span className="text-sm">{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const renderStep2 = () => (
        <div className="flex flex-col py-6">
            <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1">Document Details</h3>
                <p className="text-gray-500">Add information about your documents</p>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                <Input
                    placeholder="Enter document title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="report">Report</SelectItem>
                        <SelectItem value="invoice">Invoice</SelectItem>
                        <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-4 mb-2 bg-gray-50 rounded-lg border border-gray-200 p-4">
                <p className="font-medium">Files to Upload ({fileList.length})</p>
                <div className="max-h-32 overflow-y-auto mt-2">
                    {fileList.map((file, index) => (
                        <div key={index} className="flex items-center py-1">
                            <Paperclip size={16} className="text-gray-500 mr-2" />
                            <span className="text-sm">{file.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="flex flex-col items-center py-6">
            {!uploadComplete ? (
                <>
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold mb-1">Uploading Documents</h3>
                        <p className="text-gray-500">Please wait while we upload your files</p>
                    </div>

                    <div className="w-full mb-6 px-4">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-center text-sm text-gray-500 mt-2">
                            Uploading {fileList.length} {fileList.length === 1 ? "file" : "files"}...
                        </p>
                    </div>

                    <div className="bg-brand-green/5 dark:bg-brand-gold/5 border border-brand-green/20 dark:border-brand-gold/20 rounded-lg p-4 max-w-sm">
                        <div className="flex items-start">
                            <AlertCircle size={20} className="text-brand-green dark:text-brand-gold mr-2 mt-0.5" />
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-0">
                                Please don't close this dialog until the upload is complete.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-brand-green/20 dark:bg-brand-gold/20 p-4 rounded-full mb-4">
                            <CheckCircle size={48} className="text-brand-green dark:text-brand-gold" />
                        </div>
                        <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Upload Complete!</h3>
                        <p className="text-gray-500 dark:text-gray-400">Your documents have been successfully uploaded</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-darkBg-card rounded-lg border border-gray-200 dark:border-darkBorder-light p-4 w-full mb-6">
                        <h4 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Document Summary</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Title:</span>
                                <span className="font-medium">{title}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Category:</span>
                                <span className="font-medium capitalize">{category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Files:</span>
                                <span className="font-medium">{fileList.length}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center">
                        <FileText size={20} className="text-green-600 mr-2" />
                        <DialogTitle>Document Upload</DialogTitle>
                    </div>
                </DialogHeader>

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}

                <DialogFooter className="flex justify-between">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 1 || uploading}>
                        Back
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            onClick={handleNext}
                            disabled={(currentStep === 1 && fileList.length === 0) || (currentStep === 2 && !title)}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button onClick={handleFinish} disabled={!uploadComplete}>
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

