'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    Loader2,
    Sparkles,
    Ticket,
    Scan,
    Check,
    Target,
    Users,
    CheckCircle,
    Ban,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Lock,
    ArrowRight,
    Plus,
    Globe2,
    Eye,
    Pencil,
    Send,
    ArrowLeftRight,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Header } from '@/components/Header';
import baseUrl from '@/helpers/baseUrl';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useUserInfo } from '@/hooks/use-user-info';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import ActionWizardModal from '@/components/ActionPage/ActionWizardModal';
import QRObjectValidator from '@/components/ActionPage/QRObjectValidator';
import TransferTicketModal from '@/components/ActionPage/TransferTicketModal';
import { createSubAction, updateSubAction, getMyGroupContributions, contributeToGroup, closeGroupContribution, extendGroupContributionDeadline, getMyPublicContributions } from '@/helpers/api';
import CreatePublicContributionModal from '@/components/contributions/CreatePublicContributionModal';
import { PublicContributionCard, PublicContributionData } from '@/components/contributions/PublicContributionCard';
import socketService from '@/services/socketService';
import { getCurrentUserId } from '@/utils/tokenUtils';
import { formatDistanceToNow } from 'date-fns';

interface TransferRecord {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    at: string;
}

interface QrObject {
    id: string;
    type: string;
    metadata: {
        quantity?: number;
        seatType?: string;
        actionName?: string;
        subActionName?: string;
        benefits?: string[];
        coverImage?: string;
        actionId?: string;
        organizationId?: string;
        transferHistory?: TransferRecord[];
        [key: string]: any;
    };
    status: string;
    issuedAt?: string;
    validUntil?: string;
    usedAt?: string | null;
    qrCodeData?: string;
    coverImage?: string;
    createdAt?: string;
    updatedAt?: string;
    actionId?: string;
    actionPurchaseId?: string;
    organizationId?: string;
}

interface OrganizationAction {
    id: string;
    name: string;
    shortDescription?: string | null;
    description?: string | null;
    coverImage?: string | null;
    visibility?: { mode?: string };
    pricing?: { mode?: string };
    currency?: string | null;
    availability?: {
        startsAt?: string | null;
        endsAt?: string | null;
        timezone?: string | null;
        userQuota?: number | null;
    };
    status?: string;
    subActions?: SubAction[];
    totalSubActionBalance?: number;
}

interface SubAction {
    id: string;
    name: string;
    description?: string | null;
    price: string;
    stock?: number | null;
    stockReserved?: number;
    isActive?: boolean;
    sortOrder?: number;
    metadata?: Record<string, any>;
    wallet?: {
        id: string;
        balance: number;
        currency: string;
    };
}

type AccountMode = 'individual' | 'organization' | null;

// ─── Group Contribution types & components ────────────────────────────────────

interface ContributionPayment {
    id: string; payerId: string; amount: number; createdAt: string;
    payer: { id: string; firstName: string; lastName: string };
}
interface MyContribution {
    id: string; groupId: string; groupName: string; createdBy: string; isAdmin: boolean;
    title: string; note?: string; goalAmount: number; collectedAmount: number;
    contributorCount: number; type: 'fixed' | 'flexible'; amountPerMember?: number;
    minimumAmount?: number; deadline?: string; status: 'active' | 'completed' | 'closed' | 'expired';
    visibilityMode: 'all' | 'admin_only'; currency: string; createdAt: string;
    payments?: ContributionPayment[];
    myPayment?: { id: string; amount: number; createdAt: string } | null;
    creator?: { id: string; firstName: string; lastName: string };
}

const fmtRwf = (n: number, cur = 'RWF') =>
    new Intl.NumberFormat('en-RW', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const toOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

function ContributeFlow({ contribution, onSuccess }: { contribution: MyContribution; onSuccess: (amount: number) => void }) {
    type Step = 'idle' | 'enter_amount' | 'enter_pin' | 'loading';
    const [step, setStep] = useState<Step>('idle');
    const [amount, setAmount] = useState('');
    const [pin, setPin] = useState('');

    const fixedAmount = Number(contribution.amountPerMember);

    const handlePay = async () => {
        const payAmount = contribution.type === 'fixed' ? fixedAmount : Number(amount);
        if (!pin || pin.length !== 4) {
            alert('Enter your 4-digit PIN');
            return;
        }
        setStep('loading');
        try {
            await contributeToGroup(contribution.groupId, contribution.id, payAmount, pin);
            onSuccess(payAmount);
            setStep('idle'); setPin(''); setAmount('');
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Contribution failed');
            setStep(contribution.type === 'fixed' ? 'enter_pin' : 'enter_amount');
        }
    };

    const cancel = () => { setStep('idle'); setPin(''); setAmount(''); };

    if (step === 'idle') return (
        <Button size="sm" className="h-8 text-xs bg-[#00B512] hover:bg-[#009a0f] text-white"
            onClick={() => contribution.type === 'fixed' ? setStep('enter_pin') : setStep('enter_amount')}>
            Contribute{contribution.type === 'fixed' && contribution.amountPerMember ? ` ${fmtRwf(fixedAmount, contribution.currency)}` : ''}
            <ArrowRight size={12} className="ml-1" />
        </Button>
    );

    if (step === 'enter_amount') return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <Input type="number" placeholder={`Amount${contribution.minimumAmount ? ` (min ${fmtRwf(Number(contribution.minimumAmount), contribution.currency)})` : ''}`}
                value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-xs w-full sm:w-36 min-w-0" autoFocus />
            <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-none" onClick={cancel}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs flex-1 sm:flex-none bg-[#00B512] hover:bg-[#009a0f] text-white" onClick={() => {
                    if (!amount || Number(amount) <= 0) return;
                    setStep('enter_pin');
                }}>Next</Button>
            </div>
        </div>
    );

    if (step === 'enter_pin') return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500"><Lock size={11} /><span>PIN</span></div>
                <Input type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                    value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="h-8 text-xs w-full sm:w-20 min-w-0 tracking-widest" autoFocus />
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-none" onClick={cancel}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs flex-1 sm:flex-none bg-[#00B512] hover:bg-[#009a0f] text-white" onClick={handlePay}>Pay</Button>
            </div>
        </div>
    );

    return <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 size={13} className="animate-spin" /> Processing…</div>;
}

function useScrollRow() {
    const ref = React.useRef<HTMLDivElement>(null);
    const [canLeft, setCanLeft] = React.useState(false);
    const [canRight, setCanRight] = React.useState(true);

    const update = React.useCallback(() => {
        const el = ref.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;
        update();
        const t1 = setTimeout(update, 80);
        const t2 = setTimeout(update, 400);
        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            el.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
        };
    }, [update]);

    const scroll = React.useCallback((dir: 'left' | 'right') => {
        ref.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
        setTimeout(update, 380);
    }, [update]);

    return { ref, canLeft, canRight, scroll };
}

function ScrollBtns({ s }: { s: ReturnType<typeof useScrollRow> }) {
    const btn = (active: boolean) =>
        `w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
            active
                ? 'border-gray-300 dark:border-darkBorder-light text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkBg-interactive cursor-pointer'
                : 'border-gray-200 dark:border-darkBorder-light text-gray-300 dark:text-gray-600 pointer-events-none'
        }`;
    return (
        <div className="flex items-center gap-1">
            <button onClick={() => s.scroll('left')} disabled={!s.canLeft} className={btn(s.canLeft)}>
                <ChevronLeft size={12} />
            </button>
            <button onClick={() => s.scroll('right')} disabled={!s.canRight} className={btn(s.canRight)}>
                <ChevronRight size={12} />
            </button>
        </div>
    );
}

