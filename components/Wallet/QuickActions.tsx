"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Send, HandCoins, QrCode, ScanLine } from 'lucide-react';
import { useAccent } from '@/hooks/use-accent';

interface QuickActionsProps {
  entityId: string;
}

/**
 * Quick actions row — deep-links into the existing money flows so the wallet
 * page becomes the hub for send / request / receive / scan.
 */
export const QuickActions: React.FC<QuickActionsProps> = ({ entityId }) => {
  const router = useRouter();
  const accent = useAccent();

  const actions = [
    { key: 'send', label: 'Send', icon: <Send className="w-5 h-5" />, go: () => router.push('/home/transfer') },
    { key: 'request', label: 'Request', icon: <HandCoins className="w-5 h-5" />, go: () => router.push('/home/request') },
    { key: 'receive', label: 'Receive', icon: <QrCode className="w-5 h-5" />, go: () => router.push(`/welcome/${entityId}`) },
    { key: 'scan', label: 'Scan', icon: <ScanLine className="w-5 h-5" />, go: () => router.push('/home/scan') },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <button
          key={a.key}
          onClick={a.go}
          className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:shadow-md hover:border-gray-200 dark:hover:border-white/10 transition-all`}
        >
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent.lightIconBg} ${accent.lightIconColor}`}>
            {a.icon}
          </span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{a.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
