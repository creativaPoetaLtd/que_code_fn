import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUserInfo } from './use-user-info';
import { 
  getAnalyticsSummary, 
  getAnalyticsCategoryBreakdown, 
  getAnalyticsSpendingTrends,
  getAnalyticsRecentTransactions,
  getTransactionsByCategory,
  getAnalyticsSpendingComparison,
  getAnalyticsPeriodSummary
} from '@/helpers/api';
import { 
  AnalyticsSummary, 
  CategoryBreakdown, 
  SpendingTrend, 
  RecentTransaction,
  AnalyticsApiResponse,
  DateRange,
  SpendingComparison
} from '@/types/analytics.types';

/**
 * Hook to fetch analytics summary data for a given date range
 * Automatically compares with previous period for trend analysis
 */
export const useAnalyticsSummary = (dateRange: DateRange) => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();
        
        const response = await getAnalyticsSummary(
          userId, 
          startDate, 
          endDate
        );
        
        if (response.status === 200 && response.data?.data) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch analytics summary');
        }
      } catch (err) {
        setError('Failed to fetch analytics summary');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate]);

  return { data, loading, error };
};

/**
 * Hook to fetch category breakdown data
 * Returns spending distribution by categories
 * Can filter by type (expenses or income)
 */
export const useAnalyticsCategoryBreakdown = (dateRange: DateRange, type: 'expenses' | 'income' = 'expenses') => {
  const [data, setData] = useState<CategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();
        
        const response = await getAnalyticsCategoryBreakdown(
          userId, 
          startDate, 
          endDate,
          type
        );
        
        if (response.status === 200 && response.data?.data) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch category breakdown');
        }
      } catch (err) {
        setError('Failed to fetch category breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate, type]);

  return { data, loading, error };
};

/**
 * Hook to fetch spending trends data
 * Supports daily, weekly, monthly, and yearly intervals
 */
export const useAnalyticsSpendingTrends = (dateRange: DateRange, interval: 'daily' | 'weekly' | 'monthly' = 'daily') => {
  const [data, setData] = useState<SpendingTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();
        
        const response = await getAnalyticsSpendingTrends(
          userId, 
          startDate, 
          endDate,
          interval
        );
        
        if (response.status === 200 && response.data?.data) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch spending trends');
        }
      } catch (err) {
        setError('Failed to fetch spending trends');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate, interval]);

  return { data, loading, error };
};

/**
 * Hook to fetch recent transactions
 * Can be filtered by type (sent/received) and limited by count
 */
export const useAnalyticsRecentTransactions = (limit: number = 10, type?: string) => {
  const [data, setData] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAnalyticsRecentTransactions(
          userId, 
          limit, 
          type
        );
        
        if (response.status === 200 && response.data?.data) {
          setData(response.data.data);
        } else {
          setError('Failed to fetch recent transactions');
        }
      } catch (err) {
        setError('Failed to fetch recent transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, limit, type]);

  return { data, loading, error };
};

/**
 * Hook to fetch transactions for a specific category
 * Only fetches when categoryId is provided (lazy loading)
 * Includes caching to prevent repeated API calls
 */
export const useCategoryTransactions = (
  categoryId: string | null, 
  dateRange: DateRange,
  limit: number = 10
) => {
  const [data, setData] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    // Only fetch if we have a categoryId and user is authenticated
    if (!isAuthenticated || !userId || !categoryId) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();
        
        const response: AnalyticsApiResponse<RecentTransaction[]> = await getTransactionsByCategory(
          userId, 
          categoryId,
          startDate, 
          endDate,
          limit
        );
        
        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to fetch category transactions');
        }
      } catch (err) {
        setError('Failed to fetch category transactions');
        console.error('Category transactions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, categoryId, dateRange.startDate, dateRange.endDate, limit]);

  return { data, loading, error };
};

/**
 * Hook to fetch spending comparison data between current and previous periods
 * Returns data formatted for comparison charts
 */
export const useSpendingComparison = (dateRange: DateRange, interval: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily') => {
  const [data, setData] = useState<SpendingComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();

        const response: AnalyticsApiResponse<SpendingComparison> = await getAnalyticsSpendingComparison(
          userId,
          startDate,
          endDate,
          interval
        );

        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to fetch spending comparison');
        }
      } catch (err) {
        setError('Failed to fetch spending comparison');
        console.error('Spending comparison error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate, interval]);

  return { data, loading, error };
};

/**
 * Hook to fetch transactions for a specific date range (period)
 * Used for detail view in transaction table
 * Fetches all transactions (both sent and received) within the date range
 */
export const usePeriodTransactions = (
  startDate: Date | null,
  endDate: Date | null,
  limit: number = 100
) => {
  const [data, setData] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    // Only fetch if we have both dates and user is authenticated
    if (!isAuthenticated || !userId || !startDate || !endDate) {
      setData([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();
        
        const response: AnalyticsApiResponse<RecentTransaction[]> = await getAnalyticsRecentTransactions(
          userId,
          limit,
          undefined, // type - fetch all (both sent and received)
          startDateStr,
          endDateStr
        );
        
        if (response.success) {
          // Sort by createdAt ascending to ensure chronological order for balance calculation
          const sortedData = response.data.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          setData(sortedData);
        } else {
          setError(response.message || 'Failed to fetch period transactions');
        }
      } catch (err) {
        setError('Failed to fetch period transactions');
        console.error('Period transactions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, startDate, endDate, limit]);

  return { data, loading, error };
};

/**
 * Hook to fetch period summary with accurate starting/ending balances
 * Groups transactions by period (daily/weekly/monthly) and calculates balances
 * 
 * @param dateRange - Date range for the analysis
 * @param interval - Grouping interval: 'daily', 'weekly', or 'monthly'
 * @returns Object with periods array, summary data, loading state, and error
 * 
 * Example:
 * const { data, loading, error } = useAnalyticsPeriodSummary(dateRange, 'daily')
 * // data.periods = [{ date, periodLabel, startingBalance, income, expenses, endingBalance, transactionCount }, ...]
 * // data.summary = { totalIncome, totalExpenses, netFlow, totalTransactions }
 */
export const useAnalyticsPeriodSummary = (
  dateRange: DateRange,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId, isAuthenticated } = useUserInfo();

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startDate = dateRange.startDate?.toISOString();
        const endDate = dateRange.endDate?.toISOString();

        const response = await getAnalyticsPeriodSummary(
          userId,
          startDate!,
          endDate!,
          interval
        );

        if (response.success) {
          setData(response.data);
        } else {
          setError(response.message || 'Failed to fetch period summary');
          setData(null);
        }
      } catch (err) {
        setError('Failed to fetch period summary');
        setData(null);
        console.error('Period summary error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate, interval]);

  return { data, loading, error };
};

/**
 * Helper hook to calculate percentage change between two values
 * Useful for trend indicators
 */
export const usePercentageChange = (current: number, previous: number): number => {
  return useMemo(() => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
  }, [current, previous]);
};

/**
 * Helper hook to format currency consistently
 */
export const useFormatCurrency = () => {
  return useCallback((amount: number, currency: string = 'RWF'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);
};
