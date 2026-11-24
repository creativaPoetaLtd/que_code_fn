// QC account types - mirrors the backend's src/utils/accountTiers.ts (GET /plans).

export type AccountTier = "STARTER" | "PREMIUM" | "VIP" | "FREELANCE" | "AGENT" | "BUSINESS" | "NPO";

export type FeatureKey =
  | "instantTransfer"
  | "personalizedTransfer"
  | "comment"
  | "scheduledPayment"
  | "blockedTransfer"
  | "transferTracking"
  | "bulkPayment"
  | "categoryCreation"
  | "secondQc"
  | "actionCreation"
  | "instantMoneyReceipt"
  | "paymentAmountSetting"
  | "storingInformation"
  | "aiChatbot"
  | "employeeManagement"
  | "productManagement"
  | "receiveAnyMoney";

export interface FeatureAccess {
  allowed: boolean;
  fee: number;
  onDemand: boolean;
}

export interface TierDefinition {
  tier: AccountTier;
  name: string;
  accountKind: "user" | "organization";
  priceRwf: number | null;
  dailyTransferLimit: number | null;
  currencies: string[];
  support: "email" | "mail_chat" | "24_7";
  features: Record<FeatureKey, FeatureAccess>;
}

export interface PlanCatalogue {
  feesEnabled: boolean;
  transferLimitsEnabled: boolean;
  selfServiceTiers: AccountTier[];
  features: { key: FeatureKey; label: string }[];
  tiers: TierDefinition[];
}

export interface AccountSubscription {
  id: string;
  tier: AccountTier;
  pendingTier: AccountTier | null;
  priceRwf: string | number;
  status: "active" | "past_due" | "cancelled" | "expired";
  autoRenew: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  pastDueSince: string | null;
}

export interface MyPlan {
  tier: AccountTier;
  name: string;
  priceRwf: number | null;
  currencies: string[];
  support: TierDefinition["support"];
  feesEnabled: boolean;
  dailyTransferLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  features: Record<FeatureKey, FeatureAccess & { granted: boolean; listedFee: number }>;
  subscription: AccountSubscription | null;
  /** Organizations only: a pending request to become an NPO. */
  npoRequest: { requestedAt: string; note: string | null } | null;
}

export interface PlanChangeResult {
  tier: AccountTier;
  effective: "now" | "end_of_period";
  effectiveAt: string;
  chargedRwf: number;
  plan: MyPlan;
}
