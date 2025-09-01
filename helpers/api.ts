import axios from 'axios';
import baseUrl from './baseUrl';

const getTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') return null;

  const nameEQ = "token=";
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        const cookieValue = c.substring(nameEQ.length, c.length);
        const cookieData = JSON.parse(cookieValue);
        if (cookieData.expires && new Date().getTime() > cookieData.expires) {
          return null;
        }
        return cookieData.value;
      } catch (error) {
        console.error('Error parsing token cookie:', error);
        return null;
      }
    }
  }
  return null;
};

const getAuthHeaders = () => {
  let authToken = getTokenFromCookie();
  
  if (!authToken) {
    const raw = sessionStorage.getItem('token') ?? localStorage.getItem('token');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        authToken = parsed.value || parsed;
      } catch {
        authToken = raw;
      }
    }
  }
  
  console.log('Auth token found:', authToken ? 'YES' : 'NO');
  if (authToken) {
    console.log('Token preview:', authToken.substring(0, 20) + '...');
  }
  
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
};

export const getUserWallet = async (userId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/user/${userId}/wallet`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getWalletBalance = async (walletId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/wallet/${walletId}/balance`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getUserBalance = async (userId: string) => {
  try {
    const walletResponse = await getUserWallet(userId);
    if (!walletResponse.success) {
      throw new Error(walletResponse.message || 'Failed to get wallet');
    }
    
    const balanceResponse = await getWalletBalance(walletResponse.data.walletId);
    return balanceResponse;
  } catch (error) {
    console.error('getUserBalance error:', error);
    throw error;
  }
};

const activeTransfers = new Set<string>();

export const transferMoney = async ({ senderUserId, receiverUserId, amount, description, categoryId }: {
  senderUserId: string;
  receiverUserId: string;
  amount: number;
  description?: string;
  categoryId?: string;
}) => {
  // Create a unique key for this transfer request
  const transferKey = `${senderUserId}-${receiverUserId}-${amount}-${Date.now()}`;
  const baseKey = `${senderUserId}-${receiverUserId}-${amount}`;
  
  // Check if a similar transfer is already in progress
  if (activeTransfers.has(baseKey)) {
    throw new Error('A similar transfer is already in progress. Please wait.');
  }
  
  // Mark this transfer as active
  activeTransfers.add(baseKey);
  
  try {
    const res = await axios.post(`${baseUrl}/transactions/transfer`, {
      senderUserId,
      receiverUserId,
      amount,
      description,
      categoryId
    }, {
      headers: getAuthHeaders()
    });
    
    return res.data;
  } finally {
    setTimeout(() => {
      activeTransfers.delete(baseKey);
    }, 1000);
  }
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
  try {
    const walletResponse = await getUserWallet(userId);
    const walletId = walletResponse.data.walletId;
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = `${baseUrl}/transactions/wallet/${walletId}/history${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await axios.get(url, {
      headers: getAuthHeaders()
    });
    return res.data;
  } catch (error) {
    console.error('getTransactionHistory error:', error);
    throw error;
  }
};

export const getTransactionCategories = async () => {
  const res = await axios.get(`${baseUrl}/transactions/categories`, {
    headers: getAuthHeaders()
  });
  return res.data;
};