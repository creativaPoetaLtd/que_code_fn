'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useUserInfo } from '@/hooks/use-user-info';
import { useToast } from '@/hooks/use-toast';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Edit2,
    ExternalLink,
    Link as LinkIcon,
    Loader2,
    Maximize2,
    Package,
    QrCode,
    Save,
    Share2,
    ShoppingCart,
    Trash2,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import ImageCarousel from '@/components/ui/image-carousel';
import ImageLightbox from '@/components/ui/image-lightbox';
import ShareQrDialog from '@/components/ui/share-qr-dialog';
import SocialLinksRow from '@/components/ui/social-links';
import type { SocialLinks } from '@/types/action.types';
import { parseMetadata } from '@/utils/subActionMetadata';

interface SubAction {
    id: string;
    actionId: string;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    stockReserved?: number;
    variants?: Record<string, any>;
    metadata?: Record<string, any> & { socialLinks?: SocialLinks };
    isActive?: boolean;
    sortOrder?: number;
    coverImage?: string;
    images?: string[];
    dedicatedQrCodeData?: string;
    createdAt?: string;
    updatedAt?: string;
    parentActionType?: string;
    wallet?: { id: string; balance: number; currency: string };
}

interface ParentAction {
    id: string;
    name: string;
    type: string;
    description?: string;
    shortDescription?: string;
    status: 'draft' | 'published' | 'archived';
    pricing?: { mode: string };
    currency?: string;
    coverImage?: string | null;
    buyerFields?: string[];
    availability?: { startsAt?: string; endsAt?: string; userQuota?: number | null };
    metadata?: Record<string, any>;
    fulfillment?: { postPurchaseMessage?: string | null };
}

