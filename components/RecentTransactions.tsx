import Image from "next/image";
import { useEffect, useState } from 'react';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { getCurrentUserId } from '@/helpers/api';

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = getCurrentUserId();
        console.log('RecentTransactions - userId:', userId);
        if (!userId) throw new Error('User not found');
        console.log('RecentTransactions - fetching transactions from:', `${baseUrl}/transactions/history/${userId}?limit=5`);
        const res = await axios.get(`${baseUrl}/transactions/history/${userId}?limit=5`);
        console.log('RecentTransactions - response:', res.data);
        setTransactions(res.data.transactions || []);
      } catch (err) {
        console.error('RecentTransactions - fetch error:', err);
        setError('Could not fetch transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return <div className="bg-white rounded-xl shadow-sm p-6">Loading transactions...</div>;
  }
  if (error) {
    return <div className="bg-white rounded-xl shadow-sm p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl text-[#00313A] font-semibold">Recent Transactions</h3>
        <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 flex items-center gap-1">
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
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {/* You can use a default icon or transaction type icon here */}
                      <span className="text-gray-400">💸</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description || transaction.type}</p>
                      <p className="text-sm text-gray-500">{transaction.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <span className={Number(transaction.amount) < 0 ? 'text-red-600' : 'text-green-600'}>
                    {Number(transaction.amount) < 0 ? '-' : ''}RWF {Math.abs(Number(transaction.amount)).toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {transaction.processedAt ? new Date(transaction.processedAt).toLocaleDateString() : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile List View */}
      <div className="sm:hidden divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-gray-400">💸</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.description || transaction.type}</p>
                  <p className="text-sm text-gray-500">{transaction.type}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{transaction.processedAt ? new Date(transaction.processedAt).toLocaleDateString() : ''}</span>
              <span className={`font-medium ${Number(transaction.amount) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Number(transaction.amount) < 0 ? '-' : ''}RWF {Math.abs(Number(transaction.amount)).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;