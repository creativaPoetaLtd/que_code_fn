export type TopUpProviderKey = "mtn_momo" | "airtel_money";
export type TopUpStatus = "pending" | "successful" | "failed" | "expired";

export interface TopUpProviderOption {
  key: TopUpProviderKey;
  name: string;
  available: boolean;
  simulated: boolean;
}

export interface TopUpOptions {
  simulation: boolean;
  minAmount: number;
  maxAmount: number;
  currency: string;
  pendingTimeoutMinutes: number;
  providers: TopUpProviderOption[];
}

export interface TopUp {
  id: string;
  status: TopUpStatus;
  amount: number;
  currency: string;
  provider: TopUpProviderKey;
  providerName: string;
  phoneNumber: string;
  note: string | null;
  simulated: boolean;
  providerReference: string | null;
  failureReason: string | null;
  transactionId: string | null;
  completedAt: string | null;
  createdAt: string;
}
