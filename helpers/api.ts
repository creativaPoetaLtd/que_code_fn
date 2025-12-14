import axios from 'axios';
import baseUrl from './baseUrl';
import { getValidToken, handleTokenExpiration, getCurrentUserId, getCurrentUserInfo } from '@/utils/tokenUtils';

// Setup axios interceptor once
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleTokenExpiration();
    }
    return Promise.reject(error);
  }
);

const getAuthHeaders = () => {
  const token = getValidToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiGet = (url: string) => axios.get(`${baseUrl}${url}`, { headers: getAuthHeaders() });
const apiPost = (url: string, data: any) => axios.post(`${baseUrl}${url}`, data, { headers: getAuthHeaders() });
const apiPut = (url: string, data: any) => axios.put(`${baseUrl}${url}`, data, { headers: getAuthHeaders() });
const apiDelete = (url: string) => axios.delete(`${baseUrl}${url}`, { headers: getAuthHeaders() });

// Helper for FormData requests (no Content-Type header, let browser set it with boundary)
const apiPostFormData = (url: string, formData: FormData) => 
  axios.post(`${baseUrl}${url}`, formData, { 
    headers: getAuthHeaders()
  });

const apiPutFormData = (url: string, formData: FormData) => 
  axios.put(`${baseUrl}${url}`, formData, { 
    headers: getAuthHeaders()
  });


export const getUserWallet = async (userId: string) => {
  const res = await apiGet(`/transactions/user/${userId}/wallet`);
  return res.data;
};

export const getOrganizationWallet = async (organizationId: string) => {
  try {
    const res = await apiGet(`/transactions/organization/${organizationId}/wallet`);
    return res.data;
  } catch (error: any) {
    throw new Error(getOrganizationWalletErrorMessage(error));
  }
};

const getOrganizationWalletErrorMessage = (error: any): string => {
  if (error.response?.status === 403) {
    return 'Access denied. You do not have permission to access this organization wallet.';
  }
  if (error.response?.status === 404) {
    return 'Organization wallet not found.';
  }
  return error.message || 'Failed to get organization wallet';
};

export const getWalletBalance = async (walletId: string) => {
  const res = await apiGet(`/transactions/wallet/${walletId}/balance`);
  return res.data;
};

export const getEntityBalance = async (entityId: string, entityType: 'user' | 'organization' = 'user') => {
  const walletFn = entityType === 'organization' ? getOrganizationWallet : getUserWallet;
  const walletResponse = await walletFn(entityId);

  if (!walletResponse.success) {
    throw new Error(walletResponse.message || `Failed to get ${entityType} wallet`);
  }

  return await getWalletBalance(walletResponse.data.walletId);
};

export const getUserBalance = (userId: string) => getEntityBalance(userId, 'user');
export const getOrganizationBalance = (organizationId: string) => getEntityBalance(organizationId, 'organization');

const activeTransfers = new Set<string>();

export const transferMoney = async (params: {
  senderUserId?: string;
  senderOrganizationId?: string;
  receiverUserId?: string;
  receiverOrganizationId?: string;
  amount: number;
  description?: string;
  categoryId?: string;
  type?: string;
  applyConstraints?: boolean;
  pin?: string;
}) => {
  validateTransferParams(params);

  const transferKey = createTransferKey(params);
  if (activeTransfers.has(transferKey)) {
    throw new Error('A similar transfer is already in progress. Please wait.');
  }

  activeTransfers.add(transferKey);

  try {
    const res = await apiPost('/transactions/transfer', params);
    return res.data;
  } finally {
    setTimeout(() => activeTransfers.delete(transferKey), 1000);
  }
};

const validateTransferParams = (params: any) => {
  const { senderUserId, senderOrganizationId, receiverUserId, receiverOrganizationId } = params;
  const senderCount = (senderUserId ? 1 : 0) + (senderOrganizationId ? 1 : 0);
  const receiverCount = (receiverUserId ? 1 : 0) + (receiverOrganizationId ? 1 : 0);

  if (senderCount !== 1 || receiverCount !== 1) {
    throw new Error('Exactly one sender and one receiver must be provided');
  }
};

const createTransferKey = (params: any) => {
  const { senderUserId, senderOrganizationId, receiverUserId, receiverOrganizationId, amount } = params;
  const senderId = senderUserId || senderOrganizationId;
  const receiverId = receiverUserId || receiverOrganizationId;
  return `${senderId}-${receiverId}-${amount}`;
};

export const getAllUsers = async () => {
  const res = await axios.get(`${baseUrl}/users`);
  return res.data;
};

export const getTransactionHistory = async (userId: string, params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  let walletResponse;
  try {
    walletResponse = await getUserWallet(userId);
  } catch {
    walletResponse = await getOrganizationWallet(userId);
  }

  if (!walletResponse.success) {
    throw new Error('Could not fetch wallet information');
  }

  const queryParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  const url = `${baseUrl}/transactions/wallet/${walletResponse.data.walletId}/history${queryParams.toString() ? '?' + queryParams.toString() : ''
    }`;

  const res = await axios.get(url, { headers: getAuthHeaders() });
  return res.data;
};

export const getTransactionCategories = () => apiGet('/transactions/categories');

const createAnalyticsUrl = (endpoint: string, userId: string, params: Record<string, any> = {}) => {
  const searchParams = new URLSearchParams({ userId, ...params });
  return `/analytics/${endpoint}?${searchParams.toString()}`;
};

export const getAnalyticsSummary = (userId: string, startDate?: string, endDate?: string) =>
  apiGet(createAnalyticsUrl('summary', userId, { startDate, endDate }));

export const getAnalyticsCategoryBreakdown = (userId: string, startDate?: string, endDate?: string) =>
  apiGet(createAnalyticsUrl('category-breakdown', userId, { startDate, endDate }));

export const getAnalyticsSpendingTrends = (userId: string, startDate?: string, endDate?: string, interval = 'daily') =>
  apiGet(createAnalyticsUrl('spending-trends', userId, { startDate, endDate, interval }));

export const getAnalyticsRecentTransactions = (userId: string, limit = 10, type?: string) =>
  apiGet(createAnalyticsUrl('recent-transactions', userId, { limit, type }));

// Wallet restrictions and transaction details
export const getWalletRestrictions = (walletId: string) =>
  apiGet(`/transactions/wallet/${walletId}/restrictions`);

export const getTransactionDetails = (transactionId: string) =>
  apiGet(`/transactions/${transactionId}`);

const pinRequest = (endpoint: string, data: any) =>
  apiPost(`/users/pin/${endpoint}`, data);

const pinGet = (endpoint: string) =>
  apiGet(`/users/pin/${endpoint}`);

export const setupPin = (pin: string) => pinRequest('setup', { pin });
export const verifyPin = (pin: string) => pinRequest('verify', { pin });
export const changePin = (currentPin: string, newPin: string) =>
  apiPut('/users/pin/change', { currentPin, newPin });
export const resetPinAttempts = () => pinRequest('reset-attempts', {});
export const requestPinReset = (verificationMethod: 'email' | 'sms') =>
  pinRequest('request-reset', { verificationMethod });
export const confirmPinReset = (resetToken: string, newPin: string) =>
  pinRequest('confirm-reset', { resetToken, newPin });
export const checkUserPinStatus = () => pinGet('status');
export const getPinStatus = () => pinGet('status');
// Actions & Sub-actions Wizard
export const createActionStepA = (organizationId: string, payload: Record<string, any>) =>
  apiPost(`/organizations/${organizationId}/actions/wizard/step-a`, payload);

export const createActionStepAWithFormData = (organizationId: string, formData: FormData) =>
  apiPostFormData(`/organizations/${organizationId}/actions/wizard/step-a`, formData);

export const updateActionStepB = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-b`, payload);

export const createSubAction = (actionId: string, payload: Record<string, any>) =>
  apiPost(`/actions/${actionId}/sub-actions`, payload);

export const updateActionStepD = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-d`, payload);

