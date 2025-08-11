import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Transaction } from '@/types/dashboard';
import { getTransactionHistory, getCurrentUserId } from '@/helpers/api';

interface TransactionListProps {
  transactions?: Transaction[];
}

export const TransactionList = ({ transactions: propTransactions }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>(propTransactions || []);
  const [loading, setLoading] = useState(!propTransactions);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!propTransactions) {
      fetchTransactions();
    }
  }, [propTransactions]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not found');
      
      setCurrentUserId(userId);
      const response = await getTransactionHistory(userId, { limit: 50 });
      setTransactions(response.transactions || []);
    } catch (err) {
      console.error('TransactionList - fetch error:', err);
      setError('Could not fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDisplayInfo = (transaction: Transaction) => {
    const isOutgoing = transaction.senderId === currentUserId;
    const transactionAmount = Number(transaction.amount) || 0;
    const transactionFee = Number(transaction.fee) || 0;
    const amount = isOutgoing ? -(transactionAmount + transactionFee) : transactionAmount;
    const displayName = transaction.description || (isOutgoing ? 'Money Sent' : 'Money Received');
    
    return { amount, displayName, isOutgoing };
  };

  const filteredTransactions = transactions.filter(transaction => {
    const { displayName } = getTransactionDisplayInfo(transaction);
    return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           transaction.status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">Loading transactions...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-red-500">{error}</div>
      </Card>
    );
  }
  return (
    <Card className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 md:mb-0">Transactions</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Time</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pb-4">Transaction</th>
              <th className="pb-4">Date</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => {
              const { amount, displayName, isOutgoing } = getTransactionDisplayInfo(transaction);
              return (
                <tr key={transaction.id} className="border-t">
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs">{isOutgoing ? '📤' : '📥'}</span>
                      </div>
                      <span>{displayName}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-600">{new Date(transaction.createdAt).toLocaleDateString()}</td>
                  <td className="py-4">
                    <span className={amount < 0 ? 'text-red-600' : 'text-green-600'}>
                      {amount < 0 ? '-' : '+'}RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-600' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
          </div>
        )}
      </div>
    </Card>
  );
};