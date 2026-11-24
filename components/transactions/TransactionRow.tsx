import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Target, Users } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { Transaction } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { STATUS_BADGES, TransactionDisplay, amountClassName, formatMoney, timeLabel } from './transactionDisplay';

const AVATAR_SIZES = { md: 'h-9 w-9', lg: 'h-12 w-12' };

/**
 * People get their photo or initials, organizations a rounded square, and rows with no
 * profile behind them (groups, campaigns, split bills, deposits) an icon.
 */
export const CounterpartyAvatar = ({ display, size = 'md' }: { display: TransactionDisplay; size?: 'md' | 'lg' }) => {
  const box = AVATAR_SIZES[size];
  const iconSize = size === 'lg' ? 20 : 16;

  if (display.counterpartyType === 'user' || display.counterpartyType === 'organization') {
    const [firstName, ...rest] = display.name.split(' ');
    return (
      <UserAvatar
        profileImage={display.profileImage}
        firstName={firstName}
        lastName={rest.join(' ')}
        userType={display.counterpartyType}
        disableClick
        className={cn(box, 'shrink-0', display.counterpartyType === 'organization' && 'rounded-xl')}
      />
    );
  }

  const Icon =
    display.counterpartyType === 'campaign'
      ? Target
      : display.counterpartyType === 'group'
        ? Users
        : display.label === 'Withdrawal'
          ? ArrowUpFromLine
          : ArrowDownToLine;

  return (
    <span
      aria-hidden="true"
      className={cn(
        box,
        'shrink-0 overflow-hidden rounded-full flex items-center justify-center',
        display.counterpartyType === 'system'
          ? 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'
          : 'bg-brand-green/10 text-[#0A7A16] dark:bg-brand-gold/15 dark:text-brand-gold',
      )}
    >
      {display.profileImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={display.profileImage} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon size={iconSize} />
      )}
    </span>
  );
};

interface TransactionRowProps {
  transaction: Transaction;
  display: TransactionDisplay;
  selected?: boolean;
  onOpen: () => void;
}

/** List row for phones and narrow cards, grouped under day headings by the caller. */
export const TransactionRow = ({ transaction, display, selected, onOpen }: TransactionRowProps) => {
  const badge = transaction.status !== 'completed' ? STATUS_BADGES[transaction.status] : undefined;
  const subline = [display.label, timeLabel(transaction.createdAt), display.note].filter(Boolean).join(' · ');
  const currency = transaction.currency || 'RWF';
  const amount = `${display.sign === '-' ? '−' : display.sign}${formatMoney(display.displayAmount)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={selected ? 'true' : undefined}
      aria-label={`${display.name}, ${subline}, ${amount} ${currency}${badge ? `, ${badge.label}` : ''}`}
      className={cn(
        'flex w-full items-center gap-3 px-3.5 md:px-4 py-2.5 min-h-[60px] text-left border-t border-gray-100 dark:border-darkBorder-light transition-colors',
        'hover:bg-gray-50 dark:hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green dark:focus-visible:ring-brand-gold',
        selected && 'bg-green-50 dark:bg-brand-gold/10',
      )}
    >
      <CounterpartyAvatar display={display} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">{display.name}</span>
        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{subline}</span>
      </span>

      <span className="text-right shrink-0">
        <span className={cn('block whitespace-nowrap text-sm font-semibold', amountClassName(display))}>{amount}</span>
        {badge && (
          <span className={cn('mt-0.5 inline-block rounded px-1.5 py-px text-[11px] font-semibold', badge.className)}>{badge.label}</span>
        )}
      </span>
    </button>
  );
};
