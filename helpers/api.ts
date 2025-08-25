import axios from 'axios';
import baseUrl from './baseUrl';

export const getWalletBalance = async (userId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/wallet/${userId}`);
  return res.data;
};

export const transferMoney = async ({ senderId, receiverId, amount, description, categoryId, token }: {
  senderId: string;
  receiverId: string;
  amount: number;
  description: string;
  categoryId?: string;
  token?: string;
}) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(`${baseUrl}/transactions/transfer`, {
    senderId,
    receiverId,
    amount,
    description,
    categoryId,
  }, { headers });
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
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.type) queryParams.append('type', params.type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  
  const url = `${baseUrl}/transactions/history/${userId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const res = await axios.get(url);
  return res.data;
};

// Analytics API functions
export const getExpenseSummary = async (userId: string, period?: '7d' | '30d' | '90d' | '365d', token?: string) => {
  const queryParams = new URLSearchParams();
  if (period) queryParams.append('period', period);
  
  const url = `${baseUrl}/analytics/summary/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(url, { headers });
  return res.data;
};

export const getCategoryBreakdown = async (userId: string, period?: '7d' | '30d' | '90d' | '365d', token?: string) => {
  const queryParams = new URLSearchParams();
  if (period) queryParams.append('period', period);
  
  const url = `${baseUrl}/analytics/category-breakdown/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(url, { headers });
  return res.data;
};

export const getSpendingTrends = async (userId: string, period?: '7d' | '30d' | '90d' | '365d', token?: string) => {
  const queryParams = new URLSearchParams();
  if (period) queryParams.append('period', period);
  
  const url = `${baseUrl}/analytics/spending-trends/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(url, { headers });
  return res.data;
};

export const getRecentExpenses = async (userId: string, limit?: number, token?: string) => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());
  
  const url = `${baseUrl}/analytics/recent-transactions/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(url, { headers });
  return res.data;
};

export const getCategories = async (token?: string) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${baseUrl}/transactions/categories`, { headers });
  return res.data;
};