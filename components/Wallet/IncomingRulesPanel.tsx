"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, Plus, Pencil, Trash2, X, Check, Pause, Play, ArrowRight } from 'lucide-react';
import { useAccent } from '@/hooks/use-accent';
import type { WalletIncomingRule, IncomingSender } from '@/types/dashboard';
import {
  getWalletIncomingRules,
  getIncomingSenders,
  getWalletCategories,
  createWalletIncomingRule,
  updateWalletIncomingRule,
  deleteWalletIncomingRule,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
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

interface IncomingRulesPanelProps {
  walletId?: string;
  currency: string;
}

const senderName = (r: WalletIncomingRule): string => {
  const sw = r.senderWallet;
  if (!sw) return 'Sender';
  if (sw.organization?.name) return sw.organization.name;
  const u = sw.user;
  return `${u?.firstName || ''} ${u?.lastName || ''}`.trim() || 'Sender';
};

/**
 * "Incoming money rules": the owner can pre-decide that money received from a
 * given person/organization is automatically filed into a category (e.g. Rent),
 * optionally up to a lifetime cap. Money already received keeps flowing into the
 * category envelope on each transfer; this panel only manages the rules.
 */
export const IncomingRulesPanel: React.FC<IncomingRulesPanelProps> = ({
  walletId,
  currency,
}) => {
  const accent = useAccent();
  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;

  const [rules, setRules] = useState<WalletIncomingRule[]>([]);
  const [senders, setSenders] = useState<IncomingSender[]>([]);
  const [categories, setCategories] = useState<WalletCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WalletIncomingRule | null>(null);
  const [senderWalletId, setSenderWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cap, setCap] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!walletId) return;
    setLoading(true);
    // Load independently — a failure in one call must not wipe the others
    // (e.g. a categories hiccup shouldn't hide the senders list / Add button).
    const [rulesRes, sendersRes, catsRes] = await Promise.allSettled([
      getWalletIncomingRules(walletId),
      getIncomingSenders(walletId),
      getWalletCategories(),
    ]);
    if (rulesRes.status === 'fulfilled' && rulesRes.value?.success) setRules(rulesRes.value.data || []);
    if (sendersRes.status === 'fulfilled' && sendersRes.value?.success) setSenders(sendersRes.value.data || []);
    if (catsRes.status === 'fulfilled' && catsRes.value?.success) setCategories(catsRes.value.data || []);
    setLoading(false);
  }, [walletId]);

  useEffect(() => {
    load();
  }, [load]);

  // Senders that don't already have a rule (for the Add picker)
  const availableSenders = useMemo(() => {
    const taken = new Set(rules.map((r) => r.senderWalletId));
    return senders.filter((s) => !taken.has(s.senderWalletId));
  }, [senders, rules]);

  const recentSenders = useMemo(
    () => availableSenders.filter((s) => s.source !== 'contact'),
    [availableSenders]
  );
  const contactSenders = useMemo(
    () => availableSenders.filter((s) => s.source === 'contact'),
    [availableSenders]
  );

  const openAdd = () => {
    setEditing(null);
    setSenderWalletId('');
    setCategoryId('');
    setCap('');
    setDialogOpen(true);
    // Refresh the picker sources in case the initial load raced with auth/data.
    load();
  };

  const openEdit = (r: WalletIncomingRule) => {
    setEditing(r);
    setSenderWalletId(r.senderWalletId);
    setCategoryId(r.categoryId);
    setCap(r.cap != null ? String(r.cap) : '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setSenderWalletId('');
    setCategoryId('');
    setCap('');
  };

  const capNum = cap.trim() === '' ? null : Number(cap);
  const capValid = capNum === null || (!isNaN(capNum) && capNum > 0);
  const canSubmit =
    !!categoryId && (editing ? true : !!senderWalletId) && capValid && !saving;

  const handleSave = async () => {
    if (!walletId || !canSubmit) return;
    setSaving(true);
    try {
      const res = editing
        ? await updateWalletIncomingRule(editing.id, { categoryId, cap: capNum })
        : await createWalletIncomingRule({ walletId, senderWalletId, categoryId, cap: capNum });
      if (res?.success) {
        toast({ title: editing ? 'Rule updated' : 'Rule created' });
        closeDialog();
        load();
      } else {
        toast({ title: res?.message || 'Could not save rule', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Could not save rule', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const res = await deleteWalletIncomingRule(id);
      if (res?.success) {
        toast({ title: 'Rule removed' });
        setConfirmDelete(null);
        load();
      } else {
        toast({ title: res?.message || 'Could not remove rule', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Could not remove rule', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (r: WalletIncomingRule) => {
    setBusyId(r.id);
    try {
      const res = await updateWalletIncomingRule(r.id, { isActive: !r.isActive });
      if (res?.success) load();
      else toast({ title: res?.message || 'Could not update rule', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: err?.response?.data?.message || 'Could not update rule', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const canAdd = !!walletId;

  if (!walletId) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <ArrowDownLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Incoming money rules</h2>
        {rules.length > 0 && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.lightIconBg} ${accent.lightIconColor}`}>
            {rules.length}
          </span>
        )}
        {canAdd && (
          <button
            onClick={openAdd}
            className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white transition-colors ${accent.solidDark}`}
          >
            <Plus className="w-3.5 h-3.5" /> Add rule
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
      ) : rules.length === 0 ? (
        <div className={`text-sm text-gray-500 dark:text-gray-400 rounded-2xl p-4 border border-dashed border-gray-200 dark:border-white/[0.06] ${accent.darkBgCard}`}>
          <p>
            No rules yet. Set one so money from a specific person or organization is
            automatically filed into a category (e.g. Rent).
          </p>
          {canAdd ? (
            <button
              onClick={openAdd}
              className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl text-white ${accent.solidDark}`}
            >
              <Plus className="w-4 h-4" /> Add a rule
            </button>
          ) : (
            <p className="mt-2 text-[11px] text-gray-400">
              Rules can be set for people or organizations who have sent you money.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((r) => {
            const isConfirming = confirmDelete === r.id;
            const capNumber = r.cap != null ? Number(r.cap) : null;
            const filed = Number(r.restrictedTotal) || 0;
            return (
              <div key={r.id} className={`${cardBase} rounded-2xl p-4 ${!r.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 text-sm">
                    <span className="font-medium text-gray-900 dark:text-white truncate">{senderName(r)}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className={`font-semibold ${accent.lightIconColor} truncate`}>{r.category?.name || 'Category'}</span>
                  </div>
                  {!r.isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 shrink-0">
                      Paused
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>
                    {capNumber != null
                      ? `Up to ${capNumber.toLocaleString()} ${currency} per payment`
                      : 'Whole payment is filed'}
                  </span>
                  {filed > 0 && <span>{filed.toLocaleString()} {currency} filed so far</span>}
                </div>

                {/* Row actions */}
                <div className="mt-3 flex items-center gap-3 text-gray-400">
                  {isConfirming ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 dark:text-gray-300">Remove this rule?</span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> {busyId === r.id ? 'Removing…' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="inline-flex items-center gap-1 font-medium hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <X className="w-3.5 h-3.5" /> No
                      </button>
                    </div>
                  ) : (
                    <>
                      <button title="Edit rule" onClick={() => openEdit(r)} className="hover:text-gray-600 dark:hover:text-gray-200">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        title={r.isActive ? 'Pause rule' : 'Resume rule'}
                        onClick={() => toggleActive(r)}
                        disabled={busyId === r.id}
                        className="hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
                      >
                        {r.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button title="Remove rule" onClick={() => setConfirmDelete(r.id)} className="hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? undefined : closeDialog())}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit incoming rule' : 'New incoming rule'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">From</label>
              {editing ? (
                <div className="mt-1 px-3 py-2 rounded-md border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white">
                  {senderName(editing)}
                </div>
              ) : availableSenders.length === 0 ? (
                <p className="mt-1 text-[11px] text-gray-400">
                  No eligible senders yet. People or organizations who have sent you money,
                  or who are in your contacts, can be added here.
                </p>
              ) : (
                <Select value={senderWalletId} onValueChange={setSenderWalletId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a sender" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentSenders.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Recent senders</SelectLabel>
                        {recentSenders.map((s) => (
                          <SelectItem key={s.senderWalletId} value={s.senderWalletId}>
                            {s.name} {s.type === 'organization' ? '(org)' : ''}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {contactSenders.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Contacts</SelectLabel>
                        {contactSenders.map((s) => (
                          <SelectItem key={s.senderWalletId} value={s.senderWalletId}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Restrict to category</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Max per payment (optional)</label>
              <Input
                type="number"
                min={0}
                inputMode="decimal"
                value={cap}
                onChange={(e) => setCap(e.target.value)}
                placeholder="Whole payment"
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Leave empty to file the whole payment. Otherwise, each time this sender pays
                you, at most{' '}
                {cap.trim() && capValid ? `${Number(cap).toLocaleString()} ${currency}` : 'this amount'}{' '}
                is filed into the category and the rest stays free (e.g. they send 5,000, only
                2,000 is restricted).
              </p>
              {cap.trim() !== '' && !capValid && (
                <p className="mt-1 text-[11px] text-red-500">Enter a positive amount.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSubmit} className={`text-white ${accent.solidDark}`}>
              {saving ? 'Saving…' : editing ? 'Save' : 'Create rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomingRulesPanel;
