'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImageUp, Link2, Loader2, Search, Send, UserRound, Users, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useGetAcceptedContactsQuery } from '@/states/contactSlice';
import { transferActionPurchase, getUserById, getOrganizationById } from '@/helpers/api';
import { toast } from '@/hooks/use-toast';

interface TransferTicketModalProps {
    open: boolean;
    onClose: () => void;
    /** The purchase to transfer (from the QR object's actionPurchaseId) */
    purchaseId: string;
    ticketName: string;
    /** The current owner — used to guard against transferring to yourself */
    senderId: string;
    onTransferred: () => void;
}

interface RecipientUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile?: { profileImage?: string };
}

type Mode = 'contacts' | 'link';

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const fullName = (u: RecipientUser) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
const initials = (u: RecipientUser) =>
    `${(u.firstName || u.email || '?')[0] || ''}${(u.lastName || '')[0] || ''}`.toUpperCase();

/** Pull a user id out of a profile link, full URL, or raw id — QR codes encode the same link. */
const extractUserId = (input: string): string | null => {
    const trimmed = input.trim();
    const welcomeMatch = trimmed.match(/\/welcome\/([^/?#]+)/i);
    if (welcomeMatch) return welcomeMatch[1];
    const uuid = trimmed.match(UUID_RE);
    return uuid ? uuid[0] : null;
};

const Avatar: React.FC<{ user: RecipientUser; size?: number }> = ({ user, size = 36 }) => (
    <div
        className="rounded-full bg-gray-100 dark:bg-darkBg-interactive overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
    >
        {user.profile?.profileImage ? (
            <img src={user.profile.profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
            <span className="text-xs font-bold text-gray-500 dark:text-gray-300">{initials(user)}</span>
        )}
    </div>
);

const TransferTicketModal: React.FC<TransferTicketModalProps> = ({
    open,
    onClose,
    purchaseId,
    ticketName,
    senderId,
    onTransferred,
}) => {
    const { getToken } = useAuthToken();
    const token = getToken();
    const [mode, setMode] = useState<Mode>('contacts');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<RecipientUser | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Link / QR mode
    const [linkInput, setLinkInput] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState<string | null>(null);
    const [resolved, setResolved] = useState<RecipientUser | null>(null);
    const qrFileRef = useRef<HTMLInputElement>(null);

    // Live camera scanning
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const scannerRef = useRef<any>(null);

    const { data, isLoading, error } = useGetAcceptedContactsQuery(token as string, {
        skip: !token || !open,
    });

    const contacts: RecipientUser[] = useMemo(() => {
        const list = (data?.contacts || [])
            .map((c: any) => c.otherUser)
            .filter((u: RecipientUser | undefined): u is RecipientUser => Boolean(u?.id));
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter(
            (u) => fullName(u).toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
        );
    }, [data, search]);

    const reset = () => {
        stopCamera();
        setMode('contacts');
        setSearch('');
        setSelected(null);
        setSubmitting(false);
        setLinkInput('');
        setResolving(false);
        setResolveError(null);
        setResolved(null);
        setCameraError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Look up a recipient from a pasted link / id and preview them before transfer.
    // A /welcome/:id link can point at a person or an organization, so try both.
    const resolveRecipient = async (rawInput: string) => {
        const id = extractUserId(rawInput);
        setResolved(null);
        setResolveError(null);
        if (!id) {
            setResolveError('Could not find a profile link or ID in that text.');
            return;
        }
        if (id === senderId) {
            setResolveError('That is your own profile — pick someone else.');
            return;
        }
        try {
            setResolving(true);

            // A person can receive a ticket
            try {
                const res = await getUserById(id);
                const user = (res.data?.data ?? res.data) as RecipientUser;
                if (user?.id) {
                    setResolved(user);
                    return;
                }
            } catch { /* fall through to the organization check */ }

            // An organization profile link is valid but can't own a personal ticket
            try {
                const orgRes = await getOrganizationById(id);
                const org = orgRes.data?.data ?? orgRes.data;
                if (org?.id) {
                    setResolveError('That link is an organization — tickets can only be sent to a person.');
                    return;
                }
            } catch { /* neither user nor org */ }

            setResolveError('No account found for that link or QR code.');
        } finally {
            setResolving(false);
        }
    };

    const stopCamera = useCallback(() => {
        if (scannerRef.current) {
            try { scannerRef.current.stop(); scannerRef.current.destroy(); } catch { /* already gone */ }
            scannerRef.current = null;
        }
        setCameraActive(false);
    }, []);

    // Open the device camera and resolve the recipient from a scanned profile QR
    const startCamera = async () => {
        setCameraError(null);
        setResolveError(null);
        try {
            const QrScanner = (await import('qr-scanner')).default;
            if (!(await QrScanner.hasCamera())) {
                setCameraError('No camera was found on this device.');
                return;
            }
            setCameraActive(true);
            // Let the <video> mount before attaching the scanner
            await new Promise((r) => setTimeout(r, 60));
            if (!videoRef.current) return;
            const scanner = new QrScanner(
                videoRef.current,
                (result: any) => {
                    const text = typeof result === 'string' ? result : result?.data;
                    if (!text) return;
                    stopCamera();
                    setLinkInput(text);
                    resolveRecipient(text);
                },
                { returnDetailedScanResult: true, preferredCamera: 'environment', highlightScanRegion: true, maxScansPerSecond: 5 }
            );
            scannerRef.current = scanner;
            await scanner.start();
        } catch (err: any) {
            stopCamera();
            setCameraError(
                err?.name === 'NotAllowedError'
                    ? 'Camera permission was denied. Allow access or upload a photo of the QR instead.'
                    : 'Could not start the camera. Try uploading a photo of the QR instead.'
            );
        }
    };

    // Tear the camera down whenever the modal closes or leaves link mode
    useEffect(() => {
        if (!open || mode !== 'link') stopCamera();
    }, [open, mode, stopCamera]);
    useEffect(() => () => stopCamera(), [stopCamera]);

    // Decode a QR image (or a photo taken on mobile) and resolve the encoded profile link
    const handleQrFile = async (file: File) => {
        try {
            setResolveError(null);
            setResolving(true);
            const QrScanner = (await import('qr-scanner')).default;
            const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
            const text = typeof result === 'string' ? result : result.data;
            setLinkInput(text);
            await resolveRecipient(text);
        } catch {
            setResolveError('Could not read a QR code from that image.');
            setResolving(false);
        }
    };

    const recipient = mode === 'contacts' ? selected : resolved;

    const handleTransfer = async () => {
        if (!recipient) return;
        try {
            setSubmitting(true);
            await transferActionPurchase(purchaseId, recipient.id);
            toast({
                title: 'Ticket transferred',
                description: `"${ticketName}" is now owned by ${fullName(recipient)}.`,
            });
            onTransferred();
            handleClose();
        } catch (err: any) {
            toast({
                title: 'Transfer failed',
                description: err?.response?.data?.message || err?.message || 'Could not transfer the ticket.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    const tabClass = (active: boolean) =>
        `flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
            active
                ? 'bg-white dark:bg-darkBg-card text-[#00B512] shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`;

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
            <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-2xl w-[calc(100vw-2rem)] max-w-md p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-darkBorder-light">
                    <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-[#00B512]" />
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Transfer ticket</p>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5 truncate">
                        Send <span className="font-semibold text-gray-700 dark:text-gray-200">{ticketName}</span> to someone
                    </p>
                </div>

                <div className="p-5 space-y-4">
                    {/* Mode toggle */}
                    <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-darkBg-interactive">
                        <button type="button" onClick={() => setMode('contacts')} className={tabClass(mode === 'contacts')}>
                            <Users className="w-3.5 h-3.5" /> My contacts
                        </button>
                        <button type="button" onClick={() => setMode('link')} className={tabClass(mode === 'link')}>
                            <Link2 className="w-3.5 h-3.5" /> Link or QR
                        </button>
                    </div>

                    {mode === 'contacts' ? (
                        <>
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search contacts..."
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#00B512] transition-colors"
                                />
                            </div>

                            {/* Contact list */}
                            <div className="max-h-56 overflow-y-auto -mx-1 px-1 space-y-1.5">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                    </div>
                                ) : error ? (
                                    <p className="text-center text-sm text-red-500 py-8">Could not load your contacts.</p>
                                ) : contacts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserRound className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {search ? 'No contacts match your search.' : 'No contacts yet — use a link or QR instead.'}
                                        </p>
                                    </div>
                                ) : (
                                    contacts.map((u) => {
                                        const isSelected = selected?.id === u.id;
                                        return (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => setSelected(isSelected ? null : u)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                                    isSelected
                                                        ? 'border-[#00B512] bg-[#00B512]/5'
                                                        : 'border-gray-100 dark:border-darkBorder-light hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <Avatar user={u} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fullName(u)}</p>
                                                    {u.email && <p className="text-xs text-gray-400 truncate">{u.email}</p>}
                                                </div>
                                                {isSelected && (
                                                    <span className="w-5 h-5 rounded-full bg-[#00B512] flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Paste link / id */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                    Profile link or ID
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        value={linkInput}
                                        onChange={(e) => { setLinkInput(e.target.value); setResolved(null); setResolveError(null); }}
                                        onBlur={() => linkInput.trim() && resolveRecipient(linkInput)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') resolveRecipient(linkInput); }}
                                        placeholder=".../welcome/USER-ID"
                                        className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#00B512] transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => resolveRecipient(linkInput)}
                                        disabled={!linkInput.trim() || resolving}
                                        className="px-3 rounded-xl bg-gray-100 dark:bg-darkBg-interactive text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-darkBorder-light disabled:opacity-40 transition-colors"
                                    >
                                        Find
                                    </button>
                                </div>

                                {/* Live camera view */}
                                {cameraActive ? (
                                    <div className="relative rounded-xl overflow-hidden bg-black aspect-square">
                                        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                            <div className="w-2/3 aspect-square border-2 border-white/70 rounded-2xl" />
                                        </div>
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
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:border-[#00B512] hover:text-[#00B512] transition-colors"
                                        >
                                            <Camera className="w-4 h-4" /> Scan QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => qrFileRef.current?.click()}
                                            className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:border-[#00B512] hover:text-[#00B512] transition-colors"
                                        >
                                            <ImageUp className="w-4 h-4" /> Upload QR
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={qrFileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrFile(f); e.target.value = ''; }}
                                />
                                {cameraError && (
                                    <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2">
                                        {cameraError}
                                    </p>
                                )}
                            </div>

                            {/* Resolution state */}
                            {resolving && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Looking up account...
                                </div>
                            )}
                            {resolveError && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2">
                                    {resolveError}
                                </p>
                            )}
                            {resolved && !resolving && (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#00B512] bg-[#00B512]/5">
                                    <Avatar user={resolved} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{fullName(resolved)}</p>
                                        {resolved.email && <p className="text-xs text-gray-400 truncate">{resolved.email}</p>}
                                    </div>
                                    <Check className="w-5 h-5 text-[#00B512] flex-shrink-0" />
                                </div>
                            )}
                        </>
                    )}

                    {recipient && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-lg px-3 py-2">
                            Ownership moves immediately and cannot be undone — {fullName(recipient)} would need to transfer it back.
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleTransfer}
                            disabled={!recipient || submitting}
                            className="flex-1 py-2.5 rounded-xl bg-[#00B512] hover:bg-[#00a010] disabled:opacity-40 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {submitting ? 'Transferring...' : 'Transfer'}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TransferTicketModal;
