export interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  status: string;
}

export interface AnalyticsData {
  name: string;
  income: number;
  expense: number;
}


export interface ExpenseData {
  name: string;
  value: number;
  color: string;
}

export interface StatCardProps {
  title: string;
  amount: string;
  percentage: number;
  type: 'income' | 'outcome';
}