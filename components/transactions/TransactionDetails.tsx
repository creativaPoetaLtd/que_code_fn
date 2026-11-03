import React, { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Copy, MessageCircle, Send, X } from 'lucide-react';
import { Transaction } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { CounterpartyAvatar } from './TransactionRow';
import {
  STATUS_BADGES,
  TransactionDisplay,
  amountClassName,
  canMessage,
  canSendAgain,
  formatMoney,
} from './transactionDisplay';

interface TransactionDetailsProps {
  transaction: Transaction | null;
  display: TransactionDisplay | null;
  onClose: () => void;
  onSendAgain: (tx: Transaction, d: TransactionDisplay) => void;
  onMessage: (d: TransactionDisplay) => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex justify-between gap-3 py-2.5 border-t border-gray-100 dark:border-darkBorder-light text-sm">
    <dt className="text-gray-500 dark:text-gray-400 shrink-0">{label}</dt>
    <dd className="font-medium text-gray-900 dark:text-gray-100 text-right min-w-0 break-words">{children}</dd>
  </div>
);

const CopyReference = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable (insecure context); the reference is still selectable.
    }
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono">
      <span className="break-all">{value}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Reference copied' : 'Copy reference'}
        className="p-1 -m-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </span>
  );
};

/** Bottom sheet on phones, right-hand panel from md up. */
export const TransactionDetails = ({ transaction, display, onClose, onSendAgain, onMessage }: TransactionDetailsProps) => {
  const open = !!transaction && !!display;
  const badge = transaction ? STATUS_BADGES[transaction.status] : undefined;
  const directionLabel = display?.isOutgoing ? 'Sent to' : display?.label === 'Deposit' ? 'Deposit from' : 'Received from';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex flex-col bg-white dark:bg-darkBg-card shadow-xl focus:outline-none',
            'inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl px-5 pt-2 pb-6',
            'md:inset-x-auto md:right-0 md:top-0 md:bottom-0 md:max-h-none md:w-[380px] md:rounded-none md:border-l md:border-gray-200 md:dark:border-darkBorder-light md:pt-5',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom md:data-[state=closed]:slide-out-to-right md:data-[state=open]:slide-in-from-right',
          )}
        >
          {transaction && display && (
            <>
              <div className="md:hidden mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
              <div className="flex items-center justify-between">
                <DialogPrimitive.Title className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  Transaction details
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </DialogPrimitive.Close>
              </div>

              <div className="overflow-y-auto -mx-5 px-5">
                <div className="flex flex-col items-center gap-1.5 pt-2 pb-4 text-center">
                  <CounterpartyAvatar display={display} size="lg" />
                  <DialogPrimitive.Description className="text-sm font-medium text-gray-900 dark:text-white">
                    {display.counterpartyType === 'system' ? display.name : `${directionLabel} ${display.name}`}
                  </DialogPrimitive.Description>
                  <p className={cn('text-[28px] leading-tight font-bold', amountClassName(display))}>
                    {display.sign === '-' ? '−' : display.sign}
                    {transaction.currency || 'RWF'} {formatMoney(display.displayAmount)}
                  </p>
                  {badge && (
                    <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', badge.className)}>{badge.label}</span>
                  )}
                </div>

                <dl>
                  <Row label="Date">
                    {new Date(transaction.createdAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
                    })}
                  </Row>
                  <Row label="Type">{display.label}</Row>
                  <Row label="Reference"><CopyReference value={transaction.referenceId} /></Row>
                  <Row label="Amount">{transaction.currency || 'RWF'} {formatMoney(Number(transaction.amount) || 0)}</Row>
                  {display.isOutgoing && (
                    <>
                      <Row label="Fee">{transaction.currency || 'RWF'} {formatMoney(Number(transaction.fee) || 0)}</Row>
                      <Row label="Total">{transaction.currency || 'RWF'} {formatMoney(display.displayAmount)}</Row>
                    </>
                  )}
                  {display.note && <Row label="Note">{display.note}</Row>}
                  {transaction.category?.name && <Row label="Category">{transaction.category.name}</Row>}
                </dl>
              </div>

              {(canSendAgain(display) || canMessage(display)) && (
                <div className="mt-4 flex gap-2 md:mt-auto md:pt-4">
                  {canSendAgain(display) && (
                    <button
                      type="button"
                      onClick={() => onSendAgain(transaction, display)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0A7A16] text-sm font-semibold text-white hover:bg-[#086512] dark:bg-brand-gold dark:text-[#00313A] dark:hover:bg-brand-goldHover"
                    >
                      <Send className="h-4 w-4" /> Send again
                    </button>
                  )}
                  {canMessage(display) && (
                    <button
                      type="button"
                      onClick={() => onMessage(display)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-darkBorder-medium dark:text-white dark:hover:bg-white/5"
                    >
                      <MessageCircle className="h-4 w-4" /> Message
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
