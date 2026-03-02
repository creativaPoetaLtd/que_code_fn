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
import { useToast } from '@/hooks/use-toast';
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
    parentActionType?: string;
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
    const { toast } = useToast();

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
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const isOwner = userId === tokenUserId && accountType === 'organization';

    // Fetch subaction and parent action details
    const fetchSubActionDetails = useCallback(async () => {
        
        if (!userId || !subactionId) {
            console.error('Missing required parameters - userId:', userId, 'subactionId:', subactionId);
            setError('Missing required parameters');
            setLoading(false);
            return;
        }

        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
            setLoading(true);
            setError(null);

            // Fetch the subaction directly by ID
            const subActionResponse = await axios.get(
                `${baseUrl}/sub-actions/${subactionId}`,
                { headers }
            );

            const foundSubAction = subActionResponse.data?.data || subActionResponse.data;

            if (!foundSubAction) {
                setError('Subaction not found');
                setLoading(false);
                return;
            }

            // Parse metadata if it's a JSON string
            if (foundSubAction.metadata && typeof foundSubAction.metadata === 'string') {
                try {
                    foundSubAction.metadata = JSON.parse(foundSubAction.metadata);
                } catch (err) {
                    console.error('Error parsing metadata:', err);
                    foundSubAction.metadata = {};
                }
            }

            // Now fetch the parent action
            const actionId = foundSubAction.actionId;
            const actionResponse = await axios.get(
                `${baseUrl}/actions/${actionId}`,
                { headers }
            );

            const foundAction = actionResponse.data?.data || actionResponse.data;

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
        const token = getToken();
        setIsLoggedIn(!!token);
        fetchSubActionDetails();
    }, [fetchSubActionDetails, getToken]);

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

            // Show success toast
            toast({
                title: "Purchase Successful!",
                description: "Check your email for details.",
                variant: "default",
            });

            // Close modal and reset form
            setIsPurchaseOpen(false);
            setPurchaseQuantity('1');
            setCustomAmount('');
            setBuyerData({});

            // Navigate to home after a short delay to show the toast
            setTimeout(() => {
                router.push('/home');
            }, 1000);
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
                        className="w-full h-20 rounded-lg border-2 border-[#00313A]/10 dark:border-darkBorder-light focus:border-[#D4AF37] text-sm p-2 focus:outline-none bg-white dark:bg-darkBg-interactive text-[#00313A] dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
                {isLoggedIn && <Navigation />}
                <main className={cn(
                    "flex-1 flex flex-col p-4 md:p-8 transition-all duration-300",
                    isLoggedIn && (isExpanded ? "lg:ml-64" : "lg:ml-20")
                )}>
                    <div className="flex items-center justify-center h-screen">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37] mx-auto mb-4" />
                            <p className="text-[#00313A] dark:text-white font-medium">Loading subaction details...</p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-darkBg-main">
            {isLoggedIn && <Navigation />}

            <main className={cn(
                "flex-1 flex flex-col p-4 md:p-8 transition-all duration-300",
                isLoggedIn && (isExpanded ? "lg:ml-64" : "lg:ml-20")
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    {isLoggedIn && <Header />}

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
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-white font-semibold shadow hover:bg-[#C9A530]"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : subAction && parentAction ? (
                            <>
                                {/* Parent Action Reference */}
                                <div className="p-4 mb-4">
                                    <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest mb-3">
                                        Parent Action
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-bold text-[#00313A] dark:text-white mb-2">
                                                {parentAction.name}
                                            </h2>
                                            <p className="text-base text-[#00313A]/70 dark:text-gray-300">
                                                {parentAction.shortDescription}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                            parentAction.status === 'published'
                                                ? 'bg-[#D4AF37]/10 dark:bg-[#D4AF37]/20 text-[#D4AF37]'
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
                                                    className="text-3xl font-bold text-[#00313A] dark:text-white bg-transparent border-b-2 border-[#D4AF37] outline-none w-full"
                                                />
                                            ) : (
                                                <>
                                                    <h1 className="text-3xl font-bold text-[#00313A] dark:text-white">
                                                        {subAction.name}
                                                    </h1>
                                                    <p className="text-xl font-semibold text-[#00313A]/70 dark:text-gray-300 mt-2">
                                                        {subAction.stock ? `${subAction.stock}` : '∞'} available
                                                    </p>
                                                </>
                                            )}
                                            {/* <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-2">
                                                ID: {subactionId}
                                            </p> */}
                                        </div>

                                        {isOwner && !isEditing && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-white text-sm font-semibold shadow hover:bg-[#C9A530] transition-colors"
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
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37] text-white text-sm font-semibold shadow hover:bg-[#C9A530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isPurchasing ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Purchasing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShoppingCart className="w-4 h-4" />
                                                                {(() => {
                                                                    switch (subAction.parentActionType) {
                                                                        case 'ticket':
                                                                        case 'service':
                                                                            return 'Purchase';
                                                                        case 'payment':
                                                                        case 'transport':
                                                                            return 'Pay';
                                                                        case 'booking':
                                                                            return 'Book Now';
                                                                        case 'vote':
                                                                            return 'Vote';
                                                                        case 'subscription':
                                                                            return 'Subscribe';
                                                                        case 'donation':
                                                                            return 'Donate';
                                                                        default:
                                                                            return 'Buy Now';
                                                                    }
                                                                })()}
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
                                                                <label className="text-sm font-semibold text-[#D4AF37] flex items-center gap-2">
                                                                    <span>Your Price</span>
                                                                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                                                                </label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-semibold text-[#D4AF37]">
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
                                                                <p className="text-xs text-[#D4AF37] font-semibold">
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
                                                                        <span className="text-xl font-bold text-[#D4AF37]">
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
                                                                        <span className="text-xl font-bold text-[#D4AF37]">
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
                                                            className="px-4 py-2 rounded-lg bg-[#D4AF37] text-white font-semibold hover:bg-[#C9A530] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        >
                                                            {isPurchasing ? (
                                                                <>
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                    Processing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ShoppingCart className="w-4 h-4" />
                                                                    {(() => {
                                                                        switch (subAction.parentActionType) {
                                                                            case 'ticket':
                                                                            case 'service':
                                                                                return 'Complete Purchase';
                                                                            case 'payment':
                                                                            case 'transport':
                                                                                return 'Complete Payment';
                                                                            case 'booking':
                                                                                return 'Complete Booking';
                                                                            case 'vote':
                                                                                return 'Submit Vote';
                                                                            case 'subscription':
                                                                                return 'Complete Subscription';
                                                                            case 'donation':
                                                                                return 'Complete Donation';
                                                                            default:
                                                                                return 'Complete Purchase';
                                                                        }
                                                                    })()}
                                                                </>
                                                            )}
                                                        </button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>

                                    {/* Main Content Layout - Cover Image, QR Code, and Details */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Left Column - Cover Image (Square) */}
                                        <div className="lg:col-span-1">
                                            {subAction.coverImage ? (
                                                <div className="relative w-full aspect-square rounded-3xl overflow-hidden shadow-lg border-4 border-[#D4AF37]/20">
                                                    <img
                                                        src={subAction.coverImage}
                                                        alt={subAction.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative w-full aspect-square rounded-3xl bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:from-darkBg-interactive dark:to-darkBg-card flex items-center justify-center border-4 border-[#D4AF37]/20">
                                                    <div className="text-center">
                                                        <Package className="w-16 h-16 text-[#D4AF37]/30 mx-auto mb-2" />
                                                        <p className="text-sm text-[#D4AF37]/60 font-medium">No cover image</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* QR Code - Small on the side */}
                                            {subAction.dedicatedQrCodeData && (
                                                <div className="mt-4 bg-white dark:bg-darkBg-card rounded-2xl border-2 border-[#D4AF37]/20 p-3 shadow-md">
                                                    <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest mb-2 text-center">
                                                        QR Code
                                                    </p>
                                                    <div className="flex justify-center">
                                                        <img
                                                            src={subAction.dedicatedQrCodeData}
                                                            alt="QR Code"
                                                            className="w-32 h-32 rounded-lg"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-center text-[#D4AF37] font-semibold mt-2">Scan to access</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column - Details and Content */}
                                        <div className="lg:col-span-2 space-y-6">
                                            {/* Pricing Cards */}
                                            {(parentAction as any)?.pricing?.mode !== 'pay_what_you_want' && (
                                                <div className="bg-gradient-to-br from-[#FFF9E6] via-[#FFFBF0] to-[#FFFEF8] dark:from-darkBg-interactive dark:to-darkBg-card rounded-2xl border-2 border-[#D4AF37]/20 p-5 shadow-md">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                                                        <span className="text-sm font-bold text-[#D4AF37] uppercase tracking-wide">
                                                            Price
                                                        </span>
                                                    </div>
                                                    {isEditing && editFormData ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editFormData.price}
                                                            onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) })}
                                                            className="text-3xl font-bold text-[#00313A] dark:text-white bg-transparent border-b-2 border-[#D4AF37] outline-none w-full"
                                                        />
                                                    ) : (
                                                        <p className="text-3xl font-bold text-[#00313A] dark:text-white">
                                                            ${Number(subAction.price).toFixed(2)}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Description */}
                                            <div className="bg-white dark:bg-darkBg-card rounded-2xl border-2 border-[#D4AF37]/10 p-5 shadow-md">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1 h-6 bg-[#D4AF37] rounded-full"></div>
                                                    <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wide">
                                                        Description
                                                    </h3>
                                                </div>
                                                {isEditing && editFormData ? (
                                                    <textarea
                                                        value={editFormData.description || ''}
                                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                                        className="w-full rounded-xl border-2 border-[#D4AF37]/20 dark:border-darkBorder-light dark:bg-darkBg-main dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
                                                        rows={4}
                                                        placeholder="Add a description..."
                                                    />
                                                ) : (
                                                    <p className="text-[#00313A] dark:text-gray-300 leading-relaxed">
                                                        {subAction.description || 'No description provided'}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Metadata Section */}
                                            {subAction.metadata && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {subAction.metadata.seatType && (
                                                        <div className="bg-white dark:bg-darkBg-card rounded-2xl border-2 border-[#D4AF37]/10 p-4 shadow-md">
                                                            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-2">
                                                                Seat Type
                                                            </p>
                                                            <p className="text-lg font-semibold text-[#00313A] dark:text-white capitalize">
                                                                {subAction.metadata.seatType}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {(subAction.metadata as any).extra && (
                                                        <div className="bg-white dark:bg-darkBg-card rounded-2xl border-2 border-[#D4AF37]/10 p-4 shadow-md">
                                                            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide mb-2">
                                                                Extra
                                                            </p>
                                                            <p className="text-lg font-semibold text-[#00313A] dark:text-white capitalize">
                                                                {(subAction.metadata as any).extra}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {Array.isArray(subAction.metadata.benefits) && subAction.metadata.benefits.length > 0 && (
                                                        <div className="bg-white dark:bg-darkBg-card rounded-2xl border-2 border-[#D4AF37]/10 p-4 shadow-md sm:col-span-2">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-1 h-5 bg-[#D4AF37] rounded-full"></div>
                                                                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wide">
                                                                    Benefits
                                                                </p>
                                                            </div>
                                                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {subAction.metadata.benefits.map((benefit) => (
                                                                    <li key={benefit} className="flex items-start gap-2">
                                                                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                                                                        <span className="text-sm text-[#00313A] dark:text-gray-300">{benefit}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Timestamps */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-xl border border-[#D4AF37]/10 p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Calendar className="w-3 h-3 text-[#D4AF37]" />
                                                        <span className="text-xs font-semibold text-[#D4AF37]">
                                                            Created
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-[#00313A] dark:text-gray-300">
                                                        {formatDate(subAction.createdAt)}
                                                    </p>
                                                </div>

                                                <div className="bg-gradient-to-br from-gray-50 dark:from-darkBg-interactive to-white dark:to-darkBg-card rounded-xl border border-[#D4AF37]/10 p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock className="w-3 h-3 text-[#D4AF37]" />
                                                        <span className="text-xs font-semibold text-[#D4AF37]">
                                                            Updated
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-[#00313A] dark:text-gray-300">
                                                        {formatDate(subAction.updatedAt)}
                                                    </p>
                                                </div>
                                            </div>
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
                                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37] text-white font-semibold shadow hover:bg-[#C9A530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

            {isLoggedIn && (
                <div className="lg:hidden">
                    <Navigation />
                </div>
            )}
        </div>
    );
};

export default SubActionDetailPage;
