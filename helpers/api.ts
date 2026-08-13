import axios from 'axios';
import baseUrl from './baseUrl';
import { getValidToken, handleTokenExpiration, getCurrentUserId, getCurrentUserInfo } from '@/utils/tokenUtils';

// Setup axios interceptor once
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only trigger logout when the request carried an auth token
    // (meaning the token was rejected/expired server-side).
    // Don't logout for requests that were sent without auth.
    const hadAuthHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization;
    if (error.response?.status === 401 && hadAuthHeader) {
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
const apiPatch = (url: string, data: any) => axios.patch(`${baseUrl}${url}`, data, { headers: getAuthHeaders() });
const apiDelete = (url: string) => axios.delete(`${baseUrl}${url}`, { headers: getAuthHeaders() });
const apiPatch = (url: string, data: any) => axios.patch(`${baseUrl}${url}`, data, { headers: getAuthHeaders() });

// Helper for FormData requests (no Content-Type header, let browser set it with boundary)
const apiPostFormData = (url: string, formData: FormData) =>
  axios.post(`${baseUrl}${url}`, formData, {
    headers: getAuthHeaders()
  });

const apiPutFormData = (url: string, formData: FormData) =>
  axios.put(`${baseUrl}${url}`, formData, {
    headers: getAuthHeaders()
  });

const apiPatchFormData = (url: string, formData: FormData) =>
  axios.patch(`${baseUrl}${url}`, formData, {
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
  senderSubActionId?: string;
  receiverUserId?: string;
  receiverOrganizationId?: string;
  receiverWalletId?: string;
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
  const {
    senderUserId,
    senderOrganizationId,
    senderSubActionId,
    receiverUserId,
    receiverOrganizationId,
    receiverWalletId
  } = params;

  const senderCount =
    (senderUserId ? 1 : 0) +
    (senderOrganizationId ? 1 : 0) +
    (senderSubActionId ? 1 : 0);

  const receiverCount =
    (receiverUserId ? 1 : 0) +
    (receiverOrganizationId ? 1 : 0) +
    (receiverWalletId ? 1 : 0);

  if (senderCount !== 1 || receiverCount !== 1) {
    throw new Error('Exactly one sender and one receiver must be provided');
  }
};

const createTransferKey = (params: any) => {
  const {
    senderUserId,
    senderOrganizationId,
    senderSubActionId,
    receiverUserId,
    receiverOrganizationId,
    receiverWalletId,
    amount
  } = params;

  const senderId = senderUserId || senderOrganizationId || senderSubActionId;
  const receiverId = receiverUserId || receiverOrganizationId || receiverWalletId;
  return `${senderId}-${receiverId}-${amount}`;
};

/* ---------- Scheduled transfers ---------- */

export interface ScheduleRecurrenceInput {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: string;
  maxOccurrences?: number;
}

export interface ScheduleTransferParams {
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
  pin: string;
  scheduledFor: string;
  timezone?: string;
  recurrence?: ScheduleRecurrenceInput;
}

export const scheduleTransfer = async (params: ScheduleTransferParams) => {
  validateTransferParams(params);
  const res = await apiPost('/scheduled-transfers', params);
  return res.data;
};

export const getScheduledTransfers = async (params?: {
  status?: string;
  direction?: 'outgoing' | 'incoming' | 'all';
  limit?: number;
  offset?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.direction) query.set('direction', params.direction);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  const res = await apiGet(`/scheduled-transfers${qs ? `?${qs}` : ''}`);
  return res.data;
};

export const getScheduledTransferById = async (id: string) => {
  const res = await apiGet(`/scheduled-transfers/${id}`);
  return res.data;
};

export const updateScheduledTransfer = async (id: string, params: {
  amount?: number;
  scheduledFor?: string;
  description?: string;
  categoryId?: string;
  applyConstraints?: boolean;
  recurrence?: ScheduleRecurrenceInput | null;
  pin?: string;
}) => {
  const res = await apiPatch(`/scheduled-transfers/${id}`, params);
  return res.data;
};

export const cancelScheduledTransfer = async (id: string) => {
  const res = await apiPost(`/scheduled-transfers/${id}/cancel`, {});
  return res.data;
};

export const pauseScheduledTransfer = async (id: string) => {
  const res = await apiPost(`/scheduled-transfers/${id}/pause`, {});
  return res.data;
};

export const resumeScheduledTransfer = async (id: string) => {
  const res = await apiPost(`/scheduled-transfers/${id}/resume`, {});
  return res.data;
};

export const skipNextScheduledOccurrence = async (id: string) => {
  const res = await apiPost(`/scheduled-transfers/${id}/skip-next`, {});
  return res.data;
};

export interface BatchRecipientInput {
  receiverUserId?: string;
  receiverOrganizationId?: string;
  receiverWalletId?: string;
  amount: number;
  description?: string;
}

export const createBatchTransfer = async (params: {
  senderUserId?: string;
  senderOrganizationId?: string;
  senderSubActionId?: string;
  recipients: BatchRecipientInput[];
  description?: string;
  categoryId?: string;
  type?: string;
  applyConstraints?: boolean;
  pin: string;
  idempotencyKey?: string;
}) => {
  const res = await apiPost('/transactions/batch-transfer', params);
  return res.data;
};

export const getBatchTransfers = async (params?: { page?: number; limit?: number }) => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiGet(`/transactions/batches${qs ? `?${qs}` : ''}`);
  return res.data;
};

export const getBatchTransferById = async (id: string) => {
  const res = await apiGet(`/transactions/batch/${id}`);
  return res.data;
};

export const createScheduledBatchTransfer = async (params: {
  senderUserId?: string;
  senderOrganizationId?: string;
  senderSubActionId?: string;
  recipients: BatchRecipientInput[];
  description?: string;
  categoryId?: string;
  type?: string;
  applyConstraints?: boolean;
  pin: string;
  scheduledFor: string;
  timezone: string;
  recurrence?: ScheduleRecurrenceInput | null;
}) => {
  const res = await apiPost('/scheduled-transfers/batch', params);
  return res.data;
};

export const getScheduledBatches = async (params?: { limit?: number; offset?: number }) => {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  const res = await apiGet(`/scheduled-transfers/batches${qs ? `?${qs}` : ''}`);
  return res.data;
};

export const getScheduledBatchById = async (id: string) => {
  const res = await apiGet(`/scheduled-transfers/batch/${id}`);
  return res.data;
};

export const cancelScheduledBatch = async (id: string) => {
  const res = await apiPost(`/scheduled-transfers/batch/${id}/cancel`, {});
  return res.data;
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
  contactId?: string;
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

export const getContactTransactionStats = async (userId: string, contactId: string) => {
  let walletResponse;
  try {
    walletResponse = await getUserWallet(userId);
  } catch {
    walletResponse = await getOrganizationWallet(userId);
  }

  if (!walletResponse.success) {
    throw new Error('Could not fetch wallet information');
  }

  const url = `${baseUrl}/transactions/wallet/${walletResponse.data.walletId}/contact-stats?contactId=${contactId}`;
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

export const getAnalyticsCategoryBreakdown = (userId: string, startDate?: string, endDate?: string, type: 'expenses' | 'income' = 'expenses') =>
  apiGet(createAnalyticsUrl('category-breakdown', userId, { startDate, endDate, type }));

export const getAnalyticsSpendingTrends = (userId: string, startDate?: string, endDate?: string, interval = 'daily') =>
  apiGet(createAnalyticsUrl('spending-trends', userId, { startDate, endDate, interval }));

export const getAnalyticsRecentTransactions = async (
  userId: string,
  limit: number = 10,
  type?: string,
  startDate?: string,
  endDate?: string
) => {
  const params = new URLSearchParams({ userId, limit: limit.toString() });
  if (type) params.append('type', type);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await axios.get(`${baseUrl}/analytics/recent-transactions?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAnalyticsSpendingComparison = async (userId: string, startDate?: string, endDate?: string, interval: string = 'daily') => {
  const params = new URLSearchParams({ userId, interval });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await axios.get(`${baseUrl}/analytics/spending-comparison?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAnalyticsPeriodSummary = async (
  userId: string,
  startDate: string,
  endDate: string,
  interval: 'daily' | 'weekly' | 'monthly' = 'daily'
) => {
  const params = new URLSearchParams({ userId, startDate, endDate, interval });

  const res = await axios.get(`${baseUrl}/analytics/period-summary?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getTransactionsByCategory = async (
  userId: string,
  categoryId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 10
) => {
  const params = new URLSearchParams({ userId, categoryId, limit: limit.toString() });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await axios.get(`${baseUrl}/analytics/category-transactions?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// Wallet restrictions and transaction details
export const getWalletRestrictions = (walletId: string) =>
  apiGet(`/transactions/wallet/${walletId}/restrictions`);

// Wallet page: aggregated summary + generic "items wallet"
export const getWalletSummary = async (
  entityId: string,
  entityType: 'user' | 'organization' = 'user'
) => {
  const res = await apiGet(`/wallets/${entityType}/${entityId}/summary`);
  return res.data;
};

export const getWalletItems = async (
  walletId: string,
  params?: { status?: string; itemType?: string }
) => {
  const qs = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v != null) as [string, string][]
  ).toString();
  const res = await apiGet(`/wallets/${walletId}/items${qs ? `?${qs}` : ''}`);
  return res.data;
};

export const createWalletItem = async (walletId: string, data: any) => {
  const res = await apiPost(`/wallets/${walletId}/items`, data);
  return res.data;
};

// Create a wallet item with an attached file (photo or PDF) via multipart
export const createWalletItemForm = async (walletId: string, formData: FormData) => {
  const res = await apiPostFormData(`/wallets/${walletId}/items`, formData);
  return res.data;
};

// Update a wallet item (optionally with a new/replacement file) via multipart
export const updateWalletItemForm = async (itemId: string, formData: FormData) => {
  const res = await apiPatchFormData(`/wallets/items/${itemId}`, formData);
  return res.data;
};

// Wallet transaction history by wallet id (recent activity feed)
export const getWalletHistory = async (
  walletId: string,
  params?: { page?: number; limit?: number; type?: string; status?: string }
) => {
  const qs = new URLSearchParams(
    Object.entries(params || {})
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const res = await apiGet(`/transactions/wallet/${walletId}/history${qs ? `?${qs}` : ''}`);
  return res.data;
};

// Spending categories (for budgets / restrictions picker)
export const getWalletCategories = async () => {
  const res = await apiGet('/transactions/categories');
  return res.data;
};

// Wallet spending restrictions ("budgets") CRUD
export const createWalletRestriction = async (walletId: string, categoryId: string, amount: number) => {
  const res = await apiPost('/transactions/restrictions', { walletId, categoryId, amount });
  return res.data;
};

export const updateWalletRestriction = async (id: string, amount: number) => {
  const res = await apiPut(`/transactions/restrictions/${id}`, { amount });
  return res.data;
};

export const deleteWalletRestriction = async (id: string) => {
  const res = await apiDelete(`/transactions/restrictions/${id}`);
  return res.data;
};

// Incoming money rules: auto-categorize money received from a specific sender
export const getWalletIncomingRules = async (walletId: string) => {
  const res = await apiGet(`/transactions/wallet/${walletId}/incoming-rules`);
  return res.data;
};

// Senders (users/orgs) that have sent money to this wallet — picker source
export const getIncomingSenders = async (walletId: string) => {
  const res = await apiGet(`/transactions/wallet/${walletId}/incoming-senders`);
  return res.data;
};

export const createWalletIncomingRule = async (payload: {
  walletId: string;
  categoryId: string;
  cap?: number | null;
  senderWalletId?: string;
  senderUserId?: string;
  senderOrganizationId?: string;
}) => {
  const res = await apiPost('/transactions/incoming-rules', payload);
  return res.data;
};

export const updateWalletIncomingRule = async (
  id: string,
  data: { categoryId?: string; cap?: number | null; isActive?: boolean }
) => {
  const res = await apiPut(`/transactions/incoming-rules/${id}`, data);
  return res.data;
};

export const deleteWalletIncomingRule = async (id: string) => {
  const res = await apiDelete(`/transactions/incoming-rules/${id}`);
  return res.data;
};

// Download a transaction receipt (auth-protected → fetch as blob then save)
export const downloadTransactionReceipt = async (transactionId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/receipt/${transactionId}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${transactionId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const updateWalletItem = async (itemId: string, data: any) => {
  const res = await apiPatch(`/wallets/items/${itemId}`, data);
  return res.data;
};

export const deleteWalletItem = async (itemId: string) => {
  const res = await apiDelete(`/wallets/items/${itemId}`);
  return res.data;
};

export const getTransactionDetails = (transactionId: string) =>
  apiGet(`/transactions/${transactionId}`);

export const getPaymentRequestById = (id: string) =>
  apiGet(`/transactions/request/${id}`);

export const getPaymentRequestQR = (id: string) =>
  apiGet(`/transactions/request/${id}/qr`);

export const declinePaymentRequest = (id: string, chatId?: string) =>
  axios.patch(`${baseUrl}/transactions/request/${id}/decline`, { chatId }, { headers: getAuthHeaders() });

export const acceptPaymentRequest = (id: string, pin: string, chatId?: string, customAmount?: number) =>
  axios.patch(`${baseUrl}/transactions/request/${id}/accept`, { pin, chatId, customAmount }, { headers: getAuthHeaders() });

export const getPaymentRequests = (type: 'sent' | 'received' = 'received') =>
  apiGet(`/transactions/requests?type=${type}`);

export const getRecentSends = async (limit: number = 15) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  const res = await axios.get(`${baseUrl}/transactions/recent-sends?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

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
export const validateResetToken = (resetToken: string) =>
  pinRequest('validate-reset-token', { resetToken });
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

export const getGroupById = (groupId: string) =>
  axios.get(`${baseUrl}/groups/${groupId}`, { headers: getAuthHeaders() });

export const transferActionPurchase = (purchaseId: string, recipientId: string) =>
  apiPost(`/action-purchases/${purchaseId}/transfer`, { recipientId });

export const getUserById = (userId: string) => apiGet(`/users/${userId}`);

export const getOrganizationById = (organizationId: string) =>
  apiGet(`/organizations/${organizationId}`);

export const getGroupWallet = (groupId: string) =>
  apiGet(`/groups/${groupId}/wallet`);

// Group contributions
export const createGroupContribution = (
  groupId: string,
  payload: {
    title: string;
    note?: string;
    goalAmount?: number;
    type: "fixed" | "flexible";
    amountPerMember?: number;
    minimumAmount?: number;
    deadline?: string;
    visibilityMode: "all" | "admin_only";
    disbursementPolicy?: "hold" | "auto";
    disbursementRecipientId?: string;
  }
) =>
  axios.post(`${baseUrl}/groups/${groupId}/contributions`, payload, {
    headers: getAuthHeaders(),
  });

export const getMyGroupContributions = () => apiGet("/contributions/mine");

export const getGroupContributions = (groupId: string) =>
  apiGet(`/groups/${groupId}/contributions`);

export const getGroupContribution = (groupId: string, contributionId: string) =>
  apiGet(`/groups/${groupId}/contributions/${contributionId}`);

export const contributeToGroup = (groupId: string, contributionId: string, amount: number, pin: string, isAnonymous?: boolean) =>
  axios.post(`${baseUrl}/groups/${groupId}/contributions/${contributionId}/pay`, { amount, pin, isAnonymous }, { headers: getAuthHeaders() });

export const updateGroupContribution = (
  groupId: string,
  contributionId: string,
  payload: {
    title?: string;
    note?: string | null;
    goalAmount?: number | null;
    visibilityMode?: "all" | "admin_only";
    disbursementPolicy?: "hold" | "auto";
    disbursementRecipientId?: string | null;
  }
) =>
  axios.patch(`${baseUrl}/groups/${groupId}/contributions/${contributionId}`, payload, { headers: getAuthHeaders() });

export const closeGroupContribution = (groupId: string, contributionId: string) =>
  axios.patch(`${baseUrl}/groups/${groupId}/contributions/${contributionId}/close`, {}, { headers: getAuthHeaders() });

export const extendGroupContributionDeadline = (groupId: string, contributionId: string, deadline: string) =>
  axios.patch(`${baseUrl}/groups/${groupId}/contributions/${contributionId}/extend`, { deadline }, { headers: getAuthHeaders() });

export const withdrawGroupContribution = (groupId: string, contributionId: string) =>
  axios.post(`${baseUrl}/groups/${groupId}/contributions/${contributionId}/withdraw`, {}, { headers: getAuthHeaders() });

export const listGroupContributors = (groupId: string, contributionId: string) =>
  apiGet(`/groups/${groupId}/contributions/${contributionId}/contributors`);

// Public (standalone) contributions
export const createPublicContribution = (payload: {
  title: string;
  note?: string;
  goalAmount?: number;
  type: "fixed" | "flexible";
  amountPerMember?: number;
  minimumAmount?: number;
  deadline?: string;
  visibilityMode?: "all" | "creator_only";
  disbursementPolicy?: "hold" | "auto";
}) =>
  apiPost("/public-contributions", payload);

export const getPublicContribution = (contributionId: string) =>
  apiGet(`/public-contributions/${contributionId}`);

export const getMyPublicContributions = () =>
  apiGet("/public-contributions/");

export const contributeToPublic = (contributionId: string, amount: number, pin: string, isAnonymous?: boolean) =>
  axios.post(
    `${baseUrl}/public-contributions/${contributionId}/pay`,
    { amount, pin, isAnonymous },
    { headers: getAuthHeaders() }
  );

export const closePublicContribution = (contributionId: string) =>
  axios.patch(
    `${baseUrl}/public-contributions/${contributionId}/close`,
    {},
    { headers: getAuthHeaders() }
  );

export const extendPublicContributionDeadline = (contributionId: string, deadline: string) =>
  axios.patch(
    `${baseUrl}/public-contributions/${contributionId}/extend`,
    { deadline },
    { headers: getAuthHeaders() }
  );

export const withdrawPublicContribution = (contributionId: string) =>
  axios.post(
    `${baseUrl}/public-contributions/${contributionId}/withdraw`,
    {},
    { headers: getAuthHeaders() }
  );

export const updatePublicContribution = (
  contributionId: string,
  payload: {
    title?: string;
    note?: string | null;
    goalAmount?: number | null;
    visibilityMode?: "all" | "creator_only";
    disbursementPolicy?: "hold" | "auto";
  }
) =>
  axios.patch(`${baseUrl}/public-contributions/${contributionId}`, payload, { headers: getAuthHeaders() });

export const listPublicContributors = (contributionId: string) =>
  apiGet(`/public-contributions/${contributionId}/contributors`);

export const createCampaignGroup = (
  contributionId: string,
  payload: { name: string; description?: string; isOpen: boolean }
) =>
  axios.post(`${baseUrl}/public-contributions/${contributionId}/group`, payload, { headers: getAuthHeaders() });

export const getCampaignGroup = (contributionId: string) =>
  apiGet(`/public-contributions/${contributionId}/group`);

export const joinCampaignGroup = (contributionId: string) =>
  apiPost(`/public-contributions/${contributionId}/join-group`, {});

export const getContributionByGroup = (groupId: string) =>
  apiGet(`/public-contributions/by-group/${groupId}`);

export const updateGroupPrivacy = (groupId: string, isOpen: boolean) =>
  axios.put(
    `${baseUrl}/groups/${groupId}`,
    { privacyType: isOpen ? "public" : "require_approval" },
    { headers: getAuthHeaders() }
  );
