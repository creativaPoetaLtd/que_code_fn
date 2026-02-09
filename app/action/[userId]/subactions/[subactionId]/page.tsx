'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useUserInfo } from '@/hooks/use-user-info';
import { useSidebar } from '@/context/SidebarContext';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Clock,
    DollarSign,
    Edit,
    Loader2,
    Trash2,
    CheckCircle2,
    Package,
    ShoppingCart,
} from 'lucide-react';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface SubAction {
    id: string;
    actionId: string;
    name: string;
    description?: string;
    price: number;
    stock?: number;
    stockReserved?: number;
    variants?: Record<string, any>;
    metadata?: {
        seatType?: string;
        benefits?: string[];
    };
    isActive?: boolean;
    sortOrder?: number;
    coverImage?: string;
    dedicatedQrCodeData?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface OrganizationAction {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    status: 'draft' | 'published' | 'archived';
    pricing?: {
        mode: string;
    };
    currency?: string;
    availability?: {
        startsAt?: string;
        endsAt?: string;
        userQuota?: number | null;
    };
}

const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const SubActionDetailPage = () => {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;
    const subactionId = params?.subactionId as string;
    const { getToken } = useAuthToken();
    const { userId: tokenUserId, accountType } = useUserInfo();
    const { isExpanded } = useSidebar();

    const [subAction, setSubAction] = useState<SubAction | null>(null);
    const [parentAction, setParentAction] = useState<OrganizationAction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState<SubAction | null>(null);
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
    const [purchaseQuantity, setPurchaseQuantity] = useState('1');
    const [buyerData, setBuyerData] = useState<Record<string, string>>({});
    const [customAmount, setCustomAmount] = useState('');
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);

    const isOwner = userId === tokenUserId && accountType === 'organization';

    // Fetch subaction and parent action details
    const fetchSubActionDetails = useCallback(async () => {
        console.log('fetchSubActionDetails called with userId:', userId, 'subactionId:', subactionId);
        
        const token = getToken();
        if (!token || !userId || !subactionId) {
            console.error('Missing required parameters - token:', !!token, 'userId:', userId, 'subactionId:', subactionId);
            setError('Missing required parameters');
            setLoading(false);
            return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        try {
            setLoading(true);
            setError(null);

            // Fetch the subaction directly by ID
            console.log('Fetching subaction directly:', `${baseUrl}/sub-actions/${subactionId}`);
            const subActionResponse = await axios.get(
                `${baseUrl}/sub-actions/${subactionId}`,
                { headers }
            );

            const foundSubAction = subActionResponse.data?.data || subActionResponse.data;
            console.log('Fetched subaction:', foundSubAction);

            if (!foundSubAction) {
                setError('Subaction not found');
                setLoading(false);
                return;
            }

            // Now fetch the parent action
            const actionId = foundSubAction.actionId;
            console.log('Fetching parent action:', actionId);
            const actionResponse = await axios.get(
                `${baseUrl}/actions/${actionId}`,
                { headers }
            );

            const foundAction = actionResponse.data?.data || actionResponse.data;
            console.log('Fetched parent action:', foundAction);

            setSubAction(foundSubAction);
            setParentAction(foundAction);
            setEditFormData(foundSubAction);
        } catch (err: any) {
            console.error('Error fetching subaction details:', err);
            const errorMessage =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load subaction details';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [userId, subactionId, getToken]);

    useEffect(() => {
        fetchSubActionDetails();
    }, [fetchSubActionDetails]);

    const handleSaveEdit = async () => {
        if (!editFormData || !parentAction) return;

        const token = getToken();
        if (!token) {
            setError('You need to be logged in');
            return;
        }

        try {
            setIsSaving(true);
            const headers = { Authorization: `Bearer ${token}` };

            const payload: Record<string, any> = {
                name: editFormData.name,
                price: editFormData.price,
                description: editFormData.description || null,
                stock: editFormData.stock || null,
                metadata: editFormData.metadata || {},
            };

            await axios.put(
                `${baseUrl}/sub-actions/${subactionId}`,
                payload,
                { headers }
            );

            setSubAction(editFormData);
            setIsEditing(false);
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || 'Failed to save changes';
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this subaction?')) {
            return;
        }

        const token = getToken();
        if (!token) {
            setError('You need to be logged in');
            return;
        }

        try {
            setIsSaving(true);
            const headers = { Authorization: `Bearer ${token}` };

            await axios.delete(
                `${baseUrl}/sub-actions/${subactionId}`,
                { headers }
            );

            router.push(`/action/${userId}`);
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || 'Failed to delete subaction';
            setError(errorMessage);
            setIsSaving(false);
        }
    };

    const handlePurchase = async () => {
        if (!parentAction) return;

        const quantity = parseInt(purchaseQuantity);
        if (!quantity || quantity <= 0) {
            setPurchaseError('Please enter a valid quantity');
            return;
        }

        // For pay_what_you_want mode, validate custom amount
        if ((parentAction as any)?.pricing?.mode === 'pay_what_you_want') {
            const amount = parseFloat(customAmount);
            if (!customAmount || isNaN(amount) || amount <= 0) {
                setPurchaseError('Please enter a valid amount');
                return;
            }
        }

        // Validate stock
        if (subAction && subAction.stock !== null && subAction.stock !== undefined && quantity > subAction.stock) {
            setPurchaseError(`Only ${subAction.stock} items available`);
            return;
        }

        // Validate buyer data - check configured buyer fields or defaults
        const requiredFields = (parentAction as any)?.buyerFields && (parentAction as any).buyerFields.length > 0
            ? (parentAction as any).buyerFields.filter((f: string) => f !== 'notes')
            : ['fullName', 'email', 'phone'];

        const missingFields = requiredFields.filter((field: string) => !buyerData?.[field]?.trim());
        if (missingFields.length > 0) {
            const fieldNames = missingFields
                .map((f: string) => {
                    const labels: Record<string, string> = {
                        fullName: 'Full Name',
                        firstName: 'First Name',
                        lastName: 'Last Name',
                        email: 'Email',
                        phone: 'Phone',
                        phoneNumber: 'Phone Number',
                        address: 'Address',
                        city: 'City',
                        country: 'Country',
                        zipCode: 'Zip Code',
                        postalCode: 'Postal Code',
                        idNumber: 'ID Number',
                        companyName: 'Company Name',
                        taxId: 'Tax ID',
                    };
                    return labels[f] || f;
                })
                .join(', ');
            setPurchaseError(`Please fill in: ${fieldNames}`);
            return;
        }

        try {
            setIsPurchasing(true);
            setPurchaseError(null);

            const token = getToken();
            if (!token) {
                setPurchaseError('Please login to purchase');
                setIsPurchasing(false);
                return;
            }

            if (!tokenUserId) {
                setPurchaseError('User ID not found. Please login again.');
                setIsPurchasing(false);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const requestBody: any = {
                subActionId: subactionId,
                quantity: quantity,
                buyerId: tokenUserId,
                buyerData: buyerData,
            };

            // For pay_what_you_want pricing, add custom amount
            if ((parentAction as any)?.pricing?.mode === 'pay_what_you_want') {
                requestBody.amount = parseFloat(customAmount);
            }

            await axios.post(
                `${baseUrl}/actions/${parentAction.id}/purchase`,
                requestBody,
                { headers }
            );

            setIsPurchaseOpen(false);
            setPurchaseQuantity('1');
            setCustomAmount('');
            setBuyerData({});
            setError('Purchase successful! Check your email for details.');
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.message || err?.message || 'Failed to complete purchase';
            setPurchaseError(errorMessage);
        } finally {
            setIsPurchasing(false);
        }
    };

    const updateBuyerData = (field: string, value: string) => {
        setBuyerData(prev => ({
            ...prev,
            [field]: value
        }));
        setPurchaseError(null);
    };

    const renderBuyerField = (field: string, value: string, isRequired: boolean) => {
        const fieldConfig: Record<string, { label: string; type: string; placeholder: string }> = {
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
            postalCode: { label: 'Postal Code', type: 'text', placeholder: 'Enter postal code' },
            idNumber: { label: 'ID Number', type: 'text', placeholder: 'Enter ID number' },
            companyName: { label: 'Company Name', type: 'text', placeholder: 'Enter company name' },
            taxId: { label: 'Tax ID', type: 'text', placeholder: 'Enter tax ID' },
            notes: { label: 'Notes', type: 'text', placeholder: 'Enter notes (optional)' },
        };

        const config = fieldConfig[field] || { label: field, type: 'text', placeholder: `Enter ${field}` };

        return (
            <div key={field} className="space-y-2">
                <label className="text-xs font-semibold text-[#00313A] dark:text-white mb-1 flex items-center gap-1">
                    {config.label}
                    {isRequired && <span className="text-red-500">*</span>}
                </label>
                {field === 'notes' ? (
                    <textarea
                        value={value || ''}
                        onChange={(e) => updateBuyerData(field, e.target.value)}
                        className="w-full h-20 rounded-lg border-2 border-[#00313A]/10 dark:border-darkBorder-light focus:border-[#00B512] text-sm p-2 focus:outline-none bg-white dark:bg-darkBg-interactive text-[#00313A] dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={config.placeholder}
                    />
                ) : (
                    <input
                        type={config.type}
                        value={value || ''}
                        onChange={(e) => updateBuyerData(field, e.target.value)}
                        className="w-full px-4 py-2 border-2 border-[#00313A]/10 dark:border-darkBorder-light rounded-lg focus:border-[#00B512] text-sm bg-white dark:bg-darkBg-interactive text-[#00313A] dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={config.placeholder}
                    />
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50 dark:bg-darkBg-main">
                <Navigation />
                <main className={cn(
                    "flex-1 flex flex-col p-4 md:p-8 transition-all duration-300",
                    isExpanded ? "lg:ml-64" : "lg:ml-20"
                )}>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-[#00B512] dark:text-brand-green mx-auto mb-4" />
                            <p className="text-[#00313A] dark:text-white font-medium">Loading subaction details...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-darkBg-main">
            <Navigation />

            <main className={cn(
                "flex-1 flex flex-col p-4 md:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <Header />

                    <section className="mt-6 space-y-6">
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 dark:border-darkBorder-light text-[#00313A] dark:text-white hover:bg-gray-100 dark:hover:bg-darkBg-interactive transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {error ? (
                            <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Error loading subaction</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                                <button
                                    onClick={() => fetchSubActionDetails()}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white font-semibold shadow hover:bg-[#009a0f]"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : subAction && parentAction ? (
                            <>
                                {/* Parent Action Reference */}
                                <div className="bg-gradient-to-br from-[#f0fff4] via-[#e6f9f0] to-[#f6fff9] dark:bg-darkBg-interactive rounded-2xl border border-[#00B512]/20 dark:border-darkBorder-light p-4">
                                    <p className="text-xs font-semibold text-[#00B512] dark:text-brand-green uppercase tracking-widest mb-2">
                                        Parent Action
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-[#00313A] dark:text-white">
                                                {parentAction.name}
                                            </h2>
                                            <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-1">
                                                {parentAction.shortDescription}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                            parentAction.status === 'published'
                                                ? 'bg-[#00B512]/10 dark:bg-[#00B512]/20 text-[#00B512] dark:text-brand-green'
                                                : 'bg-gray-100 dark:bg-darkBg-card text-gray-600 dark:text-gray-300'
                                        }`}>
                                            {parentAction.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Main Subaction Details */}
                                <div className="bg-white dark:bg-darkBg-card rounded-3xl border border-white/40 dark:border-darkBorder-light shadow-md p-6 space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 pb-6 border-b border-gray-100 dark:border-darkBorder-light">
                                        <div>
                                            {isEditing && editFormData ? (
                                                <input
                                                    type="text"
                                                    value={editFormData.name}
                                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                    className="text-3xl font-bold text-[#00313A] dark:text-white bg-transparent border-b-2 border-[#00B512] outline-none w-full"
                                                />
                                            ) : (
                                                <h1 className="text-3xl font-bold text-[#00313A] dark:text-white">
                                                    {subAction.name}
                                                </h1>
                                            )}
                                            <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-2">
                                                ID: {subactionId}
                                            </p>
                                        </div>

                                        {isOwner && !isEditing && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    disabled={isSaving}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-sm font-semibold shadow hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}

                                        {!isOwner && !isEditing && (
                                            <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
                                                <DialogTrigger asChild>
                                                    <button
                                                        disabled={isPurchasing}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isPurchasing ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Purchasing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShoppingCart className="w-4 h-4" />
                                                                Buy Now
                                                            </>
                                                        )}
                                                    </button>
                                                </DialogTrigger>
                                                <DialogContent className="bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light rounded-3xl">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl font-bold text-[#00313A] dark:text-white">
                                                            Purchase {subAction.name}
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-6 py-4">
                                                        {/* Quantity Section */}
                                                        <div>
                                                            <label className="block text-sm font-semibold text-[#00313A] dark:text-white mb-2">
                                                                Quantity
                                                            </label>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    onClick={() => setPurchaseQuantity(Math.max(1, parseInt(purchaseQuantity) - 1).toString())}
                                                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-darkBorder-light hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                                                                >
                                                                    −
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max={subAction.stock}
                                                                    value={purchaseQuantity}
                                                                    onChange={(e) => setPurchaseQuantity(e.target.value || '1')}
                                                                    className="w-16 text-center px-3 py-2 border border-gray-300 dark:border-darkBorder-light rounded-lg bg-white dark:bg-darkBg-interactive text-[#00313A] dark:text-white"
                                                                />
                                                                <button
                                                                    onClick={() => setPurchaseQuantity(Math.min(subAction.stock || 1, parseInt(purchaseQuantity) + 1).toString())}
                                                                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-darkBorder-light hover:bg-gray-100 dark:hover:bg-darkBg-interactive"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                Available: {subAction.stock} units
                                                            </p>
                                                        </div>

                                                        {/* Custom Amount for Pay What You Want */}
                                                        {(parentAction as any)?.pricing?.mode === 'pay_what_you_want' && (
                                                            <div className="space-y-2">
                                                                <label className="text-sm font-semibold text-[#00313A] dark:text-white flex items-center gap-2">
                                                                    <span>Your Price</span>
                                                                    <DollarSign className="w-4 h-4 text-[#00B512]" />
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-[#00313A] dark:text-white">
                                                                        {parentAction.currency || 'USD'}
                                                                    </span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={customAmount}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (!value || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                                                                                setCustomAmount(value);
                                                                                setPurchaseError(null);
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-darkBorder-light rounded-lg bg-white dark:bg-darkBg-interactive text-right font-semibold text-[#00313A] dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                                                        placeholder="Enter amount you want to pay"
                                                                    />
                                                                </div>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                    Enter any amount you'd like to pay
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Price Summary */}
                                                        <div className="bg-gray-50 dark:bg-darkBg-interactive rounded-lg p-4">
                                                            {(parentAction as any)?.pricing?.mode === 'pay_what_you_want' ? (
                                                                <>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300">Quantity:</span>
                                                                        <span className="font-semibold text-[#00313A] dark:text-white">
                                                                            {purchaseQuantity}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300">Price per item:</span>
                                                                        <span className="font-semibold text-[#00313A] dark:text-white">
                                                                            {customAmount ? `${parentAction.currency || 'USD'} ${parseFloat(customAmount).toFixed(2)}` : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-darkBorder-light">
                                                                        <span className="font-semibold text-[#00313A] dark:text-white">Total:</span>
                                                                        <span className="text-xl font-bold text-[#00B512]">
                                                                            {customAmount ? `${parentAction.currency || 'USD'} ${(parseFloat(customAmount) * parseInt(purchaseQuantity)).toFixed(2)}` : 'N/A'}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300">Unit Price:</span>
                                                                        <span className="font-semibold text-[#00313A] dark:text-white">
                                                                            {parentAction.currency || 'USD'} {Number(subAction.price).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-darkBorder-light">
                                                                        <span className="font-semibold text-[#00313A] dark:text-white">Total:</span>
                                                                        <span className="text-xl font-bold text-[#00B512]">
                                                                            {parentAction.currency || 'USD'} {(Number(subAction.price) * parseInt(purchaseQuantity)).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Buyer Information - Dynamic Fields */}
                                                        <div className="space-y-4">
                                                            {(() => {
                                                                const requiredFields = (parentAction as any)?.buyerFields && (parentAction as any).buyerFields.length > 0
                                                                    ? (parentAction as any).buyerFields
                                                                    : ['fullName', 'email', 'phone'];
                                                                
                                                                const notesFields = requiredFields.filter((f: string) => f === 'notes');
                                                                const otherFields = requiredFields.filter((f: string) => f !== 'notes');

                                                                return (
                                                                    <>
                                                                        {otherFields.map((field: string) => {
                                                                            const isRequired = field !== 'notes';
                                                                            return renderBuyerField(field, buyerData[field] || '', isRequired);
                                                                        })}
                                                                        {notesFields.map((field: string) => {
                                                                            return renderBuyerField(field, buyerData[field] || '', false);
                                                                        })}
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Error Message */}
                                                        {purchaseError && (
                                                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                                                                <p className="text-sm text-red-600 dark:text-red-400">{purchaseError}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <DialogFooter className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setIsPurchaseOpen(false)}
                                                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-darkBorder-light text-[#00313A] dark:text-white hover:bg-gray-50 dark:hover:bg-darkBg-interactive"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handlePurchase}
                                                            disabled={isPurchasing}
                                                            className="px-4 py-2 rounded-lg bg-[#00B512] text-white font-semibold hover:bg-[#009a0f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {isPurchasing ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShoppingCart className="w-4 h-4" />
                                                                    Complete Purchase
                                                                </>
                                                            )}
                                                        </button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>

                                    {/* Pricing Section */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <DollarSign className="w-4 h-4 text-[#00B512]" />
                                                <span className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest">
                                                    Price
                                                </span>
                                            </div>
                                            {isEditing && editFormData ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editFormData.price}
                                                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                                                    className="text-2xl font-bold text-[#00313A] dark:text-white bg-transparent border-b-2 border-[#00B512] outline-none w-full"
                                                />
                                            ) : (
                                                <p className="text-2xl font-bold text-[#00313A] dark:text-white">
                                                    ${Number(subAction.price).toFixed(2)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package className="w-4 h-4 text-[#00B512]" />
                                                <span className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest">
                                                    Stock
                                                </span>
                                            </div>
                                            {isEditing && editFormData ? (
                                                <input
                                                    type="number"
                                                    value={editFormData.stock || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value ? parseInt(e.target.value) : undefined })}
                                                    placeholder="Unlimited"
                                                    className="text-2xl font-bold text-[#00313A] dark:text-white bg-transparent border-b-2 border-[#00B512] outline-none w-full"
                                                />
                                            ) : (
                                                <p className="text-2xl font-bold text-[#00313A] dark:text-white">
                                                    {subAction.stock ? `${subAction.stock} units` : 'Unlimited'}
                                                </p>
                                            )}
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <span className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-2 block">
                                                Reserved
                                            </span>
                                            <p className="text-2xl font-bold text-[#00313A] dark:text-white">
                                                {subAction.stockReserved || 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-3">
                                            Description
                                        </label>
                                        {isEditing && editFormData ? (
                                            <textarea
                                                value={editFormData.description || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                className="w-full rounded-xl border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-main dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                                                rows={4}
                                                placeholder="Add a description..."
                                            />
                                        ) : (
                                            <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                                <p className="text-[#00313A] dark:text-gray-300">
                                                    {subAction.description || 'No description provided'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Status and Visibility */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-2">
                                                Status
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${subAction.isActive ? 'bg-[#00B512]' : 'bg-gray-400'}`} />
                                                <p className="text-lg font-semibold text-[#00313A] dark:text-white">
                                                    {subAction.isActive ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-2">
                                                Sort Order
                                            </p>
                                            <p className="text-lg font-semibold text-[#00313A] dark:text-white">
                                                #{subAction.sortOrder ?? 0}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metadata Section */}
                                    {subAction.metadata && (
                                        <div className="space-y-4">
                                            {subAction.metadata.seatType && (
                                                <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                                    <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-2">
                                                        Seat Type
                                                    </p>
                                                    <p className="text-lg font-semibold text-[#00313A] dark:text-white capitalize">
                                                        {subAction.metadata.seatType}
                                                    </p>
                                                </div>
                                            )}

                                            {Array.isArray(subAction.metadata.benefits) && subAction.metadata.benefits.length > 0 && (
                                                <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                                    <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-3">
                                                        Benefits
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {subAction.metadata.benefits.map((benefit) => (
                                                            <li key={benefit} className="flex items-center gap-2">
                                                                <CheckCircle2 className="w-4 h-4 text-[#00B512]" />
                                                                <span className="text-[#00313A] dark:text-gray-300">{benefit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* QR Code Section */}
                                    {subAction.dedicatedQrCodeData && (
                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-3">
                                                Dedicated QR Code
                                            </p>
                                            <div className="flex justify-center">
                                                <img
                                                    src={subAction.dedicatedQrCodeData}
                                                    alt="Dedicated QR Code"
                                                    className="w-48 h-48 border border-gray-200 dark:border-darkBorder-light rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Cover Image Section */}
                                    {subAction.coverImage && (
                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <p className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest mb-3">
                                                Cover Image
                                            </p>
                                            <img
                                                src={subAction.coverImage}
                                                alt="Cover"
                                                className="w-full h-48 object-cover rounded-lg"
                                            />
                                        </div>
                                    )}

                                    {/* Timestamps */}
                                    <div className="pt-6 border-t border-gray-100 dark:border-darkBorder-light grid grid-cols-2 gap-4">
                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-[#00B512]" />
                                                <span className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest">
                                                    Created
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-[#00313A] dark:text-gray-300">
                                                {formatDate(subAction.createdAt)}
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="w-4 h-4 text-[#00B512]" />
                                                <span className="text-xs font-semibold text-[#00313A] dark:text-white uppercase tracking-widest">
                                                    Updated
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-[#00313A] dark:text-gray-300">
                                                {formatDate(subAction.updatedAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Edit Actions */}
                                    {isEditing && (
                                        <div className="pt-6 border-t border-gray-100 dark:border-darkBorder-light flex gap-3 justify-end">
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditFormData(subAction);
                                                }}
                                                disabled={isSaving}
                                                className="px-6 py-3 rounded-full border border-gray-200 dark:border-darkBorder-light text-[#00313A] dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-darkBg-interactive disabled:opacity-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveEdit}
                                                disabled={isSaving}
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00B512] text-white font-semibold shadow hover:bg-[#009a0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                                <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    <span>Subaction not found</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">
                                    The subaction you're looking for doesn't exist or has been deleted.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <div className="lg:hidden">
                <Navigation />
            </div>
        </div>
    );
};

export default SubActionDetailPage;
