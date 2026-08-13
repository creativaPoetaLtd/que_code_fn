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
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      profile?: {
        profileImage: string;
      };
    } | null;
    organization?: {
      id: string;
      name: string;
      email: string;
      profile?: {
        profileImage: string;
      };
    } | null;
    group?: {
      id: string;
      name: string;
      profilePictureUrl?: string | null;
    } | null;
    publicContribution?: {
      id: string;
      title: string;
    } | null;
  };
  receiverWallet: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    currency: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      profile?: {
        profileImage: string;
      };
    } | null;
    organization?: {
      id: string;
      name: string;
      email: string;
      profile?: {
        profileImage: string;
      };
    } | null;
    group?: {
      id: string;
      name: string;
      profilePictureUrl?: string | null;
    } | null;
    publicContribution?: {
      id: string;
      title: string;
    } | null;
  };
  // Legacy fields for backward compatibility
  senderId?: string;
  receiverId?: string;
  senderSubActionId?: string;
  senderWalletId?: string;
  receiverWalletId?: string;
  resolvedReceiverWalletId?: string;
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

// A person/organization eligible as a rule sender (recent sender or contact)
export interface IncomingSender {
  senderWalletId: string;
  type: 'user' | 'organization';
  userId: string | null;
  organizationId: string | null;
  name: string;
  source?: 'recent' | 'contact';
}

// Receiver-driven rule: money from senderWalletId is auto-filed into a category
export interface WalletIncomingRule {
  id: string;
  walletId: string;
  senderWalletId: string;
  categoryId: string;
  cap: number | null;
  restrictedTotal: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string; description?: string | null };
  senderWallet?: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    user?: { id: string; firstName?: string; lastName?: string } | null;
    organization?: { id: string; name?: string } | null;
  };
}

// Wallet page ("items wallet") types
export type WalletItemType =
  | 'voucher'
  | 'pass'
  | 'saved_action'
  | 'custom_card'
  | 'transferred_item'
  | 'action_purchase_ref';

export type WalletItemStatus = 'active' | 'used' | 'expired' | 'archived';

export interface WalletItem {
  id: string;
  walletId: string;
  itemType: WalletItemType;
  referenceId?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, any>;
  status: WalletItemStatus;
  isPinned: boolean;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WalletPurchase {
  id: string;
  actionId: string;
  subActionId: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  buyerData?: Record<string, any>;
  createdAt: string;
  action?: {
    id: string;
    name: string;
    type: string;
    coverImage: string | null;
    currency: string;
  } | null;
  subAction?: {
    id: string;
    name: string;
    coverImage: string | null;
  } | null;
  qrObject?: {
    id: string;
    type: string;
    status: string;
    qrCodeData: string;
    coverImage: string | null;
    validUntil: string | null;
    metadata?: Record<string, any>;
  } | null;
}

export interface WalletSummary {
  wallet: {
    id: string;
    balance: number;
    currency: string;
    isActive: boolean;
    entityType: 'user' | 'organization';
    entityId: string;
  };
  balanceBreakdown: {
    total: number;
    restricted: number;
    available: number;
  };
  restrictions: WalletRestriction[];
  purchases: WalletPurchase[];
  items: WalletItem[];
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
  senderSubActionId?: string;
  receiverUserId?: string;
  receiverOrganizationId?: string;
  receiverWalletId?: string;
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
    senderSubActionId: string | null;
    receiverUserId: string | null;
    receiverOrganizationId: string | null;
    receiverWalletId: string | null;
    resolvedReceiverWalletId: string | null;
    description: string;
    categoryId: string | null;
    spendConstraintType: string;
    constraintCategoryId: string | null;
    constraintsApplied: boolean;
    status: string;
  };
}

export interface PaymentRequest {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  note: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  allowEditAmount: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile?: {
      avatar?: string;
    };
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profile?: {
      avatar?: string;
    };
  };
}