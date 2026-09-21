"use client";

import React from "react";
import { Check, Copy, ExternalLink, MapPin } from "lucide-react";

// ─── types ───────────────────────────────────────────────────────────────────

export interface LocationMessageData {
    type: "location";
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    label?: string;
    timestamp?: string;
}

interface Props {
    data: LocationMessageData;
    isMe: boolean;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const isAppleDevice = () =>
    typeof navigator !== "undefined" && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document;

/** A URL that opens a maps app for the platform it's clicked on — Apple Maps on
 *  iOS (matching the system share sheet), Google Maps everywhere else since that
 *  works from any browser without requiring an app to be installed. */
export const mapsUrlFor = (latitude: number, longitude: number, label?: string) =>
    isAppleDevice()
        ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(label || "Shared location")}`
        : `https://www.google.com/maps?q=${latitude},${longitude}`;

/** A small live preview via OpenStreetMap's public embed — no API key needed */
export const osmEmbedUrlFor = (latitude: number, longitude: number, delta = 0.006) => {
    const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join("%2C");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
};

// ─── component ───────────────────────────────────────────────────────────────

export function LocationMessageCard({ data, isMe }: Props) {
    const { latitude, longitude, accuracy, label } = data;
    const [copied, setCopied] = React.useState(false);

    const mapsUrl = mapsUrlFor(latitude, longitude, label);
    const embedUrl = osmEmbedUrlFor(latitude, longitude);

    const openInMaps = () => window.open(mapsUrl, "_blank", "noopener,noreferrer");

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${latitude}, ${longitude}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // clipboard unavailable — silently ignore
        }
    };

    return (
        <div className="w-[260px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
            {/* Map preview — click opens the full maps app/site */}
            <div
                role="button"
                tabIndex={0}
                onClick={openInMaps}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openInMaps(); }}
                className="relative h-32 bg-gray-100 dark:bg-darkBg-interactive cursor-pointer"
                aria-label="Open location in Maps"
            >
                <iframe
                    src={embedUrl}
                    className="w-full h-full pointer-events-none"
                    loading="lazy"
                    title="Location preview"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500 text-white rounded-full p-1.5 shadow-lg -translate-y-3">
                        <MapPin size={16} fill="white" />
                    </div>
                </div>
            </div>

            <div className="p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-brand-green dark:text-brand-gold flex-shrink-0" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {label || "Current location"}
                    </p>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    {accuracy ? ` · ±${Math.round(accuracy)}m` : ""}
                </p>

                <div className="flex gap-2 pt-0.5">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex-1 h-7 rounded-lg border border-gray-200 dark:border-darkBorder-light text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive flex items-center justify-center gap-1 transition-colors"
                    >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? "Copied" : "Copy"}
                    </button>
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-7 rounded-lg bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main text-[11px] font-bold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
                    >
                        <ExternalLink size={11} />
                        Open in Maps
                    </a>
                </div>
            </div>
        </div>
    );
}
