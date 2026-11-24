import { decryptSecureMediaBlob } from "@/lib/e2ee/secureMediaCrypto"
import type { MediaData } from "@/types/chat.types"

/** Everything needed to turn a stored media URL into something displayable */
export type MediaSource = Pick<
    MediaData,
    "mediaUrl" | "mimeType" | "isSecureMedia" | "secureMediaKey" | "secureMediaIv"
>

export const fetchMediaBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`)
    }
    return response.blob()
}

/** Plaintext passes through; secure media is decrypted with the message's own key */
export const decryptMediaBlobIfNeeded = async (blob: Blob, source: MediaSource): Promise<Blob> => {
    const { isSecureMedia, secureMediaKey, secureMediaIv, mimeType } = source
    if (!isSecureMedia || !secureMediaKey || !secureMediaIv) return blob

    return decryptSecureMediaBlob({
        encryptedBlob: blob,
        key: secureMediaKey,
        iv: secureMediaIv,
        originalType: mimeType || "application/octet-stream",
    })
}

/**
 * An object URL the browser can render directly. Callers own the result and must
 * revoke it once the element showing it goes away.
 */
export const resolveMediaObjectUrl = async (source: MediaSource): Promise<string> => {
    if (!source.mediaUrl) throw new Error("No media URL")
    const blob = await decryptMediaBlobIfNeeded(await fetchMediaBlob(source.mediaUrl), source)
    return window.URL.createObjectURL(blob)
}

/** Save the file to disk, decrypting first when it is secure media */
export const downloadMedia = async (source: MediaSource, filename: string): Promise<void> => {
    const url = source.mediaUrl
    if (!url) return

    try {
        const blobUrl = await resolveMediaObjectUrl(source)
        const link = document.createElement("a")
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
        console.error("Download failed:", error)
        // A plaintext file can still be opened directly; an encrypted one cannot
        if (!source.isSecureMedia) {
            window.open(url, "_blank")
        }
    }
}
