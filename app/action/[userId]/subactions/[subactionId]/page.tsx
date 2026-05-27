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
    Loader2,
    Package,
    QrCode,
    Save,
    ShoppingCart,
    Trash2,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface SubAction {
    id: string;
    actionId: string;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    stockReserved?: number;
    variants?: Record<string, any>;
    metadata?: Record<string, any>;
    isActive?: boolean;
    sortOrder?: number;
    coverImage?: string;
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
            if (found.metadata && typeof found.metadata === 'string') {
                try { found.metadata = JSON.parse(found.metadata); } catch { found.metadata = {}; }
            }
            const actionRes = await axios.get(`${baseUrl}/actions/${found.actionId}`, { headers });
            const foundAction: ParentAction = actionRes.data?.data || actionRes.data;
            setSubAction(found);
            setParentAction(foundAction);
            setEditFormData(found);
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
                <label className="text-xs font-semibold text-[#4a6278] flex items-center gap-1">
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
                <Loader2 className="w-10 h-10 text-[#4a6278] animate-spin" />
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
        ([k]) => !['benefits', 'highlights', 'extendedDescription'].includes(k)
    );

    return (
        <div className="min-h-screen bg-[#0d1117]">

            {/* ── Sticky nav ─────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-[#1e2d40] px-4 sm:px-6 py-3 flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-[#1e2d40] transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[#4a6278] text-xs truncate">{parentAction.name}</p>
                    <h1 className="text-[#f0f4f8] font-bold text-sm truncate">{subAction.name}</h1>
                </div>
                {isOwner && !isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-9 h-9 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-[#1e2d40] transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-9 h-9 rounded-lg bg-[#111927] border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {isOwner && isEditing && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setIsEditing(false); setEditFormData(subAction); }}
                            className="px-3 py-1.5 rounded-lg bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-xs font-semibold hover:text-[#f0f4f8] transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="px-3 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                        </button>
                    </div>
                )}
            </div>

            <div className="max-w-[960px] mx-auto pb-32">

                {/* ── Hero ───────────────────────────────────────────────────── */}
                <div className="relative w-full h-72 overflow-hidden">
                    {(subAction.coverImage || parentAction.coverImage) ? (
                        <img
                            src={subAction.coverImage || parentAction.coverImage!}
                            alt={subAction.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-[#0d1117]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold capitalize ${
                                parentAction.status === 'published'
                                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                    : 'bg-[#1e2d40] text-[#8da0b3]'
                            }`}>
                                {parentAction.status}
                            </span>
                            {parentAction.type && (
                                <span className="bg-[#1a3a5c]/80 border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-0.5 rounded-md font-medium backdrop-blur-sm capitalize">
                                    {parentAction.type}
                                </span>
                            )}
                            {stock != null && (
                                <span className="bg-black/50 text-white/70 text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm">
                                    {stock} left
                                </span>
                            )}
                        </div>
                        {isEditing && editFormData ? (
                            <input
                                value={editFormData.name}
                                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="text-2xl font-bold bg-transparent border-b-2 border-[#3b82f6] text-[#f0f4f8] outline-none w-full"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-[#f0f4f8] leading-tight drop-shadow">{subAction.name}</h2>
                        )}
                        {(subAction.description || parentAction.shortDescription) && !isEditing && (
                            <p className="text-[#8da0b3] text-sm mt-1.5 max-w-lg line-clamp-2">
                                {subAction.description || parentAction.shortDescription}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Main grid ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">

                    {/* Left column */}
                    <div className="flex flex-col gap-4">

                        {/* Price card */}
                        <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                            <p className="text-[#4a6278] text-xs font-semibold uppercase tracking-wide mb-1">
                                {isPWYW ? 'Pay what you want' : 'Price'}
                            </p>
                            {isEditing && editFormData && !isPWYW ? (
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editFormData.price}
                                    onChange={e => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                                    className="text-3xl font-bold bg-transparent border-b-2 border-[#3b82f6] text-[#f0f4f8] outline-none w-full"
                                />
                            ) : (
                                <p className="text-3xl font-bold text-[#f0f4f8]">
                                    {isPWYW ? 'Open price' : `${parentAction.currency || ''} ${Number(subAction.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                </p>
                            )}
                            {stock != null && (
                                <p className="text-[#4a6278] text-xs mt-1.5">{stock} units available</p>
                            )}
                        </div>

                        {/* Wallet balance (owner only) */}
                        {isOwner && subAction.wallet && (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-[#1a3a5c] border border-[#3b82f6]/30 flex items-center justify-center flex-shrink-0">
                                    <Wallet className="w-4 h-4 text-[#60a5fa]" />
                                </div>
                                <div>
                                    <p className="text-[#4a6278] text-xs font-semibold">Wallet balance</p>
                                    <p className="text-[#f0f4f8] font-bold">
                                        {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* QR code */}
                        {subAction.dedicatedQrCodeData && (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <QrCode className="w-4 h-4 text-[#3b82f6]" />
                                    <p className="text-[#f0f4f8] font-semibold text-sm">Your QR Code</p>
                                </div>
                                <div className="flex justify-center mb-3">
                                    <div className="bg-white rounded-xl p-3">
                                        <img
                                            src={subAction.dedicatedQrCodeData}
                                            alt="QR Code"
                                            className="w-40 h-40 block"
                                        />
                                    </div>
                                </div>
                                <a
                                    href={`/action/${actionId}/subactions/${subAction.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa] text-sm font-semibold hover:bg-[#1e4a72] transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open link
                                </a>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="w-3 h-3 text-[#4a6278]" />
                                    <p className="text-[#4a6278] text-xs">Created</p>
                                </div>
                                <p className="text-[#8da0b3] text-xs font-semibold">{formatDate(subAction.createdAt)}</p>
                            </div>
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Clock className="w-3 h-3 text-[#4a6278]" />
                                    <p className="text-[#4a6278] text-xs">Updated</p>
                                </div>
                                <p className="text-[#8da0b3] text-xs font-semibold">{formatDate(subAction.updatedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">

                        {/* Description */}
                        <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                            <p className="text-[#4a6278] text-xs font-semibold uppercase tracking-wide mb-2">Description</p>
                            {isEditing && editFormData ? (
                                <textarea
                                    value={editFormData.description || ''}
                                    onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Add a description..."
                                    className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none resize-none transition-colors"
                                />
                            ) : (
                                <p className="text-[#8da0b3] text-sm leading-relaxed">
                                    {subAction.description || parentAction.description || parentAction.shortDescription || 'No description provided.'}
                                </p>
                            )}
                        </div>

                        {/* Benefits */}
                        {benefitsList.length > 0 && (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                                <p className="text-[#4a6278] text-xs font-semibold uppercase tracking-wide mb-3">Included</p>
                                <ul className="space-y-2">
                                    {benefitsList.map((b: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-[#8da0b3]">
                                            <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>{b}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Metadata grid */}
                        {metaEntries.length > 0 && (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setDetailsExpanded(p => !p)}
                                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#0d1525] transition-colors"
                                >
                                    <span className="text-[#f0f4f8] text-sm font-semibold">Details</span>
                                    {detailsExpanded
                                        ? <ChevronUp className="w-4 h-4 text-[#4a6278]" />
                                        : <ChevronDown className="w-4 h-4 text-[#4a6278]" />}
                                </button>
                                {detailsExpanded && (
                                    <div className="grid grid-cols-2 gap-px bg-[#1e2d40] border-t border-[#1e2d40]">
                                        {metaEntries.map(([k, v]) => (
                                            <div key={k} className="bg-[#0d1117] p-3">
                                                <p className="text-[#4a6278] text-xs mb-0.5 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                                                <p className="text-[#f0f4f8] text-xs font-semibold truncate">{String(v)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Stock edit (owner) */}
                        {isEditing && editFormData && (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                                <p className="text-[#4a6278] text-xs font-semibold uppercase tracking-wide mb-3">Stock</p>
                                <input
                                    type="number"
                                    min="0"
                                    value={editFormData.stock ?? ''}
                                    onChange={e => setEditFormData({ ...editFormData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                                    placeholder="Unlimited"
                                    className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none transition-colors"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Purchase form ───────────────────────────────────────────── */}
                {!isOwner && (
                    <div className="px-6 pb-6">
                        {!showPurchaseForm ? (
                            <button
                                onClick={() => setShowPurchaseForm(true)}
                                className="w-full py-3.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                {ctaLabel(parentAction.type)}
                            </button>
                        ) : (
                            <div className="bg-[#111927] border border-[#1e2d40] rounded-xl overflow-hidden">
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
                                    {/* Quantity */}
                                    <div>
                                        <label className="text-[#4a6278] text-xs font-semibold mb-2 block">
                                            Quantity {maxQty < 999 && <span className="font-normal">(max {maxQty})</span>}
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setPurchaseQuantity(q => Math.max(1, q - 1))}
                                                disabled={purchaseQuantity <= 1}
                                                className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 flex items-center justify-center font-bold transition-colors"
                                            >−</button>
                                            <span className="text-[#f0f4f8] font-bold text-base w-8 text-center">{purchaseQuantity}</span>
                                            <button
                                                onClick={() => setPurchaseQuantity(q => Math.min(maxQty, q + 1))}
                                                disabled={purchaseQuantity >= maxQty}
                                                className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 flex items-center justify-center font-bold transition-colors"
                                            >+</button>
                                        </div>
                                    </div>

                                    {/* PWYW amount */}
                                    {isPWYW && (
                                        <div>
                                            <label className="text-[#4a6278] text-xs font-semibold mb-2 block">Your amount ({parentAction.currency})</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={customAmount}
                                                onChange={e => { setCustomAmount(e.target.value); setPurchaseError(null); }}
                                                placeholder="Enter amount"
                                                className="w-full bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] rounded-lg px-3 py-2 text-sm text-[#f0f4f8] placeholder:text-[#4a6278] outline-none transition-colors"
                                            />
                                        </div>
                                    )}

                                    {/* Buyer fields */}
                                    <div className="space-y-3">
                                        <p className="text-[#4a6278] text-xs font-semibold uppercase tracking-wide">Your information</p>
                                        {(parentAction.buyerFields?.length ? parentAction.buyerFields : ['fullName', 'email', 'phone']).map(f =>
                                            renderBuyerField(f, buyerData[f] || '', f !== 'notes')
                                        )}
                                    </div>

                                    {/* Price summary */}
                                    <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-[#4a6278] text-xs">Total</p>
                                            <p className="text-[#f0f4f8] font-bold text-lg">
                                                {isPWYW && !customAmount ? '—' : `${parentAction.currency || ''} ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </p>
                                        </div>
                                        <p className="text-[#4a6278] text-xs text-right">
                                            {purchaseQuantity} × {isPWYW ? `${parentAction.currency} ${parseFloat(customAmount || '0').toFixed(2)}` : `${parentAction.currency} ${Number(subAction.price).toFixed(2)}`}
                                        </p>
                                    </div>

                                    {purchaseError && (
                                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-lg text-sm">
                                            {purchaseError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handlePurchase}
                                        disabled={isPurchasing}
                                        className="w-full py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isPurchasing
                                            ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                                            : ctaLabel(parentAction.type)
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
                                        <p className="text-xs font-semibold text-[#4a6278] uppercase tracking-wide mb-1.5">Summary</p>
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
                                        <p className="text-xs font-semibold text-[#4a6278] uppercase tracking-wide mb-1.5">Message from Organizer</p>
                                        <p className="text-sm text-[#8da0b3]">{parentAction.fulfillment.postPurchaseMessage}</p>
                                    </div>
                                )}

                                {purchaseResult.qrCodeData && (
                                    <div className="flex flex-col items-center gap-3 bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Your QR Code</p>
                                        <div className="bg-white rounded-xl p-3">
                                            <img src={purchaseResult.qrCodeData} alt="QR Code" className="w-40 h-40 block" />
                                        </div>
                                        <p className="text-xs text-[#4a6278] text-center">Show this to confirm your entry</p>
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
