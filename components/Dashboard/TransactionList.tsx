import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ChevronDown, Download, Loader2, ReceiptText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types/dashboard';
import SplitBillHistoryDialog from '@/components/bills/SplitBillHistoryDialog';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionDetails } from '@/components/transactions/TransactionDetails';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import {
  EMPTY_FILTERS,
  HistoryFilters,
  activeFilterCount,
  exportTransactions,
  useTransactionHistory,
} from '@/components/transactions/useTransactionHistory';
import { TransactionDisplay, describeTransaction, formatMoney, groupByDay } from '@/components/transactions/transactionDisplay';

interface TransactionListProps {
  /** Left side of the title row (back button, page title). Full variant only. */
  heading?: React.ReactNode;
  /** A short "recent activity" card with a link to the full page, no filters. */
  compact?: boolean;
}

const useIsDesktop = () => {
  // Read it up front so desktop doesn't fetch once as "mobile" and again after mount.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return isDesktop;
};

const SkeletonRows = ({ count }: { count: number }) => (
  <div aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 dark:border-darkBorder-light first:border-t-0">
        <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-36 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
          <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
        </div>
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
      </div>
    ))}
  </div>
);

const StateMessage = ({ icon, title, body, action }: { icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400">{icon}</span>
    <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
    {body && <p className="max-w-xs text-sm text-gray-500 dark:text-gray-400">{body}</p>}
    {action}
  </div>
);

const PAGE_SIZE = 10;
const COMPACT_PAGE_SIZE = 6;

const secondaryButton =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-[13px] font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-darkBorder-medium dark:bg-darkBg-card dark:text-white dark:hover:bg-white/5';

const TransactionListInner = ({ heading, compact = false }: TransactionListProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  const [filters, setFilters] = useState<HistoryFilters>(EMPTY_FILTERS);
  const history = useTransactionHistory({
    filters: compact ? EMPTY_FILTERS : filters,
    pageSize: compact ? COMPACT_PAGE_SIZE : PAGE_SIZE,
    append: !compact && !isDesktop,
  });
  const { ownerId, items, summary } = history;

  const [openId, setOpenId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const rows = useMemo(
    () => items.map((tx) => ({ tx, display: describeTransaction(tx, ownerId) })),
    [items, ownerId],
  );
  const groups = useMemo(() => groupByDay(rows.map((r) => ({ ...r, createdAt: r.tx.createdAt }))), [rows]);
  const open = rows.find((r) => r.tx.id === openId) || null;

  // Deep link: ?transactionId=… opens that row once it is on screen, then drops the param.
  const linkedId = searchParams.get('transactionId');
  useEffect(() => {
    if (!linkedId || !rows.some((r) => r.tx.id === linkedId)) return;
    setOpenId(linkedId);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('transactionId');
    router.replace(params.toString() ? `${pathname}?${params}` : pathname, { scroll: false });
  }, [linkedId, rows, searchParams, pathname, router]);

  const handleSendAgain = (tx: Transaction, d: TransactionDisplay) => {
    const isOrganization = d.counterpartyType === 'organization';
    sessionStorage.setItem(
      'selectedRecipient',
      JSON.stringify({
        id: isOrganization ? d.counterpartyOrganizationId : d.counterpartyUserId,
        name: d.name,
        phone: '',
        avatar: d.profileImage || '',
        type: isOrganization ? 'organization' : 'user',
      }),
    );
    sessionStorage.setItem('initialAmount', String(Number(tx.amount) || 0));
    router.push('/home/transfer/amount');
  };

  const handleMessage = (d: TransactionDisplay) => router.push(`/chat?userId=${d.counterpartyUserId}`);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!ownerId) return;
    setExporting(true);
    try {
      const count = await exportTransactions(ownerId, history.query, format);
      toast({ title: `Exported ${count} transaction${count === 1 ? '' : 's'}` });
    } catch (err) {
      console.error('Transaction export failed:', err);
      toast({ title: 'Export failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const filtered = activeFilterCount(filters) > 0 || filters.search.trim() !== '';
  const firstRow = (history.page - 1) * PAGE_SIZE + 1;
  const lastRow = Math.min(history.page * PAGE_SIZE, history.total);

  const list = (
    <>
      {history.initialLoading ? (
        <SkeletonRows count={compact ? 4 : 6} />
      ) : history.error ? (
        <StateMessage
          icon={<AlertCircle className="h-5 w-5" />}
          title="Something went wrong"
          body={history.error}
          action={<button type="button" onClick={history.retry} className={`${secondaryButton} mt-2`}>Try again</button>}
        />
      ) : rows.length === 0 ? (
        <StateMessage
          icon={<ReceiptText className="h-5 w-5" />}
          title={filtered ? 'Nothing matches these filters' : 'No transactions yet'}
          body={filtered ? 'Try a different search or clear some filters.' : 'Money you send and receive will show up here.'}
          action={
            filtered ? (
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={`${secondaryButton} mt-2`}>Clear filters</button>
            ) : undefined
          }
        />
      ) : (
        <>
        {!compact && (
          <div className="hidden md:block">
            <TransactionTable rows={rows} selectedId={openId} onOpen={setOpenId} />
          </div>
        )}
        <div className={compact ? undefined : 'md:hidden'}>
        {groups.map((group, gi) => (
          <section key={`${group.label}-${gi}`} aria-label={group.label}>
            <h3 className={`bg-gray-50 px-3.5 md:px-4 pb-1.5 pt-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/[0.02] dark:text-gray-400 ${gi === 0 ? '' : 'border-t border-gray-100 dark:border-darkBorder-light'}`}>
              {group.label}
            </h3>
            {group.items.map(({ tx, display }) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                display={display}
                selected={tx.id === openId}
                onOpen={() => setOpenId(tx.id)}
              />
            ))}
          </section>
        ))}
        </div>
        </>
      )}
    </>
  );

  const details = (
    <>
      {open?.display.isSplit && <SplitBillHistoryDialog transaction={open.tx} onClose={() => setOpenId(null)} />}
      <TransactionDetails
        transaction={open && !open.display.isSplit ? open.tx : null}
        display={open && !open.display.isSplit ? open.display : null}
        onClose={() => setOpenId(null)}
        onSendAgain={handleSendAgain}
        onMessage={handleMessage}
      />
    </>
  );

  if (compact) {
    return (
      <Card className="overflow-hidden border border-gray-200 bg-white p-0 dark:border-darkBorder-light dark:bg-darkBg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Recent transactions</h2>
          <Link href="/transactions" className="text-[13px] font-medium text-[#0A7A16] hover:underline dark:text-brand-gold">View all</Link>
        </div>
        {list}
        {details}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">{heading}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={secondaryButton} disabled={exporting || !ownerId} aria-label="Export transactions">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="hidden sm:block h-3.5 w-3.5 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs font-normal text-gray-500 dark:text-gray-400">
              {filtered ? 'Everything matching your filters' : 'Your whole history'}
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => handleExport('csv')}>Download CSV</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExport('xlsx')}>Download Excel (.xlsx)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionFilters filters={filters} onChange={setFilters} />

      {summary && !history.error && (
        <p className="text-xs md:text-[13px] text-gray-600 dark:text-gray-400" aria-live="polite">
          {summary.count.toLocaleString()} transaction{summary.count === 1 ? '' : 's'}
          {summary.count > 0 && (
            <>
              {' · In '}<b className="font-semibold text-green-700 dark:text-green-400">+RWF {formatMoney(summary.totalIn)}</b>
              {' · Out '}<b className="font-semibold text-gray-900 dark:text-white">−RWF {formatMoney(summary.totalOut)}</b>
            </>
          )}
        </p>
      )}

      <Card className="overflow-hidden border border-gray-200 bg-white p-0 dark:border-darkBorder-light dark:bg-darkBg-card">
        <div aria-busy={history.loading}>{list}</div>

        {!history.initialLoading && !history.error && rows.length > 0 && (
          <>
            {/* Desktop: pages */}
            <div className="hidden md:flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-2.5 dark:border-darkBorder-light">
              <span className="text-[13px] text-gray-500 dark:text-gray-400">
                {firstRow}–{lastRow} of {history.total.toLocaleString()}
              </span>
              <div className="flex gap-1.5">
                <button type="button" className={`${secondaryButton} h-8`} disabled={history.page <= 1 || history.loading} onClick={() => history.setPage(history.page - 1)}>
                  Previous
                </button>
                <button type="button" className={`${secondaryButton} h-8`} disabled={history.page >= history.totalPages || history.loading} onClick={() => history.setPage(history.page + 1)}>
                  Next
                </button>
              </div>
            </div>
            {/* Phone: load more */}
            {history.page < history.totalPages && (
              <div className="md:hidden border-t border-gray-200 p-3 dark:border-darkBorder-light">
                <button type="button" className={`${secondaryButton} h-11 w-full`} disabled={history.loading} onClick={() => history.setPage(history.page + 1)}>
                  {history.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {details}
    </div>
  );
};

export const TransactionList = (props: TransactionListProps) => (
  <Suspense fallback={null}>
    <TransactionListInner {...props} />
  </Suspense>
);
