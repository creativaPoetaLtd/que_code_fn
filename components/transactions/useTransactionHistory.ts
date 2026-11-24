import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { getTransactionHistory, TransactionHistoryKind } from '@/helpers/api';
import { useAuthToken } from '@/hooks/use-auth-token';
import { Transaction } from '@/types/dashboard';
import { describeTransaction } from './transactionDisplay';

export type DatePreset = 'all' | 'today' | '7d' | '30d' | 'month' | 'custom';

export interface HistoryFilters {
  search: string;
  kind?: TransactionHistoryKind;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  datePreset: DatePreset;
  /** YYYY-MM-DD, local days, used when datePreset is 'custom'. */
  customStart?: string;
  customEnd?: string;
  contactId?: string;
}

export const EMPTY_FILTERS: HistoryFilters = { search: '', datePreset: 'all' };

export interface HistorySummary {
  count: number;
  totalIn: number;
  totalOut: number;
}

const localDay = (ymd: string, endOfDay: boolean) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
};

/** Turns a preset into ISO bounds for the user's local days. */
export const dateRangeFor = (filters: HistoryFilters): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86_400_000).toISOString();
  switch (filters.datePreset) {
    case 'today':
      return { startDate: today.toISOString() };
    case '7d':
      return { startDate: daysAgo(6) };
    case '30d':
      return { startDate: daysAgo(29) };
    case 'month':
      return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
    case 'custom':
      return {
        startDate: filters.customStart ? localDay(filters.customStart, false).toISOString() : undefined,
        endDate: filters.customEnd ? localDay(filters.customEnd, true).toISOString() : undefined,
      };
    default:
      return {};
  }
};

export const activeFilterCount = (f: HistoryFilters) =>
  [f.kind, f.status, f.contactId, f.datePreset !== 'all' ? f.datePreset : undefined].filter(Boolean).length;

const toQuery = (filters: HistoryFilters, search: string) => ({
  search: search || undefined,
  kind: filters.kind,
  status: filters.status,
  contactId: filters.contactId,
  ...dateRangeFor(filters),
});

const errorMessage = (err: unknown) => {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { message?: string } | undefined)?.message;
    if (err.response?.status === 400 && message) return message;
  }
  return 'We couldn’t load your transactions.';
};

/**
 * The signed-in account's id (user or organization). useAuthToken fills its token in after
 * mount, so this is null on the first render and must be read every render, not memoized once.
 * It also redirects to login on its own when the session is really gone.
 */
export const useOwnerId = () => {
  const { getUserId } = useAuthToken();
  return getUserId();
};

/**
 * Loads one page of history per filter change. Changing filters goes back to page 1 in the
 * same request, and an in-flight request is aborted when a newer one starts. With `append`,
 * later pages are added below the earlier ones ("Load more") instead of replacing them.
 */
export const useTransactionHistory = ({
  filters,
  pageSize,
  append,
}: {
  filters: HistoryFilters;
  pageSize: number;
  append: boolean;
}) => {
  const ownerId = useOwnerId();
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search.trim());
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(filters.search.trim()), 350);
    return () => clearTimeout(handle);
  }, [filters.search]);

  const query = useMemo(() => toQuery(filters, debouncedSearch), [filters, debouncedSearch]);
  const queryKey = `${JSON.stringify(query)}|${pageSize}|${append}`;

  const [request, setRequest] = useState({ key: queryKey, page: 1 });
  const page = request.key === queryKey ? request.page : 1;
  const [reloadToken, setReloadToken] = useState(0);

  const [items, setItems] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // No id yet: the token is still loading (or useAuthToken is redirecting to login).
    if (!ownerId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getTransactionHistory(ownerId, { ...query, page, limit: pageSize }, { signal: controller.signal })
      .then((response) => {
        const data = response?.data;
        const rows: Transaction[] = data?.transactions || [];
        setItems((prev) => (append && page > 1 ? [...prev, ...rows] : rows));
        setSummary(data?.summary ?? null);
        setTotal(Number(data?.pagination?.total) || 0);
        setTotalPages(Math.max(1, Number(data?.pagination?.totalPages) || 1));
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        console.error('Transaction history fetch failed:', err);
        setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // queryKey stands in for query, pageSize and append.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, queryKey, page, reloadToken]);

  const setPage = useCallback((next: number) => setRequest({ key: queryKey, page: next }), [queryKey]);
  const retry = useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    ownerId,
    items,
    summary,
    page,
    total,
    totalPages,
    setPage,
    loading,
    /** First load for this filter set, as opposed to fetching the next page. */
    initialLoading: loading && (page === 1 || !append),
    error,
    retry,
    query,
  };
};

const EXPORT_PAGE_SIZE = 500;
const EXPORT_MAX_PAGES = 20;

/** Exports every row matching the filters, not just the page on screen. */
export const exportTransactions = async (
  ownerId: string,
  query: ReturnType<typeof toQuery>,
  format: 'csv' | 'xlsx',
) => {
  const rows: Transaction[] = [];
  for (let page = 1; page <= EXPORT_MAX_PAGES; page++) {
    const response = await getTransactionHistory(ownerId, { ...query, page, limit: EXPORT_PAGE_SIZE });
    rows.push(...(response?.data?.transactions || []));
    if (page >= (Number(response?.data?.pagination?.totalPages) || 1)) break;
  }

  const data = rows.map((tx) => {
    const d = describeTransaction(tx, ownerId);
    return {
      Date: new Date(tx.createdAt).toLocaleString(),
      Reference: tx.referenceId,
      Name: d.name,
      Type: d.label,
      Status: tx.status,
      Amount: Number(tx.amount) || 0,
      Fee: d.isSplit ? 0 : Number(tx.fee) || 0,
      // Signed change to this wallet: fee included once, covered shares and unsettled rows as 0.
      'Balance change': d.balanceChange,
      Note: d.isCovered ? `Covered by someone else: ${tx.description || ''}`.trim() : d.note,
    };
  });

  const sheet = XLSX.utils.json_to_sheet(data);
  sheet['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 24 }, { wch: 14 }, { wch: 11 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 32 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Transactions');
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `transactions-${stamp}.${format}`, { bookType: format });
  return rows.length;
};
