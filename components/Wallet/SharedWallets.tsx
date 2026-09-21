"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletCards, ChevronRight, Lock, ArrowUpFromLine, Plus } from 'lucide-react';
import { useGetMySharedWalletsQuery } from '@/states/sharedWalletSlice';
import { useAccent } from '@/hooks/use-accent';
import WithdrawFromSharedWalletModal from '@/components/Wallet/WithdrawFromSharedWalletModal';
import CreateSharedWalletModal from '@/components/Wallet/CreateSharedWalletModal';

interface SharedWallet {
  id: string;
  name: string;
  groupId?: string | null;
  memberCount: number;
  withdrawalPolicy?: 'free' | 'approval';
  balance: number;
  currency: string;
}

export const SharedWallets: React.FC = () => {
  const router = useRouter();
  const accent = useAccent();
  const { data, isLoading } = useGetMySharedWalletsQuery(undefined);
  const [withdrawTarget, setWithdrawTarget] = useState<SharedWallet | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const wallets: SharedWallet[] = data?.data ?? [];

  if (isLoading) return null;

  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <WalletCards className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Shared wallets</h2>
          {wallets.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.lightIconBg} ${accent.lightIconColor}`}>
              {wallets.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${accent.lightIconBg} ${accent.lightIconColor} hover:opacity-80 transition-opacity`}
        >
          <Plus className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {wallets.length === 0 ? (
        <div className={`${cardBase} rounded-2xl p-4 text-center`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pool money with a few people — with or without a group chat.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {wallets.map((w) => (
            <div
              key={w.id}
              onClick={() => router.push(`/wallets/shared/${w.id}`)}
              className={`${cardBase} rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all`}
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.lightIconBg} ${accent.lightIconColor}`}>
                <WalletCards className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{w.name}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {w.memberCount} {w.memberCount === 1 ? 'member' : 'members'}
                  {w.withdrawalPolicy === 'approval' && (
                    <span className="inline-flex items-center gap-0.5 ml-1.5">
                      <Lock className="w-2.5 h-2.5" /> Approval required
                    </span>
                  )}
                </p>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                {w.balance.toLocaleString()} {w.currency}
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setWithdrawTarget(w); }}
                title="Withdraw"
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${accent.lightIconBg} ${accent.lightIconColor} hover:opacity-80 transition-opacity`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {withdrawTarget && (
        <WithdrawFromSharedWalletModal
          isOpen={!!withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          sharedWalletId={withdrawTarget.id}
          walletName={withdrawTarget.name}
          balance={withdrawTarget.balance}
          currency={withdrawTarget.currency}
          withdrawalPolicy={withdrawTarget.withdrawalPolicy || 'approval'}
        />
      )}

      <CreateSharedWalletModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </section>
  );
};

export default SharedWallets;
