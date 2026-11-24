"use client"

import { useEffect, useMemo, useState } from "react"
import { Lock, Play } from "lucide-react"
import ImageLightbox from "@/components/ui/image-lightbox"
import { formatDuration } from "@/services/mediaService"
import { downloadMedia, resolveMediaObjectUrl, type MediaSource } from "@/utils/mediaSource"
import { getChatPreviewText } from "@/utils/chatPreview"

/** One photo or video of a bundle, as the thread knows it */
export interface AlbumItem extends MediaSource {
    id: string
    content?: string
    mediaType?: string
    thumbnailUrl?: string
    fileName?: string
    duration?: number
}

interface MediaAlbumContentProps {
    items: AlbumItem[]
}

/** Four tiles at most; the rest live behind the "+N" on the last one */
const VISIBLE_TILES = 4

/** A caption the backend wrote for us is furniture, not something the sender typed */
function realCaption(item: AlbumItem): string | undefined {
    const content = item.content
    if (!content) return undefined
    const placeholder = getChatPreviewText({ messageType: item.mediaType })
    if (content === `Sent a ${item.mediaType}` || content === placeholder) return undefined
    return content
}

/**
 * Photos and videos sent together, bundled into one bubble the way WhatsApp
 * does it: a 2-up, 3-up or 2x2 grid, extras folded behind a "+N", and the whole
 * set opening in the fullscreen viewer from whichever tile was tapped.
 */
export default function MediaAlbumContent({ items }: MediaAlbumContentProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    /**
     * Plaintext media can be shown straight from its URL; secure media has to be
     * fetched and decrypted first, so those slots start empty and fill in.
     */
    const [sources, setSources] = useState<(string | null)[]>(() =>
        items.map((item) => (item.isSecureMedia ? null : item.mediaUrl ?? null))
    )
    // Identity of the bundle itself — a re-render with an equal array must not
    // re-run the decryption below
    const albumKey = items.map((item) => item.id).join("|")

    useEffect(() => {
        setSources(items.map((item) => (item.isSecureMedia ? null : item.mediaUrl ?? null)))

        const secure = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.isSecureMedia && item.mediaUrl)
        if (!secure.length) return

        let cancelled = false
        const created: string[] = []

        void Promise.all(
            secure.map(async ({ item, index }) => {
                try {
                    const url = await resolveMediaObjectUrl(item)
                    if (cancelled) {
                        window.URL.revokeObjectURL(url)
                        return
                    }
                    created.push(url)
                    setSources((prev) => {
                        const next = [...prev]
                        next[index] = url
                        return next
                    })
                } catch (error) {
                    // The tile keeps its locked placeholder
                    console.error("Secure album preview failed:", error)
                }
            })
        )

        return () => {
            cancelled = true
            created.forEach((url) => window.URL.revokeObjectURL(url))
        }
        // Keyed by the bundle's members, not the array instance
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [albumKey])

    const visible = items.slice(0, VISIBLE_TILES)
    const hiddenCount = items.length - visible.length

    // Only what has a usable source can be opened, so the viewer's indexes are
    // its own and map back through this list
    const viewable = useMemo(
        () =>
            items
                .map((item, index) => ({ item, url: sources[index] }))
                .filter((entry): entry is { item: AlbumItem; url: string } => Boolean(entry.url)),
        [items, sources]
    )

    const openFrom = (index: number) => {
        const target = items[index]
        const position = viewable.findIndex((entry) => entry.item.id === target.id)
        setLightboxIndex(position === -1 ? 0 : position)
    }

    const captions = items.map(realCaption).filter(Boolean) as string[]
    // A set captioned once reads as one thought, so show it under the grid; when
    // several items carry their own, each belongs to its own tile in the viewer
    const sharedCaption = captions.length === 1 ? captions[0] : undefined

    const gridClass =
        items.length === 3
            ? "grid-cols-2 grid-rows-2"
            : "grid-cols-2"

    return (
        <div className="space-y-2">
            <div className={`grid ${gridClass} gap-0.5 w-[16rem] sm:w-[20rem] rounded-lg overflow-hidden`}>
                {visible.map((item, index) => {
                    const url = sources[index]
                    const isVideo = item.mediaType === "video"
                    // In a 3-up the first tile stands full height beside the stack
                    const tall = items.length === 3 && index === 0
                    const overlayCount = index === VISIBLE_TILES - 1 ? hiddenCount : 0

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => url && openFrom(index)}
                            disabled={!url}
                            aria-label={
                                overlayCount > 0
                                    ? `Open bundle, ${overlayCount} more`
                                    : `Open ${isVideo ? "video" : "photo"} ${index + 1} of ${items.length}`
                            }
                            className={`relative block overflow-hidden bg-gray-200 dark:bg-white/10 ${
                                tall ? "row-span-2 h-full" : "aspect-square"
                            } ${url ? "cursor-pointer hover:opacity-90 transition-opacity" : "cursor-default"}`}
                        >
                            {!url ? (
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-brand-green dark:text-brand-gold" />
                                </span>
                            ) : isVideo ? (
                                item.thumbnailUrl && !item.isSecureMedia ? (
                                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
                                )
                            ) : (
                                <img src={url} alt={item.fileName || ""} className="h-full w-full object-cover" />
                            )}

                            {url && isVideo && !overlayCount && (
                                <>
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55">
                                            <Play className="h-4 w-4 text-white" fill="currentColor" />
                                        </span>
                                    </span>
                                    {item.duration ? (
                                        <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                                            {formatDuration(item.duration)}
                                        </span>
                                    ) : null}
                                </>
                            )}

                            {overlayCount > 0 && (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xl font-semibold text-white">
                                    +{overlayCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {sharedCaption && <p className="text-sm">{sharedCaption}</p>}

            {lightboxIndex !== null && viewable.length > 0 && (
                <ImageLightbox
                    images={viewable.map((entry) => entry.url)}
                    kinds={viewable.map((entry) => (entry.item.mediaType === "video" ? "video" : "image"))}
                    captions={viewable.map((entry) => realCaption(entry.item))}
                    index={Math.min(lightboxIndex, viewable.length - 1)}
                    alt="Album"
                    onClose={() => setLightboxIndex(null)}
                    onIndexChange={setLightboxIndex}
                    onDownload={(index) => {
                        const entry = viewable[index]
                        if (entry) void downloadMedia(entry.item, entry.item.fileName || `media-${index + 1}`)
                    }}
                />
            )}
        </div>
    )
}