const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Metadata is free-form JSON, so arrays and objects have to be rendered readably
const formatMetaValue = (value: unknown): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(formatMetaValue).join(', ');
    if (typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${formatMetaValue(v)}`)
            .join(' · ');
    }
    return String(value);
};

const editFieldClass =
    'w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-xl px-4 py-2.5 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none transition-colors';

const ctaLabel = (type?: string) => {
    switch (type) {
        case 'vote': return 'Vote now';
        case 'booking': return 'Book now';
        case 'donation': return 'Donate';
        case 'subscription': return 'Subscribe';
        case 'payment':
        case 'transport': return 'Pay now';
        default: return 'Buy now';
    }
};

export default function SubActionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const actionId = params?.userId as string;
    const subactionId = params?.subactionId as string;
    const { getToken } = useAuthToken();
    const { userId: tokenUserId, accountType } = useUserInfo();
    const { toast } = useToast();

    const [subAction, setSubAction] = useState<SubAction | null>(null);
    const [parentAction, setParentAction] = useState<ParentAction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState<SubAction | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Purchase state
    const [purchaseQuantity, setPurchaseQuantity] = useState(1);
    const [buyerData, setBuyerData] = useState<Record<string, string>>({});
    const [customAmount, setCustomAmount] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [purchaseResult, setPurchaseResult] = useState<{
        referenceId: string;
        description: string;
        buyerBalanceAfter: number;
        buyerCurrency: string;
        qrCodeData?: string;
    } | null>(null);
    const [isPurchaseSuccessOpen, setIsPurchaseSuccessOpen] = useState(false);
    const [showPurchaseForm, setShowPurchaseForm] = useState(false);
    const [detailsExpanded, setDetailsExpanded] = useState(false);
    const [heroScrolledPast, setHeroScrolledPast] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [siblings, setSiblings] = useState<SubAction[]>([]);
    const [copied, setCopied] = useState(false);
    const [showShareQr, setShowShareQr] = useState(false);

    // The sticky bar only shows the title once the hero title has scrolled out of view
    useEffect(() => {
        const onScroll = () => setHeroScrolledPast(window.scrollY > 220);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const isOwner = actionId === tokenUserId && accountType === 'organization';

    const fetchDetails = useCallback(async () => {
        if (!subactionId) { setError('Missing parameters'); setLoading(false); return; }
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        try {
            setLoading(true);
            setError(null);
            const subRes = await axios.get(`${baseUrl}/sub-actions/${subactionId}`, { headers });
            const found: SubAction = subRes.data?.data || subRes.data;
            if (!found) { setError('Not found'); setLoading(false); return; }
            found.metadata = parseMetadata(found.metadata);
            const actionRes = await axios.get(`${baseUrl}/actions/${found.actionId}`, { headers });
            const foundAction: ParentAction = actionRes.data?.data || actionRes.data;
            setSubAction(found);
            setParentAction(foundAction);
            setEditFormData(found);

            // Siblings power the share-of-vote bar and the leader gap; a failure here is not fatal
            try {
                const siblingRes = await axios.get(`${baseUrl}/actions/${found.actionId}/sub-actions`, { headers });
                const list: SubAction[] = siblingRes.data?.data ?? [];
                setSiblings(
                    Array.isArray(list)
                        ? list.map(item => ({ ...item, metadata: parseMetadata(item.metadata) }))
                        : []
                );
            } catch {
                setSiblings([]);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [subactionId, getToken]);

    useEffect(() => { fetchDetails(); }, [fetchDetails]);

    const handleSaveEdit = async () => {
        if (!editFormData || !parentAction) return;
        const token = getToken();
        if (!token) return;
        try {
            setIsSaving(true);
            await axios.put(
                `${baseUrl}/sub-actions/${subactionId}`,
                { name: editFormData.name, price: editFormData.price, description: editFormData.description || null, stock: editFormData.stock || null, metadata: editFormData.metadata || {} },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSubAction(editFormData);
            setIsEditing(false);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const token = getToken();
        if (!token) return;
        try {
            setIsSaving(true);
            await axios.delete(`${baseUrl}/sub-actions/${subactionId}`, { headers: { Authorization: `Bearer ${token}` } });
            router.push(`/action/${actionId}`);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Failed to delete');
            setIsSaving(false);
        }
    };

    const handlePurchase = async () => {
        if (!parentAction || !subAction) return;
        if (purchaseQuantity <= 0) { setPurchaseError('Enter a valid quantity'); return; }
        if (parentAction.pricing?.mode === 'pay_what_you_want') {
            const amt = parseFloat(customAmount);
            if (!customAmount || isNaN(amt) || amt <= 0) { setPurchaseError('Enter a valid amount'); return; }
        }
        if (subAction.stock != null && purchaseQuantity > subAction.stock) {
            setPurchaseError(`Only ${subAction.stock} available`); return;
        }
        const requiredFields = parentAction.buyerFields?.length
            ? parentAction.buyerFields.filter(f => f !== 'notes')
            : ['fullName', 'email', 'phone'];
        const missing = requiredFields.filter(f => !buyerData[f]?.trim());
        if (missing.length) {
            const labels: Record<string, string> = { fullName: 'Full Name', firstName: 'First Name', lastName: 'Last Name', email: 'Email', phone: 'Phone', phoneNumber: 'Phone Number', address: 'Address', city: 'City', country: 'Country', zipCode: 'Zip Code', idNumber: 'ID Number' };
            setPurchaseError(`Please fill in: ${missing.map(f => labels[f] || f).join(', ')}`); return;
        }
        try {
            setIsPurchasing(true);
            setPurchaseError(null);
            const token = getToken();
            if (!token) { setPurchaseError('Please login to continue'); setIsPurchasing(false); return; }
            if (!tokenUserId) { setPurchaseError('User ID not found. Please login again.'); setIsPurchasing(false); return; }
            const body: any = { subActionId: subactionId, quantity: purchaseQuantity, buyerId: tokenUserId, buyerData };
            if (parentAction.pricing?.mode === 'pay_what_you_want') body.amount = parseFloat(customAmount);
            const res = await axios.post(`${baseUrl}/actions/${parentAction.id}/purchase`, body, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const result = res.data?.data;
            setShowPurchaseForm(false);
            setPurchaseQuantity(1);
            setBuyerData({});
            setCustomAmount('');
            if (result?.transaction) {
                setPurchaseResult({
                    referenceId: result.transaction.referenceId || '',
                    description: result.transaction.description || '',
                    buyerBalanceAfter: result.wallets?.buyer?.balanceAfter ?? 0,
                    buyerCurrency: result.wallets?.buyer?.currency || 'RWF',
                    qrCodeData: result.qrObject?.qrCodeData,
                });
                setIsPurchaseSuccessOpen(true);
            } else {
                toast({ title: 'Success!', description: `Completed for ${subAction.name}.` });
            }
        } catch (err: any) {
            setPurchaseError(err?.response?.data?.message || err?.message || 'Operation failed.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const updateBuyerData = (field: string, value: string) => {
        setBuyerData(prev => ({ ...prev, [field]: value }));
        setPurchaseError(null);
    };

    const renderBuyerField = (field: string, value: string, isRequired: boolean) => {
        const configs: Record<string, { label: string; type: string; placeholder: string }> = {
            fullName: { label: 'Full Name', type: 'text', placeholder: 'Enter full name' },
            firstName: { label: 'First Name', type: 'text', placeholder: 'Enter first name' },
            lastName: { label: 'Last Name', type: 'text', placeholder: 'Enter last name' },
            email: { label: 'Email', type: 'email', placeholder: 'Enter email address' },
            phone: { label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
            phoneNumber: { label: 'Phone Number', type: 'tel', placeholder: 'Enter phone number' },
            address: { label: 'Address', type: 'text', placeholder: 'Enter address' },
            city: { label: 'City', type: 'text', placeholder: 'Enter city' },
            country: { label: 'Country', type: 'text', placeholder: 'Enter country' },
            zipCode: { label: 'Zip Code', type: 'text', placeholder: 'Enter zip code' },
            idNumber: { label: 'ID Number', type: 'text', placeholder: 'Enter ID number' },
            notes: { label: 'Notes', type: 'text', placeholder: 'Add notes (optional)' },
        };
        const cfg = configs[field] || { label: field, type: 'text', placeholder: `Enter ${field}` };
        return (
            <div key={field} className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8da0b3] flex items-center gap-1">
                    {cfg.label}{isRequired && <span className="text-red-400">*</span>}
                </label>
                {field === 'notes' ? (
                    <textarea
                        value={value}
                        onChange={e => updateBuyerData(field, e.target.value)}
                        rows={3}
                        placeholder={cfg.placeholder}
                        className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none resize-none transition-colors"
                    />
                ) : (
                    <input
                        type={cfg.type}
                        value={value}
                        onChange={e => updateBuyerData(field, e.target.value)}
                        placeholder={cfg.placeholder}
                        className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none transition-colors"
                    />
                )}
            </div>
        );
    };

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#8da0b3] animate-spin" />
            </div>
        );
    }

    if (error || !subAction || !parentAction) {
        return (
            <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 px-4">
                <div className="bg-[#111927] border border-red-500/20 rounded-2xl p-8 text-center max-w-sm w-full">
                    <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                    <p className="text-[#f0f4f8] font-bold mb-1">Something went wrong</p>
                    <p className="text-[#8da0b3] text-sm mb-5">{error || 'Item not found'}</p>
                    <button
                        onClick={fetchDetails}
                        className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] rounded-xl text-white font-bold text-sm transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const isPWYW = parentAction.pricing?.mode === 'pay_what_you_want';
    const stock = subAction.stock ?? null;
    const userQuota = parentAction.availability?.userQuota ?? null;
    const maxQty = userQuota && stock != null ? Math.min(userQuota, stock) : userQuota ?? stock ?? 999;
    const totalPrice = isPWYW
        ? parseFloat(customAmount || '0') * purchaseQuantity
        : Number(subAction.price) * purchaseQuantity;

    const benefitsList: string[] = subAction.metadata?.benefits || subAction.metadata?.highlights || [];
    const metaEntries = Object.entries(subAction.metadata || {}).filter(
        ([k]) =>
            !['benefits', 'highlights', 'extendedDescription', 'socialLinks'].includes(k) &&
            // Numeric top-level keys are never meaningful metadata — they are character-spread artifacts
            !/^\d+$/.test(k)
    );

    // The sub-action's own photos; the parent cover is only a fallback, never an extra slide
    const ownImages = [subAction.coverImage, ...(subAction.images ?? [])].filter(Boolean) as string[];
    const heroImages = ownImages.length > 0 ? ownImages : [parentAction.coverImage].filter(Boolean) as string[];

    // Vote standing, derived from the sibling contestants
    const isVote = parentAction.type === 'vote';
    const voteCount = Number(subAction.metadata?.votes ?? 0);
    const rank = subAction.metadata?.rank !== undefined ? Number(subAction.metadata.rank) : null;
    const siblingVotes = siblings.map(s => Number(s.metadata?.votes ?? 0));
    const totalVotes = siblingVotes.reduce((sum, v) => sum + v, 0);
    const leaderVotes = siblingVotes.length ? Math.max(...siblingVotes) : voteCount;
    const voteShare = totalVotes > 0 ? (voteCount / totalVotes) * 100 : null;
    const votesBehindLeader = Math.max(leaderVotes - voteCount, 0);
    const otherContestants = siblings.filter(s => s.id !== subAction.id);

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: 'Could not copy', description: 'Copy the link from your address bar.' });
        }
    };

    const handleNativeShare = async () => {
        if (!navigator.share) return handleCopyLink();
        try {
            await navigator.share({ title: subAction.name, text: `Support ${subAction.name}`, url: shareUrl });
        } catch {
            // The user dismissed the share sheet — nothing to report
        }
    };


    return (
        <div className="min-h-screen bg-[#0d1117]">

            {/* ── Sticky nav ── */}
            <div className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur-md border-b border-[#1e2d40] px-4 sm:px-6 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                {/* The hero already shows the name; the bar only takes it over once the hero is gone */}
                <div className="flex-1 min-w-0">
                    <p className="text-[#8da0b3] text-[11px] truncate leading-none">{parentAction.name}</p>
                    <h1
                        className={`text-[#f0f4f8] font-bold text-sm truncate leading-none transition-all duration-200 ${
                            heroScrolledPast ? 'opacity-100 mt-0.5 max-h-5' : 'opacity-0 max-h-0'
                        }`}
                        aria-hidden={!heroScrolledPast}
                    >
                        {subAction.name}
                    </h1>
                </div>
                {isOwner && !isEditing && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditing(true)} className="w-8 h-8 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(true)} className="w-8 h-8 rounded-lg bg-[#111927] border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
                {isOwner && isEditing && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setIsEditing(false); setEditFormData(subAction); }} className="px-3 py-1.5 rounded-lg bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-xs font-semibold hover:text-[#f0f4f8] transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} disabled={isSaving} className="px-3 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}Save
                        </button>
                    </div>
                )}
            </div>

            <div className="max-w-2xl mx-auto pb-32">

                {/* ── Hero — the photos are the content, so they get the room ── */}
                <div className="relative w-full h-80 sm:h-[26rem] overflow-hidden">
                    <ImageCarousel
                        images={heroImages}
                        alt={subAction.name}
                        className="w-full h-full"
                        dotsAlign="right"
                        fallback={
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] via-[#111927] to-[#0d1117]" />
                        }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/60 to-transparent pointer-events-none" />


                    {/* Badges top-left */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold capitalize backdrop-blur-sm ${
                            parentAction.status === 'published'
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                : 'bg-black/40 border border-white/10 text-white/50'
                        }`}>{parentAction.status}</span>
                        {parentAction.type && (
                            <span className="bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#60a5fa] text-[11px] px-2.5 py-1 rounded-full font-medium backdrop-blur-sm capitalize">
                                {parentAction.type}
                            </span>
                        )}
                    </div>

                    {/* Stock + fullscreen photos, stacked so they never collide */}
                    <div className="absolute z-20 top-4 right-4 flex flex-col items-end gap-2">
                        {stock != null && (
                            <div className="bg-black/50 backdrop-blur-sm text-white/70 text-[11px] px-2.5 py-1 rounded-full border border-white/10">
                                {stock} available
                            </div>
                        )}
                        {heroImages.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setLightboxIndex(0)}
                                aria-label="View photos fullscreen"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold hover:bg-black/70 transition-colors"
                            >
                                <Maximize2 className="w-3 h-3" />
                                {heroImages.length > 1 ? `${heroImages.length} photos` : 'View photo'}
                            </button>
                        )}
                    </div>

                    {/* Title bottom — editing happens in the panel below, never on top of the photo */}
                    <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pr-20">
                        <h2 className="text-white font-bold text-2xl sm:text-3xl leading-tight drop-shadow-lg">{subAction.name}</h2>
                        {(subAction.description || parentAction.shortDescription) && (
                            <p className="text-white/75 text-sm mt-1 line-clamp-1 drop-shadow">
                                {subAction.description || parentAction.shortDescription}
                            </p>
                        )}
                        <SocialLinksRow
                            links={subAction.metadata?.socialLinks}
                            variant="chip"
                            className="mt-2.5"
                        />
                    </div>
                </div>

                {/* ── Thumbnail strip ── */}
                {heroImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 sm:px-6 py-3 border-b border-[#1e2d40]">
                        {heroImages.map((image, i) => (
                            <button
                                key={image}
                                type="button"
                                onClick={() => setLightboxIndex(i)}
                                aria-label={`Open photo ${i + 1} fullscreen`}
                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#1e2d40] hover:border-[#3b82f6] flex-shrink-0 transition-colors"
                            >
                                <img src={image} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Stats strip — on a vote, the tally leads and the price is a footnote ── */}
                <div className="grid grid-cols-2 sm:flex sm:items-stretch gap-px bg-[#1e2d40] border-b border-[#1e2d40]">
                    {isVote ? (
                        <>
                            <div className="col-span-2 sm:flex-1 bg-[#0d1117] px-5 py-4">
                                <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-1">Votes</p>
                                <p className="text-[#60a5fa] font-bold text-3xl tabular-nums">{voteCount.toLocaleString()}</p>
                                {voteShare === null && (
                                    <p className="text-[#8da0b3] text-xs mt-1.5">
                                        No votes cast yet — be the first.
                                    </p>
                                )}
                                {voteShare !== null && (
                                    <div className="mt-2.5">
                                        <div className="h-1.5 rounded-full bg-[#1e2d40] overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] transition-all duration-500"
                                                style={{ width: `${Math.max(voteShare, 2)}%` }}
                                            />
                                        </div>
                                        <p className="text-[#8da0b3] text-xs mt-1.5">
                                            {voteShare.toFixed(1)}% of all votes cast
                                            {votesBehindLeader > 0 && ` · ${votesBehindLeader.toLocaleString()} behind the leader`}
                                            {votesBehindLeader === 0 && voteCount > 0 && ' · leading'}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {rank !== null && (
                                <div className="bg-[#0d1117] px-5 py-4 sm:text-center">
                                    <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-1">Rank</p>
                                    <p className="text-white font-bold text-3xl tabular-nums">#{rank}</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="col-span-2 sm:flex-1 bg-[#0d1117] px-5 py-4">
                            <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-1">
                                {isPWYW ? 'Pay what you want' : 'Price'}
                            </p>
                            <p className="text-white font-bold text-xl">
                                {isPWYW ? 'Open price' : `${parentAction.currency || ''} ${Number(subAction.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                            </p>
                        </div>
                    )}
                    {isOwner && subAction.wallet && (
                        <div className="bg-[#0d1117] px-5 py-4 sm:text-center">
                            <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-1">Raised</p>
                            <p className="text-emerald-400 font-bold text-xl">{subAction.wallet.balance.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* ── Content sections ── */}
                <div className="px-4 sm:px-6 pt-5 space-y-4">

                    {/* Owner edit panel — every editable field lives here, not scattered across the page */}
                    {isEditing && editFormData && (
                        <section className="bg-[#111927] border border-[#3b82f6]/40 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-3.5 h-3.5 text-[#60a5fa]" />
                                <p className="text-[#f0f4f8] font-semibold text-sm">Edit details</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label htmlFor="edit-name" className="text-[#8da0b3] text-xs font-semibold mb-1.5 block">Name</label>
                                    <input
                                        id="edit-name"
                                        value={editFormData.name}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className={editFieldClass}
                                    />
                                </div>

                                {!isPWYW && (
                                    <div>
                                        <label htmlFor="edit-price" className="text-[#8da0b3] text-xs font-semibold mb-1.5 block">
                                            Price ({parentAction.currency || 'RWF'})
                                        </label>
                                        <input
                                            id="edit-price"
                                            type="number" step="0.01" min="0"
                                            value={editFormData.price}
                                            onChange={e => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                                            className={editFieldClass}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="edit-stock" className="text-[#8da0b3] text-xs font-semibold mb-1.5 block">Stock</label>
                                    <input
                                        id="edit-stock"
                                        type="number" min="0"
                                        value={editFormData.stock ?? ''}
                                        onChange={e => setEditFormData({ ...editFormData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                                        placeholder="Unlimited"
                                        className={editFieldClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="edit-description" className="text-[#8da0b3] text-xs font-semibold mb-1.5 block">Description</label>
                                    <textarea
                                        id="edit-description"
                                        value={editFormData.description || ''}
                                        onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Add a description..."
                                        className={`${editFieldClass} resize-none`}
                                    />
                                </div>
                            </div>

                            <p className="text-[#8da0b3] text-xs">
                                Photos and social links are managed from the action builder.
                            </p>
                        </section>
                    )}

                    {/* Description — the primary thing a visitor reads about this contestant */}
                    {!isEditing && (
                        <section className="bg-[#111927] border border-[#1e2d40] rounded-2xl p-5 sm:p-6">
                            <p className="text-[#60a5fa] text-[10px] font-bold uppercase tracking-widest mb-2.5">
                                About {subAction.name}
                            </p>
                            {subAction.description ? (
                                <p className="text-[#e2e9f0] text-[15px] sm:text-base leading-relaxed whitespace-pre-line">
                                    {subAction.description}
                                </p>
                            ) : (
                                <p className="text-[#8da0b3] text-sm leading-relaxed italic">
                                    {parentAction.description || parentAction.shortDescription || 'No description provided yet.'}
                                </p>
                            )}
                        </section>
                    )}

                    {/* Benefits */}
                    {benefitsList.length > 0 && (
                        <section className="bg-[#111927] border border-[#1e2d40] rounded-2xl p-5">
                            <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-3">What&apos;s included</p>
                            <ul className="space-y-2.5">
                                {benefitsList.map((b: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-[#c4d4e0]">
                                        <span className="w-5 h-5 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/30 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 className="w-3 h-3 text-[#3b82f6]" />
                                        </span>
                                        {b}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Share — the QR pointed at this very page, so it is now a small action, not a billboard */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleNativeShare}
                            className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111927] border border-[#1e2d40] text-[#f0f4f8] text-sm font-semibold hover:border-[#3b82f6] transition-colors"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                        </button>
                        <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex-1 min-w-[8rem] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-sm font-semibold hover:text-[#f0f4f8] hover:border-[#3b82f6] transition-colors"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                            {copied ? 'Link copied' : 'Copy link'}
                        </button>
                        {subAction.dedicatedQrCodeData && (
                            <button
                                type="button"
                                onClick={() => setShowShareQr(true)}
                                title="Show QR code for posters, flyers and reposts"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-sm font-semibold hover:text-[#f0f4f8] hover:border-[#3b82f6] transition-colors"
                            >
                                <QrCode className="w-3.5 h-3.5" />
                                QR
                            </button>
                        )}
                    </div>

                    {/* Details accordion */}
                    {metaEntries.length > 0 && (
                        <section className="border border-[#1e2d40] rounded-2xl overflow-hidden">
                            <button
                                onClick={() => setDetailsExpanded(p => !p)}
                                className="w-full flex items-center justify-between px-5 py-4 bg-[#111927] hover:bg-[#131f2e] transition-colors"
                            >
                                <span className="text-[#f0f4f8] text-sm font-semibold">Details</span>
                                {detailsExpanded ? <ChevronUp className="w-4 h-4 text-[#8da0b3]" /> : <ChevronDown className="w-4 h-4 text-[#8da0b3]" />}
                            </button>
                            {detailsExpanded && (
                                <div className="grid grid-cols-2 gap-px bg-[#1e2d40]">
                                    {metaEntries.map(([k, v]) => (
                                        <div key={k} className="bg-[#0d1117] px-4 py-3">
                                            <p className="text-[#8da0b3] text-[10px] uppercase tracking-wide mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                                            <p className="text-[#f0f4f8] text-xs font-semibold break-words">{formatMetaValue(v)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ── Purchase form ── */}
                    {!isOwner && (
                        <div>
                            {!showPurchaseForm ? (
                                <button
                                    onClick={() => setShowPurchaseForm(true)}
                                    className="w-full py-4 rounded-2xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold transition-colors flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-blue-900/30"
                                >
                                    <span className="flex items-center gap-2 text-sm">
                                        <ShoppingCart className="w-4 h-4" />
                                        {ctaLabel(parentAction.type)}
                                    </span>
                                    {!isPWYW && (
                                        <span className="text-white/70 text-xs font-medium">
                                            {parentAction.currency || 'RWF'} {Number(subAction.price).toLocaleString()}
                                            {isVote ? ' per vote' : ' each'}
                                        </span>
                                    )}
                                </button>
                            ) : (
                                <div className="bg-[#111927] border border-[#1e2d40] rounded-2xl overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e2d40]">
                                        <p className="text-[#f0f4f8] font-bold">Complete your order</p>
                                        <button
                                            onClick={() => { setShowPurchaseForm(false); setPurchaseError(null); }}
                                            className="w-7 h-7 rounded-lg bg-[#0d1525] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="p-5 space-y-5">
                                        <div>
                                            <label className="text-[#8da0b3] text-xs font-semibold mb-2 block">
                                                Quantity {maxQty < 999 && <span className="font-normal opacity-60">(max {maxQty})</span>}
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setPurchaseQuantity(q => Math.max(1, q - 1))} disabled={purchaseQuantity <= 1} className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 flex items-center justify-center font-bold transition-colors">−</button>
                                                <span className="text-[#f0f4f8] font-bold text-base w-8 text-center">{purchaseQuantity}</span>
                                                <button onClick={() => setPurchaseQuantity(q => Math.min(maxQty, q + 1))} disabled={purchaseQuantity >= maxQty} className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 flex items-center justify-center font-bold transition-colors">+</button>
                                            </div>
                                        </div>
                                        {isPWYW && (
                                            <div>
                                                <label className="text-[#8da0b3] text-xs font-semibold mb-2 block">Your amount ({parentAction.currency})</label>
                                                <input type="number" min="0" step="0.01" value={customAmount} onChange={e => { setCustomAmount(e.target.value); setPurchaseError(null); }} placeholder="Enter amount" className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-xl px-4 py-2.5 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none transition-colors" />
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest">Your information</p>
                                            {(parentAction.buyerFields?.length ? parentAction.buyerFields : ['fullName', 'email', 'phone']).map(f =>
                                                renderBuyerField(f, buyerData[f] || '', f !== 'notes')
                                            )}
                                        </div>
                                        <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-[#8da0b3] text-xs mb-0.5">Total</p>
                                                <p className="text-white font-bold text-lg">
                                                    {isPWYW && !customAmount ? '—' : `${parentAction.currency || ''} ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                                </p>
                                            </div>
                                            <p className="text-[#8da0b3] text-xs text-right">
                                                {purchaseQuantity} × {isPWYW ? `${parentAction.currency} ${parseFloat(customAmount || '0').toFixed(2)}` : `${parentAction.currency} ${Number(subAction.price).toFixed(2)}`}
                                            </p>
                                        </div>
                                        {purchaseError && (
                                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{purchaseError}</div>
                                        )}
                                        <button onClick={handlePurchase} disabled={isPurchasing} className="w-full py-3.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
                                            {isPurchasing ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : ctaLabel(parentAction.type)}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Other contestants — keeps the page from being a dead end */}
                    {isVote && otherContestants.length > 0 && (
                        <section className="pt-1">
                            <p className="text-[#8da0b3] text-[10px] font-bold uppercase tracking-widest mb-3">
                                Other {parentAction.name ? 'contestants' : 'options'}
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                                {otherContestants.map(other => {
                                    const photo = other.coverImage || other.images?.[0];
                                    return (
                                        <a
                                            key={other.id}
                                            href={`/action/${actionId}/subactions/${other.id}`}
                                            className="group w-32 flex-shrink-0 rounded-xl border border-[#1e2d40] bg-[#111927] overflow-hidden hover:border-[#3b82f6] transition-colors"
                                        >
                                            <div className="h-24 bg-[#0d1525]">
                                                {photo ? (
                                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Users className="w-6 h-6 text-[#1e2d40]" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2.5">
                                                <p className="text-[#f0f4f8] text-xs font-semibold truncate group-hover:text-[#60a5fa] transition-colors">
                                                    {other.name}
                                                </p>
                                                <p className="text-[#8da0b3] text-[11px] mt-0.5 tabular-nums">
                                                    {Number(other.metadata?.votes ?? 0).toLocaleString()} votes
                                                </p>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Timestamps — record-keeping, so they sit below the primary action */}
                    <div className="flex items-center gap-4 text-xs text-[#8da0b3] pt-2">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Added {formatDate(subAction.createdAt)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Updated {formatDate(subAction.updatedAt)}</span>
                    </div>
                </div>
            </div>

            {/* ── QR / share dialog ── */}
            <ShareQrDialog
                open={showShareQr}
                onOpenChange={setShowShareQr}
                name={subAction.name}
                subtitle={parentAction.name}
                url={`/action/${actionId}/subactions/${subAction.id}`}
                qrCodeData={subAction.dedicatedQrCodeData}
            />

            {/* ── Fullscreen photo viewer ── */}
            {lightboxIndex !== null && heroImages.length > 0 && (
                <ImageLightbox
                    images={heroImages}
                    index={lightboxIndex}
                    alt={subAction.name}
                    onClose={() => setLightboxIndex(null)}
                    onIndexChange={setLightboxIndex}
                />
            )}

            {/* ── Delete confirm dialog ───────────────────────────────────────── */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="bg-[#0d1117] border border-[#1e2d40] rounded-2xl max-w-sm p-0 gap-0 overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-400" />
                        </div>
                        <h3 className="text-[#f0f4f8] font-bold text-center mb-2">Delete this item?</h3>
                        <p className="text-[#8da0b3] text-sm text-center">
                            This will permanently delete <span className="font-semibold text-[#f0f4f8]">{subAction.name}</span>. This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-2 px-6 pb-6">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2.5 rounded-xl bg-[#111927] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] text-sm font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Delete
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Purchase success dialog ─────────────────────────────────────── */}
            <Dialog open={isPurchaseSuccessOpen} onOpenChange={setIsPurchaseSuccessOpen}>
                <DialogContent className="bg-[#0d1117] border border-[#1e2d40] rounded-2xl w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e2d40]">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[#f0f4f8]">Success!</h2>
                    </div>

                    <div className="overflow-y-auto max-h-[65vh]">
                        {purchaseResult && (
                            <div className="space-y-3 p-5">
                                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">Reference</p>
                                    <p className="text-base font-bold text-[#f0f4f8] font-mono break-all">{purchaseResult.referenceId}</p>
                                </div>

                                {purchaseResult.description && (
                                    <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                                        <p className="text-xs font-semibold text-[#8da0b3] uppercase tracking-wide mb-1.5">Summary</p>
                                        <p className="text-sm text-[#8da0b3]">{purchaseResult.description}</p>
                                    </div>
                                )}

                                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                                    <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1.5">New Wallet Balance</p>
                                    <p className="text-2xl font-bold text-[#f0f4f8]">
                                        {purchaseResult.buyerCurrency} {purchaseResult.buyerBalanceAfter.toLocaleString()}
                                    </p>
                                </div>

                                {parentAction.fulfillment?.postPurchaseMessage && (
                                    <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                                        <p className="text-xs font-semibold text-[#8da0b3] uppercase tracking-wide mb-1.5">Message from Organizer</p>
                                        <p className="text-sm text-[#8da0b3]">{parentAction.fulfillment.postPurchaseMessage}</p>
                                    </div>
                                )}

                                {purchaseResult.qrCodeData && (
                                    <div className="flex flex-col items-center gap-3 bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Your QR Code</p>
                                        <div className="bg-white rounded-xl p-3">
                                            <img src={purchaseResult.qrCodeData} alt="QR Code" className="w-40 h-40 block" />
                                        </div>
                                        <p className="text-xs text-[#8da0b3] text-center">Show this to confirm your entry</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-[#1e2d40]">
                        <button
                            onClick={() => setIsPurchaseSuccessOpen(false)}
                            className="w-full py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-bold text-sm transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
