export interface Transaction {
  id: string;
  senderId: string;
  receiverId: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  amount: number;
  fee: number;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  processedAt?: string;
  // Legacy fields for backward compatibility
  name?: string;
  date?: string;
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
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