export const updateActionStepE = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-e`, payload);

export const updateActionStepF = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-f`, payload);

export const updateActionStepG = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-g`, payload);

export const updateActionStepH = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/wizard/step-h`, payload);

export const publishAction = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}/publish`, payload);

export const updateAction = (actionId: string, payload: Record<string, any>) =>
  apiPut(`/actions/${actionId}`, payload);

export const updateActionWithFormData = (actionId: string, formData: FormData) =>
  apiPutFormData(`/actions/${actionId}`, formData);

export const deleteAction = (actionId: string) =>
  apiDelete(`/actions/${actionId}`);

export const updateSubAction = (subActionId: string, payload: Record<string, any>) =>
  apiPut(`/sub-actions/${subActionId}`, payload);

export const deleteSubAction = (subActionId: string) =>
  apiDelete(`/sub-actions/${subActionId}`);

export const getOrganizationActions = (organizationId: string, params?: { status?: string; type?: string }) => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append('status', params.status);
  if (params?.type) searchParams.append('type', params.type);
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return apiGet(`/organizations/${organizationId}/actions${query}`);
};

export const getActionById = (actionId: string) => apiGet(`/actions/${actionId}`);

export const getSubActions = (actionId: string) => apiGet(`/actions/${actionId}/sub-actions`);
