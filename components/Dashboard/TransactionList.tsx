import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Search, Download } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Transaction } from '@/types/dashboard';
import { UserAvatar } from '@/components/UserAvatar';
import * as XLSX from 'xlsx';
import { getTransactionHistory } from '@/helpers/api';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';
import { useGetAcceptedContactsQuery } from '@/states/contactSlice';
import { Combobox } from '@/components/ui/combobox';
import { X } from 'lucide-react';

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
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Filter states
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);

  // Fetch accepted contacts for filtering
  const token = getToken();
  const { data: contactsData } = useGetAcceptedContactsQuery(token || '', {
    skip: !token
  });

  const contactOptions = React.useMemo(() => {
    if (!contactsData?.contacts) return [];

    return contactsData.contacts.map(contact => {
      const u = contact.otherUser;
      return {
        value: u.id,
        label: `${u.firstName} ${u.lastName}`.trim(),
        profileImage: u.profile?.profileImage
      };
    });
  }, [contactsData]);

  // Debounce searchTerm to avoid re-render on every keystroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!propTransactions) {
      fetchTransactions();
    }
  }, [propTransactions, page, debouncedSearch, startDate, endDate, selectedContactId]); // Trigger fetch when filter changes

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
        endDate,
        contactId: selectedContactId // Pass the selected contact ID
      });
      setTransactions(response.data.transactions || []);
    } catch (err) {
      console.error('TransactionList - fetch error:', err);
      setError('Could not fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionDisplayInfo = (transaction: Transaction) => {
    const isOutgoing = transaction.senderWallet?.userId === currentUserId;
    const transactionAmount = Number(transaction.amount) || 0;
    const transactionFee = Number(transaction.fee) || 0;
    const amount = isOutgoing ? -(transactionAmount + transactionFee) : transactionAmount;

    // Get the counterparty user info
    let counterpartyName = 'Unknown User';
    let counterpartyEmail = '';
    let counterpartyProfileImage: string | undefined = undefined;

    if (isOutgoing && transaction.receiverWallet?.user) {
      // Outgoing: show receiver info
      const user = transaction.receiverWallet.user;
      counterpartyName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      counterpartyEmail = user.email || '';
      counterpartyProfileImage = user.profile?.profileImage;
    } else if (!isOutgoing && transaction.senderWallet?.user) {
      // Incoming: show sender info
      const user = transaction.senderWallet.user;
      counterpartyName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      counterpartyEmail = user.email || '';
      counterpartyProfileImage = user.profile?.profileImage;
    }

    if (!counterpartyName || counterpartyName === '') {
      counterpartyName = transaction.description || (isOutgoing ? 'Money Sent' : 'Money Received');
    }

    return { amount, counterpartyName, counterpartyEmail, counterpartyProfileImage, isOutgoing };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allIds = new Set(filteredTransactions.map(t => t.id));
      setSelectedTransactions(allIds);
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
    setSelectAll(newSelected.size === filteredTransactions.length && filteredTransactions.length > 0);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const { counterpartyName, isOutgoing } = getTransactionDisplayInfo(transaction);

    // Check contact filter
    if (selectedContactId) {
      let matchesContact = false;
      if (isOutgoing && transaction.receiverWallet?.user?.id === selectedContactId) matchesContact = true;
      if (!isOutgoing && transaction.senderWallet?.user?.id === selectedContactId) matchesContact = true;

      if (!matchesContact) return false;
    }

    return counterpartyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.status.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Export displayed transactions to Excel
  const exportToExcel = () => {
    const headers = ['Transaction', 'Date', 'Type', 'Amount', 'Fee', 'Description', 'Status'];
    const data = filteredTransactions.map(tx => {
      const { counterpartyName, amount } = getTransactionDisplayInfo(tx);
      return {
        Transaction: counterpartyName,
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
    <Card className="p-6 bg-white dark:bg-darkBg-card border border-gray-200 dark:border-darkBorder-light">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 md:mb-0 text-gray-900 dark:text-white">Transactions</h2>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-darkBorder-light rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact Filter */}
          <div className="w-full md:w-64 relative">
            <div className="relative">
              <Combobox
                options={contactOptions}
                value={selectedContactId}
                onSelect={setSelectedContactId}
                placeholder="Filter by person..."
                searchPlaceholder="Search contacts..."
                emptyText="No contacts found."
                className="w-full bg-white dark:bg-gray-900 border-gray-300 dark:border-darkBorder-light"
              />
              {selectedContactId && (
                <button
                  onClick={() => setSelectedContactId(undefined)}
                  className="absolute -right-2 -top-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-10"
                  title="Clear filter"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => setStartDate(e.target.value || undefined)}
              className="border border-gray-300 dark:border-darkBorder-light rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => setEndDate(e.target.value || undefined)}
              className="border border-gray-300 dark:border-darkBorder-light rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* CSV export */}
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 bg-[#00B512] dark:bg-[#D4AF37] text-white dark:text-[#00313A] rounded-md text-sm transition-colors"
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
            <tr className="text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-darkBg-interactive border-b border-gray-200 dark:border-darkBorder-light">
              <th className="pb-4 pl-4">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-darkBorder-light dark:bg-darkBg-input"
                />
              </th>
              <th className="pb-4 px-4 font-semibold">Transaction ID</th>
              <th className="pb-4 px-4 font-semibold">User</th>
              <th className="pb-4 px-4 font-semibold">Type</th>
              <th className="pb-4 px-4 font-semibold">Amount</th>
              <th className="pb-4 px-4 font-semibold">Status</th>
              <th className="pb-4 px-4 font-semibold">Date & Time</th>
              <th className="pb-4 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => {
              const { amount, counterpartyName, counterpartyEmail, counterpartyProfileImage, isOutgoing } = getTransactionDisplayInfo(transaction);
              const isSelected = selectedTransactions.has(transaction.id);

              return (
                <tr key={transaction.id} className="border-t border-gray-200 dark:border-darkBorder-light hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors">
                  <td className="py-4 pl-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-darkBorder-light dark:bg-darkBg-input"
                    />
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">{transaction.referenceId}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        profileImage={counterpartyProfileImage}
                        firstName={counterpartyName.split(' ')[0]}
                        lastName={counterpartyName.split(' ')[1] || ''}
                      />
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{counterpartyName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{counterpartyEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{isOutgoing ? 'Payment Sent' : 'Payment Received'}</td>
                  <td className="py-4 px-4">
                    <span className={`text-sm font-semibold ${amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {amount < 0 ? '-' : '+'}RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-md text-sm font-medium inline-block ${transaction.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                      transaction.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                      }`}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="px-4 py-1 bg-white dark:bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-sm font-medium rounded hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                          View
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-darkBg-card border dark:border-darkBorder-light">
                        <DialogHeader>
                          <DialogTitle className="text-gray-900 dark:text-white">Transaction Details</DialogTitle>
                          {/* Prominent amount display */}
                          <p className={`mt-2 text-2xl font-semibold ${amount < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {amount < 0 ? '-' : '+'}RWF {Math.abs(amount).toLocaleString()}
                          </p>
                        </DialogHeader>
                        <DialogDescription className="dark:text-gray-300">
                          <dl className="divide-y divide-gray-200 dark:divide-darkBorder-light text-sm">
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Reference ID</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{transaction.referenceId}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Date & Time</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{new Date(transaction.createdAt).toLocaleString()}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Type</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{isOutgoing ? 'Payment Sent' : 'Payment Received'}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">{isOutgoing ? 'Sent to' : 'Received from'}</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{counterpartyName}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Amount</dt>
                              <dd className="text-gray-900 dark:text-gray-100">RWF {Number(transaction.amount).toLocaleString()}</dd>
                            </div>
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Fee</dt>
                              <dd className="text-gray-900 dark:text-gray-100">RWF {Number(transaction.fee).toLocaleString()}</dd>
                            </div>
                            {transaction.description && (
                              <div className="py-2 flex justify-between">
                                <dt className="font-bold text-gray-700 dark:text-gray-300">Description</dt>
                                <dd className="text-gray-900 dark:text-gray-100">{transaction.description}</dd>
                              </div>
                            )}
                            <div className="py-2 flex justify-between">
                              <dt className="font-bold text-gray-700 dark:text-gray-300">Status</dt>
                              <dd className="text-gray-900 dark:text-gray-100">{transaction.status}</dd>
                            </div>
                          </dl>
                        </DialogDescription>
                        <DialogFooter>
                          <DialogClose className="px-4 py-2 bg-[#00B512] dark:bg-[#D4AF37] text-white dark:text-[#00313A] transition-colors">Close</DialogClose>
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
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
          </div>
        )}
      </div>
      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTransactions.length > 0 ? `Showing page ${page}` : 'No results'}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-darkBorder-light rounded hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            {[1, 2, 3].map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 rounded transition-colors ${page === pageNum
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'border border-gray-300 dark:border-darkBorder-light text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkBg-interactive'
                  }`}
              >
                {pageNum}
              </button>
            ))}
            {transactions.length >= 40 && <span className="text-gray-500 dark:text-gray-400">...</span>}
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={transactions.length < 10}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-darkBorder-light rounded hover:bg-gray-50 dark:hover:bg-darkBg-interactive disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  );
};