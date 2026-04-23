"use client"

import { useGetLinkPreviewQuery } from "@/states/linkPreviewSlice"
import { ExternalLink, Globe } from "lucide-react"

interface LinkPreviewCardProps {
    /** Fully-qualified, sanitized URL (https://...) */
    url: string
    /** Alters colour treatment so the card matches the sender bubble */
    isMe: boolean
}

export default function LinkPreviewCard({ url, isMe }: LinkPreviewCardProps) {
    const { data, isLoading, isError } = useGetLinkPreviewQuery(url)

    // ── Skeleton while loading ────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div
                className={`mt-2 rounded-lg overflow-hidden border animate-pulse ${
                    isMe
                        ? "border-white/20 bg-white/10"
                        : "border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive"
                }`}
            >
                <div className="flex gap-3 p-3">
                    <div
                        className={`flex-shrink-0 w-16 h-16 rounded ${
                            isMe ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"
                        }`}
                    />
                    <div className="flex-1 space-y-2 py-1">
                        <div className={`h-3 rounded w-3/4 ${isMe ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`} />
                        <div className={`h-2 rounded w-full  ${isMe ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`} />
                        <div className={`h-2 rounded w-1/2  ${isMe ? "bg-white/20" : "bg-gray-200 dark:bg-gray-700"}`} />
                    </div>
                </div>
            </div>
        )
    }

    // ── Nothing to render on error ────────────────────────────────────────────
    if (isError || !data) return null

    // ── Fallback chip — metadata unavailable but URL is valid ─────────────────
    if (data.fallback || (!data.title && !data.description && !data.image)) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 ${
                    isMe
                        ? "bg-white/15 text-white"
                        : "bg-gray-100 dark:bg-darkBg-interactive text-brand-green dark:text-brand-gold border border-gray-200 dark:border-darkBorder-light"
                }`}
            >
                <Globe size={12} className="flex-shrink-0" />
                <span className="truncate">{data.domain}</span>
                <ExternalLink size={11} className="flex-shrink-0 ml-auto" />
            </a>
        )
    }

    // ── Full preview card ─────────────────────────────────────────────────────
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`mt-2 block w-full rounded-lg overflow-hidden border transition-opacity hover:opacity-90 ${
                isMe
                    ? "border-white/20 bg-white/10"
                    : "border-gray-200 dark:border-darkBorder-light bg-gray-50 dark:bg-darkBg-interactive"
            }`}
        >
            {/* Thumbnail */}
            {data.image && (
                <div className="w-full h-32 overflow-hidden bg-gray-100 dark:bg-darkBg-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={data.image}
                        alt={data.title ?? data.domain}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).parentElement!.style.display = "none"
                        }}
                    />
                </div>
            )}

            <div className="p-3">
                {/* Domain row */}
                <div
                    className={`flex items-center gap-1.5 mb-1.5 ${
                        isMe ? "text-white/60" : "text-gray-500 dark:text-gray-400"
                    }`}
                >
                    {data.favicon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={data.favicon}
                            alt=""
                            width={12}
                            height={12}
                            className="w-3 h-3 rounded-sm flex-shrink-0"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none"
                            }}
                        />
                    ) : (
                        <Globe size={11} className="flex-shrink-0" />
                    )}
                    <span className="text-[11px] font-medium uppercase tracking-wide truncate">
                        {data.domain}
                    </span>
                    <ExternalLink size={10} className="ml-auto flex-shrink-0" />
                </div>

                {/* Title */}
                {data.title && (
                    <p
                        className={`text-sm font-semibold leading-snug line-clamp-2 ${
                            isMe ? "text-white" : "text-gray-900 dark:text-white"
                        }`}
                    >
                        {data.title}
                    </p>
                )}

                {/* Description */}
                {data.description && (
                    <p
                        className={`text-xs leading-relaxed mt-1 line-clamp-2 ${
                            isMe ? "text-white/70" : "text-gray-500 dark:text-gray-400"
                        }`}
                    >
                        {data.description}
                    </p>
                )}
            </div>
        </a>
    )
}
