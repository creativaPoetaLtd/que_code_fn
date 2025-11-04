import { useEffect, useState } from 'react';
import { useUserInfo } from './use-user-info';
import { 
  getAnalyticsSummary, 
  getAnalyticsCategoryBreakdown, 
  getAnalyticsSpendingTrends,
  getAnalyticsRecentTransactions 
} from '@/helpers/api';
import { 
  AnalyticsSummary, 
  CategoryBreakdown, 
  SpendingTrend, 
  RecentTransaction,
  DateRange 
} from '@/types/analytics.types';

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
        
        if (response.status === 200 && response.data) {
          setData(response.data);
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

export const useAnalyticsCategoryBreakdown = (dateRange: DateRange) => {
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
          endDate
        );
        
        if (response.status === 200 && response.data) {
          setData(response.data);
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
  }, [userId, isAuthenticated, dateRange.startDate, dateRange.endDate]);

  return { data, loading, error };
};

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
        
        if (response.status === 200 && response.data) {
          setData(response.data);
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
        
        if (response.status === 200 && response.data) {
          setData(response.data);
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
