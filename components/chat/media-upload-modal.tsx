"use client"

import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { X, Loader2, Image as ImageIcon, Video, Music, FileText, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { validateMediaFile, formatFileSize, getFileType } from "@/services/mediaService"

const DEFAULT_ACCEPT = "image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"

/** One attachment waiting in the tray, with the caption typed for it */
interface QueueItem {
    id: string
    file: File
    caption: string
    /** Object URL, for images and videos only */
    previewUrl: string | null
    kind: ReturnType<typeof getFileType>
}

interface MediaUploadModalProps {
    isOpen: boolean
    onClose: () => void
    /** Single-attachment path, used when `onUploadMany` is not given */
    onUpload: (file: File, caption: string) => void
    /**
     * Multi-attachment path. Upload them in order and resolve with the files
     * that failed — the tray keeps those so they can be retried, and an empty
     * result means the caller is free to close.
     */
    onUploadMany?: (items: { file: File; caption: string }[]) => Promise<File[] | void> | void
    uploading?: boolean
    uploadProgress?: number
    /** Replaces "Uploading..." while a batch is in flight, e.g. "Sending 2 of 5" */
    uploadLabel?: string
    /**
     * A file the caller already picked. The modal then opens straight on the
     * preview-and-caption step instead of asking for a file it has been handed.
     */
    initialFile?: File | null
    /** Several already-picked files, same idea as `initialFile` */
    initialFiles?: File[] | null
    /** Lets the tray's own picker take more than one file at a time */
    multiple?: boolean
    /** `accept` for the tray's own picker — match the caller's picker */
    accept?: string
    maxFiles?: number
    title?: string
}

export default function MediaUploadModal({
    isOpen,
    onClose,
    onUpload,
    onUploadMany,
    uploading = false,
    uploadProgress = 0,
    uploadLabel,
    initialFile = null,
    initialFiles = null,
    multiple = false,
    accept = DEFAULT_ACCEPT,
    maxFiles = 10,
    title = "Upload Media"
}: MediaUploadModalProps) {
    const [items, setItems] = useState<QueueItem[]>([])
    const [activeIdx, setActiveIdx] = useState<number>(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const idSeq = useRef<number>(0)
    // Mirrors `items` so cleanup can revoke previews without re-running on edits
    const itemsRef = useRef<QueueItem[]>([])
    itemsRef.current = items

    /**
     * Turn picked files into tray items: drop what the service rejects, skip
     * what is already in the tray, and stop at `maxFiles`.
     */
    const buildItems = useCallback((files: File[], existing: QueueItem[]): QueueItem[] => {
        const rejected: string[] = []
        const added: QueueItem[] = []
        let room = Math.max(0, maxFiles - existing.length)
        let overflow = 0

        for (const file of files) {
            const isDuplicate = [...existing, ...added].some(
                (item) =>
                    item.file.name === file.name &&
                    item.file.size === file.size &&
                    item.file.lastModified === file.lastModified
            )
            if (isDuplicate) continue

            const validation = validateMediaFile(file)
            if (!validation.valid) {
                rejected.push(`${file.name}: ${validation.error}`)
                continue
            }

            if (room === 0) { overflow++; continue }
            room--

            const kind = getFileType(file.type)
            added.push({
                id: `f${idSeq.current++}`,
                file,
                caption: "",
                previewUrl: kind === "image" || kind === "video" ? URL.createObjectURL(file) : null,
                kind,
            })
        }

        if (rejected.length) {
            toast({
                title: rejected.length === 1 ? "File skipped" : `${rejected.length} files skipped`,
                description: rejected.slice(0, 3).join("\n"),
                variant: "destructive",
            })
        }
        if (overflow) {
            toast({
                title: "Too many files",
                description: `You can send up to ${maxFiles} at a time, so ${overflow} ${overflow === 1 ? "was" : "were"} left out.`,
                variant: "destructive",
            })
        }

        return added
    }, [maxFiles])

    // Adopt files chosen before the modal opened, so the picker is the first and
    // only thing between "Photo / video" and the preview.
    useEffect(() => {
        // Closing clears the slate so a later open never shows the last selection
        if (!isOpen) {
            itemsRef.current.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
            setItems([])
            setActiveIdx(0)
            return
        }

        const picked = initialFiles?.length ? initialFiles : initialFile ? [initialFile] : []
        if (!picked.length) return

        const next = buildItems(picked, [])
        if (!next.length) { onClose(); return }
        setItems(next)
        setActiveIdx(0)
        // onClose is intentionally omitted: callers recreate it every render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialFile, initialFiles, buildItems])

    // Unmounting while the tray is full would otherwise leak its object URLs
    useEffect(() => () => {
        itemsRef.current.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
    }, [])

    if (!isOpen) return null

    const activeItem: QueueItem | undefined = items[activeIdx]

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        // Reset the input so picking the same file twice still fires a change
        e.target.value = ""
        if (!files.length) return

        const current = itemsRef.current
        const added = buildItems(files, current)
        if (!added.length) return
        setActiveIdx(current.length)
        setItems([...current, ...added])
    }

    const removeItem = (id: string) => {
        const current = itemsRef.current
        const idx = current.findIndex((item) => item.id === id)
        if (idx === -1) return

        const removed = current[idx]
        if (removed.previewUrl) URL.revokeObjectURL(removed.previewUrl)
        const next = current.filter((item) => item.id !== id)

        setItems(next)
        setActiveIdx(Math.max(0, Math.min(activeIdx > idx ? activeIdx - 1 : activeIdx, next.length - 1)))
    }

    const setActiveCaption = (caption: string) => {
        setItems((prev) => prev.map((item, idx) => (idx === activeIdx ? { ...item, caption } : item)))
    }

    const handleUpload = async () => {
        if (!items.length) return

        if (!onUploadMany) {
            onUpload(items[0].file, items[0].caption)
            return
        }

        const failed = await onUploadMany(items.map(({ file, caption }) => ({ file, caption })))
        if (!Array.isArray(failed) || !failed.length) return

        // Keep only what failed, so the tray becomes a retry list
        const kept: QueueItem[] = []
        for (const item of itemsRef.current) {
            if (failed.includes(item.file)) kept.push(item)
            else if (item.previewUrl) URL.revokeObjectURL(item.previewUrl)
        }
        setItems(kept)
        setActiveIdx(0)
    }

    const handleClose = () => {
        if (uploading) return // Prevent closing during upload
        items.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl))
        setItems([])
        setActiveIdx(0)
        onClose()
    }

    const iconFor = (kind: QueueItem["kind"], className: string) => {
        switch (kind) {
            case 'image':
                return <ImageIcon className={`${className} text-brand-green dark:text-brand-gold`} />
            case 'video':
                return <Video className={`${className} text-brand-green dark:text-brand-gold`} />
            case 'audio':
                return <Music className={`${className} text-brand-green dark:text-brand-gold`} />
            case 'document':
                return <FileText className={`${className} text-gray-600 dark:text-gray-400`} />
            default:
                return <FileText className={`${className} text-gray-400 dark:text-gray-500`} />
        }
    }

    const totalSize = items.reduce((sum, item) => sum + item.file.size, 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white dark:bg-darkBg-card rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b dark:border-darkBorder-light">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {title}
                        {items.length > 1 && (
                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                {items.length} files · {formatFileSize(totalSize)}
                            </span>
                        )}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClose}
                        disabled={uploading}
                        className="h-8 w-8 dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
                    {!activeItem ? (
                        <div
                            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-brand-green dark:hover:border-brand-gold transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-darkBg-interactive flex items-center justify-center">
                                    <ImageIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-200">
                                        Click to upload{multiple ? " files" : " media"}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Images, videos, audio, or documents
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Max size: Images (10MB), Videos (100MB), Audio (20MB), Documents (50MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {/* Preview of the selected attachment */}
                            <div className="relative bg-gray-50 dark:bg-darkBg-interactive rounded-lg overflow-hidden">
                                {activeItem.previewUrl && activeItem.kind === 'image' ? (
                                    <img
                                        src={activeItem.previewUrl}
                                        alt={activeItem.file.name}
                                        className="w-full max-h-80 object-contain"
                                    />
                                ) : activeItem.previewUrl && activeItem.kind === 'video' ? (
                                    <video
                                        key={activeItem.id}
                                        src={activeItem.previewUrl}
                                        controls
                                        className="w-full max-h-80"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8">
                                        {iconFor(activeItem.kind, "h-14 w-14")}
                                        <p className="mt-3 font-medium text-gray-700 dark:text-gray-200 text-center break-all px-4">
                                            {activeItem.file.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formatFileSize(activeItem.file.size)}
                                        </p>
                                    </div>
                                )}

                                {/* Upload Progress */}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="bg-white dark:bg-darkBg-card rounded-lg p-4 max-w-sm w-full mx-4">
                                            <div className="flex items-center gap-3 mb-2.5">
                                                <Loader2 className="h-5 w-5 animate-spin text-brand-green dark:text-brand-gold" />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {uploadLabel || "Uploading..."}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-darkBg-interactive rounded-full h-2">
                                                <div
                                                    className="bg-brand-green dark:bg-brand-gold h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1.5">
                                                {uploadProgress}%
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Caption for the selected attachment */}
                            <textarea
                                value={activeItem.caption}
                                onChange={(e) => setActiveCaption(e.target.value)}
                                placeholder={items.length > 1 ? "Add a caption for this file..." : "Add a caption..."}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-darkBorder-light rounded-lg bg-white dark:bg-darkBg-interactive text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B512] resize-none"
                                rows={2}
                                disabled={uploading}
                            />

                            {/* Tray — pick which attachment to caption, drop one, add more */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setActiveIdx(idx)}
                                            disabled={uploading}
                                            title={item.file.name}
                                            className={`relative h-14 w-14 rounded-md overflow-hidden border-2 flex items-center justify-center bg-gray-50 dark:bg-darkBg-interactive transition-colors ${
                                                idx === activeIdx
                                                    ? "border-brand-green dark:border-brand-gold"
                                                    : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                            }`}
                                        >
                                            {item.previewUrl && item.kind === 'image' ? (
                                                <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                                            ) : item.previewUrl && item.kind === 'video' ? (
                                                <video src={item.previewUrl} muted preload="metadata" className="h-full w-full object-cover" />
                                            ) : (
                                                iconFor(item.kind, "h-6 w-6")
                                            )}
                                            {item.caption.trim() && (
                                                <span className="absolute bottom-0 inset-x-0 h-1 bg-brand-green dark:bg-brand-gold" />
                                            )}
                                        </button>
                                        {!uploading && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.id)}
                                                aria-label={`Remove ${item.file.name}`}
                                                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-gray-900/80 dark:bg-black/80 text-white flex items-center justify-center hover:bg-gray-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {!uploading && onUploadMany && items.length < maxFiles && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        aria-label="Add more files"
                                        className="h-14 w-14 shrink-0 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:border-brand-green dark:hover:border-brand-gold transition-colors"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {/* File Info */}
                            <div className="flex items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-darkBg-interactive px-3 py-2 rounded-lg">
                                <span className="font-medium truncate">{activeItem.file.name}</span>
                                <span className="shrink-0">{formatFileSize(activeItem.file.size)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Shared picker for the empty state and the tray's "+" */}
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple={multiple}
                    accept={accept}
                    onChange={handleFileSelect}
                />

                {/* Footer */}
                {activeItem && (
                    <div className="flex items-center justify-end gap-3 px-4 py-2.5 border-t dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive">
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
                                    {uploadLabel || "Uploading..."}
                                </>
                            ) : (
                                items.length > 1 ? `Send ${items.length}` : "Send"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
