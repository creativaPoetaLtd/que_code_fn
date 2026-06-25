'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowDownUp,
  ExternalLink,
  LayoutGrid,
  Loader2,
  List,
  Search,
  Users,
  Ticket,
  QrCode,
  CreditCard,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  X,
  Check,
  Heart,
  TrendingUp,
} from 'lucide-react';
import baseUrl from '@/helpers/baseUrl';
import { useUserInfo } from '@/hooks/use-user-info';
import { useAuthToken } from '@/hooks/use-auth-token';
import { toast } from '@/hooks/use-toast';
import { Input as CustomInput } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button as CustomButton } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Action {
  id: string;
  organizationId: string;
  type: string;
  name: string;
  slug: string;
  displayLayout: string;
  coverImage: string | null;
  shortDescription: string | null;
  description: string | null;
  currency: string;
  pricing: { mode: string };
  availability: {
    endsAt: string | null;
    startsAt: string | null;
    timezone: string | null;
    userQuota: number | null;
    salesWindow: { until: string | null } | null;
  };
  visibility: { mode: string };
  buyerFields: string[];
  fulfillment: {
    objectType: string;
    storeOnBuyerQR: boolean;
    postPurchaseMessage: string | null;
  };
  policy: { refund: string | null; tosUrl: string | null; cancellation: string | null };
  webhooks: { onCheckout: string | null; onScanValid: string | null };
  customFields: Record<string, any>;
  metadata?: Record<string, any>;
  status: string;
  dedicatedQrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubAction {
  id: string;
  actionId: string;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  stockReserved: number;
  variants: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  sortOrder: number;
  coverImage?: string | null;
  dedicatedQrCodeData?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: { id: string; balance: number; currency: string };
}

type PurchaseRecord = { quantity: number; buyerData: Record<string, string>; customAmount?: number };

interface BookingState {
  selectedSlot: string;
  selectedDate: string;
  people: string;
  notes: string;
  selectedOptions: string[];
}

const PEOPLE_OPTIONS = ['1 person', '2 people', '3 people', '4 people', '5+ people'];

const defaultBookingState = (): BookingState => ({
  selectedSlot: '',
  selectedDate: '',
  people: '1 person',
  notes: '',
  selectedOptions: [],
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ActionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const actionId = params.actionId as string;

  const { isAuthenticated, userId: currentUserId, accountType } = useUserInfo();
  const { getToken } = useAuthToken();
  const isLoggedInAsOrganization = accountType === 'organization';

  // Data
  const [action, setAction] = useState<Action | null>(null);
  const [subActions, setSubActions] = useState<SubAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [subActionsLoading, setSubActionsLoading] = useState(false);

  // Purchase state
  const [purchaseData, setPurchaseData] = useState<Record<string, PurchaseRecord>>({});
  const [purchasing, setPurchasing] = useState<Record<string, boolean>>({});
  const [purchaseError, setPurchaseError] = useState<Record<string, string>>({});
  const [purchaseResult, setPurchaseResult] = useState<{
    referenceId: string;
    description: string;
    buyerBalanceAfter: number;
    buyerCurrency: string;
    qrCodeData?: string;
    subActionName?: string;
  } | null>(null);
  const [isPurchaseSuccessOpen, setIsPurchaseSuccessOpen] = useState(false);

  // Vote state
  const [selectedCandidate, setSelectedCandidate] = useState<SubAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [voteFilter, setVoteFilter] = useState<'all' | 'top' | 'new'>('all');

  // Ticket state
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  // Booking state
  const [bookingState, setBookingState] = useState<Record<string, BookingState>>({});
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchAction = async () => {
      if (!actionId) return;
      try {
        setLoading(true);
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${baseUrl}/actions/${actionId}`, { headers });
        const data = res.data?.data || res.data;
        setAction(data);
      } catch {
        toast({ title: 'Failed to load action', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchAction();
  }, [actionId, getToken]);

  const fetchSubActions = useCallback(async () => {
    if (!actionId) return;
    try {
      setSubActionsLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${baseUrl}/actions/${actionId}/sub-actions`, { headers });
      const data = res.data?.data || res.data;
      setSubActions(Array.isArray(data) ? data : []);
    } catch {
      setSubActions([]);
    } finally {
      setSubActionsLoading(false);
    }
  }, [actionId, getToken]);

  useEffect(() => {
    if (!loading && action) fetchSubActions();
  }, [loading, action, fetchSubActions]);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatPrice = (price: string, currency: string) => {
    const n = parseFloat(price);
    if (isNaN(n)) return price;
    return `${currency} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      });
    } catch { return 'N/A'; }
  };

  const activeSubActions = useMemo(
    () => subActions.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [subActions]
  );

  // ─── Purchase logic ────────────────────────────────────────────────────────

  const handlePurchase = async (subAction: SubAction) => {
    if (!action) return;
    const data = purchaseData[subAction.id];
    if (!data?.quantity || data.quantity <= 0) {
      setPurchaseError(prev => ({ ...prev, [subAction.id]: 'Please enter a valid quantity' }));
      return;
    }
    const requiredFields =
      action.buyerFields?.length > 0
        ? action.buyerFields.filter(f => f !== 'notes')
        : ['fullName', 'email', 'phone'];
    const missing = requiredFields.filter(f => !data.buyerData?.[f]?.trim());
    if (missing.length > 0) {
      const labels: Record<string, string> = {
        fullName: 'Full Name', email: 'Email', phone: 'Phone',
        firstName: 'First Name', lastName: 'Last Name',
      };
      setPurchaseError(prev => ({
        ...prev,
        [subAction.id]: `Please fill in: ${missing.map(f => labels[f] || f).join(', ')}`,
      }));
      return;
    }
    await executePurchase(subAction, data);
  };

  const handleDirectPurchase = async (subAction: SubAction, data: PurchaseRecord) => {
    await executePurchase(subAction, data);
  };

  const executePurchase = async (subAction: SubAction, data: PurchaseRecord) => {
    if (!action) return;
    try {
      setPurchasing(prev => ({ ...prev, [subAction.id]: true }));
      setPurchaseError(prev => ({ ...prev, [subAction.id]: '' }));

      const token = getToken();
      if (!token) {
        setPurchaseError(prev => ({ ...prev, [subAction.id]: 'Please login to continue' }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }
      if (!currentUserId) {
        setPurchaseError(prev => ({ ...prev, [subAction.id]: 'User ID not found. Please login again.' }));
        setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
        return;
      }

      const body: any = {
        subActionId: subAction.id,
        quantity: data.quantity,
        buyerId: currentUserId,
        buyerData: data.buyerData,
      };
      if (action.pricing.mode === 'pay_what_you_want') {
        body.amount = data.customAmount || 0;
      }

      const res = await axios.post(
        `${baseUrl}/actions/${action.id}/purchase`,
        body,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
      );

      if (res.data) {
        const result = res.data?.data;
        setPurchaseError(prev => { const n = { ...prev }; delete n[subAction.id]; return n; });
        setPurchaseData(prev => { const n = { ...prev }; delete n[subAction.id]; return n; });

        if (result?.transaction) {
          setPurchaseResult({
            referenceId: result.transaction.referenceId || '',
            description: result.transaction.description || '',
            buyerBalanceAfter: result.wallets?.buyer?.balanceAfter ?? 0,
            buyerCurrency: result.wallets?.buyer?.currency || 'RWF',
            qrCodeData: result.qrObject?.qrCodeData,
            subActionName: subAction.name,
          });
          setIsPurchaseSuccessOpen(true);
        } else {
          toast({ title: 'Success!', description: `Operation completed for ${subAction.name}.` });
        }
        fetchSubActions();
      }
    } catch (err: any) {
      setPurchaseError(prev => ({
        ...prev,
        [subAction.id]: err.response?.data?.message || err.message || 'Operation failed.',
      }));
    } finally {
      setPurchasing(prev => ({ ...prev, [subAction.id]: false }));
    }
  };

  const updateQuantity = (subActionId: string, quantity: number) => {
    setPurchaseData(prev => ({
      ...prev,
      [subActionId]: { quantity, buyerData: prev[subActionId]?.buyerData || {}, customAmount: prev[subActionId]?.customAmount },
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
  };

  const updateBuyerData = (subActionId: string, field: string, value: string) => {
    setPurchaseData(prev => ({
      ...prev,
      [subActionId]: {
        quantity: prev[subActionId]?.quantity || 1,
        buyerData: { ...(prev[subActionId]?.buyerData || {}), [field]: value },
        customAmount: prev[subActionId]?.customAmount,
      },
    }));
    setPurchaseError(prev => ({ ...prev, [subActionId]: '' }));
  };

  // ─── Booking helpers ────────────────────────────────────────────────────────

  const getBookingState = (id: string): BookingState => bookingState[id] || defaultBookingState();
  const updateBookingState = (id: string, patch: Partial<BookingState>) =>
    setBookingState(prev => ({ ...prev, [id]: { ...getBookingState(id), ...patch } }));
  const toggleBookingOption = (subActionId: string, option: string) => {
    const current = getBookingState(subActionId).selectedOptions;
    updateBookingState(subActionId, {
      selectedOptions: current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option],
    });
  };

  const handleBook = (subAction: SubAction) => {
    const state = getBookingState(subAction.id);
    if (!state.selectedDate) {
      setLocalErrors(prev => ({ ...prev, [subAction.id]: 'Please select a preferred date.' }));
      return;
    }
    if (!state.selectedSlot) {
      setLocalErrors(prev => ({ ...prev, [subAction.id]: 'Please select a time slot.' }));
      return;
    }
    setLocalErrors(prev => { const n = { ...prev }; delete n[subAction.id]; return n; });
    handleDirectPurchase(subAction, {
      quantity: parseInt(state.people) || 1,
      buyerData: {
        preferredDate: state.selectedDate,
        preferredTime: state.selectedSlot,
        people: state.people,
        notes: state.notes,
        options: state.selectedOptions.join(', '),
      },
    });
  };

  // ─── Buyer field renderer ──────────────────────────────────────────────────

  const renderBuyerField = (field: string, subActionId: string, value: string, isRequired: boolean) => {
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
      idNumber: { label: 'ID Number', type: 'text', placeholder: 'Enter ID number' },
      notes: { label: 'Notes', type: 'text', placeholder: 'Enter notes (optional)' },
    };
    const config = fieldConfig[field] || { label: field, type: 'text', placeholder: `Enter ${field}` };
    return (
      <div key={field} className="space-y-1.5">
        <label className="text-xs font-semibold text-[#4a6278] flex items-center gap-1">
          {config.label}
          {isRequired && <span className="text-red-400">*</span>}
        </label>
        {field === 'notes' ? (
          <textarea
            value={value || ''}
            onChange={e => updateBuyerData(subActionId, field, e.target.value)}
            className="w-full h-20 rounded-lg bg-[#0d1525] border border-[#1e2d40] focus:border-[#3b82f6] text-sm p-3 outline-none text-[#f0f4f8] placeholder:text-[#4a6278] resize-none transition-colors"
            placeholder={config.placeholder}
          />
        ) : (
          <CustomInput
            type={config.type}
            value={value || ''}
            onChange={e => updateBuyerData(subActionId, field, e.target.value)}
            className="h-9 rounded-lg bg-[#0d1525] border-[#1e2d40] focus:border-[#3b82f6] text-sm text-[#f0f4f8] placeholder:text-[#4a6278]"
            placeholder={config.placeholder}
          />
        )}
      </div>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#4a6278] animate-spin" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4">
        <p className="text-[#8da0b3] text-lg">Action not found.</p>
        <button
          onClick={() => router.push(`/welcome/${userId}`)}
          className="px-5 py-2.5 bg-[#3b82f6] rounded-lg text-white font-semibold text-sm"
        >
          Go back
        </button>
      </div>
    );
  }

  // ─── Success dialog config ─────────────────────────────────────────────────

  const successConfigs: Record<string, {
    Icon: React.ElementType;
    iconBg: string;
    title: string;
    refLabel: string;
    qrLabel: string;
    qrCaption: string;
    accentColor: string;
  }> = {
    vote: {
      Icon: Check,
      iconBg: 'from-emerald-500 to-emerald-600',
      title: 'Vote Submitted!',
      refLabel: 'Vote Reference',
      qrLabel: 'Your Vote Confirmation',
      qrCaption: 'Keep this as proof of your vote',
      accentColor: 'text-emerald-400',
    },
    ticket: {
      Icon: Ticket,
      iconBg: 'from-[#3b82f6] to-[#2563eb]',
      title: 'Ticket Purchased!',
      refLabel: 'Ticket Reference',
      qrLabel: 'Your Ticket QR',
      qrCaption: 'Show this at the entry gate',
      accentColor: 'text-[#60a5fa]',
    },
    buy: {
      Icon: Ticket,
      iconBg: 'from-[#3b82f6] to-[#2563eb]',
      title: 'Purchase Complete!',
      refLabel: 'Order Reference',
      qrLabel: 'Your QR Code',
      qrCaption: 'Show this at the entry gate',
      accentColor: 'text-[#60a5fa]',
    },
    booking: {
      Icon: Calendar,
      iconBg: 'from-violet-500 to-violet-600',
      title: 'Booking Confirmed!',
      refLabel: 'Booking Reference',
      qrLabel: 'Your Booking Pass',
      qrCaption: 'Show this to confirm your booking',
      accentColor: 'text-violet-400',
    },
    donation: {
      Icon: Heart,
      iconBg: 'from-rose-500 to-pink-500',
      title: 'Donation Received!',
      refLabel: 'Donation Reference',
      qrLabel: 'Your QR Code',
      qrCaption: 'Thank you for your generosity',
      accentColor: 'text-rose-400',
    },
    subscription: {
      Icon: Check,
      iconBg: 'from-teal-500 to-teal-600',
      title: 'Subscription Activated!',
      refLabel: 'Subscription Reference',
      qrLabel: 'Your QR Code',
      qrCaption: 'Show this to verify your subscription',
      accentColor: 'text-teal-400',
    },
    transport: {
      Icon: CreditCard,
      iconBg: 'from-amber-500 to-orange-500',
      title: 'Payment Complete!',
      refLabel: 'Payment Reference',
      qrLabel: 'Your QR Code',
      qrCaption: 'Show this to the operator',
      accentColor: 'text-amber-400',
    },
  };
  const successCfg = successConfigs[action.type] ?? {
    Icon: Star,
    iconBg: 'from-[#D4AF37] to-[#E5C158]',
    title: 'Purchase Successful!',
    refLabel: 'Receipt / Reference',
    qrLabel: 'Your QR Code',
    qrCaption: 'Show this at the entry gate',
    accentColor: 'text-[#60a5fa]',
  };
  const { Icon: SuccessIcon, iconBg, title: successTitle, refLabel, qrLabel, qrCaption, accentColor } = successCfg;

  // ─── Render by type ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top nav bar */}
      <div className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-[#1e2d40] px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push(`/welcome/${userId}`)}
          className="w-9 h-9 rounded-lg bg-[#111927] border border-[#1e2d40] flex items-center justify-center text-[#8da0b3] hover:text-[#f0f4f8] hover:bg-[#1e2d40] transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#4a6278] text-xs">Back to profile</p>
          <h1 className="text-[#f0f4f8] font-bold text-sm truncate">{action.name}</h1>
        </div>
      </div>

      <div className="max-w-[960px] mx-auto pb-32">
        {action.type === 'vote' && (
          <VoteContent
            action={action}
            activeSubActions={activeSubActions}
            subActionsLoading={subActionsLoading}
            purchasing={purchasing}
            purchaseError={purchaseError}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={setSelectedCandidate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            voteFilter={voteFilter}
            setVoteFilter={setVoteFilter}
            onVote={handleDirectPurchase}
          />
        )}

        {(action.type === 'ticket' || action.type === 'buy') && (
          <TicketContent
            action={action}
            activeSubActions={activeSubActions}
            subActionsLoading={subActionsLoading}
            purchaseData={purchaseData}
            purchasing={purchasing}
            purchaseError={purchaseError}
            expandedDetails={expandedDetails}
            setExpandedDetails={setExpandedDetails}
            onAdjustQuantity={(subAction: SubAction, delta: number) => {
              const current = purchaseData[subAction.id]?.quantity || 0;
              const quota = action.availability.userQuota;
              const stock = subAction.stock !== null ? subAction.stock : null;
              const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock || 999;
              updateQuantity(subAction.id, Math.max(0, Math.min(current + delta, max)));
            }}
            onPurchase={handlePurchase}
            renderBuyerField={renderBuyerField}
            formatPrice={formatPrice}
            currentUserId={currentUserId}
            userId={userId}
            isLoggedInAsOrganization={isLoggedInAsOrganization}
          />
        )}

        {action.type === 'booking' && (
          <BookingContent
            action={action}
            activeSubActions={activeSubActions}
            subActionsLoading={subActionsLoading}
            purchasing={purchasing}
            purchaseError={purchaseError}
            localErrors={localErrors}
            bookingState={bookingState}
            expandedDetails={expandedDetails}
            setExpandedDetails={setExpandedDetails}
            getBookingState={getBookingState}
            updateBookingState={updateBookingState}
            toggleBookingOption={toggleBookingOption}
            onBook={handleBook}
          />
        )}

        {action.type !== 'vote' && action.type !== 'ticket' && action.type !== 'buy' && action.type !== 'booking' && (
          <DefaultContent
            action={action}
            activeSubActions={activeSubActions}
            subActionsLoading={subActionsLoading}
            purchaseData={purchaseData}
            purchasing={purchasing}
            purchaseError={purchaseError}
            onPurchase={handlePurchase}
            onUpdateQuantity={updateQuantity}
            onUpdateBuyerData={updateBuyerData}
            renderBuyerField={renderBuyerField}
            formatDate={formatDate}
            formatPrice={formatPrice}
            currentUserId={currentUserId}
            userId={userId}
            isLoggedInAsOrganization={isLoggedInAsOrganization}
          />
        )}
      </div>

      {/* Purchase success dialog — dynamic per action type */}
      <Dialog open={isPurchaseSuccessOpen} onOpenChange={setIsPurchaseSuccessOpen}>
        <DialogContent className="bg-[#0d1117] border border-[#1e2d40] rounded-2xl w-[calc(100vw-2rem)] max-w-lg p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1e2d40]">
            <div className={`w-10 h-10 bg-gradient-to-br ${iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
              <SuccessIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#f0f4f8] leading-tight">{successTitle}</h2>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
            {purchaseResult && (
              <div className="space-y-3 p-5">
                {/* Sub-action name badge */}
                {purchaseResult.subActionName && (
                  <div className="bg-[#1a3a5c]/40 border border-[#3b82f6]/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <SuccessIcon className={`w-4 h-4 flex-shrink-0 ${accentColor}`} />
                    <p className={`text-sm font-bold ${accentColor}`}>{purchaseResult.subActionName}</p>
                  </div>
                )}

                {/* Reference */}
                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${accentColor}`}>{refLabel}</p>
                  <p className="text-base sm:text-lg font-bold text-[#f0f4f8] font-mono break-all">
                    {purchaseResult.referenceId}
                  </p>
                </div>

                {/* Summary */}
                {purchaseResult.description && (
                  <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#4a6278] uppercase tracking-wide mb-1.5">Summary</p>
                    <p className="text-sm text-[#8da0b3]">{purchaseResult.description}</p>
                  </div>
                )}

                {/* Wallet balance */}
                <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${accentColor}`}>
                    New Wallet Balance
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#f0f4f8]">
                    {purchaseResult.buyerCurrency}{' '}
                    {purchaseResult.buyerBalanceAfter.toLocaleString()}
                  </p>
                </div>

                {/* Organizer message */}
                {action.fulfillment?.postPurchaseMessage && (
                  <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#4a6278] uppercase tracking-wide mb-1.5">
                      Message from Organizer
                    </p>
                    <p className="text-sm text-[#8da0b3]">{action.fulfillment.postPurchaseMessage}</p>
                  </div>
                )}

                {/* QR Code */}
                {purchaseResult.qrCodeData && (
                  <div className="flex flex-col items-center gap-3 bg-[#111927] border border-[#1e2d40] rounded-xl p-5">
                    <p className={`text-xs font-semibold uppercase tracking-wide ${accentColor}`}>{qrLabel}</p>
                    <div className="bg-white rounded-xl p-2 sm:p-3">
                      <img
                        src={purchaseResult.qrCodeData}
                        alt="QR Code"
                        className="w-36 h-36 sm:w-44 sm:h-44 block"
                      />
                    </div>
                    <p className="text-xs text-[#4a6278] text-center">{qrCaption}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
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

// ─── Vote Content ──────────────────────────────────────────────────────────────

function VoteContent({
  action, activeSubActions, subActionsLoading, purchasing, purchaseError,
  selectedCandidate, setSelectedCandidate, searchQuery, setSearchQuery, voteFilter, setVoteFilter, onVote,
}: any) {
  type SortMode = 'votes-desc' | 'votes-asc' | 'newest' | 'oldest' | 'trending' | 'custom';
  type ViewMode = 'grid' | 'list';

  const [sortMode, setSortMode] = useState<SortMode>('votes-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [pinnedCandidateIds, setPinnedCandidateIds] = useState<string[]>([]);
  const filteredCandidates = useMemo(() => {
    let list = activeSubActions;
    if (searchQuery) list = list.filter((s: SubAction) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getVotes = (candidate: SubAction) => Number(candidate.metadata?.votes ?? 0);
    const getRank = (candidate: SubAction) => Number(candidate.metadata?.rank ?? Number.MAX_SAFE_INTEGER);
    const getAgeScore = (candidate: SubAction) => {
      const createdAt = Date.parse(candidate.createdAt);
      return Number.isNaN(createdAt) ? Number.MAX_SAFE_INTEGER : Date.now() - createdAt;
    };
    const getMomentum = (candidate: SubAction) => getVotes(candidate) / Math.max(getAgeScore(candidate) / 3_600_000, 1);

    const compareCandidates = (a: SubAction, b: SubAction) => {
      const votesA = getVotes(a);
      const votesB = getVotes(b);
      const rankA = getRank(a);
      const rankB = getRank(b);
      const sortOrderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const sortOrderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const createdAtA = Date.parse(a.createdAt) || 0;
      const createdAtB = Date.parse(b.createdAt) || 0;
      const momentumA = getMomentum(a);
      const momentumB = getMomentum(b);

      if (sortMode === 'votes-desc') return votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || createdAtB - createdAtA || a.name.localeCompare(b.name);
      if (sortMode === 'votes-asc') return votesA - votesB || rankA - rankB || sortOrderA - sortOrderB || createdAtA - createdAtB || a.name.localeCompare(b.name);
      if (sortMode === 'newest') return createdAtB - createdAtA || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || a.name.localeCompare(b.name);
      if (sortMode === 'oldest') return createdAtA - createdAtB || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || a.name.localeCompare(b.name);
      if (sortMode === 'trending') return momentumB - momentumA || votesB - votesA || rankA - rankB || sortOrderA - sortOrderB || createdAtB - createdAtA || a.name.localeCompare(b.name);
      return sortOrderA - sortOrderB || rankA - rankB || votesB - votesA || createdAtA - createdAtB || a.name.localeCompare(b.name);
    };

    const sortFiltered = [...list].sort(compareCandidates);
    if (voteFilter === 'top') return sortFiltered;
    if (voteFilter === 'new') return [...sortFiltered].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    return sortFiltered;
  }, [activeSubActions, searchQuery, voteFilter, sortMode]);

  const getVotes = (candidate: SubAction) => Number(candidate.metadata?.votes ?? 0);
  const getRank = (candidate: SubAction) => Number(candidate.metadata?.rank ?? Number.MAX_SAFE_INTEGER);
  const getAgeScore = (candidate: SubAction) => {
    const createdAt = Date.parse(candidate.createdAt);
    return Number.isNaN(createdAt) ? Number.MAX_SAFE_INTEGER : Date.now() - createdAt;
  };
  const getMomentum = (candidate: SubAction) => getVotes(candidate) / Math.max(getAgeScore(candidate) / 3_600_000, 1);
  const getTrendLabel = (candidate: SubAction) => {
    const momentum = getMomentum(candidate);
    if (momentum >= 10) return 'Surging';
    if (momentum >= 4) return 'Trending';
    if (momentum >= 1) return 'Rising';
    return 'Steady';
  };

  const pinnedCandidates = useMemo(
    () => pinnedCandidateIds.map(candidateId => activeSubActions.find((candidate: SubAction) => candidate.id === candidateId)).filter(Boolean) as SubAction[],
    [activeSubActions, pinnedCandidateIds]
  );

  const togglePinnedCandidate = (candidateId: string) => {
    setPinnedCandidateIds(prev => {
      if (prev.includes(candidateId)) return prev.filter(id => id !== candidateId);
      if (prev.length >= 3) return [...prev.slice(1), candidateId];
      return [...prev, candidateId];
    });
  };

  const [expandedMore, setExpandedMore] = useState<Record<string, boolean>>({});

  return (
    <>
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden h-56 sm:h-72 bg-[#0d1117]">
        {action.coverImage ? (
          <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a5c] to-[#0d1117]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <div className="flex flex-wrap gap-2 mb-2">
            {action.metadata?.isLive && (
              <span className="inline-flex items-center gap-1.5 bg-[#1a3a5c]/90 border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-1 rounded-full font-semibold backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                Live
              </span>
            )}
            {action.availability.userQuota === 1 && (
              <span className="bg-white/10 text-white/70 text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">1 vote / user</span>
            )}
          </div>
          <h2 className="text-white font-bold text-2xl sm:text-3xl leading-tight drop-shadow-lg">{action.name}</h2>
          {(action.shortDescription || action.description) && (
            <p className="text-white/60 text-sm mt-1 line-clamp-1">{action.shortDescription || action.description}</p>
          )}
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-black/40 text-white/70 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
            {activeSubActions.length} candidates
          </span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="px-4 sm:px-6 pt-4 pb-3 space-y-3 border-b border-[#1e2d40]">
        {/* Quick-pick pills */}
        {activeSubActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeSubActions.slice(0, 5).map((c: SubAction) => (
              <button
                key={c.id}
                onClick={() => setSelectedCandidate((prev: SubAction | null) => prev?.id === c.id ? null : c)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedCandidate?.id === c.id
                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa] shadow-sm shadow-blue-900/40'
                    : 'bg-[#111927] border-[#1e2d40] text-[#8da0b3] hover:border-[#2a3d54] hover:text-[#f0f4f8]'
                }`}
              >
                {c.coverImage && <img src={c.coverImage} alt="" className="w-4 h-4 rounded-full object-cover" />}
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Search + view toggle row */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4a6278]" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search candidates..."
              className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg pl-8 pr-3 py-2 text-[#f0f4f8] text-sm placeholder:text-[#4a6278] outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
          <div className="inline-flex rounded-lg border border-[#1e2d40] bg-[#111927] p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#1a3a5c] text-[#60a5fa]' : 'text-[#4a6278] hover:text-[#8da0b3]'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#1a3a5c] text-[#60a5fa]' : 'text-[#4a6278] hover:text-[#8da0b3]'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs + sort row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-1 bg-[#0d1525] rounded-lg p-0.5 border border-[#1e2d40]">
            {(['all', 'top', 'new'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setVoteFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                  voteFilter === f ? 'bg-[#1a3a5c] text-[#60a5fa]' : 'text-[#4a6278] hover:text-[#8da0b3]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'top' ? 'Top' : 'New'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#4a6278] uppercase tracking-wide font-semibold mr-1">Sort</span>
            {([
              { value: 'votes-desc', label: 'Highest' },
              { value: 'votes-asc', label: 'Lowest' },
              { value: 'newest', label: 'Newest' },
              { value: 'trending', label: 'Trending' },
              { value: 'custom', label: 'Custom' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortMode(opt.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                  sortMode === opt.value
                    ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                    : 'bg-transparent border-[#1e2d40] text-[#4a6278] hover:text-[#8da0b3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Candidates ── */}
      <div className="px-4 sm:px-6 py-5">
        {subActionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-[#4a6278] animate-spin" />
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#1e2d40] rounded-xl">
            <Users className="w-8 h-8 text-[#1e2d40] mx-auto mb-2" />
            <p className="text-[#4a6278] text-sm">No candidates found</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid ── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.map((candidate: SubAction) => {
              const isSelected = selectedCandidate?.id === candidate.id;
              const votes = candidate.metadata?.votes;
              const rank = candidate.metadata?.rank;
              const candidateNum = candidate.metadata?.candidateNumber;

              return (
                <div
                  key={candidate.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${
                    isSelected
                      ? 'border-[#3b82f6] shadow-lg shadow-blue-900/30 bg-[#0f1e30]'
                      : 'border-[#1e2d40] bg-[#111927] hover:border-[#2a3d54] hover:shadow-md hover:shadow-black/30'
                  }`}
                >
                  {/* Photo */}
                  <div className="relative h-44 bg-[#0d1525] flex-shrink-0">
                    {candidate.coverImage ? (
                      <img src={candidate.coverImage} alt={candidate.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a2c3d] to-[#0d1525]">
                        <Users className="w-12 h-12 text-[#1e2d40]" />
                      </div>
                    )}
                    {rank !== undefined && (
                      <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg">
                        #{rank}
                      </div>
                    )}
                    {votes !== undefined && (
                      <div className="absolute top-2.5 right-2.5 bg-[#3b82f6]/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                        {Number(votes).toLocaleString()} votes
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h4 className="text-[#f0f4f8] font-bold text-base leading-tight">{candidate.name}</h4>
                      {candidateNum && <p className="text-[#4a6278] text-xs mt-0.5">Candidate #{candidateNum}</p>}
                      {candidate.description && (
                        <p className="text-[#8da0b3] text-xs mt-1.5 line-clamp-2 leading-relaxed">{candidate.description}</p>
                      )}
                    </div>

                    {candidate.dedicatedQrCodeData && (
                      <a
                        href={`/action/${action.id}/subactions/${candidate.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#4a6278] hover:text-[#60a5fa] transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        View QR & profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {purchaseError[candidate.id] && (
                      <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-2.5 py-1.5 rounded-lg">
                        {purchaseError[candidate.id]}
                      </p>
                    )}

                    <div className="flex gap-2 mt-auto pt-1">
                      <button
                        onClick={() => setSelectedCandidate((prev: SubAction | null) => prev?.id === candidate.id ? null : candidate)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-[#3b82f6] text-[#60a5fa] bg-[#1a3a5c]'
                            : 'border-[#1e2d40] text-[#8da0b3] hover:border-[#2a3d54] hover:text-[#f0f4f8]'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : 'Select'}
                      </button>
                      <button
                        onClick={() => onVote(candidate, { quantity: 1, buyerData: {} })}
                        disabled={purchasing[candidate.id]}
                        className="flex-1 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        {purchasing[candidate.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        {purchasing[candidate.id] ? 'Voting...' : 'Vote'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List ── */
          <div className="border border-[#1e2d40] rounded-xl overflow-hidden divide-y divide-[#1e2d40]">
            {filteredCandidates.map((candidate: SubAction, index: number) => {
              const isSelected = selectedCandidate?.id === candidate.id;
              const votes = candidate.metadata?.votes;
              const rank = candidate.metadata?.rank;

              return (
                <div
                  key={candidate.id}
                  className={`flex items-center gap-4 px-4 py-3 transition-colors ${
                    isSelected ? 'bg-[#0f1e30]' : 'bg-[#111927] hover:bg-[#131f2e]'
                  }`}
                >
                  {/* Rank number */}
                  <span className="text-[#2a3d54] text-sm font-bold w-6 text-center flex-shrink-0">
                    {rank !== undefined ? `#${rank}` : index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#1e2d40] flex-shrink-0 bg-[#0d1525]">
                    {candidate.coverImage ? (
                      <img src={candidate.coverImage} alt={candidate.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-[#4a6278]" />
                      </div>
                    )}
                  </div>

                  {/* Name + description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f0f4f8] font-semibold text-sm truncate">{candidate.name}</p>
                    {candidate.description && (
                      <p className="text-[#4a6278] text-xs truncate mt-0.5">{candidate.description}</p>
                    )}
                  </div>

                  {/* Vote count */}
                  {votes !== undefined && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#f0f4f8] font-bold text-sm">{Number(votes).toLocaleString()}</p>
                      <p className="text-[#4a6278] text-[10px]">votes</p>
                    </div>
                  )}

                  {purchaseError[candidate.id] && (
                    <p className="text-red-400 text-xs flex-shrink-0 max-w-[100px] truncate">{purchaseError[candidate.id]}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {candidate.dedicatedQrCodeData && (
                      <a
                        href={`/action/${action.id}/subactions/${candidate.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-[#1e2d40] text-[#4a6278] hover:text-[#60a5fa] hover:border-[#3b82f6] transition-colors"
                        title="View QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedCandidate((prev: SubAction | null) => prev?.id === candidate.id ? null : candidate)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isSelected
                          ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                          : 'border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                      }`}
                    >
                      {isSelected ? '✓' : 'Select'}
                    </button>
                    <button
                      onClick={() => onVote(candidate, { quantity: 1, buyerData: {} })}
                      disabled={purchasing[candidate.id]}
                      className="px-3 py-1.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      {purchasing[candidate.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Vote
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sticky vote bar ── */}
      {selectedCandidate && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0d1117]/95 backdrop-blur-md border-t border-[#1e2d40] px-4 sm:px-6 py-3 z-30">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-[#3b82f6] flex-shrink-0 bg-[#0d1525]">
              {selectedCandidate.coverImage ? (
                <img src={selectedCandidate.coverImage} alt={selectedCandidate.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#4a6278]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#f0f4f8] font-bold text-sm truncate">{selectedCandidate.name}</p>
              <p className="text-[#4a6278] text-xs">Selected candidate</p>
            </div>
            <button
              onClick={() => setSelectedCandidate(null)}
              className="p-2 text-[#4a6278] hover:text-[#8da0b3] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => onVote(selectedCandidate, { quantity: 1, buyerData: {} })}
              disabled={purchasing[selectedCandidate.id]}
              className="px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-xl text-white font-bold text-sm transition-colors flex items-center gap-2 flex-shrink-0"
            >
              {purchasing[selectedCandidate.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {purchasing[selectedCandidate.id] ? 'Voting...' : 'Vote now'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Ticket Content ────────────────────────────────────────────────────────────

function TicketContent({
  action, activeSubActions, subActionsLoading, purchaseData, purchasing, purchaseError,
  expandedDetails, setExpandedDetails, onAdjustQuantity, onPurchase, renderBuyerField,
  formatPrice, currentUserId, userId, isLoggedInAsOrganization,
}: any) {
  const totalSelected = activeSubActions.reduce((sum: number, s: SubAction) => sum + (purchaseData[s.id]?.quantity || 0), 0);
  const totalPrice = activeSubActions.reduce((sum: number, s: SubAction) => {
    return sum + (purchaseData[s.id]?.quantity || 0) * parseFloat(s.price || '0');
  }, 0);

  return (
    <>
      {/* Hero: image with overlay (left) + description + quick-pick (right) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
        {/* Left: image with gradient overlay + title + meta */}
        <div className="relative rounded-xl overflow-hidden h-64 bg-[#111927] flex-shrink-0">
          {action.coverImage ? (
            <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950 to-[#0d1117]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex flex-wrap gap-2 mb-2">
              {action.metadata?.schedule && (
                <span className="bg-black/50 text-white/80 text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm font-medium">
                  {action.metadata.schedule}
                </span>
              )}
              {action.metadata?.venue && (
                <span className="bg-black/50 text-white/80 text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm font-medium">
                  {action.metadata.venue}
                </span>
              )}
              {action.metadata?.accessMode && (
                <span className="bg-[#1a3a5c]/80 border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-0.5 rounded-md backdrop-blur-sm font-medium">
                  {action.metadata.accessMode}
                </span>
              )}
            </div>
            <h2 className="text-[#f0f4f8] font-bold text-xl leading-tight drop-shadow">{action.name}</h2>
          </div>
        </div>

        {/* Right: description + quick-pick price buttons */}
        <div className="flex flex-col gap-4">
          {(action.description || action.shortDescription) && (
            <p className="text-[#8da0b3] text-sm leading-relaxed">
              {action.description || action.shortDescription}
            </p>
          )}
          {activeSubActions.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {activeSubActions.map((s: SubAction) => (
                <button
                  key={s.id}
                  onClick={() => document.getElementById(`ticket-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="bg-[#111927] border border-[#1e2d40] rounded-xl px-3 py-3 flex flex-col items-center gap-0.5 hover:border-[#3b82f6] hover:bg-[#1a2c3d] transition-colors text-center"
                >
                  <span className="text-[#f0f4f8] text-xs font-bold leading-tight">{s.name}</span>
                  <span className="text-[#60a5fa] text-xs font-semibold">{formatPrice(s.price, action.currency)}</span>
                </button>
              ))}
            </div>
          )}
          {action.metadata?.features && Array.isArray(action.metadata.features) && (
            <ul className="space-y-1.5">
              {action.metadata.features.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-[#7a95ad] text-sm">
                  <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>{f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Ticket cards */}
      <div className="px-6 pb-6">
        {subActionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
          </div>
        ) : activeSubActions.length === 0 ? (
          <div className="text-center py-12 bg-[#111927] rounded-xl border border-[#1e2d40]">
            <Ticket className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
            <p className="text-[#4a6278] text-sm">No ticket categories available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeSubActions.map((subAction: SubAction) => {
              const qty = purchaseData[subAction.id]?.quantity || 0;
              const highlights: string[] = subAction.metadata?.highlights || subAction.metadata?.benefits || [];
              const accessLabel = subAction.metadata?.accessLabel;
              const quota = action.availability.userQuota;
              const stock = subAction.stock !== null ? subAction.stock : null;
              const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock;

              return (
                <div
                  id={`ticket-${subAction.id}`}
                  key={subAction.id}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    qty > 0 ? 'bg-[#111927] border-[#3b82f6]' : 'bg-[#111927] border-[#1e2d40] hover:border-[#2a3d54]'
                  }`}
                >
                  {subAction.coverImage && (
                    <div className="relative h-32 w-full">
                      <img src={subAction.coverImage} alt={subAction.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111927]/90 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    {/* Name + price row */}
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <h4 className="text-[#f0f4f8] font-bold text-lg leading-tight">{subAction.name}</h4>
                      <span className="text-[#f0f4f8] font-bold text-lg flex-shrink-0">
                        {formatPrice(subAction.price, action.currency)}
                      </span>
                    </div>
                    {subAction.description && (
                      <p className="text-[#8da0b3] text-sm mb-3">{subAction.description}</p>
                    )}

                    {/* Badges */}
                    {(accessLabel || stock !== null || max) && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {accessLabel && (
                          <span className="bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-xs px-2.5 py-0.5 rounded-full">
                            {accessLabel}
                          </span>
                        )}
                        {stock !== null && (
                          <span className="bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-xs px-2.5 py-0.5 rounded-full">
                            {stock} left
                          </span>
                        )}
                        {max && (
                          <span className="bg-[#111927] border border-[#1e2d40] text-[#8da0b3] text-xs px-2.5 py-0.5 rounded-full">
                            max {max}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Feature list */}
                    {highlights.length > 0 && (
                      <ul className="space-y-1.5 mb-4">
                        {highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[#7a95ad] text-sm">
                            <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>{h}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Existing QR code */}
                    {subAction.dedicatedQrCodeData && (
                      <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 mb-4 flex items-center gap-4">
                        <div className="bg-white rounded-lg p-2 flex-shrink-0">
                          <img src={subAction.dedicatedQrCodeData} alt="QR" className="w-16 h-16 block" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <QrCode className="w-4 h-4 text-[#3b82f6]" />
                            <span className="text-[#f0f4f8] text-sm font-semibold">Your QR Code</span>
                          </div>
                          <p className="text-[#4a6278] text-xs">Share qr code </p>
                        </div>
                      </div>
                    )}

                    {/* Wallet (org view) */}
                    {subAction.wallet && currentUserId === userId && isLoggedInAsOrganization && (
                      <div className="bg-[#1a3a5c]/30 border border-[#3b82f6]/30 rounded-lg px-3 py-2 mb-4 text-xs text-[#60a5fa] font-semibold">
                        Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                      </div>
                    )}

                    {/* Quantity — inline row */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[#4a6278] text-sm font-semibold">Quantity</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onAdjustQuantity(subAction, -1)}
                          disabled={qty <= 0}
                          className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 transition-colors flex items-center justify-center font-bold text-base"
                        >−</button>
                        <span className="text-[#f0f4f8] font-bold text-base w-6 text-center">{qty}</span>
                        <button
                          onClick={() => onAdjustQuantity(subAction, 1)}
                          disabled={max !== null && max !== undefined && qty >= max}
                          className="w-9 h-9 rounded-full bg-[#0d1525] border border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8] hover:border-[#3b82f6] disabled:opacity-30 transition-colors flex items-center justify-center font-bold text-base"
                        >+</button>
                      </div>
                    </div>

                    {/* Buyer fields */}
                    {qty > 0 && (
                      <div className="bg-[#0d1525] border border-[#1e2d40] rounded-xl p-4 space-y-3 mb-4">
                        <p className="text-[#4a6278] text-xs font-semibold">Buyer information</p>
                        {(action.buyerFields?.length > 0 ? action.buyerFields : ['fullName', 'email', 'phone']).map(
                          (field: string) => renderBuyerField(field, subAction.id, purchaseData[subAction.id]?.buyerData?.[field] || '', field !== 'notes')
                        )}
                      </div>
                    )}

                    {purchaseError[subAction.id] && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs mb-4">
                        {purchaseError[subAction.id]}
                      </div>
                    )}

                    <button
                      onClick={() => onPurchase(subAction)}
                      disabled={qty <= 0 || purchasing[subAction.id]}
                      className="w-full py-3 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {purchasing[subAction.id] ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                      ) : 'Buy now'}
                    </button>
                  </div>

                  {/* Details & conditions expandable */}
                  <button
                    onClick={() => setExpandedDetails((prev: any) => ({ ...prev, [subAction.id]: !prev[subAction.id] }))}
                    className="w-full flex items-center justify-between px-5 py-3.5 border-t border-[#1e2d40] hover:bg-[#0d1525] transition-colors"
                  >
                    <span className="text-[#f0f4f8] text-sm font-semibold">Included details &amp; conditions</span>
                    {expandedDetails[subAction.id]
                      ? <ChevronUp className="w-4 h-4 text-[#4a6278]" />
                      : <ChevronDown className="w-4 h-4 text-[#4a6278]" />}
                  </button>
                  {expandedDetails[subAction.id] && (
                    <div className="px-5 pb-4 space-y-1.5">
                      {action.policy.refund && (
                        <p className="text-[#4a6278] text-xs"><span className="text-[#8da0b3] font-semibold">Refund:</span> {action.policy.refund}</p>
                      )}
                      {action.policy.cancellation && (
                        <p className="text-[#4a6278] text-xs"><span className="text-[#8da0b3] font-semibold">Cancellation:</span> {action.policy.cancellation}</p>
                      )}
                      {!action.policy.refund && !action.policy.cancellation && (
                        <p className="text-[#4a6278] text-xs">No additional details provided.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Event info footer */}
        {(action.metadata?.eventType || action.metadata?.accessMode || action.metadata?.paymentMethod || action.metadata?.refundPolicy) && (
          <div className="grid grid-cols-2 gap-px bg-[#1e2d40] rounded-xl overflow-hidden mt-4">
            {action.metadata?.eventType && <div className="bg-[#0d1117] p-4"><p className="text-[#4a6278] text-xs mb-1">Event type</p><p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.eventType}</p></div>}
            {action.metadata?.accessMode && <div className="bg-[#0d1117] p-4"><p className="text-[#4a6278] text-xs mb-1">Access mode</p><p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.accessMode}</p></div>}
            {action.metadata?.paymentMethod && <div className="bg-[#0d1117] p-4"><p className="text-[#4a6278] text-xs mb-1">Payment</p><p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.paymentMethod}</p></div>}
            {action.metadata?.refundPolicy && <div className="bg-[#0d1117] p-4"><p className="text-[#4a6278] text-xs mb-1">Refund policy</p><p className="text-[#f0f4f8] font-semibold text-sm">{action.metadata.refundPolicy}</p></div>}
          </div>
        )}
      </div>

      {/* Sticky checkout bar */}
      {totalSelected > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0f1924] border-t border-[#1e2d40] px-4 sm:px-6 py-4 z-30">
          <div className="max-w-[960px] mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[#4a6278] text-xs">{totalSelected} ticket{totalSelected !== 1 ? 's' : ''} selected</p>
              <p className="text-[#f0f4f8] font-bold text-sm mt-0.5">
                Total {action.currency} {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={() => {
                const first = activeSubActions.find((s: SubAction) => (purchaseData[s.id]?.quantity || 0) > 0);
                if (first) onPurchase(first);
              }}
              disabled={activeSubActions.some((s: SubAction) => purchasing[s.id])}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-xl text-white font-bold text-sm transition-colors flex-shrink-0"
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Booking Content ───────────────────────────────────────────────────────────

function BookingContent({
  action, activeSubActions, subActionsLoading, purchasing, purchaseError, localErrors,
  expandedDetails, setExpandedDetails, getBookingState, updateBookingState,
  toggleBookingOption, onBook,
}: any) {
  const hasAnythingConfigured = activeSubActions.some((s: SubAction) => {
    const st = getBookingState(s.id);
    return st.selectedSlot || st.selectedDate;
  });

  return (
    <>
      {/* Hero with overlay */}
      <div className="relative h-72 w-full overflow-hidden flex-shrink-0">
        {action.coverImage ? (
          <img src={action.coverImage} alt={action.name} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 to-[#0d1117]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2.5 py-0.5 rounded-md font-medium">Appointment booking</span>
            <span className="bg-[#1a3a5c] border border-[#3b82f6] text-[#60a5fa] text-xs px-2.5 py-0.5 rounded-md font-medium">Instant QC booking</span>
          </div>
          <h2 className="text-2xl font-bold text-[#f0f4f8] leading-tight">{action.name}</h2>
          {(action.description || action.shortDescription) && (
            <p className="text-[#8da0b3] text-sm mt-1.5 max-w-lg">{action.description || action.shortDescription}</p>
          )}
        </div>
      </div>

      {/* Service cards */}
      <div className="p-6">
        {subActionsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
          </div>
        ) : activeSubActions.length === 0 ? (
          <div className="text-center py-12 bg-[#111927] rounded-xl border border-[#1e2d40]">
            <Calendar className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
            <p className="text-[#4a6278] text-sm">No services available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeSubActions.map((subAction: SubAction) => {
              const state = getBookingState(subAction.id);
              const duration = subAction.metadata?.duration;
              const slots: string[] = subAction.metadata?.availableSlots || [];
              const locationOptions: string[] = subAction.metadata?.locationOptions || [];
              const highlights: string[] = subAction.metadata?.highlights || subAction.metadata?.benefits || [];
              const maxPeople = subAction.metadata?.maxPeople;
              const category = subAction.metadata?.category;
              const stockLeft = subAction.stock !== null ? subAction.stock : null;
              const error = localErrors[subAction.id] || purchaseError[subAction.id];

              return (
                <div key={subAction.id} className="rounded-xl border border-[#1e2d40] bg-[#111927] overflow-hidden">
                  {subAction.coverImage && (
                    <div className="relative h-32 w-full">
                      <img src={subAction.coverImage} alt={subAction.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111927]/90 to-transparent" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="text-[#f0f4f8] font-bold text-base">{subAction.name}</h4>
                        {subAction.description && <p className="text-[#8da0b3] text-xs mt-0.5">{subAction.description}</p>}
                      </div>
                      <span className="text-[#3b82f6] font-bold text-lg flex-shrink-0">
                        {action.currency}{Math.round(parseFloat(subAction.price || '0'))}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {duration && <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">{duration}</span>}
                      {stockLeft !== null && <span className="bg-[#1a2c3d] text-[#5b8aaa] text-xs px-2 py-0.5 rounded-md">{stockLeft} slots left</span>}
                    </div>
                    {highlights.length > 0 && (
                      <ul className="space-y-1.5 mb-4">
                        {highlights.map((h: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[#7a95ad] text-xs">
                            <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">·</span>{h}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(category || duration || maxPeople) && (
                      <div className="grid grid-cols-3 gap-px bg-[#1e2d40] rounded-lg overflow-hidden mb-4">
                        {category && <div className="bg-[#0d1525] p-2.5 text-center"><p className="text-[#4a6278] text-xs mb-0.5">Category</p><p className="text-[#f0f4f8] text-xs font-semibold">{category}</p></div>}
                        {duration && <div className="bg-[#0d1525] p-2.5 text-center"><p className="text-[#4a6278] text-xs mb-0.5">Duration</p><p className="text-[#f0f4f8] text-xs font-semibold">{duration}</p></div>}
                        {maxPeople && <div className="bg-[#0d1525] p-2.5 text-center"><p className="text-[#4a6278] text-xs mb-0.5">People</p><p className="text-[#f0f4f8] text-xs font-semibold">1 to {maxPeople}</p></div>}
                      </div>
                    )}
                    {locationOptions.length > 0 && (
                      <div className="mb-4">
                        <label className="text-[#4a6278] text-xs font-semibold mb-2 block">Options</label>
                        <div className="flex flex-wrap gap-2">
                          {locationOptions.map((opt: string) => (
                            <button
                              key={opt}
                              onClick={() => toggleBookingOption(subAction.id, opt)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                state.selectedOptions.includes(opt)
                                  ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                  : 'bg-[#0d1525] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                              }`}
                            >{opt}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    {slots.length > 0 && (
                      <div className="mb-4">
                        <label className="text-[#4a6278] text-xs font-semibold mb-2 block">Available slots</label>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot: string) => (
                            <button
                              key={slot}
                              onClick={() => updateBookingState(subAction.id, { selectedSlot: slot })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                state.selectedSlot === slot
                                  ? 'bg-[#1a3a5c] border-[#3b82f6] text-[#60a5fa]'
                                  : 'bg-[#0d1525] border-[#1e2d40] text-[#8da0b3] hover:text-[#f0f4f8]'
                              }`}
                            >{slot}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">Preferred date</label>
                        <input
                          type="date"
                          value={state.selectedDate}
                          onChange={e => updateBookingState(subAction.id, { selectedDate: e.target.value })}
                          className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">People</label>
                        <select
                          value={state.people}
                          onChange={e => updateBookingState(subAction.id, { people: e.target.value })}
                          className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs outline-none focus:border-[#3b82f6] transition-colors [color-scheme:dark]"
                        >
                          {PEOPLE_OPTIONS.slice(0, maxPeople || 5).map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[#4a6278] text-xs font-semibold mb-1.5 block">Notes</label>
                      <textarea
                        value={state.notes}
                        onChange={e => updateBookingState(subAction.id, { notes: e.target.value })}
                        placeholder="Add details for this booking..."
                        rows={3}
                        className="w-full bg-[#0d1525] border border-[#1e2d40] rounded-lg px-3 py-2 text-[#f0f4f8] text-xs placeholder:text-[#4a6278] outline-none focus:border-[#3b82f6] transition-colors resize-none"
                      />
                    </div>
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs mb-4">{error}</div>
                    )}
                    <button
                      onClick={() => onBook(subAction)}
                      disabled={purchasing[subAction.id]}
                      className="w-full py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {purchasing[subAction.id] ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</> : 'Book now'}
                    </button>
                  </div>
                  <button
                    onClick={() => setExpandedDetails((prev: any) => ({ ...prev, [subAction.id]: !prev[subAction.id] }))}
                    className="w-full flex items-center justify-between px-5 py-3 text-[#4a6278] text-xs border-t border-[#1e2d40] hover:bg-[#0d1525] transition-colors"
                  >
                    <span>Included details &amp; conditions</span>
                    {expandedDetails[subAction.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {expandedDetails[subAction.id] && (
                    <div className="px-5 pb-4 space-y-1.5">
                      {action.policy.refund && <p className="text-[#4a6278] text-xs"><span className="text-[#8da0b3] font-semibold">Refund:</span> {action.policy.refund}</p>}
                      {action.policy.cancellation && <p className="text-[#4a6278] text-xs"><span className="text-[#8da0b3] font-semibold">Cancellation:</span> {action.policy.cancellation}</p>}
                      {!action.policy.refund && !action.policy.cancellation && <p className="text-[#4a6278] text-xs">No additional details provided.</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky booking summary */}
      {hasAnythingConfigured && (() => {
        const configured = activeSubActions.filter((s: SubAction) => {
          const st = getBookingState(s.id);
          return st.selectedDate || st.selectedSlot;
        });
        const first = configured[0];
        if (!first) return null;
        const st = getBookingState(first.id);
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-[#0f1924] border-t border-[#1e2d40] px-4 sm:px-6 py-4 flex items-center justify-between gap-4 z-30">
            <div>
              <p className="text-[#4a6278] text-xs">
                {first.name}{st.selectedSlot && ` · ${st.selectedSlot}`} · {st.people}
              </p>
              <p className="text-[#f0f4f8] font-bold text-sm mt-0.5">
                {action.currency}{Math.round(parseFloat(first.price || '0'))}
              </p>
            </div>
            <button
              onClick={() => onBook(first)}
              disabled={purchasing[first.id]}
              className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 rounded-lg text-white font-bold text-sm transition-colors flex items-center gap-2"
            >
              {purchasing[first.id] ? <><Loader2 className="w-4 h-4 animate-spin" />Booking...</> : 'Book'}
            </button>
          </div>
        );
      })()}
    </>
  );
}

// ─── Default Content ───────────────────────────────────────────────────────────

function DefaultContent({
  action, activeSubActions, subActionsLoading, purchaseData, purchasing, purchaseError,
  onPurchase, onUpdateQuantity, onUpdateBuyerData, renderBuyerField, formatDate, formatPrice,
  currentUserId, userId, isLoggedInAsOrganization,
}: any) {
  const ctaLabel = () => {
    switch (action.type) {
      case 'donation': return 'Donate';
      case 'subscription': return 'Subscribe';
      case 'payment':
      case 'transport': return 'Pay';
      default: return 'Purchase';
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {action.availability.startsAt && (
          <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
            <p className="text-[#4a6278] text-xs mb-1">Starts</p>
            <p className="text-[#f0f4f8] text-xs font-semibold">{formatDate(action.availability.startsAt)}</p>
          </div>
        )}
        {action.availability.endsAt && (
          <div className="bg-[#111927] border border-[#1e2d40] rounded-xl p-3">
            <p className="text-[#4a6278] text-xs mb-1">Ends</p>
            <p className="text-[#f0f4f8] text-xs font-semibold">{formatDate(action.availability.endsAt)}</p>
          </div>
        )}
      </div>

      {action.description && <p className="text-[#8da0b3] text-sm leading-relaxed">{action.description}</p>}

      <div>
        <h3 className="text-[#f0f4f8] font-bold text-base mb-3">Available options</h3>
        {subActionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-7 h-7 text-[#4a6278] animate-spin" />
          </div>
        ) : activeSubActions.length === 0 ? (
          <div className="text-center py-10 bg-[#111927] rounded-xl border border-[#1e2d40]">
            <Ticket className="w-10 h-10 text-[#1e2d40] mx-auto mb-3" />
            <p className="text-[#4a6278] font-medium text-sm">No options available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSubActions.map((subAction: SubAction) => {
              const quota = action.availability.userQuota;
              const stock = subAction.stock !== null ? subAction.stock : null;
              const max = quota && stock !== null ? Math.min(quota, stock) : quota || stock;
              return (
                <div key={subAction.id} className="rounded-xl overflow-hidden border border-[#1e2d40] bg-[#111927]">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h4 className="text-[#f0f4f8] font-bold text-base">{subAction.name}</h4>
                        {subAction.description && <p className="text-[#8da0b3] text-sm mt-1">{subAction.description}</p>}
                      </div>
                      {action.pricing.mode !== 'pay_what_you_want' && (
                        <p className="text-[#3b82f6] font-bold text-lg flex-shrink-0">{formatPrice(subAction.price, action.currency)}</p>
                      )}
                    </div>
                    <div className="pt-4 border-t border-[#1e2d40] space-y-4">
                      <div>
                        <label className="text-[#4a6278] text-xs font-semibold mb-1.5 flex items-center gap-2">
                          Quantity {max && <span className="font-normal">(max {max})</span>}
                        </label>
                        <CustomInput
                          type="number"
                          min="1"
                          max={max ?? undefined}
                          value={purchaseData[subAction.id]?.quantity || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 0) onUpdateQuantity(subAction.id, val);
                            else if (e.target.value === '') onUpdateQuantity(subAction.id, 0);
                          }}
                          className="w-24 h-10 rounded-lg bg-[#0d1525] border-[#1e2d40] text-[#f0f4f8] text-center placeholder:text-[#4a6278]"
                          placeholder="0"
                        />
                      </div>
                      {(purchaseData[subAction.id]?.quantity || 0) > 0 && (
                        <div className="bg-[#0d1525] border border-[#1e2d40] rounded-lg p-4 space-y-3">
                          <p className="text-[#4a6278] text-xs font-semibold">Buyer information</p>
                          {(action.buyerFields?.length > 0 ? action.buyerFields : ['fullName', 'email', 'phone']).map(
                            (field: string) => renderBuyerField(field, subAction.id, purchaseData[subAction.id]?.buyerData?.[field] || '', field !== 'notes')
                          )}
                        </div>
                      )}
                      {purchaseError[subAction.id] && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-lg text-xs">
                          {purchaseError[subAction.id]}
                        </div>
                      )}
                      <button
                        onClick={() => onPurchase(subAction)}
                        disabled={!purchaseData[subAction.id]?.quantity || purchaseData[subAction.id].quantity <= 0 || purchasing[subAction.id]}
                        className="w-full py-3 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {purchasing[subAction.id] ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</> : <><CreditCard className="w-4 h-4" />{ctaLabel()}</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
