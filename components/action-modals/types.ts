import React from 'react';
import type { SocialLinks } from '@/types/action.types';

export interface Action {
  id: string;
  organizationId: string;
  type: string;
  name: string;
  slug: string;
  displayLayout: string;
  coverImage: string | null;
  shortDescription: string | null;
  description: string | null;
  currency: string;
  minPrice?: string;
  taxProfileId: string | null;
  pricing: { mode: string };
  availability: {
    endsAt: string | null;
    startsAt: string | null;
    timezone: string | null;
    userQuota: number | null;
    salesWindow: { until: string | null } | null;
  };
  visibility: { mode: string };
  buyerFields: string[];
  fulfillment: {
    objectType: string;
    storeOnBuyerQR: boolean;
    postPurchaseMessage: string | null;
  };
  policy: {
    refund: string | null;
    tosUrl: string | null;
    cancellation: string | null;
  };
  webhooks: {
    onCheckout: string | null;
    onScanValid: string | null;
  };
  customFields: Record<string, any>;
  metadata?: Record<string, any>;
  status: string;
  dedicatedQrCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubAction {
  id: string;
  actionId: string;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  stockReserved: number;
  variants: Record<string, any>;
  metadata: Record<string, any> & { socialLinks?: SocialLinks };
  isActive: boolean;
  sortOrder: number;
  coverImage?: string | null;
  images?: string[];
  dedicatedQrCodeData?: string | null;
  createdAt: string;
  updatedAt: string;
  wallet?: { id: string; balance: number; currency: string };
}

export type PurchaseRecord = {
  quantity: number;
  buyerData: Record<string, string>;
  customAmount?: number;
};

export interface ModalProps {
  action: Action;
  subActions: SubAction[];
  subActionsLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  purchaseData: Record<string, PurchaseRecord>;
  purchasing: Record<string, boolean>;
  purchaseError: Record<string, string>;
  onPurchase: (subAction: SubAction) => void;
  onDirectPurchase: (subAction: SubAction, data: PurchaseRecord) => void;
  onUpdateQuantity: (subActionId: string, quantity: number) => void;
  onUpdateBuyerData: (subActionId: string, field: string, value: string) => void;
  renderBuyerField: (field: string, subActionId: string, value: string, isRequired: boolean) => React.ReactNode;
  formatDate: (dateString: string | null) => string;
  formatPrice: (price: string, currency: string) => string;
  currentUserId?: string | null;
  userId?: string | null;
  isLoggedInAsOrganization?: boolean;
}
