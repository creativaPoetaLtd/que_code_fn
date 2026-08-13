"use client";

import React, { useEffect, useState } from 'react';
import { PieChart } from 'lucide-react';
import { getAnalyticsCategoryBreakdown } from '@/helpers/api';
import { useAccent } from '@/hooks/use-accent';

interface SpendingInsightsProps {
  entityId: string;
  currency: string;
}

interface Slice {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

// Brand-neutral categorical bar colors (readable in light + dark)
const BAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-cyan-500',
];

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({ entityId, currency }) => {
  const accent = useAccent();
  const [rows, setRows] = useState<Slice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const end = now.toISOString();
        const res = await getAnalyticsCategoryBreakdown(entityId, start, end, 'expenses');
        const data = (res?.data?.data ?? res?.data ?? []) as Slice[];
        if (Array.isArray(data)) setRows(data.filter((r) => r.totalAmount > 0).slice(0, 5));
      } catch {
        /* insights are supplementary */
      } finally {
        setLoading(false);
      }
    };
    if (entityId) run();
  }, [entityId]);

  if (loading) {
    return <div className={`h-40 rounded-2xl bg-gray-200 dark:bg-white/[0.04] animate-pulse`} />;
  }
  if (rows.length === 0) return null; // hide entirely when there's nothing to show

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long' });

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Spending · {monthLabel}</h2>
      </div>
      <div className={`rounded-2xl p-4 bg-white ${accent.darkBgCard} border border-gray-100 dark:border-white/[0.06] space-y-3`}>
        {rows.map((r, i) => (
          <div key={r.categoryId || i}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200 truncate">{r.categoryName}</span>
              <span className="text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                {Number(r.totalAmount).toLocaleString()} {currency}
              </span>
            </div>
            <div className="mt-1 h-2 w-full rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`}
                style={{ width: `${Math.max(3, r.percentage)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpendingInsights;
