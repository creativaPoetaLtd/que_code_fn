"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Lock, Plus, ArrowUpCircle, X } from 'lucide-react';
import { useAccent } from '@/hooks/use-accent';
import type { WalletRestriction } from '@/types/dashboard';
import {
  getWalletCategories,
  createWalletRestriction,
  updateWalletRestriction,
} from '@/helpers/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface WalletCategory {
  id: string;
  name: string;
  description?: string | null;
}

interface BudgetsPanelProps {
  walletId?: string;
  restrictions: WalletRestriction[];
  total: number;
  /** Unrestricted funds still free to reserve (balanceBreakdown.available). */
  available: number;
  currency: string;
  showBalance: boolean;
  /** Called after a restriction is created/updated/deleted so the parent can refresh. */
  onChanged: () => void;
}

/**
 * Self-service view of the wallet's restricted category balances ("envelopes").
 * The wallet owner can reserve part of their available balance for a category and
 * top it up later. Reservations are increase-only: they cannot be reduced or
 * released here (spending within the category still draws them down at pay time).
 */
export const BudgetsPanel: React.FC<BudgetsPanelProps> = ({
  walletId,
  restrictions,
  total,
  available,
  currency,
  showBalance,
  onChanged,
}) => {
  const accent = useAccent();
  const hidden = '••••••';
  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;

  const [categories, setCategories] = useState<WalletCategory[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WalletRestriction | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Load spending categories once — used to pick a category when reserving funds.
  useEffect(() => {
    let active = true;
    getWalletCategories()
      .then((res) => {
        if (active && res?.success) setCategories(res.data || []);
      })
      .catch(() => {
        /* categories are non-critical; the picker just stays empty */
      });
    return () => {
      active = false;
    };
  }, []);

  // Categories that don't already have a restriction (only relevant when adding).
  const availableCategories = useMemo(() => {
    const taken = new Set(restrictions.map((r) => r.categoryId));
    return categories.filter((c) => !taken.has(c.id));
  }, [categories, restrictions]);

  const openAdd = () => {
    setEditing(null);
    setCategoryId('');
    setAmount('');
    setDialogOpen(true);
  };

  const openIncrease = (r: WalletRestriction) => {
    setEditing(r);
    setCategoryId(r.categoryId);
    setAmount('');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setCategoryId('');
    setAmount('');
  };

  // In both flows the amount is drawn from currently-free funds:
  //  • Reserve  → the amount becomes the envelope's total.
  //  • Increase → the amount is added on top of the existing envelope (top-up).
  // Restrictions are increase-only, so there is no "reduce" path.
  const numericAmount = Number(amount);
  const amountValid =
    amount.trim() !== '' &&
    !isNaN(numericAmount) &&
    numericAmount > 0 &&
    numericAmount <= available;

  const canSubmit = (editing ? true : !!categoryId) && amountValid && !saving;

  const handleSave = async () => {
    if (!walletId || !canSubmit) return;
    setSaving(true);
    try {
      const res = editing
        ? await updateWalletRestriction(editing.id, editing.amount + numericAmount)
        : await createWalletRestriction(walletId, categoryId, numericAmount);
      if (res?.success) {
        toast({ title: editing ? 'Reserved amount increased' : 'Funds reserved' });
        closeDialog();
        onChanged();
      } else {
        toast({ title: res?.message || 'Could not save restriction', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({
        title: err?.response?.data?.message || 'Could not save restriction',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const canAdd = !!walletId && availableCategories.length > 0 && available > 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Restricted categories</h2>
        {restrictions.length > 0 && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.lightIconBg} ${accent.lightIconColor}`}>
            {restrictions.length}
          </span>
        )}
        {canAdd && (
          <button
            onClick={openAdd}
            className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white transition-colors ${accent.solidDark}`}
          >
            <Plus className="w-3.5 h-3.5" /> Reserve
          </button>
        )}
      </div>

      {restrictions.length === 0 ? (
        <div className={`text-sm text-gray-500 dark:text-gray-400 rounded-2xl p-4 border border-dashed border-gray-200 dark:border-white/[0.06] ${accent.darkBgCard}`}>
          <p>No spending restrictions — all funds are available for any category.</p>
          {canAdd && (
            <button
              onClick={openAdd}
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl text-white ${accent.solidDark}`}
            >
              <Plus className="w-4 h-4" /> Reserve funds
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {restrictions.map((r) => {
            const pct = total > 0 ? Math.min(100, Math.round((r.amount / total) * 100)) : 0;
            return (
              <div key={r.id} className={`${cardBase} rounded-2xl p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{r.categoryName || 'Category'}</p>
                    {r.categoryDescription && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{r.categoryDescription}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {showBalance ? `${r.amount.toLocaleString()} ${currency}` : hidden}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
                  <div className={`h-full rounded-full ${accent.active}`} style={{ width: `${pct}%` }} />
                </div>

                {/* Row action — increase only; reservations can't be reduced or released */}
                {walletId && (
                  <div className="mt-3">
                    <button
                      title={available > 0 ? 'Add more to this reservation' : 'No free funds available to add'}
                      onClick={() => openIncrease(r)}
                      disabled={available <= 0}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${accent.lightIconColor} hover:underline disabled:opacity-40 disabled:no-underline`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" /> Increase
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reserve / increase dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? undefined : closeDialog())}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Increase reserved amount' : 'Reserve funds for a category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Category</label>
              {editing ? (
                <div className="mt-1 px-3 py-2 rounded-md border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
                  {editing.categoryName || 'Category'}
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {editing && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Currently reserved: <span className="font-semibold">{editing.amount.toLocaleString()} {currency}</span>.
                Reservations can only be increased.
              </p>
            )}
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {editing ? 'Amount to add' : 'Amount to reserve'}
              </label>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                You can {editing ? 'add' : 'reserve'} up to {available.toLocaleString()} {currency} from your available funds
                {editing ? `, bringing the total to ${(editing.amount + (numericAmount > 0 && !isNaN(numericAmount) ? numericAmount : 0)).toLocaleString()} ${currency}.` : '.'}
              </p>
              {amount.trim() !== '' && !amountValid && (
                <p className="mt-1 text-[11px] text-red-500">
                  {numericAmount > available
                    ? 'Amount exceeds your available funds.'
                    : 'Enter a positive amount.'}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSubmit} className={`text-white ${accent.solidDark}`}>
              {saving ? 'Saving…' : editing ? 'Increase' : 'Reserve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetsPanel;
