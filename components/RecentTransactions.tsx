import Image from "next/image";
import { useEffect, useState } from 'react';
import { getTransactionHistory, getUserWallet, getOrganizationWallet } from '@/helpers/api';
import { Transaction } from '@/types/dashboard';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserWalletId, setCurrentUserWalletId] = useState<string | null>(null);
  const router = useRouter();
  const { getToken } = useAuthToken();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        let userId: string | null | undefined;
        if (token && !isTokenExpired(token)) {
          userId = getUserIdFromToken(token);
        }
        if (!userId) throw new Error('User not found');

        setCurrentUserId(userId);

        // Get wallet info for display purposes
        let walletResponse;
        try {
          walletResponse = await getUserWallet(userId);
        } catch (userError) {
          walletResponse = await getOrganizationWallet(userId);
        }

        if (walletResponse.success) {
          setCurrentUserWalletId(walletResponse.data.walletId);
        }


        const response = await getTransactionHistory(userId, { limit: 5 });

        if (response.success) {
          setTransactions(response.data.transactions || []);
        } else {
          throw new Error(response.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError('Could not fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getTransactionDisplayInfo = (transaction: Transaction) => {
    const isOutgoing = transaction.type === 'sent';
    const transactionAmount = Number(transaction.amount) || 0;
    const transactionFee = Number(transaction.fee) || 0;
    const amount = isOutgoing ? -(transactionAmount + transactionFee) : transactionAmount;
    const displayName = transaction.description || (isOutgoing ? 'Money Sent' : 'Money Received');
    const transactionType = isOutgoing ? 'Sent' : 'Received';

    return { amount, displayName, transactionType, isOutgoing };
  };

  if (loading) {
    return <div className="bg-white rounded-xl shadow-sm p-6">Loading transactions...</div>;
  }
  if (error) {
    return <div className="bg-white rounded-xl shadow-sm p-6 text-red-500">{error}</div>;
  }
  const displayedTransactions = transactions.slice(0, 5);
  if (displayedTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-gray-500">
          No transactions found. Start by sending or receiving money!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
        <h3 className="text-base sm:text-lg text-[#00313A] font-semibold">Recent transactions</h3>
        <button
          onClick={() => router.push('/transactions')}
          className="text-sm text-[#00B512] hover:text-[#00B512]/80 transition-colors duration-200 font-medium"
        >
          View all
        </button>
      </div>
      
      {/* Mobile & Desktop List View */}
      <div className="divide-y divide-gray-100">
        {displayedTransactions.map((transaction) => {
          const { amount, displayName, transactionType, isOutgoing } = getTransactionDisplayInfo(transaction);
          return (
            <div key={transaction.id} className="p-2 sm:p-2.5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0 text-white font-semibold text-xs">
                  {displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-gray-900 truncate text-xs">{displayName}</p>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className={`text-xs font-medium ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {amount < 0 ? '-' : '+ '}€{isNaN(Math.abs(amount)) ? '0' : (Math.abs(amount) / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTransactions;