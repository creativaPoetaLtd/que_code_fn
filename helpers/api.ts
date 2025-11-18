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
    // Verify token format
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
      console.log('Token expired:', new Date() > new Date(payload.exp * 1000));
    } catch (e) {
      console.error('Invalid token format:', e);
    }
  } else {
    console.log('No token found in cookies, sessionStorage, or localStorage');
    console.log('SessionStorage token:', sessionStorage.getItem('token'));
    console.log('LocalStorage token:', localStorage.getItem('token'));
    console.log('Cookies:', document.cookie);
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

// Unified balance function that can handle both users and organizations
export const getEntityBalance = async (entityId: string, entityType: 'user' | 'organization' = 'user') => {
  try {
    let walletResponse;
    
    if (entityType === 'organization') {
      walletResponse = await getOrganizationWallet(entityId);
    } else {
      walletResponse = await getUserWallet(entityId);
    }
    
    if (!walletResponse.success) {
      throw new Error(walletResponse.message || `Failed to get ${entityType} wallet`);
    }
    
    const balanceResponse = await getWalletBalance(walletResponse.data.walletId);
    return balanceResponse;
  } catch (error) {
    console.error(`getEntityBalance error for ${entityType}:`, error);
    throw error;
  }
};

const activeTransfers = new Set<string>();

export const transferMoney = async ({ 
  senderUserId, 
  senderOrganizationId,
  receiverUserId, 
  receiverOrganizationId,
  amount, 
  description, 
  categoryId,
  type = 'transfer',
  applyConstraints = false,
  pin
}: {
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
  // Validate that exactly one sender and one receiver is provided
  const senderCount = (senderUserId ? 1 : 0) + (senderOrganizationId ? 1 : 0);
  const receiverCount = (receiverUserId ? 1 : 0) + (receiverOrganizationId ? 1 : 0);
  
  if (senderCount !== 1) {
    throw new Error('Exactly one sender (userId or organizationId) must be provided');
  }
  if (receiverCount !== 1) {
    throw new Error('Exactly one receiver (userId or organizationId) must be provided');
  }
  
  // Create a unique key for this transfer request
  const senderId = senderUserId || senderOrganizationId;
  const receiverId = receiverUserId || receiverOrganizationId;
  const transferKey = `${senderId}-${receiverId}-${amount}-${Date.now()}`;
  const baseKey = `${senderId}-${receiverId}-${amount}`;
  
  // Check if a similar transfer is already in progress
  if (activeTransfers.has(baseKey)) {
    throw new Error('A similar transfer is already in progress. Please wait.');
  }
  
  // Mark this transfer as active
  activeTransfers.add(baseKey);
  
  try {
    const transferData: any = {
      amount,
      description,
      categoryId,
      type,
      applyConstraints,
      pin
    };
    
    // Add sender
    if (senderUserId) {
      transferData.senderUserId = senderUserId;
    } else if (senderOrganizationId) {
      transferData.senderOrganizationId = senderOrganizationId;
    }
    
    // Add receiver
    if (receiverUserId) {
      transferData.receiverUserId = receiverUserId;
    } else if (receiverOrganizationId) {
      transferData.receiverOrganizationId = receiverOrganizationId;
    }
    
    const res = await axios.post(`${baseUrl}/transactions/transfer`, transferData, {
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
    // Use the same token retrieval logic as getAuthHeaders
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

// Helper function to get current user info and account type
export const getCurrentUserInfo = (): { userId: string | null; organizationId: string | null; accountType: 'user' | 'organization' | 'unknown' } => {
  try {
    // Use the same token retrieval logic as getAuthHeaders
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
    
    if (!authToken) return { userId: null, organizationId: null, accountType: 'unknown' };
    
    const parts = authToken.split('.');
    if (parts.length < 2) return { userId: null, organizationId: null, accountType: 'unknown' };
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    console.log('JWT payload:', payload);
    
    // Determine account type first, then assign ID accordingly
    const accountType = payload?.accountType || 'unknown';
    const id = payload?.id || payload?.userId || payload?.sub || null;
    
    let userId: string | null = null;
    let organizationId: string | null = null;
    
    if (accountType === 'organization') {
      organizationId = id;
    } else if (accountType === 'user') {
      userId = id;
    } else {
      // Fallback: if no accountType, try to determine from available fields
      if (payload?.organizationId || payload?.orgId || payload?.organization_id) {
        organizationId = payload?.organizationId || payload?.orgId || payload?.organization_id;
      } else {
        userId = id;
      }
    }
    
    return { userId, organizationId, accountType };
  } catch (error) {
    console.error('getCurrentUserInfo error:', error);
    return { userId: null, organizationId: null, accountType: 'unknown' };
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
    // Try user wallet first, then organization wallet
    let walletResponse;
    try {
      walletResponse = await getUserWallet(userId);
    } catch (userError) {
      console.log('getTransactionHistory - user wallet failed, trying organization:', userError);
      walletResponse = await getOrganizationWallet(userId);
    }
    
    if (!walletResponse.success) {
      throw new Error('Could not fetch wallet information');
    }
    
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

export const getAnalyticsSummary = async (userId: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams({ userId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await axios.get(`${baseUrl}/analytics/summary?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAnalyticsCategoryBreakdown = async (userId: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams({ userId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await axios.get(`${baseUrl}/analytics/category-breakdown?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const getAnalyticsSpendingTrends = async (userId: string, startDate?: string, endDate?: string, interval: string = 'daily') => {
  const params = new URLSearchParams({ userId, interval });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await axios.get(`${baseUrl}/analytics/spending-trends?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

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

// Organization Wallet Functions
export const getOrganizationWallet = async (organizationId: string) => {
  const headers = getAuthHeaders();
  
  // Check if we have authentication headers
  if (!headers.Authorization) {
    throw new Error('No authentication token found. Please log in first.');
  }
  
  const url = `${baseUrl}/transactions/organization/${organizationId}/wallet`;
  
  console.log('getOrganizationWallet - URL:', url);
  console.log('getOrganizationWallet - Headers:', headers);
  console.log('getOrganizationWallet - Organization ID:', organizationId);
  
  try {
    const res = await axios.get(url, { headers });
    return res.data;
  } catch (error: any) {
    console.error('getOrganizationWallet - Error:', error.response?.status, error.response?.data);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to access this organization wallet.');
    } else if (error.response?.status === 404) {
      throw new Error('Organization wallet not found.');
    }
    
    throw error;
  }
};

export const getOrganizationBalance = async (organizationId: string) => {
  try {
    const walletResponse = await getOrganizationWallet(organizationId);
    if (!walletResponse.success) {
      throw new Error(walletResponse.message || 'Failed to get organization wallet');
    }
    
    const balanceResponse = await getWalletBalance(walletResponse.data.walletId);
    return balanceResponse;
  } catch (error) {
    console.error('getOrganizationBalance error:', error);
    throw error;
  }
};

// Wallet Restriction Functions
export const getWalletRestrictions = async (walletId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/wallet/${walletId}/restrictions`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// Transaction Details Function
export const getTransactionDetails = async (transactionId: string) => {
  const res = await axios.get(`${baseUrl}/transactions/${transactionId}`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// PIN-related API functions
export const setupPin = async (pin: string) => {
  const res = await axios.post(`${baseUrl}/users/pin/setup`, { pin }, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });
  return res.data;
};

export const verifyPin = async (pin: string) => {
  const res = await axios.post(`${baseUrl}/users/pin/verify`, { pin }, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });
  return res.data;
};

export const changePin = async (currentPin: string, newPin: string) => {
  const res = await axios.put(`${baseUrl}/users/pin/change`, { currentPin, newPin }, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json"
    }
  });
  return res.data;
};

export const resetPinAttempts = async () => {
  const res = await axios.post(`${baseUrl}/users/pin/reset-attempts`, {}, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// PIN reset for locked accounts (requires verification)
export const requestPinReset = async (verificationMethod: 'email' | 'sms') => {
  const res = await axios.post(`${baseUrl}/users/pin/request-reset`, { verificationMethod }, {
    headers: getAuthHeaders()
  });
  return res.data;
};

export const confirmPinReset = async (resetToken: string, newPin: string) => {
  const res = await axios.post(`${baseUrl}/users/pin/confirm-reset`, { resetToken, newPin }, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// Check if user has PIN set up
export const checkUserPinStatus = async () => {
  const res = await axios.get(`${baseUrl}/users/pin/status`, {
    headers: getAuthHeaders()
  });
  return res.data;
};

// Get detailed PIN status including attempts and lockout info
export const getPinStatus = async () => {
  const res = await axios.get(`${baseUrl}/users/pin/status`, {
    headers: getAuthHeaders()
  });
  return res.data;
};