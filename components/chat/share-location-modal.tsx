"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2, MapPin, Send, TriangleAlert } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { osmEmbedUrlFor } from "./location-message-card";

interface ShareLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    chatId?: string;
}

type Coords = { latitude: number; longitude: number; accuracy: number | null };
type Status = "locating" | "ready" | "denied" | "unsupported" | "error";

export default function ShareLocationModal({ isOpen, onClose, chatId }: ShareLocationModalProps) {
    const [status, setStatus] = useState<Status>("locating");
    const [coords, setCoords] = useState<Coords | null>(null);
    // Same path the composer uses for a normal text message — it picks HTTP vs the
    // end-to-end encrypted secure-chat flow itself, unlike the plain REST mutation
    // (which the backend refuses outright for secure conversations).
    const { sendMessage } = useChat();

    // Ask for a fresh fix every time the modal opens — a stale position from an
    // earlier share could put someone in the wrong place.
    useEffect(() => {
        if (!isOpen) return;
        setStatus("locating");
        setCoords(null);

        if (typeof navigator === "undefined" || !navigator.geolocation) {
            setStatus("unsupported");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy ?? null,
                });
                setStatus("ready");
            },
            (err) => {
                setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [isOpen]);

    const handleSend = () => {
        if (!coords || !chatId) return;
        const payload = {
            type: "location",
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            label: "My current location",
            timestamp: new Date().toISOString(),
        };
        // Fire-and-forget, same as the composer: it shows the message optimistically
        // and surfaces its own toast if the send fails, so we just close here.
        sendMessage(chatId, JSON.stringify(payload), "text");
        onClose();
    };

    const embedUrl = coords ? osmEmbedUrlFor(coords.latitude, coords.longitude) : null;

    const errorMessage =
        status === "denied"
            ? "Location access was blocked. Allow location for this site in your browser settings, then try again."
            : status === "unsupported"
                ? "Your browser doesn't support sharing location."
                : "Couldn't get your location. Check your device's location settings and try again.";

    return (
        <Dialog open={isOpen} onOpenChange={(next) => { if (!next) onClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-sm p-0 gap-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-green dark:text-brand-gold" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Share your location</p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        Sends a card they can open in Maps to see exactly where you are.
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {status === "locating" && (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Finding your location...</p>
                        </div>
                    )}

                    {(status === "denied" || status === "unsupported" || status === "error") && (
                        <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 px-3 py-3 flex items-start gap-2">
                            <TriangleAlert className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">{errorMessage}</p>
                        </div>
                    )}

                    {status === "ready" && coords && (
                        <>
                            <div className="relative h-36 rounded-xl overflow-hidden border border-gray-100 dark:border-darkBorder-light bg-gray-100 dark:bg-darkBg-interactive">
                                {embedUrl && (
                                    <iframe
                                        src={embedUrl}
                                        className="w-full h-full pointer-events-none"
                                        loading="lazy"
                                        title="Location preview"
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-red-500 text-white rounded-full p-1.5 shadow-lg -translate-y-3">
                                        <MapPin size={16} fill="white" />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                                {coords.accuracy ? ` · accurate to ~${Math.round(coords.accuracy)}m` : ""}
                            </p>
                        </>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={status !== "ready"}
                            className="flex-1 py-2.5 rounded-xl bg-brand-green dark:bg-brand-gold hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Send location
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
