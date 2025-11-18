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
  status: 'completed' | 'pending' | 'failed';
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
    firstName?: string;
    lastName?: string;
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
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  accountType?: string;
}

export interface ComparisonData {
  label: string;
  current: number;
  previous: number;
}

export interface ViewType {
  value: 'daily' | 'weekly' | 'monthly' | 'yearly';
  label: string;
}

export interface AnalyticsState {
  dateRange: DateRange;
  interval: 'daily' | 'weekly' | 'monthly';
  activeView: 'daily' | 'weekly' | 'monthly' | 'yearly';
  accountType: string;
}

export interface SpendingComparisonDataPoint {
  label: string;
  amount: number;
}

export interface SpendingPeriod {
  data: SpendingComparisonDataPoint[];
  total: number;
}

export interface PeriodInfo {
  current: {
    startDate: string;
    endDate: string;
  };
  previous: {
    startDate: string;
    endDate: string;
  };
  interval: string;
}

export interface SpendingComparison {
  currentPeriod: SpendingPeriod;
  previousPeriod: SpendingPeriod;
  percentageChange: number;
  periodInfo: PeriodInfo;
}
