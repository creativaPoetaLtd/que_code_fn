"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, PiggyBank } from 'lucide-react';
import { getMyGroupContributions } from '@/helpers/api';
import { useAccent } from '@/hooks/use-accent';

interface ContributionsProps {
  currency: string;
}

interface NormalizedContribution {
  id: string;
  title: string;
  subtitle?: string;
  amount?: number;
  groupId?: string;
}

// The /contributions/mine payload varies by contribution type — pull fields
// defensively and only render what we can confidently show.
const normalize = (raw: any): NormalizedContribution | null => {
  if (!raw) return null;
  const c = raw.contribution || raw;
  const id = c.id || raw.id;
  const title = c.title || c.name || raw.title;
  if (!id || !title) return null;
  const amount = Number(
    raw.amountContributed ?? raw.amount ?? c.collectedAmount ?? c.totalCollected ?? c.goalAmount ?? 0
  );
  return {
    id,
    title,
    subtitle: c.type ? `${c.type} contribution` : undefined,
    amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
    groupId: c.groupId || raw.groupId,
  };
};

export const Contributions: React.FC<ContributionsProps> = ({ currency }) => {
  const router = useRouter();
  const accent = useAccent();
  const [rows, setRows] = useState<NormalizedContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res: any = await getMyGroupContributions();
        const list = res?.data?.data ?? res?.data ?? [];
        if (Array.isArray(list)) {
          setRows(list.map(normalize).filter(Boolean).slice(0, 5) as NormalizedContribution[]);
        }
      } catch {
        /* supplementary */
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  if (loading || rows.length === 0) return null; // hide unless we have something

  const cardBase = `bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06]`;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">My contributions</h2>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.lightIconBg} ${accent.lightIconColor}`}>
          {rows.length}
        </span>
      </div>
      <div className="space-y-2">
        {rows.map((c) => {
          const clickable = !!c.groupId;
          return (
            <div
              key={c.id}
              onClick={clickable ? () => router.push(`/groups/${c.groupId}`) : undefined}
              className={`${cardBase} rounded-2xl p-3 flex items-center gap-3 ${clickable ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
            >
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accent.lightIconBg} ${accent.lightIconColor}`}>
                <PiggyBank className="w-4 h-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                {c.subtitle && <p className="text-[11px] text-gray-400 truncate capitalize">{c.subtitle}</p>}
              </div>
              {c.amount != null && (
                <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                  {c.amount.toLocaleString()} {currency}
                </span>
              )}
              {clickable && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Contributions;
