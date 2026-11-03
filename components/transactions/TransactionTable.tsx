import React from 'react';
import { Transaction } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { CounterpartyAvatar } from './TransactionRow';
import { STATUS_BADGES, TransactionDisplay, amountClassName, formatMoney, timeLabel } from './transactionDisplay';

interface TransactionTableProps {
  rows: { tx: Transaction; display: TransactionDisplay }[];
  selectedId: string | null;
  onOpen: (id: string) => void;
}

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const th = 'px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400';
const td = 'px-4 py-3 align-middle';

/** Desktop history: one row per transaction, date and time together in the first column. */
export const TransactionTable = ({ rows, selectedId, onOpen }: TransactionTableProps) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] text-sm">
      <thead className="bg-gray-50 dark:bg-white/[0.03] border-b border-gray-200 dark:border-darkBorder-light">
        <tr>
          <th scope="col" className={cn(th, 'w-36')}>Date</th>
          <th scope="col" className={th}>Description</th>
          <th scope="col" className={cn(th, 'w-40')}>Reference</th>
          <th scope="col" className={cn(th, 'w-40 text-right')}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ tx, display }) => {
          const badge = tx.status !== 'completed' ? STATUS_BADGES[tx.status] : undefined;
          const currency = tx.currency || 'RWF';
          return (
            <tr
              key={tx.id}
              onClick={() => onOpen(tx.id)}
              aria-selected={tx.id === selectedId}
              className={cn(
                'cursor-pointer border-t border-gray-100 dark:border-darkBorder-light first:border-t-0 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]',
                tx.id === selectedId && 'bg-green-50 dark:bg-brand-gold/10',
              )}
            >
              <td className={cn(td, 'whitespace-nowrap')}>
                <div className="text-gray-900 dark:text-gray-100">{dateLabel(tx.createdAt)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{timeLabel(tx.createdAt)}</div>
              </td>
              <td className={td}>
                <div className="flex items-center gap-3 min-w-0">
                  <CounterpartyAvatar display={display} />
                  <div className="min-w-0">
                    {/* The real control for keyboard and screen-reader users; the row click is a mouse shortcut. */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpen(tx.id); }}
                      className="block max-w-full truncate text-left font-medium text-gray-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green rounded dark:text-white dark:focus-visible:ring-brand-gold"
                    >
                      {display.name}
                    </button>
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {[display.label, display.note].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
              </td>
              <td className={cn(td, 'font-mono text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap')}>
                {display.isSplit ? `${tx.splitBill?.paymentsCount ?? ''} payments`.trim() : tx.referenceId}
              </td>
              <td className={cn(td, 'text-right whitespace-nowrap')}>
                <div className={cn('font-semibold', amountClassName(display))}>
                  {display.sign === '-' ? '−' : display.sign}{currency} {formatMoney(display.displayAmount)}
                </div>
                {/* Completed is the norm, so only flag the rows that need attention. */}
                {badge && (
                  <span className={cn('mt-0.5 inline-block rounded-md px-1.5 py-px text-[11px] font-semibold', badge.className)}>{badge.label}</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
