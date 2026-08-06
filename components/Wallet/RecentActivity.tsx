"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownLeft, ArrowUpRight, Receipt, ChevronRight, History } from 'lucide-react';
import { getWalletHistory, downloadTransactionReceipt } from '@/helpers/api';
import { toast } from '@/hooks/use-toast';
import { useAccent } from '@/hooks/use-accent';

interface RecentActivityProps {
  walletId: string;
  entityId: string;
  currency: string;
}

const partyName = (wallet: any): string => {
  if (!wallet) return 'Unknown';
  if (wallet.user) return `${wallet.user.firstName || ''} ${wallet.user.lastName || ''}`.trim() || wallet.user.email || 'User';
  if (wallet.organization) return wallet.organization.name || 'Organization';
  if (wallet.group) return wallet.group.name || 'Group';
  if (wallet.publicContribution) return wallet.publicContribution.title || 'Contribution';
  return 'Unknown';
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ walletId, entityId, currency }) => {
  const router = useRouter();
  const accent = useAccent();
  const [tx, setTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getWalletHistory(walletId, { limit: 6 });
      if (res?.success) setTx(res.data?.transactions || []);
    } catch {
      /* non-fatal: activity is supplementary */
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    if (walletId) load();
  }, [walletId, load]);

  const handleReceipt = async (id: string) => {
    setDownloading(id);
    try {
      await downloadTransactionReceipt(id);
    } catch {
      toast({ title: 'Could not download receipt', variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent activity</h2>
        </div>
        <button
          onClick={() => router.push(`/transactions`)}
          className={`inline-flex items-center gap-1 text-xs font-medium ${accent.lightIconColor} hover:underline`}
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : tx.length === 0 ? (
        <p className={`text-sm text-gray-500 dark:text-gray-400 rounded-2xl p-5 border border-dashed border-gray-200 dark:border-white/[0.06] ${accent.darkBgCard}`}>
          No transactions yet.
        </p>
      ) : (
        <div className="space-y-2">
          {tx.map((t) => {
            const outgoing = t.senderWalletId === walletId;
            const other = outgoing ? t.receiverWallet : t.senderWallet;
            const cur = t.currency || currency;
            return (
              <div key={t.id} className={`${cardBase} rounded-2xl p-3 flex items-center gap-3`}>
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    outgoing
                      ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                      : 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                  }`}
                >
                  {outgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {outgoing ? 'To ' : 'From '}
                    {partyName(other)}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate capitalize">
                    {t.type} · {new Date(t.createdAt).toLocaleDateString()}
                    {t.status !== 'completed' ? ` · ${t.status}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${outgoing ? 'text-gray-900 dark:text-white' : 'text-green-600 dark:text-green-400'}`}>
                    {outgoing ? '-' : '+'}
                    {Number(t.amount || 0).toLocaleString()} {cur}
                  </p>
                  {t.status === 'completed' && (
                    <button
                      onClick={() => handleReceipt(t.id)}
                      disabled={downloading === t.id}
                      className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                      <Receipt className="w-3 h-3" /> {downloading === t.id ? '…' : 'Receipt'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RecentActivity;
