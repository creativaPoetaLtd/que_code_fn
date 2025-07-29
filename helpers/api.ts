import axios from 'axios';
import baseUrl from './baseUrl';

export const getWalletBalance = async (userId: string) => {
  const res = await axios.get(`${baseUrl}/api/transactions/wallet/${userId}`);
  return res.data;
};

export const transferMoney = async ({ senderId, receiverId, amount, description }: {
  senderId: string;
  receiverId: string;
  amount: number;
  description: string;
}) => {
  const res = await axios.post(`${baseUrl}/api/transactions/transfer`, {
    senderId,
    receiverId,
    amount,
    description,
  });
  return res.data;
};

export const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    // Try common locations for userId
    return user.id || user._id || user.data?.dataValues?.id || null;
  } catch {
    return null;
  }
}; 