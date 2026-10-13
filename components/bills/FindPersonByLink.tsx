"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Camera, ImageUp, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getUserById, getOrganizationById } from "@/helpers/api"

export interface FoundPerson {
    id: string
    name: string
    avatar?: string
}

interface FindPersonByLinkProps {
    /** Called with the person behind a pasted profile link or a scanned profile QR. */
    onFound: (person: FoundPerson) => void
    /** Return an error message to reject a person (yourself, the recipient, already added...). */
    validate?: (person: FoundPerson) => string | null
    disabled?: boolean
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** Pull a user id out of a profile link, full URL, or raw id. Profile QR codes encode the same link. */
const extractUserId = (input: string): string | null => {
    const trimmed = input.trim()
    const welcomeMatch = trimmed.match(/\/welcome\/([^/?#]+)/i)
    if (welcomeMatch) return welcomeMatch[1]
    const uuid = trimmed.match(UUID_RE)
    return uuid ? uuid[0] : null
}

const dashedButton =
    "inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:border-brand-green hover:text-brand-green dark:hover:border-brand-gold dark:hover:text-brand-gold transition-colors disabled:opacity-40"

/**
 * Add someone who isn't a contact, the same way the rest of the app does: their profile link
 * (pasted) or their profile QR (camera or a photo of it).
 */
export default function FindPersonByLink({ onFound, validate, disabled }: FindPersonByLinkProps) {
    const [linkInput, setLinkInput] = useState("")
    const [resolving, setResolving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cameraActive, setCameraActive] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const scannerRef = useRef<any>(null)
    const qrFileRef = useRef<HTMLInputElement>(null)

    const stopCamera = useCallback(() => {
        if (scannerRef.current) {
            try { scannerRef.current.stop(); scannerRef.current.destroy() } catch { /* already gone */ }
            scannerRef.current = null
        }
        setCameraActive(false)
    }, [])
    useEffect(() => () => stopCamera(), [stopCamera])

    // A /welcome/:id link can point at a person or an organization; only a person can owe a share.
    const resolve = async (raw: string) => {
        const id = extractUserId(raw)
        setError(null)
        if (!id) {
            setError("Could not find a profile link or ID in that text.")
            return
        }
        setResolving(true)
        try {
            try {
                const res = await getUserById(id)
                const user = res.data?.data ?? res.data
                if (user?.id) {
                    const person: FoundPerson = {
                        id: user.id,
                        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User",
                        avatar: user.profile?.profileImage,
                    }
                    const rejection = validate?.(person)
                    if (rejection) {
                        setError(rejection)
                        return
                    }
                    onFound(person)
                    setLinkInput("")
                    return
                }
            } catch { /* fall through to the organization check */ }

            try {
                const orgRes = await getOrganizationById(id)
                const org = orgRes.data?.data ?? orgRes.data
                if (org?.id) {
                    setError("That link is an organization. Only people can pay a share.")
                    return
                }
            } catch { /* neither user nor org */ }

            setError("No account found for that link or QR code.")
        } finally {
            setResolving(false)
        }
    }

    const startCamera = async () => {
        setError(null)
        try {
            const QrScanner = (await import("qr-scanner")).default
            if (!(await QrScanner.hasCamera())) {
                setError("No camera was found on this device.")
                return
            }
            setCameraActive(true)
            // Let the <video> mount before attaching the scanner
            await new Promise((r) => setTimeout(r, 60))
            if (!videoRef.current) return
            const scanner = new QrScanner(
                videoRef.current,
                (result: any) => {
                    const text = typeof result === "string" ? result : result?.data
                    if (!text) return
                    stopCamera()
                    resolve(text)
                },
                { returnDetailedScanResult: true, preferredCamera: "environment", highlightScanRegion: true, maxScansPerSecond: 5 }
            )
            scannerRef.current = scanner
            await scanner.start()
        } catch (err: any) {
            stopCamera()
            setError(
                err?.name === "NotAllowedError"
                    ? "Camera permission was denied. Allow access or upload a photo of the QR instead."
                    : "Could not start the camera. Try uploading a photo of the QR instead."
            )
        }
    }

    const handleQrFile = async (file: File) => {
        try {
            setError(null)
            const QrScanner = (await import("qr-scanner")).default
            const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
            await resolve(typeof result === "string" ? result : result.data)
        } catch {
            setError("Could not read a QR code from that image.")
        }
    }

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={linkInput}
                    disabled={disabled}
                    placeholder="Paste their profile link"
                    onChange={(e) => { setLinkInput(e.target.value); setError(null) }}
                    onKeyDown={(e) => { if (e.key === "Enter" && linkInput.trim()) resolve(linkInput) }}
                />
                <button
                    type="button"
                    onClick={() => resolve(linkInput)}
                    disabled={disabled || !linkInput.trim() || resolving}
                    className="px-3 rounded-xl bg-gray-100 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-darkBorder-light disabled:opacity-40 transition-colors inline-flex items-center"
                >
                    {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
            </div>

            {cameraActive ? (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    <button
                        type="button"
                        onClick={stopCamera}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                        aria-label="Stop camera"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/90 text-xs bg-black/50 px-2.5 py-1 rounded-full">
                        Point at their profile QR
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" disabled={disabled} onClick={startCamera} className={dashedButton}>
                        <Camera className="w-4 h-4" /> Scan QR
                    </button>
                    <button type="button" disabled={disabled} onClick={() => qrFileRef.current?.click()} className={dashedButton}>
                        <ImageUp className="w-4 h-4" /> Upload QR
                    </button>
                </div>
            )}
            <input
                ref={qrFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrFile(f); e.target.value = "" }}
            />

            {error && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
        </div>
    )
}
