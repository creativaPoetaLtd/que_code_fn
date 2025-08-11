import axios from 'axios';
import baseUrl from './baseUrl';

export const getWalletBalance = async (userId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/wallet/${userId}`);
  return res.data;
};

export const transferMoney = async ({ senderId, receiverId, amount, description }: {
  senderId: string;
  receiverId: string;
  amount: number;
  description: string;
}) => {
  const res = await axios.post(`${baseUrl}/transactions/transfer`, {
    senderId,
    receiverId,
    amount,
    description,
  });
  return res.data;
};

export const getCurrentUserId = (): string | null => {
  try {
  // Retrieve token, first check sessionStorage then localStorage
  const raw = sessionStorage.getItem('token') ?? localStorage.getItem('token');
    if (!raw) return null;
    let authToken: string | null;
    try {
      authToken = JSON.parse(raw).value;
    } catch {
      authToken = raw;
    }
    if (!authToken) return null;
    const parts = authToken.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(atob(base64));
    let userId = payload?.userId || payload?.id || payload?.sub || null;
    if (userId === 'undefined') {
      return null;
    }
    return userId;
  } catch (error) {
    console.error('getCurrentUserId error:', error);
    return null;
  }
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