function ContributionCard({ contribution: initial, currentUserId }: { contribution: MyContribution; currentUserId: string }) {
    const [c, setC] = useState(initial);
    const [expanded, setExpanded] = useState(false);
    const [extendOpen, setExtendOpen] = useState(false);
    const [newDeadline, setNewDeadline] = useState('');

    const goal = Number(c.goalAmount);
    const collected = Number(c.collectedAmount);
    const progress = goal > 0 ? Math.min((collected / goal) * 100, 100) : 0;
    const isActive = c.status === 'active';
    const hasPaid = !!c.myPayment;
    const canContribute = isActive && !hasPaid;
    const isDeadlinePast = c.deadline && new Date(c.deadline) < new Date();

    useEffect(() => {
        const handleUpdate = (ev: any) => {
            if (ev.contributionId !== c.id) return;
            setC((p) => ({ ...p, collectedAmount: Number(ev.collectedAmount), contributorCount: ev.contributorCount, status: ev.status }));
        };
        const handleCompleted = (ev: any) => {
            if (ev.contributionId === c.id) setC((p) => ({ ...p, status: 'completed', collectedAmount: Number(ev.collectedAmount) }));
        };
        const handleClosed = (ev: any) => {
            if (ev.contributionId === c.id) setC((p) => ({ ...p, status: ev.status || 'closed' }));
        };
        socketService.onGroupContributionUpdated(handleUpdate);
        socketService.onGroupContributionCompleted(handleCompleted);
        socketService.onGroupContributionClosed(handleClosed);
        return () => {
            socketService.offGroupContributionUpdated(handleUpdate);
            socketService.offGroupContributionCompleted(handleCompleted);
            socketService.offGroupContributionClosed(handleClosed);
        };
    }, [c.id]);

    const handleContributeSuccess = (amount: number) => {
        // Only mark as paid locally — collectedAmount/contributorCount come from
        // the socket event the backend emits right after the DB commit, so don't
        // add here or you'd double-count when both updates land.
        setC((p) => ({ ...p, myPayment: { id: 'new', amount, createdAt: new Date().toISOString() } }));
    };

    const handleClose = async () => {
        if (!confirm('Close this campaign? Members won\'t be able to contribute after this.')) return;
        try {
            await closeGroupContribution(c.groupId, c.id);
            setC((p) => ({ ...p, status: 'closed' }));
        } catch (err: any) { alert(err?.response?.data?.message || 'Failed to close campaign'); }
    };

    const handleExtend = async () => {
        if (!newDeadline) return;
        try {
            await extendGroupContributionDeadline(c.groupId, c.id, new Date(newDeadline).toISOString());
            setExtendOpen(false); setNewDeadline('');
        } catch (err: any) { alert(err?.response?.data?.message || 'Failed to extend deadline'); }
    };

    const statusLabel = c.status === 'completed' ? 'Goal Reached' : c.status === 'active' ? 'Active' : c.status === 'expired' ? 'Expired' : 'Closed';
    const statusClass = c.status === 'completed'
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : c.status === 'active'
        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

    const showPayments = expanded && c.payments && c.payments.length > 0 && (c.isAdmin || c.visibilityMode === 'all');

    return (
        <div className="h-full bg-white dark:bg-darkBg-card rounded-3xl border border-emerald-50 dark:border-darkBorder-light shadow-lg shadow-emerald-100/40 dark:shadow-none p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${c.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : c.status === 'active' ? 'bg-[#00B512]/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Target size={16} className={c.status === 'completed' ? 'text-green-600' : c.status === 'active' ? 'text-[#00B512]' : 'text-gray-400'} />
                    </div>
                    <div>
                        <p className="font-bold text-[#00313A] dark:text-white leading-tight">{c.title}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {c.groupName} · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${statusClass}`}>
                    {c.status === 'completed' ? <CheckCircle size={11} /> : c.status === 'active' ? <Clock size={11} /> : <Ban size={11} />}
                    {statusLabel}
                </span>
            </div>

            {c.note && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 -mt-2">{c.note}</p>}

            <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{fmtRwf(collected, c.currency)} collected</span>
                    <span className="font-semibold text-[#00313A] dark:text-white">{fmtRwf(goal, c.currency)} goal</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{Math.round(progress)}% of goal</span>
                    <span className="flex items-center gap-1"><Users size={11} />{c.contributorCount} contributor{c.contributorCount !== 1 ? 's' : ''}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                {c.type === 'fixed' && c.amountPerMember
                    ? <span>Fixed: <span className="font-semibold text-[#00313A] dark:text-white">{fmtRwf(Number(c.amountPerMember), c.currency)}/member</span></span>
                    : <span>Flexible{c.minimumAmount ? ` (min ${fmtRwf(Number(c.minimumAmount), c.currency)})` : ''}</span>
                }
                {c.deadline && (
                    <span className={`flex items-center gap-1 ${isDeadlinePast && isActive ? 'text-red-500' : ''}`}>
                        <CalendarClock size={11} />
                        {isDeadlinePast ? 'Deadline passed ' : 'Due '}
                        {new Date(c.deadline).toLocaleDateString('en-RW', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                )}
            </div>

            {hasPaid && (
                <div className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-full px-3 py-1 mb-3">
                    <CheckCircle size={12} /> You contributed {fmtRwf(Number(c.myPayment!.amount), c.currency)}
                </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                {canContribute && <ContributeFlow contribution={c} onSuccess={handleContributeSuccess} />}

                {c.payments && c.payments.length > 0 && (c.isAdmin || c.visibilityMode === 'all') && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500 px-2"
                        onClick={() => setExpanded((v) => !v)}>
                        <ChevronRight size={13} className={cn('mr-1 transition-transform', expanded && 'rotate-90')} />
                        {expanded ? 'Hide' : 'Show'} contributors ({c.payments.length})
                    </Button>
                )}

                {c.isAdmin && (isActive || c.status === 'expired') && (
                    <div className="flex gap-2 flex-shrink-0 ml-auto">
                        {isActive && (
                            <Button variant="outline" size="sm" className="h-7 text-[11px] border-red-200 text-red-500 hover:bg-red-50" onClick={handleClose}>
                                Close
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-[11px] text-[#00B512] border-[#00B512]/30 hover:bg-[#00B512]/5"
                            onClick={() => setExtendOpen((v) => !v)}>
                            Extend
                        </Button>
                    </div>
                )}
            </div>

            {extendOpen && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input type="date" min={new Date().toISOString().split('T')[0]} value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)} className="h-8 text-xs w-full sm:w-44 min-w-0" />
                    <div className="flex gap-2">
                        <Button size="sm" className="h-8 text-xs flex-1 sm:flex-none bg-[#00B512] hover:bg-[#009a0f] text-white" onClick={handleExtend}>Save</Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs flex-1 sm:flex-none" onClick={() => { setExtendOpen(false); setNewDeadline(''); }}>Cancel</Button>
                    </div>
                </div>
            )}

            {showPayments && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-darkBorder-light space-y-2">
                    {c.payments!.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-[#00B512]/10 flex items-center justify-center text-[10px] font-bold text-[#00B512]">
                                    {p.payer.firstName[0]}{p.payer.lastName[0]}
                                </div>
                                <span className="text-[#00313A] dark:text-white">
                                    {p.payer.firstName} {p.payer.lastName}
                                    {p.payerId === currentUserId && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold text-[#00313A] dark:text-white">{fmtRwf(Number(p.amount), c.currency)}</span>
                                <p className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── end contribution components ──────────────────────────────────────────────

const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const statusClasses: Record<string, string> = {
    valid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    used: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
    expired: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
};

const ActionsByAccountPage = () => {
    const params = useParams<{ userId: string }>();
    const router = useRouter();
    const paramUserId = params?.userId;
    const { userId: tokenUserId, accountType: loggedInAccountType } = useUserInfo();
    const { getToken } = useAuthToken();
    const { isExpanded } = useSidebar();

    // Check if the logged-in user is an organization viewing another user's QR objects
    const isLoggedInAsOrganization = loggedInAccountType === 'organization';
    const isViewingAnotherUser = paramUserId && paramUserId !== tokenUserId;

    const [effectiveUserId, setEffectiveUserId] = useState<string>('');
    const [accountMode, setAccountMode] = useState<AccountMode>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [purchasedActions, setPurchasedActions] = useState<QrObject[]>([]);
    const [organizationActions, setOrganizationActions] = useState<OrganizationAction[]>([]);
    const [selectedAction, setSelectedAction] = useState<OrganizationAction | null>(null);
    const [subActions, setSubActions] = useState<SubAction[]>([]);
    const [subActionsLoading, setSubActionsLoading] = useState(false);
    const [isSubActionsModalOpen, setIsSubActionsModalOpen] = useState(false);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editingActionId, setEditingActionId] = useState<string | null>(null);
    const [preSelectedType, setPreSelectedType] = useState<string | null>(null);
    const [creatingSubAction, setCreatingSubAction] = useState(false);
    const [qrValidatorOpen, setQrValidatorOpen] = useState(false);
    const [subActionError, setSubActionError] = useState<string | null>(null);
    const [newSubAction, setNewSubAction] = useState({
        name: '',
        price: '',
        seatType: '',
        stock: '',
        description: '',
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
    const [purchasedActionsFilter, setPurchasedActionsFilter] = useState<'all' | 'archive'>('all');
    const [editingSubActionId, setEditingSubActionId] = useState<string | null>(null);
    const [markingAsUsed, setMarkingAsUsed] = useState<Record<string, boolean>>({});
    const [transferTarget, setTransferTarget] = useState<QrObject | null>(null);
    const [resolvedTypeMap, setResolvedTypeMap] = useState<Record<string, string>>({});
    const [voteStandingsMap, setVoteStandingsMap] = useState<Record<string, { id: string; name: string; votes: number; rank: number }[]>>({});

    const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
    const [myContributions, setMyContributions] = useState<MyContribution[]>([]);
    const [contributionsLoading, setContributionsLoading] = useState(false);
    const currentUserId = React.useMemo(() => getCurrentUserId(), []);

    // Public campaigns tab
    const [myPublicContributions, setMyPublicContributions] = useState<PublicContributionData[]>([]);
    const [publicContributionsLoading, setPublicContributionsLoading] = useState(false);
    const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
    const [contributionsFilter, setContributionsFilter] = useState<'all' | 'active' | 'history'>('all');
    const [campaignsFilter, setCampaignsFilter] = useState<'all' | 'active' | 'closed'>('all');

    const actionsScroll = useScrollRow();
    const contributionsScroll = useScrollRow();
    const campaignsScroll = useScrollRow();

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setFilterGroupId(params.get('group'));
    }, []);

    useEffect(() => {
        if (paramUserId && paramUserId !== 'undefined') {
            setEffectiveUserId(paramUserId);
        } else if (tokenUserId) {
            setEffectiveUserId(tokenUserId);
        } else {
            setEffectiveUserId('');
        }
    }, [paramUserId, tokenUserId]);

    const fetchData = useCallback(
        async (targetUserId: string) => {
            const token = getToken();
            if (!token) {
                setError('You need to be logged in to view your actions.');
                setLoading(false);
                return;
            }

            const headers = { Authorization: `Bearer ${token}` };

            try {
                setLoading(true);
                setError(null);

                const [userRes, organizationRes] = await Promise.allSettled([
                    axios.get(`${baseUrl}/users/${targetUserId}`, { headers }),
                    axios.get(`${baseUrl}/organizations/${targetUserId}`, { headers }),
                ]);

                if (userRes.status === 'fulfilled') {
                    setAccountMode('individual');
                    const qrResponse = await axios.get(`${baseUrl}/users/${targetUserId}/qr-objects`, { headers });
                    let qrData = Array.isArray(qrResponse.data?.data) ? qrResponse.data.data : [];
                    
                    // If an organization is viewing another user's QR objects,
                    // filter to only show QR objects from their own actions
                    if (isLoggedInAsOrganization && isViewingAnotherUser && tokenUserId) {
                        try {
                            // Fetch the organization's actions to get their action IDs
                            const orgActionsResponse = await axios.get(
                                `${baseUrl}/organizations/${tokenUserId}/actions`,
                                { headers }
                            );
                            const orgActions = orgActionsResponse.data?.data ?? orgActionsResponse.data ?? [];
                            const orgActionIds = new Set(
                                Array.isArray(orgActions) ? orgActions.map((action: OrganizationAction) => action.id) : []
                            );
                            
                            // Filter QR objects to only include those from the organization's actions
                            qrData = qrData.filter((qrObj: QrObject) => {
                                const actionId = qrObj.actionId || qrObj.metadata?.actionId;
                                const organizationId = qrObj.organizationId || qrObj.metadata?.organizationId;
                                
                                // Match by actionId or organizationId
                                return (actionId && orgActionIds.has(actionId)) || 
                                       (organizationId && organizationId === tokenUserId);
                            });
                        } catch (filterErr) {
                            console.error('Failed to filter QR objects by organization:', filterErr);
                            // If filtering fails, show no QR objects for security
                            qrData = [];
                        }
                    }
                    
                    setPurchasedActions(qrData);
                    setOrganizationActions([]);
                    return;
                }

                if (organizationRes.status === 'fulfilled') {
                    setAccountMode('organization');
                    const searchParams = new URLSearchParams();
                    // Don't send 'archived' to the API - fetch all actions and filter client-side
                    if (statusFilter !== 'all' && statusFilter !== 'archived') {
                        searchParams.append('status', statusFilter);
                    }
                    const query = searchParams.toString();
                    const orgActionsResponse = await axios.get(
                        `${baseUrl}/organizations/${targetUserId}/actions${query ? `?${query}` : ''}`,
                        {
                            headers,
                        },
                    );
                    const actionPayload = orgActionsResponse.data?.data ?? orgActionsResponse.data ?? [];
                    setOrganizationActions(Array.isArray(actionPayload) ? actionPayload : []);
                    setPurchasedActions([]);
                    return;
                }

                throw new Error('Account not found. Please try logging out and back in.');
            } catch (err: any) {
                const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Something went wrong while loading your actions. Please try again.';
                setError(errorMessage);
                setPurchasedActions([]);
                setOrganizationActions([]);
            } finally {
                setLoading(false);
            }
        },
        [getToken, statusFilter, isLoggedInAsOrganization, isViewingAnotherUser, tokenUserId],
    );

    useEffect(() => {
        if (effectiveUserId) {
            fetchData(effectiveUserId);
        }
    }, [effectiveUserId, fetchData]);

    const fetchMyContributions = useCallback(async () => {
        setContributionsLoading(true);
        try {
            const res = await getMyGroupContributions();
            setMyContributions(res?.data?.data || res?.data || []);
        } catch {
            // silently fail — contributions section shows empty state
        } finally {
            setContributionsLoading(false);
        }
    }, []);

    const fetchMyPublicContributions = useCallback(async () => {
        setPublicContributionsLoading(true);
        try {
            const res = await getMyPublicContributions();
            setMyPublicContributions(res?.data?.data || res?.data || []);
        } catch {
            // silently fail
        } finally {
            setPublicContributionsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (accountMode === 'individual' && !isViewingAnotherUser) {
            fetchMyContributions();
            fetchMyPublicContributions();
        }
    }, [accountMode, isViewingAnotherUser, fetchMyContributions, fetchMyPublicContributions]);

    useEffect(() => {
        if (!purchasedActions.length) return;
        const token = getToken();
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        const uniqueIds = Array.from(
            new Set(
                purchasedActions.map(i => i.metadata?.actionId || i.actionId).filter(Boolean) as string[]
            )
        );
        Promise.allSettled(
            uniqueIds.map(async (actionId) => {
                const res = await axios.get(`${baseUrl}/actions/${actionId}`, { headers }).catch(() => null);
                const action = res?.data?.data || res?.data;
                if (!action) return;
                setResolvedTypeMap(prev => ({ ...prev, [actionId]: action.type }));
                if (action.type === 'vote') {
                    const subRes = await axios.get(`${baseUrl}/actions/${actionId}/sub-actions`, { headers }).catch(() => null);
                    const subs: any[] = subRes?.data?.data || subRes?.data || [];
                    if (Array.isArray(subs)) {
                        const standings = subs
                            .filter((s: any) => s.isActive !== false)
                            .sort((a: any, b: any) => Number(b.metadata?.votes ?? 0) - Number(a.metadata?.votes ?? 0))
                            .map((s: any, idx: number) => ({ id: s.id, name: s.name, votes: Number(s.metadata?.votes ?? 0), rank: idx + 1 }));
                        setVoteStandingsMap(prev => ({ ...prev, [actionId]: standings }));
                    }
                }
            })
        );
    }, [purchasedActions, getToken]);

    const pageTitle = useMemo(() => {
        if (isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual') {
            return 'User QR Objects';
        }
        if (accountMode === 'organization') return 'Organization Actions';
        if (accountMode === 'individual') return 'My Purchased Actions';
        return 'Actions';
    }, [accountMode, isLoggedInAsOrganization, isViewingAnotherUser]);

    const pageDescription = useMemo(() => {
        if (isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual') {
            return 'View and validate QR objects purchased from your organization. You can mark tickets as used when they are redeemed.';
        }
        if (accountMode === 'organization') {
            return 'Review the actions your organization has published. Each card mirrors the presentation on your public welcome page.';
        }
        if (accountMode === 'individual') {
            return 'Every ticket, pass or QR object you have purchased lives here. Keep them handy and ready for your next experience.';
        }
        return 'Choose an account to get started.';
    }, [accountMode, isLoggedInAsOrganization, isViewingAnotherUser]);

    const handleDownloadTicket = async (qrObject: QrObject) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: 'a4',
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 48;
            const ticketHeight = 520;
            const ticketWidth = pageWidth - margin * 2;
            const title = qrObject.metadata?.actionName || 'Action Ticket';
            const subTitle = qrObject.metadata?.subActionName;
            const seat = qrObject.metadata?.seatType;
            const quantity = qrObject.metadata?.quantity ?? 1;
            const status = qrObject.status || 'Unknown';
            const issued = formatDate(qrObject.issuedAt || qrObject.createdAt);
            const valid = formatDate(qrObject.validUntil);
            let coverImage = qrObject.coverImage || qrObject.metadata?.coverImage;

            // If cover image is not available but we have actionId, try to fetch it
            if (!coverImage && qrObject.metadata?.actionId) {
                try {
                    const token = getToken();
                    if (token) {
                        const headers = { Authorization: `Bearer ${token}` };
                        const actionResponse = await axios.get(
                            `${baseUrl}/actions/${qrObject.metadata.actionId}`,
                            { headers }
                        );
                        coverImage = actionResponse.data?.data?.coverImage || actionResponse.data?.coverImage;
                    }
                } catch (err) {
                    console.warn('Could not fetch action cover image:', err);
                }
            }

            // Background: Cover image or gradient effect
            if (coverImage) {
                try {
                    // Add cover image as full page background
                    const imgWidth = pageWidth;
                    const imgHeight = doc.internal.pageSize.getHeight();
                    doc.addImage(coverImage, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
                    
                    // Add subtle overlay for better text readability on white ticket card
                    doc.setFillColor(0, 49, 58);
                    doc.setGState(doc.GState({ opacity: 0.15 }));
                    doc.rect(0, 0, pageWidth, imgHeight, 'F');
                    doc.setGState(doc.GState({ opacity: 1.0 }));
                    
                    // Decorative circles (subtle, behind ticket)
                    doc.setFillColor(0, 181, 18);
                    doc.setGState(doc.GState({ opacity: 0.3 }));
                    doc.circle(pageWidth - 70, 70, 60, 'F');
                    doc.setFillColor(31, 211, 49);
                    doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
                    doc.setGState(doc.GState({ opacity: 1.0 }));
                } catch (imgErr) {
                    console.warn('Could not load cover image, proceeding with gradient background:', imgErr);
                    // Fallback to gradient background
                    doc.setFillColor(0, 49, 58);
                    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
                    doc.setFillColor(0, 181, 18);
                    doc.circle(pageWidth - 70, 70, 60, 'F');
                    doc.setFillColor(31, 211, 49);
                    doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
                }
            } else {
                // Background gradient effect (fallback when no cover image)
                doc.setFillColor(0, 49, 58);
                doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
                doc.setFillColor(0, 181, 18);
                doc.circle(pageWidth - 70, 70, 60, 'F');
                doc.setFillColor(31, 211, 49);
                doc.circle(80, doc.internal.pageSize.getHeight() - 80, 50, 'F');
            }

            // Ticket base (semi-transparent white to show cover image through)
            doc.setFillColor(255, 255, 255);
            doc.setGState(doc.GState({ opacity: 0.85 }));
            doc.roundedRect(margin, margin, ticketWidth, ticketHeight, 24, 24, 'F');
            doc.setGState(doc.GState({ opacity: 1.0 }));

            // Decorative strip
            doc.setFillColor(0, 181, 18);
            doc.roundedRect(margin + 16, margin + 16, ticketWidth - 32, 36, 18, 18, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text('DIGITAL ENTRY PASS • PROVIDED BY QiewCode', margin + 32, margin + 40);

            // Title section
            let cursorY = margin + 96;
            doc.setTextColor(0, 49, 58);
            doc.setFontSize(28);
            doc.text(title, margin + 32, cursorY);
            cursorY += 28;
            if (subTitle) {
                doc.setFontSize(18);
                doc.setFont('helvetica', 'normal');
                doc.text(subTitle, margin + 32, cursorY);
                cursorY += 32;
            }

            // Details box (semi-transparent to show cover image through)
            const detailBoxWidth = (ticketWidth - 80) / 2;
            doc.setFillColor(244, 255, 249);
            doc.setGState(doc.GState({ opacity: 0.75 }));
            doc.roundedRect(margin + 32, cursorY, detailBoxWidth, 140, 16, 16, 'F');
            doc.roundedRect(margin + 48 + detailBoxWidth, cursorY, detailBoxWidth, 140, 16, 16, 'F');
            doc.setGState(doc.GState({ opacity: 1.0 }));

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Ticket Details', margin + 48, cursorY + 24);
            doc.setTextColor(0, 49, 58);
            doc.setFont('helvetica', 'normal');
            doc.text(`Status: ${status}`, margin + 48, cursorY + 44);
            doc.text(`Seat: ${seat || 'General'}`, margin + 48, cursorY + 64);
            doc.text(`Quantity: ${quantity}`, margin + 48, cursorY + 84);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Schedule', margin + 64 + detailBoxWidth, cursorY + 24);
            doc.setTextColor(0, 49, 58);
            doc.setFont('helvetica', 'normal');
            doc.text(`Issued: ${issued}`, margin + 64 + detailBoxWidth, cursorY + 44);
            doc.text(`Valid Until: ${valid}`, margin + 64 + detailBoxWidth, cursorY + 64);
            doc.text(`Ticket ID: ${qrObject.id}`, margin + 64 + detailBoxWidth, cursorY + 84);

            cursorY += 170;

            // Benefits section
            if (qrObject.metadata?.benefits?.length) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(0, 49, 58);
                doc.text('Included Benefits', margin + 32, cursorY);
                cursorY += 18;
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(78, 80, 83);
                qrObject.metadata.benefits.forEach((benefit) => {
                    doc.setFillColor(0, 181, 18);
                    doc.circle(margin + 32, cursorY - 4, 3, 'F');
                    doc.text(benefit, margin + 45, cursorY);
                    cursorY += 18;
                });
            }

            // QR container (semi-transparent to show cover image through)
            if (qrObject.qrCodeData) {
                const imageType = qrObject.qrCodeData.includes('image/jpeg') ? 'JPEG' : 'PNG';
                const qrWidth = 180;
                const qrX = margin + ticketWidth - qrWidth - 48;
                doc.setFillColor(255, 255, 255);
                doc.setGState(doc.GState({ opacity: 0.85 }));
                doc.roundedRect(qrX - 12, margin + 120 - 12, qrWidth + 24, qrWidth + 72, 16, 16, 'F');
                doc.setGState(doc.GState({ opacity: 1.0 }));
                doc.addImage(qrObject.qrCodeData, imageType, qrX, margin + 130, qrWidth, qrWidth);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(0, 181, 18);
                doc.text('SCAN TO VALIDATE', qrX, margin + 130 + qrWidth + 30);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(78, 80, 83);
                doc.text('Show this code at the entry gate.', qrX, margin + 130 + qrWidth + 48);
            }

            // Footer
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(0, 181, 18);
            doc.text('Powered by QiewCode • Seamless money for modern communities', margin + 32, margin + ticketHeight + 40);

            const filename = `${title.replace(/\s+/g, '-').toLowerCase()}-${qrObject.id}.pdf`;
            doc.save(filename);
        } catch (err) {
            console.error('Failed to generate ticket PDF:', err);
        }
    };

    const fetchSubActions = useCallback(
        async (actionId: string) => {
            const token = getToken();
            if (!token) return;
            try {
                setSubActionsLoading(true);
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.get(`${baseUrl}/actions/${actionId}/sub-actions`, { headers });
                if (response.data?.data) {
                    setSubActions(response.data.data);
                } else if (Array.isArray(response.data)) {
                    setSubActions(response.data);
                } else {
                    setSubActions([]);
                }
            } catch (err) {
                console.error('Failed to fetch sub-actions:', err);
                setSubActions([]);
            } finally {
                setSubActionsLoading(false);
            }
        },
        [getToken],
    );

    const handleOrganizationActionClick = (action: OrganizationAction) => {
        setSelectedAction(action);
        setIsSubActionsModalOpen(true);
        resetSubActionForm();
        setSubActionError(null);
        fetchSubActions(action.id);
    };

    const handleWizardCompleted = () => {
        setWizardOpen(false);
        setEditingActionId(null);
        setPreSelectedType(null);
        if (effectiveUserId) {
            fetchData(effectiveUserId);
        }
    };

    const handleWizardClose = () => {
        setWizardOpen(false);
        setEditingActionId(null);
        setPreSelectedType(null);
    };

    // Handler for organizations to mark a QR object as used
    const handleMarkQRObjectAsUsed = async (qrObjectId: string) => {
        const token = getToken();
        if (!token) {
            return;
        }

        try {
            setMarkingAsUsed(prev => ({ ...prev, [qrObjectId]: true }));
            const headers = { Authorization: `Bearer ${token}` };
            
            const response = await axios.post(`${baseUrl}/qr-objects/${qrObjectId}/use`, {}, { headers });
            
            if (response.data) {
                // Update the local state to reflect the change
                setPurchasedActions(prev => 
                    prev.map(item => 
                        item.id === qrObjectId 
                            ? { ...item, status: 'used', usedAt: new Date().toISOString() }
                            : item
                    )
                );
            }
        } catch (err: any) {
            console.error('Failed to mark QR object as used:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to mark as used';
            setError(errorMessage);
        } finally {
            setMarkingAsUsed(prev => ({ ...prev, [qrObjectId]: false }));
        }
    };

    const handleSubActionFieldChange = (field: string, value: string) => {
        setNewSubAction((prev) => ({ ...prev, [field]: value }));
    };

    const resetSubActionForm = () => {
        setNewSubAction({
            name: '',
            price: '',
            seatType: '',
            stock: '',
            description: '',
        });
        setEditingSubActionId(null);
    };

    const handleSaveSubAction = async () => {
        if (!selectedAction) return;
        if (!newSubAction.name || !newSubAction.price) {
            setSubActionError('Name and price are required.');
            return;
        }
        try {
            setCreatingSubAction(true);
            setSubActionError(null);
            const payload: Record<string, any> = {
                name: newSubAction.name,
                price: Number(newSubAction.price),
                description: newSubAction.description || null,
                stock: newSubAction.stock ? Number(newSubAction.stock) : null,
                metadata: {},
            };
            if (newSubAction.seatType) {
                payload.metadata.seatType = newSubAction.seatType;
            }
            if (editingSubActionId) {
                await updateSubAction(editingSubActionId, payload);
            } else {
                await createSubAction(selectedAction.id, payload);
            }
            resetSubActionForm();
            fetchSubActions(selectedAction.id);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to create sub action';
            setSubActionError(message);
        } finally {
            setCreatingSubAction(false);
        }
    };

    const handleEditSubActionClick = (subAction: SubAction) => {
        setNewSubAction({
            name: subAction.name || '',
            price: subAction.price ? String(subAction.price) : '',
            seatType: subAction.metadata?.seatType || '',
            stock: subAction.stock !== null && subAction.stock !== undefined ? String(subAction.stock) : '',
            description: subAction.description || '',
        });
        setEditingSubActionId(subAction.id);
        setSubActionError(null);
    };

    const renderPurchasedActions = () => {
        // Check if QR object is expired
        const isQRObjectExpired = (qrObject: QrObject): boolean => {
            if (!qrObject.validUntil) return false;
            return new Date(qrObject.validUntil) < new Date();
        };

        // Check if QR object is used or archived
        const isQRObjectArchived = (qrObject: QrObject): boolean => {
            return qrObject.status?.toLowerCase() === 'used' || isQRObjectExpired(qrObject);
        };

        // Filter purchased actions based on filter tab
        const filteredPurchasedActions = purchasedActionsFilter === 'archive'
            ? purchasedActions.filter(item => isQRObjectArchived(item))
            : purchasedActions.filter(item => !isQRObjectArchived(item));

        if (!purchasedActions.length) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-2xl p-8 text-center shadow-sm">
                    <div className="text-4xl mb-3">🎟️</div>
                    <p className="font-semibold text-[#00313A] dark:text-white mb-1">
                        {isLoggedInAsOrganization && isViewingAnotherUser ? 'No QR objects found' : 'No tickets yet'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        {isLoggedInAsOrganization && isViewingAnotherUser
                            ? 'This user has not purchased any tickets or actions from your organization.'
                            : 'When you buy tickets or actions, they appear here with instant QR code access.'}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {/* Toolbar for organizations viewing user's QR objects */}
                {isLoggedInAsOrganization && isViewingAnotherUser && (
                    <div className="flex flex-wrap gap-3 items-center justify-between bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Scan className="w-5 h-5" />
                            <span className="font-semibold">Organization Mode</span>
                            <span className="text-sm text-purple-600 dark:text-purple-400">- Showing only tickets from your organization</span>
                        </div>
                        <button
                            onClick={() => setQrValidatorOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-semibold shadow hover:bg-purple-700 transition-colors"
                        >
                            <Scan className="w-4 h-4" />
                            Scan QR Code
                        </button>
                    </div>
                )}

                {/* Content Section - Empty or Grid */}
                {filteredPurchasedActions.length === 0 ? (
                    <div className="bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-2xl p-6 text-center shadow-sm">
                        <div className="text-3xl mb-2">
                            {purchasedActionsFilter === 'archive' ? '📦' : '🎟️'}
                        </div>
                        <p className="font-semibold text-[#00313A] dark:text-white mb-1 text-sm">
                            {purchasedActionsFilter === 'archive'
                                ? 'No archived items'
                                : isLoggedInAsOrganization && isViewingAnotherUser
                                ? 'No valid QR objects'
                                : 'Nothing valid right now'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                            {purchasedActionsFilter === 'archive'
                                ? 'Used and expired items will show up here once you have some.'
                                : isLoggedInAsOrganization && isViewingAnotherUser
                                ? 'This user has no active tickets or actions from your organization.'
                                : 'Switch to Archive to see past items, or buy tickets to add new ones.'}
                        </p>
                    </div>
                ) : (
                    <div ref={actionsScroll.ref} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-stretch">
                    {filteredPurchasedActions.map((item) => {
                        const actionId = item.metadata?.actionId || item.actionId || '';
                        const orgId = item.metadata?.organizationId || item.organizationId || '';
                        const resolvedType = actionId ? (resolvedTypeMap[actionId] ?? item.type ?? 'ticket') : (item.type ?? 'ticket');
                        const isExpiredItem = isQRObjectExpired(item);
                        const cover = item.coverImage || item.metadata?.coverImage;

                        const TYPE_CONFIG: Record<string, { icon: string; label: string; accent: string; accentBg: string; border: string; btnBg: string }> = {
                            ticket:     { icon: '🎟️', label: 'Ticket',        accent: 'text-emerald-600 dark:text-emerald-400', accentBg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40', btnBg: 'bg-[#00B512] hover:bg-[#00a010]' },
                            vote:       { icon: '🗳️', label: 'Vote Receipt',  accent: 'text-orange-600 dark:text-orange-400',   accentBg: 'bg-orange-50 dark:bg-orange-900/10',   border: 'border-orange-100 dark:border-orange-800/40', btnBg: 'bg-orange-500 hover:bg-orange-600' },
                            transport:  { icon: '🚌', label: 'Transport Pass', accent: 'text-blue-600 dark:text-blue-400',       accentBg: 'bg-blue-50 dark:bg-blue-900/10',       border: 'border-blue-100 dark:border-blue-800/40',    btnBg: 'bg-blue-500 hover:bg-blue-600' },
                            service:    { icon: '🛠️', label: 'Service',        accent: 'text-violet-600 dark:text-violet-400',   accentBg: 'bg-violet-50 dark:bg-violet-900/10',   border: 'border-violet-100 dark:border-violet-800/40', btnBg: 'bg-violet-500 hover:bg-violet-600' },
                            booking:    { icon: '📅', label: 'Booking',        accent: 'text-cyan-600 dark:text-cyan-400',       accentBg: 'bg-cyan-50 dark:bg-cyan-900/10',       border: 'border-cyan-100 dark:border-cyan-800/40',    btnBg: 'bg-cyan-500 hover:bg-cyan-600' },
                            membership: { icon: '🏅', label: 'Membership',     accent: 'text-amber-600 dark:text-amber-400',     accentBg: 'bg-amber-50 dark:bg-amber-900/10',     border: 'border-amber-100 dark:border-amber-800/40',  btnBg: 'bg-amber-500 hover:bg-amber-600' },
                        };
                        const cfg = TYPE_CONFIG[resolvedType] ?? TYPE_CONFIG.ticket;

                        const statusBadge = (
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize flex-shrink-0 ${
                                isExpiredItem ? statusClasses['expired'] :
                                statusClasses[item.status?.toLowerCase()] ||
                                'bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-darkBorder-light'
                            }`}>
                                {isExpiredItem ? 'Expired' : item.status || 'unknown'}
                            </span>
                        );

                        // ── VOTE RECEIPT CARD ────────────────────────────────
                        if (resolvedType === 'vote') {
                            const standings = voteStandingsMap[actionId] ?? [];
                            const myCandidate = item.metadata?.subActionName || '';
                            const myFromStandings = standings.find(s => s.name.toLowerCase() === myCandidate.toLowerCase());
                            const myRank = myFromStandings?.rank ?? item.metadata?.rank ?? item.metadata?.candidateRank ?? null;
                            const myRankLabel = myRank != null ? toOrdinal(myRank) : null;
                            const placeEmoji = (r: number) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `${r}.`;
                            const myRankColor = myRank === 1 ? 'text-yellow-600 dark:text-yellow-400' : myRank === 2 ? 'text-gray-500 dark:text-gray-300' : myRank === 3 ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400';
                            const actionName = item.metadata?.actionName || 'Vote';

                            return (
                                <div key={item.id} className={`w-80 flex-shrink-0 bg-white dark:bg-darkBg-card rounded-3xl border ${cfg.border} shadow-md overflow-hidden`}>
                                    {/* Header strip */}
                                    <div className={`${cfg.accentBg} px-5 py-4 flex items-center gap-3`}>
                                        <div className="w-11 h-11 rounded-full bg-white dark:bg-darkBg-card flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                                            {cover
                                                ? <img src={cover} alt={actionName} className="w-11 h-11 object-cover" />
                                                : <span className="text-xl">{cfg.icon}</span>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.accent}`}>{cfg.label}</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{actionName}</p>
                                        </div>
                                        {statusBadge}
                                    </div>

                                    <div className="p-5 space-y-4">
                                        {/* My choice */}
                                        {myCandidate && (
                                            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-3.5">
                                                <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1.5">Your Vote</p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-bold text-orange-600 dark:text-orange-400 text-sm">{myCandidate}</p>
                                                    {myRankLabel && (
                                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-darkBg-card border border-orange-200 dark:border-orange-800/40 ${myRankColor}`}>
                                                            {myRankLabel} place
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Standings */}
                                        {standings.length > 0 && (
                                            <div>
                                                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Standings</p>
                                                <div className="space-y-1.5">
                                                    {standings.slice(0, 3).map((s, i) => {
                                                        const isMe = myCandidate && s.name.toLowerCase() === myCandidate.toLowerCase();
                                                        return (
                                                            <div key={s.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isMe ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30' : 'bg-gray-50 dark:bg-darkBg-interactive'}`}>
                                                                <span className="text-base w-6 text-center leading-none">{placeEmoji(i + 1)}</span>
                                                                <span className={`flex-1 text-sm truncate ${isMe ? 'font-bold text-orange-600 dark:text-orange-400' : 'font-medium text-gray-700 dark:text-gray-200'}`}>{s.name}</span>
                                                                {s.votes > 0 && <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{s.votes} votes</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* View voting page */}
                                        {actionId && orgId && (
                                            <button
                                                onClick={() => router.push(`/welcome/${orgId}/action/${actionId}`)}
                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border-2 border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                                            >
                                                View Live Standings
                                                <ArrowRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        // ── TICKET / TRANSPORT / SERVICE / BOOKING / MEMBERSHIP ──
                        const actionName = item.metadata?.actionName || 'Unnamed Action';
                        const tier = item.metadata?.subActionName;
                        const lastTransfer = item.metadata?.transferHistory?.[item.metadata.transferHistory.length - 1];

                        return (
                            <div key={item.id} className={`w-80 flex-shrink-0 bg-white dark:bg-darkBg-card rounded-3xl border ${cfg.border} shadow-md overflow-hidden`}>
                                {/* Cover image */}
                                {cover && (
                                    <div className="h-28 overflow-hidden relative">
                                        <img src={cover} alt={actionName} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{cfg.icon} {cfg.label}</p>
                                                <p className="text-sm font-bold text-white truncate leading-tight">{actionName}</p>
                                                {tier && <p className="text-xs text-white/70 truncate">{tier}</p>}
                                            </div>
                                            {statusBadge}
                                        </div>
                                    </div>
                                )}

                                {/* Header (no cover) */}
                                {!cover && (
                                    <div className={`${cfg.accentBg} px-5 py-4 flex items-center gap-3`}>
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-darkBg-card flex items-center justify-center shadow-sm flex-shrink-0">
                                            <span className="text-xl">{cfg.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.accent}`}>{cfg.label}</p>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{actionName}</p>
                                            {tier && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tier}</p>}
                                        </div>
                                        {statusBadge}
                                    </div>
                                )}

                                <div className="px-5 pt-4 pb-5 space-y-4">
                                    {/* Transfer trail — this ticket changed hands */}
                                    {lastTransfer && (
                                        <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl px-3 py-2 text-blue-600 dark:text-blue-400">
                                            <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">
                                                {!isViewingAnotherUser
                                                    ? `Received from ${lastTransfer.fromName}`
                                                    : `Transferred from ${lastTransfer.fromName} to ${lastTransfer.toName}`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Details grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${cfg.accent}`}>Issued</p>
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{formatDate(item.issuedAt || item.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${cfg.accent}`}>Valid Until</p>
                                            <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{formatDate(item.validUntil)}</p>
                                        </div>
                                        {(item.metadata?.quantity ?? 1) > 1 && (
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${cfg.accent}`}>Qty</p>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{item.metadata?.quantity}</p>
                                            </div>
                                        )}
                                        {item.metadata?.seatType && (
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${cfg.accent}`}>Seat</p>
                                                <p className="text-xs font-medium text-gray-700 dark:text-gray-200 capitalize">{item.metadata.seatType}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Benefits */}
                                    {Array.isArray(item.metadata?.benefits) && item.metadata.benefits.length > 0 && (
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${cfg.accent}`}>Benefits</p>
                                            <ul className="space-y-1">
                                                {item.metadata.benefits.map((b: string) => (
                                                    <li key={b} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />{b}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* QR + actions */}
                                    {item.qrCodeData && (
                                        <div className={`${cfg.accentBg} border ${cfg.border} rounded-2xl p-4 flex items-center gap-4`}>
                                            <div className="p-1.5 bg-white dark:bg-darkBg-main rounded-xl shadow-sm flex-shrink-0">
                                                <img src={item.qrCodeData} alt="QR" className="w-20 h-20 object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                                    {item.usedAt ? `Used ${formatDate(item.usedAt)}` : 'Show at entry to redeem'}
                                                </p>
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        onClick={() => handleDownloadTicket(item)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow ${cfg.btnBg}`}
                                                    >
                                                        <Download size={12} /> Download PDF
                                                    </button>
                                                    {/* Owner can hand a still-valid ticket to a contact */}
                                                    {!isViewingAnotherUser
                                                        && item.actionPurchaseId
                                                        && !isExpiredItem
                                                        && item.status?.toLowerCase() === 'valid' && (
                                                        <button
                                                            onClick={() => setTransferTarget(item)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 dark:border-darkBorder-light text-gray-700 dark:text-gray-200 text-xs font-semibold hover:border-[#00B512] hover:text-[#00B512] transition-colors"
                                                        >
                                                            <Send size={12} /> Transfer
                                                        </button>
                                                    )}
                                                    {isLoggedInAsOrganization && isViewingAnotherUser && item.status?.toLowerCase() !== 'used' && (
                                                        <button
                                                            onClick={() => handleMarkQRObjectAsUsed(item.id)}
                                                            disabled={!!markingAsUsed[item.id]}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-semibold shadow hover:bg-purple-700 disabled:opacity-50"
                                                        >
                                                            {markingAsUsed[item.id] ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                            Mark as Used
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>
        );
    };

    // Check if action is expired based on endsAt date
    const isActionExpired = (action: OrganizationAction): boolean => {
        if (!action.availability?.endsAt) return false;
        return new Date(action.availability.endsAt) < new Date();
    };

    const renderOrganizationActions = () => {
        // Filter actions considering expiration
        const getFilteredOrganizationActions = () => {
            if (statusFilter === 'all') {
                return organizationActions;
            }
            if (statusFilter === 'archived') {
                return organizationActions.filter(action => 
                    action.status === 'archived' || isActionExpired(action)
                );
            }
            return organizationActions.filter(action => 
                action.status === statusFilter && !isActionExpired(action)
            );
        };

        const filteredActions = getFilteredOrganizationActions();

        return (
            <div className="space-y-5">
                {/* Create New Action */}
                <div>
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Create new action
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {/* Ticket */}
                        <button
                            onClick={() => { setPreSelectedType('ticket'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🎟️</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Ticket</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Events & entry</span>
                        </button>

                        {/* Transport */}
                        <button
                            onClick={() => { setPreSelectedType('transport'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-blue-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white shadow-sm shadow-blue-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🚌</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Transport</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Routes & fares</span>
                        </button>

                        {/* Service */}
                        <button
                            onClick={() => { setPreSelectedType('service'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/60 dark:hover:bg-violet-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white shadow-sm shadow-violet-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🛠️</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Service</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Packages & work</span>
                        </button>

                        {/* Vote */}
                        <button
                            onClick={() => { setPreSelectedType('vote'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-orange-200 dark:border-orange-800/60 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-orange-50/60 dark:hover:bg-orange-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white shadow-sm shadow-orange-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🗳️</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Vote</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Polls & elections</span>
                        </button>

                        {/* Booking */}
                        <button
                            onClick={() => { setPreSelectedType('booking'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-cyan-200 dark:border-cyan-800/60 hover:border-cyan-400 dark:hover:border-cyan-500 hover:bg-cyan-50/60 dark:hover:bg-cyan-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500 text-white shadow-sm shadow-cyan-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">📅</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Booking</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Reservations</span>
                        </button>

                        {/* Membership */}
                        <button
                            onClick={() => { setPreSelectedType('membership'); setEditingActionId(null); setWizardOpen(true); }}
                            className="group relative flex flex-col items-center gap-2 pt-5 pb-3 px-3 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 transition-all duration-200"
                        >
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white shadow-sm shadow-amber-300/50 group-hover:scale-110 transition-transform duration-200">
                                <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-200">🏅</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Membership</span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Plans & tiers</span>
                        </button>
                    </div>
                </div>

                {/* Status filter + Scan QR */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        {[
                            { value: 'all', label: 'All' },
                            { value: 'published', label: 'Published' },
                            { value: 'draft', label: 'Draft' },
                            { value: 'archived', label: 'Archived' },
                        ].map(filter => {
                            let count = 0;
                            if (filter.value === 'all') count = organizationActions.length;
                            else if (filter.value === 'archived') count = organizationActions.filter(a => a.status === 'archived' || isActionExpired(a)).length;
                            else count = organizationActions.filter(a => a.status === filter.value && !isActionExpired(a)).length;
                            return (
                                <button
                                    key={filter.value}
                                    onClick={() => setStatusFilter(filter.value as 'all' | 'draft' | 'published' | 'archived')}
                                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        statusFilter === filter.value
                                            ? 'bg-[#00B512] text-white shadow-sm shadow-emerald-300/40 dark:shadow-emerald-900/40'
                                            : 'border border-gray-200 dark:border-darkBorder-light text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-darkBorder-medium hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                                    }`}
                                >
                                    {filter.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === filter.value ? 'bg-white/20' : 'bg-gray-100 dark:bg-darkBg-interactive text-gray-500 dark:text-gray-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setQrValidatorOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00B512] to-[#1fd331] text-white text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-emerald-300/30 transition-all"
                    >
                        <Scan className="w-3.5 h-3.5" />
                        Scan QR Code
                    </button>
                </div>

                {/* Content Section - Empty or Actions Grid */}
                {!organizationActions.length ? (
                    <div className="bg-white dark:bg-darkBg-card border border-blue-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                            <Ticket className="w-5 h-5" />
                            <span>No actions published yet</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            Select an action type above to get started. Your published actions will appear here in the same layout visitors see on your welcome page.
                        </p>
                    </div>
                ) : filteredActions.length === 0 ? (
                    <div className="bg-white dark:bg-darkBg-card border border-blue-100 dark:border-darkBorder-light rounded-3xl p-8 text-center shadow-sm">
                        <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                            <Ticket className="w-5 h-5" />
                            <span>No actions in this category</span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            {statusFilter === 'archived' ? 'No archived or expired actions.' : `No ${statusFilter} actions.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                    {filteredActions.map((action) => (
                        <button
                            type="button"
                            key={action.id}
                            onClick={() => handleOrganizationActionClick(action)}
                            className="text-left bg-white dark:bg-darkBg-card rounded-3xl border border-[#00B512]/10 dark:border-darkBorder-light shadow-lg shadow-emerald-50/60 dark:shadow-none p-6 hover:shadow-emerald-200 dark:hover:bg-darkBg-interactive transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#00B512]/40"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-[#00313A] dark:text-white leading-tight">{action.name}</h3>
                                    {action.shortDescription && (
                                        <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-2 line-clamp-3">{action.shortDescription}</p>
                                    )}
                                </div>
                                {action.status && (
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                                            isActionExpired(action)
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                : action.status === 'published'
                                                ? 'bg-[#00B512]/10 dark:bg-[#00B512]/20 text-[#00B512] dark:text-brand-green'
                                                : 'bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300'
                                        }`}
                                    >
                                        {isActionExpired(action) ? 'Archived' : action.status}
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 space-y-3 text-sm text-[#00313A]/80 dark:text-gray-300">
                                {action.availability?.startsAt && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Starts:</span>
                                        <span>{formatDate(action.availability.startsAt)}</span>
                                    </div>
                                )}
                                {action.availability?.endsAt && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Ends:</span>
                                        <span>{formatDate(action.availability.endsAt)}</span>
                                    </div>
                                )}
                                {action.pricing?.mode && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold capitalize">{action.pricing.mode} pricing</span>
                                    </div>
                                )}
                                {action.totalSubActionBalance !== undefined && action.totalSubActionBalance !== null && (
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#00B512]/10 dark:border-darkBorder-light">
                                        <DollarSign className="w-4 h-4 text-[#00B512]" />
                                        <span className="font-semibold">Total collected:</span>
                                        <span className="font-bold text-[#00B512] dark:text-brand-green">
                                            {action.currency || 'RWF'} {action.totalSubActionBalance.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {(action.status === 'draft' || action.status === 'published') && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingActionId(action.id);
                                            setWizardOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setEditingActionId(action.id);
                                                setWizardOpen(true);
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#00B512] dark:border-brand-green text-[#00B512] dark:text-brand-green text-xs font-semibold hover:bg-[#00B512] dark:hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
                                    >
                                        {action.status === 'draft' ? (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Continue Setup
                                            </>
                                        ) : (
                                            <>
                                                <Pencil className="w-4 h-4" />
                                                Edit action
                                            </>
                                        )}
                                    </span>
                                )}
                                {effectiveUserId && (
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/welcome/${effectiveUserId}/action/${action.id}`);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                router.push(`/welcome/${effectiveUserId}/action/${action.id}`);
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-[#00B512] dark:border-brand-green text-[#00B512] dark:text-brand-green text-xs font-semibold hover:bg-[#00B512] dark:hover:bg-brand-green hover:text-white transition-colors cursor-pointer"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview action
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        // Show loading spinner first while we're determining the user ID
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-[#00313A] dark:text-white">
                    <Loader2 className="w-10 h-10 animate-spin text-[#00B512] dark:text-brand-green" />
                    <p className="mt-4 font-medium">Loading your actions...</p>
                </div>
            );
        }

        // Show error if no user ID after loading is complete
        if (!effectiveUserId) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>User ID not found</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">We could not determine which account to load. Please sign in again.</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-white dark:bg-darkBg-card border border-red-100 dark:border-darkBorder-light rounded-3xl p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span>We hit a snag</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => fetchData(effectiveUserId)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white font-semibold shadow hover:bg-[#009a0f]"
                    >
                        Try again
                    </button>
                </div>
            );
        }

        if (accountMode === 'organization') {
            return renderOrganizationActions();
        }

        // Individual: 3 horizontal scroll rows
        const allVisibleContributions = filterGroupId
            ? myContributions.filter((c) => c.groupId === filterGroupId)
            : myContributions;
        const visibleContributions =
            contributionsFilter === 'active' ? allVisibleContributions.filter((c) => c.status === 'active')
            : contributionsFilter === 'history' ? allVisibleContributions.filter((c) => c.status !== 'active')
            : allVisibleContributions;
        const activeContributions = allVisibleContributions.filter((c) => c.status === 'active');

        const allCampaigns = myPublicContributions;
        const visibleCampaigns =
            campaignsFilter === 'active' ? allCampaigns.filter((c) => c.status === 'active')
            : campaignsFilter === 'closed' ? allCampaigns.filter((c) => c.status !== 'active')
            : allCampaigns;
        const activeCampaigns = allCampaigns.filter((c) => c.status === 'active');

        return (
            <div className="space-y-8">
                {/* ── ROW 1: My Actions ── */}
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <Ticket size={16} className="text-[#00B512]" />
                        <span className="text-sm font-bold text-[#00313A] dark:text-white uppercase tracking-widest">My Actions</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{purchasedActions.length}</span>
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={() => setPurchasedActionsFilter('all')}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    purchasedActionsFilter === 'all'
                                        ? 'bg-[#00B512] text-white'
                                        : 'border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-white text-[#00313A]'
                                }`}
                            >
                                Valid
                            </button>
                            <button
                                onClick={() => setPurchasedActionsFilter('archive')}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                    purchasedActionsFilter === 'archive'
                                        ? 'bg-[#00B512] text-white'
                                        : 'border border-gray-200 dark:border-darkBorder-light dark:bg-darkBg-interactive dark:text-white text-[#00313A]'
                                }`}
                            >
                                Archive
                            </button>
                            <ScrollBtns s={actionsScroll} />
                        </div>
                    </div>
                    {renderPurchasedActions()}
                </div>

                {/* ── ROW 2: Group Contributions ── */}
                {!isViewingAnotherUser && (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Target size={16} className="text-amber-500" />
                            <span className="text-sm font-bold text-[#00313A] dark:text-white uppercase tracking-widest">Group Contributions</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{visibleContributions.length}</span>
                            {activeContributions.length > 0 && (
                                <span className="bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    {activeContributions.length} active
                                </span>
                            )}
                            <div className="ml-auto flex items-center gap-1.5">
                                {(['all', 'active', 'history'] as const).map((f) => (
                                    <button key={f} onClick={() => setContributionsFilter(f)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors ${
                                            contributionsFilter === f
                                                ? 'bg-amber-400 text-white'
                                                : 'border border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                                        }`}
                                    >{f}</button>
                                ))}
                                <ScrollBtns s={contributionsScroll} />
                            </div>
                        </div>
                        {contributionsLoading ? (
                            <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin text-[#00B512]" />
                                Loading contributions…
                            </div>
                        ) : allVisibleContributions.length === 0 ? (
                            <div className="bg-white dark:bg-darkBg-card border border-amber-50 dark:border-darkBorder-light rounded-2xl p-8 text-center shadow-sm">
                                <div className="text-4xl mb-3">🎯</div>
                                <p className="font-semibold text-[#00313A] dark:text-white mb-1">No group campaigns</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    When a group admin starts a contribution campaign in your chat, it&apos;ll show up here.
                                </p>
                            </div>
                        ) : visibleContributions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                                No {contributionsFilter === 'history' ? 'past' : 'active'} contributions
                            </div>
                        ) : (
                            <div ref={contributionsScroll.ref} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-stretch">
                                {visibleContributions.map((c) => (
                                    <div key={c.id} className="w-80 flex-shrink-0">
                                        <ContributionCard contribution={c} currentUserId={currentUserId || ''} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── ROW 3: Public Campaigns ── */}
                {!isViewingAnotherUser && (
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <Globe2 size={16} className="text-[#00B512]" />
                            <span className="text-sm font-bold text-[#00313A] dark:text-white uppercase tracking-widest">My Campaigns</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{visibleCampaigns.length}</span>
                            {activeCampaigns.length > 0 && (
                                <span className="bg-[#00B512] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                    {activeCampaigns.length} active
                                </span>
                            )}
                            <div className="ml-auto flex items-center gap-1.5">
                                {(['all', 'active', 'closed'] as const).map((f) => (
                                    <button key={f} onClick={() => setCampaignsFilter(f)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize transition-colors ${
                                            campaignsFilter === f
                                                ? 'bg-[#00B512] text-white'
                                                : 'border border-gray-200 dark:border-darkBorder-light text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                                        }`}
                                    >{f}</button>
                                ))}
                                <ScrollBtns s={campaignsScroll} />
                                <button
                                    onClick={() => setCreateCampaignOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#00B512] hover:bg-[#009a0f] text-white transition-colors"
                                >
                                    <Plus size={12} />
                                    New Campaign
                                </button>
                            </div>
                        </div>
                        {publicContributionsLoading ? (
                            <div className="flex items-center gap-3 py-8 text-sm text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin text-[#00B512]" />
                                Loading campaigns…
                            </div>
                        ) : allCampaigns.length === 0 ? (
                            <div className="bg-white dark:bg-darkBg-card border border-emerald-100 dark:border-darkBorder-light rounded-2xl p-8 text-center shadow-sm">
                                <div className="text-4xl mb-3">🌍</div>
                                <p className="font-semibold text-[#00313A] dark:text-white mb-1">No campaigns yet</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-5">
                                    Start a campaign, share a link, and collect contributions from anyone — no group needed.
                                </p>
                                <button
                                    onClick={() => setCreateCampaignOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#00B512] hover:bg-[#009a0f] text-white transition-colors shadow-sm"
                                >
                                    <Plus size={14} />
                                    Create your first campaign
                                </button>
                            </div>
                        ) : visibleCampaigns.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                                No {campaignsFilter === 'closed' ? 'closed' : 'active'} campaigns
                            </div>
                        ) : (
                            <div ref={campaignsScroll.ref} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide items-stretch">
                                {visibleCampaigns.map((c) => (
                                    <div key={c.id} className="w-80 flex-shrink-0">
                                        <PublicContributionCard
                                            data={c}
                                            onUpdated={(patch) =>
                                                setMyPublicContributions((prev) =>
                                                    prev.map((item) => item.id === c.id ? { ...item, ...patch } : item)
                                                )
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-darkBg-main">
            {/* Desktop Sidebar */}
            <Navigation />

            {/* Main Content */}
            <main className={cn(
                "flex-1 min-w-0 flex flex-col p-4 md:p-8 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
                    <Header />

                    <section className="mt-6 space-y-6">
                        <div className="bg-white dark:bg-darkBg-card rounded-3xl border border-white/40 dark:border-darkBorder-light shadow-md shadow-emerald-50 dark:shadow-none p-6 relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00B512]/10 dark:bg-[#00B512]/20 rounded-full blur-3xl" />
                            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#00B512] dark:text-brand-green">
                                        <Sparkles className="w-4 h-4" />
                                        Actions Center
                                    </p>
                                    <h1 className="text-2xl md:text-3xl font-bold text-[#00313A] dark:text-white mt-2">{pageTitle}</h1>
                                    <p className="text-[#00313A]/70 dark:text-gray-300 mt-2 max-w-2xl">{pageDescription}</p>
                                </div>
                                {accountMode === 'organization' && effectiveUserId && (
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/welcome/${effectiveUserId}`)}
                                        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00B512] text-white text-sm font-semibold shadow hover:bg-[#009a0f] transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview welcome page
                                    </button>
                                )}
                            </div>
                        </div>

                        {renderContent()}
                    </section>
                </div>
            </main>

            {/* Bottom Navigation for small devices */}
            <div className="lg:hidden">
                <Navigation />
            </div>

            <Dialog open={isSubActionsModalOpen} onOpenChange={setIsSubActionsModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-darkBg-card border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-[#00313A] dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#E5C158] rounded-lg flex items-center justify-center shadow-md">
                                <Ticket className="w-5 h-5 text-white" />
                            </div>
                            {selectedAction?.name || 'Action Details'}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedAction && (
                        <div className="space-y-6">
                            {selectedAction.description && (
                                <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive rounded-xl p-5 border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 text-sm text-[#00313A] dark:text-[#00313A] leading-relaxed">
                                    {selectedAction.description}
                                </div>
                            )}

                            {accountMode === 'organization' && (
                                <div className="bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 rounded-2xl p-4 space-y-3">
                                    <h4 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wide flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                                        Action Details
                                    </h4>
                                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                                        {selectedAction.status && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Status</span>
                                                <span className={`font-semibold capitalize ${
                                                    isActionExpired(selectedAction)
                                                        ? 'text-orange-600 dark:text-orange-400'
                                                        : selectedAction.status === 'published'
                                                        ? 'text-[#00B512] dark:text-brand-green'
                                                        : 'text-gray-500 dark:text-gray-300'
                                                }`}>
                                                    {isActionExpired(selectedAction) ? 'Archived (Expired)' : selectedAction.status}
                                                </span>
                                            </div>
                                        )}
                                        {selectedAction.currency && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Currency</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{selectedAction.currency}</span>
                                            </div>
                                        )}
                                        {selectedAction.pricing?.mode && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Pricing Mode</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A] capitalize">{selectedAction.pricing.mode}</span>
                                            </div>
                                        )}
                                        {selectedAction.totalSubActionBalance !== undefined && selectedAction.totalSubActionBalance !== null && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Total Collected</span>
                                                <span className="font-bold text-[#D4AF37]">
                                                    {selectedAction.currency || 'RWF'} {selectedAction.totalSubActionBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        {selectedAction.availability?.startsAt && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Starts At</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{formatDate(selectedAction.availability.startsAt)}</span>
                                            </div>
                                        )}
                                        {selectedAction.availability?.endsAt && (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-widest">Ends At</span>
                                                <span className="font-semibold text-[#00313A] dark:text-[#00313A]">{formatDate(selectedAction.availability.endsAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-bold text-[#00313A] dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                                    Available Options
                                </h3>

                                {subActionsLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                                    </div>
                                ) : subActions.length === 0 ? (
                                    <div className="text-center py-8 bg-gradient-to-br from-[#FFF9E6] to-[#FFFEF8] dark:bg-darkBg-interactive rounded-xl border-2 border-[#D4AF37]/20">
                                        <Ticket className="w-12 h-12 text-[#D4AF37]/30 mx-auto mb-3" />
                                        <p className="text-[#00313A]/60 dark:text-gray-300 font-medium">No sub actions available.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {subActions
                                            .filter((subAction) => subAction.isActive !== false)
                                            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                                            .map((subAction) => (
                                                <div
                                                    key={subAction.id}
                                                    className="bg-white dark:bg-darkBg-main rounded-xl p-5 border-2 border-[#D4AF37]/20 dark:border-[#D4AF37]/20 shadow-md hover:shadow-lg hover:border-[#D4AF37]/40 dark:hover:bg-darkBg-interactive transition-all duration-300"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h4 className="text-base font-bold text-[#00313A] dark:text-white">{subAction.name}</h4>
                                                            {subAction.description && (
                                                                <p className="text-sm text-[#00313A]/70 dark:text-gray-300 mt-1">{subAction.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-lg font-bold text-[#D4AF37]">
                                                                {subAction.price && selectedAction.currency
                                                                    ? `${selectedAction.currency} ${parseFloat(subAction.price).toLocaleString()}`
                                                                    : subAction.price}
                                                            </p>
                                                            {subAction.stock !== null && subAction.stock !== undefined && (
                                                                <p className="text-xs text-[#00313A]/60 dark:text-gray-400 mt-0.5">{subAction.stock} available</p>
                                                            )}
                                                            {subAction.stockReserved !== null && subAction.stockReserved !== undefined && (
                                                                <p className="text-xs font-semibold text-[#D4AF37] mt-0.5">{subAction.stockReserved} sold</p>
                                                            )}
                                                            {subAction.wallet && accountMode === 'organization' ? (
                                                                <p className="text-xs font-semibold text-[#D4AF37] mt-1">
                                                                    Wallet: {subAction.wallet.currency} {subAction.wallet.balance.toLocaleString()}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    {accountMode === 'organization' && (
                                                        <div className="mt-3 pt-3 border-t border-[#D4AF37]/10 flex justify-end gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!selectedAction?.id) return;
                                                                    router.push(`/action?transferActionId=${selectedAction.id}&transferSubActionId=${subAction.id}`);
                                                                }}
                                                                className="text-xs font-semibold text-[#00313A] dark:text-white hover:underline"
                                                            >
                                                                Transfer to Wallet
                                                            </button>
                                                            {selectedAction?.status === 'published' && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditSubActionClick(subAction);
                                                                }}
                                                                className="text-xs font-semibold text-[#D4AF37] hover:underline"
                                                            >
                                                                Edit
                                                            </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <button
                            type="button"
                            onClick={() => setIsSubActionsModalOpen(false)}
                            className="px-4 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-semibold hover:bg-[#D4AF37] hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {accountMode === 'organization' && effectiveUserId && (
                <>
                    <ActionWizardModal
                        open={wizardOpen}
                        onClose={handleWizardClose}
                        organizationId={effectiveUserId}
                        onCompleted={handleWizardCompleted}
                        editingActionId={editingActionId}
                        preSelectedType={preSelectedType}
                    />
                    <QRObjectValidator
                        isOpen={qrValidatorOpen}
                        onClose={() => setQrValidatorOpen(false)}
                        organizationId={effectiveUserId}
                    />
                </>
            )}

            {/* QR Object Validator for organizations viewing individual users' QR objects */}
            {isLoggedInAsOrganization && isViewingAnotherUser && accountMode === 'individual' && tokenUserId && (
                <QRObjectValidator
                    isOpen={qrValidatorOpen}
                    onClose={() => {
                        setQrValidatorOpen(false);
                        // Refresh the data after validation to update the list
                        if (effectiveUserId) {
                            fetchData(effectiveUserId);
                        }
                    }}
                    organizationId={tokenUserId}
                />
            )}

            <CreatePublicContributionModal
                isOpen={createCampaignOpen}
                onClose={() => setCreateCampaignOpen(false)}
                onCreated={fetchMyPublicContributions}
            />

            {/* Transfer a purchased ticket to a contact */}
            {transferTarget && tokenUserId && (
                <TransferTicketModal
                    open={Boolean(transferTarget)}
                    onClose={() => setTransferTarget(null)}
                    purchaseId={transferTarget.actionPurchaseId as string}
                    ticketName={transferTarget.metadata?.actionName || 'this ticket'}
                    senderId={tokenUserId}
                    onTransferred={() => {
                        setTransferTarget(null);
                        if (effectiveUserId) fetchData(effectiveUserId);
                    }}
                />
            )}
        </div>
    );
};

export default ActionsByAccountPage;

