import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Search, Eye, Download } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Transaction } from '@/types/dashboard';
import * as XLSX from 'xlsx';
import { getTransactionHistory } from '@/helpers/api';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';

interface TransactionListProps {
  transactions?: Transaction[];
}

export const TransactionList = ({ transactions: propTransactions }: TransactionListProps) => {
  const { getToken } = useAuthToken();
   const [transactions, setTransactions] = useState<Transaction[]>(propTransactions || []);
  const [loading, setLoading] = useState(!propTransactions);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);

  // Debounce searchTerm to avoid re-render on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!propTransactions) {
      fetchTransactions();
    }
  }, [propTransactions, page, debouncedSearch, startDate, endDate]);

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
const response = await getTransactionHistory(userId, {
  page,
  limit: 10,
  search: debouncedSearch || undefined,
  startDate,
  endDate
});
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
  
  // Export displayed transactions to Excel
  const exportToExcel = () => {
    const headers = ['Transaction', 'Date', 'Type', 'Amount', 'Fee', 'Description', 'Status'];
    const data = filteredTransactions.map(tx => {
      const { displayName, amount } = getTransactionDisplayInfo(tx);
      return {
        Transaction: displayName,
        Date: new Date(tx.createdAt).toLocaleString(),
        Type: tx.type,
        Amount: amount,
        Fee: tx.fee,
        Description: tx.description || '',
        Status: tx.status,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 12 }, 
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'transactions.xlsx');
  };

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
          {/* Date range filter */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || undefined)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || undefined)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* CSV export */}
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
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
              <th className="pb-4">Actions</th>
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
              <td className="py-4">
                <Dialog>
                    <DialogTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-full">
                      <Eye className="h-5 w-5 text-gray-600" />
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Transaction Details</DialogTitle>
                      {/* Prominent amount display */}
                      <p className={`mt-2 text-2xl font-semibold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}> 
                        {amount < 0 ? '-' : '+'}RWF {Math.abs(amount).toLocaleString()}
                      </p>
                    </DialogHeader>
                    <DialogDescription>
                      <dl className="divide-y divide-gray-200 text-sm">
                        <div className="py-2 flex justify-between">
                          <dt className="font-bold text-gray-700">Date</dt>
                          <dd className="text-gray-900">{new Date(transaction.createdAt).toLocaleString()}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="font-bold text-gray-700">Type</dt>
                          <dd className="text-gray-900">{transaction.type}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="font-bold text-gray-700">Amount</dt>
                          <dd className="text-gray-900">RWF {Number(transaction.amount).toLocaleString()}</dd>
                        </div>
                        <div className="py-2 flex justify-between">
                          <dt className="font-bold text-gray-700">Fee</dt>
                          <dd className="text-gray-900">RWF {Number(transaction.fee).toLocaleString()}</dd>
                        </div>
                        {transaction.description && (
                          <div className="py-2 flex justify-between">
                            <dt className="font-bold text-gray-700">Description</dt>
                            <dd className="text-gray-900">{transaction.description}</dd>
                          </div>
                        )}
                        <div className="py-2 flex justify-between">
                          <dt className="font-bold text-gray-700">Status</dt>
                          <dd className="text-gray-900">{transaction.status}</dd>
                        </div>
                      </dl>
                    </DialogDescription>
                    <DialogFooter>
                      <DialogClose className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Close</DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">Page {page}</div>
        <div className="space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={transactions.length < 10}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  );
};