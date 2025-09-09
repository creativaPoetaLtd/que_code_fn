export interface AnalyticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  currentBalance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface SpendingTrend {
  date: string;
  totalSpent: number;
  totalReceived: number;
  spentCount: number;
  receivedCount: number;
  netFlow: number;
}

export interface RecentTransaction {
  id: string;
  referenceId: string;
  amount: number;
  type: 'sent' | 'received';
  status: string;
  description: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    description: string;
  } | null;
  otherParty: {
    walletId: string;
    userId: string;
  };
}

export interface AnalyticsApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface AnalyticsFilters {
  dateRange: DateRange;
  interval: 'daily' | 'weekly' | 'monthly';
}
