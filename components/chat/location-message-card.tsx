"use client";

import React from "react";
import { Check, Copy, ExternalLink, MapPin } from "lucide-react";
import { MessageCardAction, MessageCardChip, MessageCardShell } from "./message-card-shell";

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

/**
 * A small live preview via OpenStreetMap's public embed — no API key needed.
 * No `marker` parameter: the bbox is centred on the point, so the card draws its
 * own pin at dead centre rather than stacking one on top of OSM's.
 */
export const osmEmbedUrlFor = (latitude: number, longitude: number, delta = 0.006) => {
    const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join("%2C");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
};

/**
 * The embed renders its own attribution bar at a fixed size, which in a card this
 * narrow wraps to three lines and swallows most of the map. The iframe is grown by
 * this much and pulled up by half of it, so the bar falls below the clip while the
 * bbox's centre — the shared coordinate — stays at the centre of what you see.
 * The card credits OpenStreetMap in its header instead.
 */
const OSM_FOOTER_CROP_PX = 120;

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
        <MessageCardShell
            accentBarClassName="bg-rose-400"
            borderClassName={isMe ? "border-rose-200 dark:border-rose-900/40" : undefined}
            icon={<MapPin size={13} className="flex-shrink-0 text-rose-500" />}
            label="Location"
            headerMeta={<MessageCardChip>© OpenStreetMap</MessageCardChip>}
            action={
                <div className="flex gap-2">
                    <MessageCardAction
                        onClick={handleCopy}
                        className="border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
                    >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        {copied ? "Copied" : "Copy"}
                    </MessageCardAction>
                    <MessageCardAction
                        onClick={openInMaps}
                        className="bg-brand-green text-white hover:opacity-90 dark:bg-brand-gold dark:text-darkBg-main"
                    >
                        <ExternalLink size={11} />
                        Open in Maps
                    </MessageCardAction>
                </div>
            }
        >
            {/* Map preview — click opens the full maps app/site */}
            <div className="px-3 pb-2">
                <div
                    role="button"
                    tabIndex={0}
                    onClick={openInMaps}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openInMaps(); }}
                    className="relative h-32 cursor-pointer overflow-hidden rounded-lg border border-gray-100 bg-gray-100 dark:border-darkBorder-light dark:bg-darkBg-interactive"
                    aria-label="Open location in Maps"
                >
                    <iframe
                        src={embedUrl}
                        className="pointer-events-none absolute inset-x-0 w-full border-0"
                        style={{
                            height: `calc(100% + ${OSM_FOOTER_CROP_PX}px)`,
                            top: `-${OSM_FOOTER_CROP_PX / 2}px`,
                        }}
                        loading="lazy"
                        title="Location preview"
                    />
                    {/* Sits on the box's centre, which the offset above keeps aligned
                        with the bbox's centre — the actual shared coordinate */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-red-500 p-1.5 text-white shadow-lg">
                            <MapPin size={16} fill="white" />
                        </div>
                    </div>
                </div>

                <p className="mt-2 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {label || "Current location"}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    {accuracy ? ` · ±${Math.round(accuracy)}m` : ""}
                </p>
            </div>
        </MessageCardShell>
    );
}
