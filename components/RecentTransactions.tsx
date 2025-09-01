import Image from "next/image";
import { useEffect, useState } from 'react';
import { getTransactionHistory, getUserWallet } from '@/helpers/api';
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
        console.log('RecentTransactions - userId:', userId);
        if (!userId) throw new Error('User not found');
        
        setCurrentUserId(userId);
        
        const walletResponse = await getUserWallet(userId);
        console.log('RecentTransactions - wallet response:', walletResponse);
        
        if (!walletResponse.success) {
          throw new Error('Could not fetch wallet information');
        }
        
        const walletId = walletResponse.data.walletId;
        setCurrentUserWalletId(walletId);
        
        console.log('RecentTransactions - fetching transactions for wallet:', walletId);
        
        const response = await getTransactionHistory(userId, { limit: 5 });
        console.log('RecentTransactions - response:', response);
        
        if (response.success) {
          setTransactions(response.data.transactions || []);
        } else {
          throw new Error(response.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        console.error('RecentTransactions - fetch error:', err);
        setError('Could not fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getTransactionDisplayInfo = (transaction: Transaction) => {
    const isOutgoing = transaction.senderWalletId === currentUserWalletId;
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
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold">Recent Transactions</h3>
        <button 
          onClick={() => router.push('/transactions')}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1"
        >
          <span className="hidden sm:inline">All transactions</span>
          <span className="inline sm:hidden">View all</span>
          <span>→</span>
        </button>
      </div>
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-t border-gray-100">
              <th className="px-6 py-3 text-sm font-medium text-gray-600">Transactions</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Amount</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-600 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {displayedTransactions.map((transaction) => {
              const { amount, displayName, transactionType, isOutgoing } = getTransactionDisplayInfo(transaction);
              return (
                <tr key={transaction.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <span className="text-gray-400">{isOutgoing ? '📤' : '📥'}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-500">{transactionType} • {transaction.status}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    <span className={amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {amount < 0 ? '-' : '+'}RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile List View */}
      <div className="sm:hidden divide-y divide-gray-100">
        {displayedTransactions.map((transaction) => {
          const { amount, displayName, transactionType, isOutgoing } = getTransactionDisplayInfo(transaction);
          return (
            <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-gray-400">{isOutgoing ? '📤' : '📥'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{displayName}</p>
                    <p className="text-sm text-gray-500">{transactionType} • {transaction.status}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">{new Date(transaction.createdAt).toLocaleDateString()}</span>
                <span className={`font-medium ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {amount < 0 ? '-' : '+'}RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentTransactions;