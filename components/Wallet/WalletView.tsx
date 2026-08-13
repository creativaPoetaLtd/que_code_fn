"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet as WalletIcon,
  Lock,
  TrendingUp,
  Ticket,
  QrCode,
  AlertCircle,
  Plus,
  Pin,
  PinOff,
  Archive,
  Trash2,
  CreditCard,
  Tag,
  BadgeCheck,
  Bookmark,
  Gift,
  X,
  Eye,
  EyeOff,
  Clock,
  ChevronRight,
  Compass,
  Upload,
  FileText,
  Paperclip,
  ExternalLink,
  Pencil,
  Calendar,
  Hash,
  AlertTriangle,
} from 'lucide-react';
import {
  getWalletSummary,
  createWalletItem,
  createWalletItemForm,
  updateWalletItem,
  updateWalletItemForm,
  deleteWalletItem,
} from '@/helpers/api';
import type {
  WalletSummary,
  WalletItem,
  WalletItemType,
  WalletPurchase,
} from '@/types/dashboard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAccent } from '@/hooks/use-accent';
import TicketQrDialog from '@/components/Wallet/TicketQrDialog';
import TransferTicketModal from '@/components/ActionPage/TransferTicketModal';
import QuickActions from '@/components/Wallet/QuickActions';
import RecentActivity from '@/components/Wallet/RecentActivity';
import SpendingInsights from '@/components/Wallet/SpendingInsights';
import Contributions from '@/components/Wallet/Contributions';
import BudgetsPanel from '@/components/Wallet/BudgetsPanel';
import IncomingRulesPanel from '@/components/Wallet/IncomingRulesPanel';

interface WalletViewProps {
  entityId: string;
  entityType?: 'user' | 'organization';
}

const money = (amount: number, currency = 'RWF') =>
  `${Number(amount || 0).toLocaleString()} ${currency}`;

const daysUntil = (iso?: string | null): number | null => {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

type TicketFilter = 'all' | 'active' | 'used' | 'expired';
const ticketBucket = (p: WalletPurchase): Exclude<TicketFilter, 'all'> => {
  const s = p.qrObject?.status;
  if (s === 'used') return 'used';
  if (s === 'expired' || s === 'revoked') return 'expired';
  return 'active';
};

const ITEM_TYPE_META: Record<
  WalletItemType,
  { label: string; plural: string; icon: React.ReactNode; accent: string }
> = {
  voucher: { label: 'Voucher', plural: 'Vouchers', icon: <Tag className="w-5 h-5" />, accent: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/10' },
  pass: { label: 'Pass', plural: 'Passes', icon: <BadgeCheck className="w-5 h-5" />, accent: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10' },
  saved_action: { label: 'Saved', plural: 'Saved', icon: <Bookmark className="w-5 h-5" />, accent: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10' },
  custom_card: { label: 'Card', plural: 'Cards', icon: <CreditCard className="w-5 h-5" />, accent: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-500/10' },
  transferred_item: { label: 'Received', plural: 'Received', icon: <Gift className="w-5 h-5" />, accent: 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-500/10' },
  action_purchase_ref: { label: 'Purchase', plural: 'Purchases', icon: <Ticket className="w-5 h-5" />, accent: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10' },
};

export const WalletView: React.FC<WalletViewProps> = ({
  entityId,
  entityType = 'user',
}) => {
  const accent = useAccent();
  const router = useRouter();
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const [tab, setTab] = useState<'tickets' | 'items'>('tickets');
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>('all');
  const [itemFilter, setItemFilter] = useState<'all' | WalletItemType>('all');

  const [activeQr, setActiveQr] = useState<WalletPurchase | null>(null);
  const [transferFor, setTransferFor] = useState<WalletPurchase | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<WalletItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState<{
    itemType: WalletItemType;
    title: string;
    subtitle: string;
    expiresAt: string;
    cardNumber: string;
  }>({
    itemType: 'custom_card',
    title: '',
    subtitle: '',
    expiresAt: '',
    cardNumber: '',
  });

  // Attachment for the new item (photo or PDF) + local preview
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileKind: 'image' | 'pdf' | 'file' | null = !file
    ? null
    : file.type.startsWith('image/')
    ? 'image'
    : file.type === 'application/pdf'
    ? 'pdf'
    : 'file';

  // Viewer for an existing item's attachment
  const [viewFile, setViewFile] = useState<{ url: string; kind: string; name: string } | null>(null);

  const clearFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onPickFile = (f: File | undefined) => {
    if (!f) return;
    const okType = f.type.startsWith('image/') || f.type === 'application/pdf';
    if (!okType) {
      toast({ title: 'Only images or PDF files are allowed', variant: 'destructive' });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast({ title: 'File is too large (max 10MB)', variant: 'destructive' });
      return;
    }
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(f);
    setFilePreview(URL.createObjectURL(f));
  };

  const balanceGradient = accent.isOrg
    ? 'from-blue-600 via-blue-600 to-indigo-700'
    : 'from-emerald-600 via-emerald-600 to-teal-700';
  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;
  const emptyBase = `text-sm text-gray-500 dark:text-gray-400 bg-gray-50 ${accent.darkBgCard} rounded-2xl p-5 border border-dashed border-gray-200 dark:border-white/[0.06]`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const res = await getWalletSummary(entityId, entityType);
      if (res?.success) setSummary(res.data);
      else setError(res?.message || 'Failed to load wallet');
    } catch (err: any) {
      // A 404 means this account simply has no wallet yet — show a calm empty
      // state rather than an error, so orgs/users without a wallet aren't alarmed.
      if (err?.response?.status === 404) setNotFound(true);
      else setError(err?.response?.data?.message || err?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (entityId) load();
  }, [entityId, load]);

  const walletId = summary?.wallet.id;
  const currency = summary?.wallet.currency || 'RWF';
  const hidden = '••••••';

  const restrictedPct = useMemo(() => {
    if (!summary || summary.balanceBreakdown.total <= 0) return 0;
    return Math.min(100, Math.round((summary.balanceBreakdown.restricted / summary.balanceBreakdown.total) * 100));
  }, [summary]);

  const ticketCounts = useMemo(() => {
    const c = { all: 0, active: 0, used: 0, expired: 0 } as Record<TicketFilter, number>;
    (summary?.purchases || []).forEach((p) => {
      c.all += 1;
      c[ticketBucket(p)] += 1;
    });
    return c;
  }, [summary]);

  const itemTypeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    (summary?.items || []).forEach((i) => {
      c[i.itemType] = (c[i.itemType] || 0) + 1;
    });
    return c;
  }, [summary]);

  const visiblePurchases = useMemo(
    () => (summary?.purchases || []).filter((p) => ticketFilter === 'all' || ticketBucket(p) === ticketFilter),
    [summary, ticketFilter]
  );
  const visibleItems = useMemo(
    () => (summary?.items || []).filter((i) => itemFilter === 'all' || i.itemType === itemFilter),
    [summary, itemFilter]
  );

  const openAction = (actionId?: string | null) => {
    if (actionId) router.push(`/welcome/${entityId}/action/${actionId}`);
  };

  const resetForm = () =>
    setNewItem({ itemType: 'custom_card', title: '', subtitle: '', expiresAt: '', cardNumber: '' });

  const closeAdd = () => {
    setAddOpen(false);
    setEditItem(null);
    resetForm();
    clearFile();
  };

  const openEdit = (item: WalletItem) => {
    clearFile();
    setEditItem(item);
    setAddOpen(false);
    setNewItem({
      itemType: item.itemType,
      title: item.title,
      subtitle: item.subtitle || '',
      expiresAt: item.expiresAt ? item.expiresAt.slice(0, 10) : '',
      cardNumber: item.metadata?.cardNumber || '',
    });
  };

  const dialogOpen = addOpen || !!editItem;

  const handleSaveItem = async () => {
    if (!walletId || !newItem.title.trim()) return;
    const isCard = newItem.itemType === 'custom_card';
    setSaving(true);
    try {
      let res: any;
      const fields: Record<string, string> = {
        title: newItem.title.trim(),
        subtitle: newItem.subtitle.trim(),
        expiresAt: newItem.expiresAt || '',
      };
      if (isCard && newItem.cardNumber.trim()) fields.cardNumber = newItem.cardNumber.trim();

      if (editItem) {
        // EDIT
        if (file) {
          const fd = new FormData();
          Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
          fd.append('file', file);
          res = await updateWalletItemForm(editItem.id, fd);
        } else {
          res = await updateWalletItem(editItem.id, {
            ...fields,
            subtitle: fields.subtitle || null,
            expiresAt: fields.expiresAt || null,
          });
        }
      } else {
        // ADD
        if (file) {
          const fd = new FormData();
          fd.append('itemType', newItem.itemType);
          Object.entries(fields).forEach(([k, v]) => v && fd.append(k, v));
          fd.append('file', file);
          res = await createWalletItemForm(walletId, fd);
        } else {
          res = await createWalletItem(walletId, {
            itemType: newItem.itemType,
            ...fields,
            subtitle: fields.subtitle || null,
            expiresAt: fields.expiresAt || null,
          });
        }
      }

      if (res?.success) {
        toast({ title: editItem ? 'Item updated' : 'Added to wallet' });
        closeAdd();
        load();
      } else {
        toast({ title: res?.message || 'Could not save item', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Could not save item', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const mutateItem = async (fn: () => Promise<any>) => {
    try {
      await fn();
      load();
    } catch {
      toast({ title: 'Could not update item', variant: 'destructive' });
    }
  };

  // ── Small building blocks ──────────────────────────────────────────────
  const Pill = ({
    active,
    onClick,
    children,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
        active
          ? `${accent.ring} ${accent.text} ${accent.lightIconBg}`
          : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {children}
      {count != null && (
        <span className={`text-[10px] ${active ? '' : 'opacity-70'}`}>{count}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="h-52 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
          <div className="h-28 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 w-64 rounded-full bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
            <div className="h-24 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={`rounded-2xl p-10 text-center ${cardBase}`}>
        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${accent.lightIconBg}`}>
          <WalletIcon className={`w-7 h-7 ${accent.lightIconColor}`} />
        </div>
        <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">No wallet yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          This {entityType === 'organization' ? 'organization' : 'account'} doesn’t have a wallet yet.
          One is created automatically on the first transaction.
        </p>
        <Button variant="outline" className="mt-5" onClick={load}>
          Refresh
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Could not load wallet</span>
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm mt-2">{error}</p>
        <Button variant="outline" className="mt-4" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }

  if (!summary) return null;

  const { balanceBreakdown, restrictions, items } = summary;

  // Alerts: reserved budgets exceed balance, or nothing left to spend
  const overBudget = balanceBreakdown.restricted > balanceBreakdown.total;
  const lowBalance = balanceBreakdown.total > 0 && balanceBreakdown.available <= 0 && !overBudget;
  const alert = overBudget
    ? `Your category budgets (${balanceBreakdown.restricted.toLocaleString()} ${currency}) exceed your balance (${balanceBreakdown.total.toLocaleString()} ${currency}).`
    : lowBalance
    ? 'All your funds are reserved by category budgets — nothing is freely available to spend.'
    : null;

  return (
    <div className="space-y-5">
      {alert && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/15 px-4 py-3 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{alert}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* ───────────────── Left column: balance + budgets + insights ───────────────── */}
      <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-4">
        {/* Balance card */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${balanceGradient} p-5 text-white shadow-lg`}>
          <div className="pointer-events-none absolute -top-16 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-black/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 opacity-90" />
              <span className="text-sm font-medium opacity-90">Total balance</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBalance((s) => !s)}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors"
                title={showBalance ? 'Hide balance' : 'Show balance'}
              >
                {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <span className={`text-xs px-2 py-1 rounded-full ${summary.wallet.isActive ? 'bg-white/20' : 'bg-red-500/40'}`}>
                {summary.wallet.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="relative mt-3 text-3xl font-bold tracking-tight break-words">
            {showBalance ? money(balanceBreakdown.total, currency) : `${hidden} ${currency}`}
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1 text-xs opacity-80">
                <TrendingUp className="w-3.5 h-3.5" /> Available
              </div>
              <div className="mt-1 text-base font-semibold break-words">
                {showBalance ? money(balanceBreakdown.available, currency) : hidden}
              </div>
            </div>
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <div className="flex items-center gap-1 text-xs opacity-80">
                <Lock className="w-3.5 h-3.5" /> Restricted
              </div>
              <div className="mt-1 text-base font-semibold break-words">
                {showBalance ? money(balanceBreakdown.restricted, currency) : hidden}
              </div>
            </div>
          </div>

          {balanceBreakdown.total > 0 && (
            <div className="relative mt-4">
              <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/80" style={{ width: `${restrictedPct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] opacity-75">{restrictedPct}% reserved for restricted categories</p>
            </div>
          )}
        </div>

        {/* Restricted categories — self-service: reserve/edit/release per category */}
        <BudgetsPanel
          walletId={walletId}
          restrictions={restrictions}
          total={balanceBreakdown.total}
          available={balanceBreakdown.available}
          currency={currency}
          showBalance={showBalance}
          onChanged={load}
        />

        {/* Incoming money rules — auto-file money received from a given sender */}
        {entityType === 'user' && <IncomingRulesPanel walletId={walletId} currency={currency} />}

        {/* Spending insights (hidden when there's no data) */}
        <SpendingInsights entityId={entityId} currency={currency} />
      </div>

      {/* ───────────────── Right column: quick actions, tabs, activity ───────────────── */}
      <div className="lg:col-span-2 space-y-5">
        {/* Quick actions */}
        {entityType === 'user' && <QuickActions entityId={entityId} />}

        {/* Main tab switch */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/[0.04] w-full sm:w-auto">
          <button
            onClick={() => setTab('tickets')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'tickets' ? `bg-white ${accent.darkBgCard} ${accent.text} shadow-sm` : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Ticket className="w-4 h-4" /> Tickets
            <span className="text-xs opacity-70">{ticketCounts.all}</span>
          </button>
          <button
            onClick={() => setTab('items')}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === 'items' ? `bg-white ${accent.darkBgCard} ${accent.text} shadow-sm` : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Wallet items
            <span className="text-xs opacity-70">{items.length}</span>
          </button>
        </div>

        {tab === 'tickets' ? (
          <>
            {/* Ticket filters */}
            {ticketCounts.all > 0 && (
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'used', 'expired'] as TicketFilter[]).map((f) => (
                  <Pill key={f} active={ticketFilter === f} onClick={() => setTicketFilter(f)} count={ticketCounts[f]}>
                    <span className="capitalize">{f}</span>
                  </Pill>
                ))}
              </div>
            )}

            {ticketCounts.all === 0 ? (
              <div className={emptyBase}>
                <p>Nothing purchased yet.</p>
                <button
                  onClick={() => router.push(`/action/${entityId}`)}
                  className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl text-white ${accent.solidDark}`}
                >
                  <Compass className="w-4 h-4" /> Browse actions
                </button>
              </div>
            ) : visiblePurchases.length === 0 ? (
              <p className={emptyBase}>No {ticketFilter} tickets.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visiblePurchases.map((p) => {
                  const cover = p.action?.coverImage || p.subAction?.coverImage;
                  return (
                    <div
                      key={p.id}
                      onClick={() => openAction(p.actionId)}
                      className={`${cardBase} rounded-2xl p-3 flex gap-3 cursor-pointer hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 transition-all`}
                    >
                      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover} alt={p.action?.name || 'action'} className="w-full h-full object-cover" />
                        ) : (
                          <Ticket className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{p.action?.name || 'Action'}</p>
                          <span
                            className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full capitalize ${
                              p.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                                : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        {p.subAction?.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.subAction.name}</p>
                        )}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {money(p.totalAmount, p.currency || currency)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">x{p.quantity}</span>
                        </div>
                        {p.qrObject?.qrCodeData && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveQr(p);
                            }}
                            className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${accent.lightIconColor} hover:underline`}
                          >
                            <QrCode className="w-3.5 h-3.5" /> View ticket
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Item filters + add */}
            <div className="flex flex-wrap items-center gap-2">
              <Pill active={itemFilter === 'all'} onClick={() => setItemFilter('all')} count={items.length}>
                All
              </Pill>
              {(Object.keys(itemTypeCounts) as WalletItemType[]).map((t) => (
                <Pill key={t} active={itemFilter === t} onClick={() => setItemFilter(t)} count={itemTypeCounts[t]}>
                  {ITEM_TYPE_META[t].plural}
                </Pill>
              ))}
              <button
                onClick={() => setAddOpen(true)}
                className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full text-white transition-colors ${accent.solidDark}`}
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {items.length === 0 ? (
              <p className={emptyBase}>No vouchers, passes or cards yet. Add one to keep it handy.</p>
            ) : visibleItems.length === 0 ? (
              <p className={emptyBase}>Nothing here in this filter.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleItems.map((item) => {
                  const meta = ITEM_TYPE_META[item.itemType];
                  const days = daysUntil(item.expiresAt);
                  const savedActionId = item.itemType === 'saved_action' ? item.referenceId : undefined;
                  const fileUrl: string | undefined = item.metadata?.fileUrl;
                  const fileType: string = item.metadata?.fileType || 'file';
                  const cardQr: string | undefined = item.metadata?.cardQr;
                  const cardNumber: string | undefined = item.metadata?.cardNumber;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl p-4 ${
                        item.status === 'archived'
                          ? `opacity-60 border border-dashed border-gray-300 dark:border-white/10 ${accent.darkBgCard}`
                          : cardBase
                      } ${savedActionId ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
                      onClick={savedActionId ? () => openAction(savedActionId) : undefined}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          ) : fileUrl && fileType === 'pdf' ? (
                            <div className="p-2 rounded-xl text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10">
                              <FileText className="w-5 h-5" />
                            </div>
                          ) : (
                            <div className={`p-2 rounded-xl ${meta.accent}`}>{meta.icon}</div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.subtitle || meta.label}</p>
                          </div>
                        </div>
                        {savedActionId ? (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          item.isPinned && <Pin className={`w-4 h-4 shrink-0 ${accent.text}`} />
                        )}
                      </div>

                      {days != null && (
                        <div
                          className={`mt-3 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                            days < 0
                              ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                              : days <= 7
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {days < 0 ? 'Expired' : days === 0 ? 'Expires today' : `Expires in ${days}d`}
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {cardQr && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewFile({ url: cardQr, kind: 'image', name: cardNumber ? `Card ${cardNumber}` : 'Card' });
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${accent.lightIconColor} hover:underline`}
                          >
                            <QrCode className="w-3.5 h-3.5" /> Show card
                          </button>
                        )}
                        {fileUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewFile({ url: fileUrl, kind: fileType, name: item.metadata?.fileName || 'Attachment' });
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium ${accent.lightIconColor} hover:underline`}
                          >
                            {fileType === 'pdf' ? <FileText className="w-3.5 h-3.5" /> : <Paperclip className="w-3.5 h-3.5" />}
                            View {fileType === 'pdf' ? 'PDF' : 'file'}
                          </button>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-gray-400" onClick={(e) => e.stopPropagation()}>
                        <button title="Edit" onClick={() => openEdit(item)} className="hover:text-gray-600 dark:hover:text-gray-200">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button title={item.isPinned ? 'Unpin' : 'Pin'} onClick={() => mutateItem(() => updateWalletItem(item.id, { isPinned: !item.isPinned }))} className="hover:text-gray-600 dark:hover:text-gray-200">
                          {item.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                        <button title={item.status === 'archived' ? 'Unarchive' : 'Archive'} onClick={() => mutateItem(() => updateWalletItem(item.id, { status: item.status === 'archived' ? 'active' : 'archived' }))} className="hover:text-amber-600">
                          <Archive className="w-4 h-4" />
                        </button>
                        <button title="Delete" onClick={() => mutateItem(() => deleteWalletItem(item.id))} className="hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Recent activity */}
        <RecentActivity walletId={summary.wallet.id} entityId={entityId} currency={currency} />

        {/* Shared wallets / contributions */}
        <Contributions currency={currency} />
      </div>

      {/* Attachment viewer */}
      <Dialog open={!!viewFile} onOpenChange={(o) => !o && setViewFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{viewFile?.name}</DialogTitle>
          </DialogHeader>
          {viewFile && (
            <div className="space-y-3">
              {viewFile.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewFile.url} alt={viewFile.name} className="w-full max-h-[70vh] object-contain rounded-xl bg-gray-50 dark:bg-white/[0.03]" />
              ) : viewFile.kind === 'pdf' ? (
                <iframe src={viewFile.url} title={viewFile.name} className="w-full h-[70vh] rounded-xl bg-gray-50 dark:bg-white/[0.03]" />
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">This file type can’t be previewed inline.</p>
              )}
              <a
                href={viewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-sm font-medium ${accent.lightIconColor} hover:underline`}
              >
                <ExternalLink className="w-4 h-4" /> Open in new tab
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket QR dialog */}
      <TicketQrDialog
        open={!!activeQr}
        onOpenChange={(o) => !o && setActiveQr(null)}
        purchase={activeQr}
        canTransfer={entityType === 'user'}
        onTransfer={() => {
          setTransferFor(activeQr);
          setActiveQr(null);
        }}
      />

      {/* Transfer modal (reuses the ActionPage flow) */}
      {transferFor && (
        <TransferTicketModal
          open={!!transferFor}
          onClose={() => setTransferFor(null)}
          purchaseId={transferFor.id}
          ticketName={transferFor.action?.name || 'Ticket'}
          senderId={entityId}
          onTransferred={() => {
            setTransferFor(null);
            load();
          }}
        />
      )}

      {/* Add / edit item dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? undefined : closeAdd())}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit item' : 'Add to wallet'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editItem && (
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Type</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(['custom_card', 'voucher', 'pass', 'saved_action'] as WalletItemType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setNewItem((s) => ({ ...s, itemType: t }))}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        newItem.itemType === t ? `${accent.ring} ${accent.text} ${accent.lightIconBg}` : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {ITEM_TYPE_META[t].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Title</label>
              <Input
                value={newItem.title}
                onChange={(e) => setNewItem((s) => ({ ...s, title: e.target.value }))}
                placeholder="e.g. Gym membership card"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Subtitle (optional)</label>
              <Input
                value={newItem.subtitle}
                onChange={(e) => setNewItem((s) => ({ ...s, subtitle: e.target.value }))}
                placeholder="e.g. Member #12345"
                className="mt-1"
              />
            </div>

            {/* Card number (loyalty/membership) → generates a scannable QR */}
            {newItem.itemType === 'custom_card' && (
              <div>
                <label className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <Hash className="w-3 h-3" /> Card number (optional)
                </label>
                <Input
                  value={newItem.cardNumber}
                  onChange={(e) => setNewItem((s) => ({ ...s, cardNumber: e.target.value }))}
                  placeholder="e.g. 6012 3456 7890"
                  className="mt-1"
                />
                <p className="mt-1 text-[10px] text-gray-400">A scannable QR is generated so you can use it at the till.</p>
              </div>
            )}

            {/* Expiry */}
            <div>
              <label className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                <Calendar className="w-3 h-3" /> Expiry date (optional)
              </label>
              <Input
                type="date"
                value={newItem.expiresAt}
                onChange={(e) => setNewItem((s) => ({ ...s, expiresAt: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Attachment (photo or PDF) */}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Attachment (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0])}
              />
              {!file ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 w-full flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-gray-300 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-white/25 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Upload photo or PDF</span>
                  <span className="text-[10px] text-gray-400">Max 10MB</span>
                </button>
              ) : (
                <div className="mt-1 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                  {fileKind === 'image' && filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={filePreview} alt={file.name} className="w-full max-h-44 object-contain bg-gray-50 dark:bg-white/[0.03]" />
                  ) : fileKind === 'pdf' && filePreview ? (
                    <object data={filePreview} type="application/pdf" className="w-full h-44 bg-gray-50 dark:bg-white/[0.03]">
                      <div className="flex flex-col items-center justify-center h-44 text-gray-500 dark:text-gray-400">
                        <FileText className="w-8 h-8" />
                        <span className="text-xs mt-1">PDF ready to upload</span>
                      </div>
                    </object>
                  ) : null}
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100 dark:border-white/10">
                    {fileKind === 'pdf' ? <FileText className="w-4 h-4 text-red-500 shrink-0" /> : <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />}
                    <span className="text-xs text-gray-700 dark:text-gray-200 truncate flex-1">{file.name}</span>
                    <button type="button" onClick={clearFile} className="text-gray-400 hover:text-red-500" title="Remove">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdd} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={saving || !newItem.title.trim()} className={`text-white ${accent.solidDark}`}>
              {saving ? 'Saving…' : editItem ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default WalletView;
