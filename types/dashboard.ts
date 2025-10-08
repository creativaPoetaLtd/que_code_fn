export interface Transaction {
  id: string;
  referenceId: string;
  amount: number;
  fee: number;
  totalAmount: number;
  currency: string;
  status: string;
  type: string;
  description: string;
  categoryId?: string;
  spendConstraintType: string;
  constraintCategoryId?: string;
  hasAccount: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    description: string;
  };
  senderWallet: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    currency: string;
  };
  receiverWallet: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    currency: string;
  };
  // Legacy fields for backward compatibility
  senderId?: string;
  receiverId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  processedAt?: string;
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

// Wallet Types
export interface Wallet {
  id: string;
  userId?: string;
  organizationId?: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletRestriction {
  id: string;
  walletId: string;
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction Category Types
export interface TransactionCategory {
  id: string;
  name: string;
  description: string;
  isRestricted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transfer Request Types
export interface TransferRequest {
  senderUserId?: string;
  senderOrganizationId?: string;
  receiverUserId?: string;
  receiverOrganizationId?: string;
  amount: number;
  description?: string;
  categoryId?: string;
  type?: string;
  applyConstraints?: boolean;
}

// Transfer Response Types
export interface TransferResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    referenceId: string;
    amount: number;
    fee: number;
    totalAmount: number;
    senderBalance: number;
    senderUserId: string | null;
    senderOrganizationId: string | null;
    receiverUserId: string | null;
    receiverOrganizationId: string | null;
    description: string;
    categoryId: string | null;
    spendConstraintType: string;
    constraintCategoryId: string | null;
    constraintsApplied: boolean;
    status: string;
  };
}