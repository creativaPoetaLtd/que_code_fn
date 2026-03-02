import Image from "next/image";
import { useEffect, useState } from 'react';
import { getTransactionHistory, getUserWallet, getOrganizationWallet } from '@/helpers/api';
import { Transaction } from '@/types/dashboard';
import { useRouter } from 'next/navigation';
import { useAuthToken } from '@/hooks/use-auth-token';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const transactionDate = new Date(dateString);
    const diffMs = now.getTime() - transactionDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;

    // Show absolute date for transactions older than 24 hours (DD/MM/YY format)
    const day = String(transactionDate.getDate()).padStart(2, '0');
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const year = String(transactionDate.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const getTransactionDisplayInfo = (transaction: Transaction) => {
    const isOutgoing = transaction.senderWallet?.userId === currentUserId;
    const transactionAmount = Number(transaction.amount) || 0;
    const transactionFee = Number(transaction.fee) || 0;
    const amount = isOutgoing ? -(transactionAmount + transactionFee) : transactionAmount;

    // Get recipient/sender name with better fallback logic
    let counterpartyName = 'Transaction';
    let isToOrganization = false;
    let counterpartyProfileImage: string | undefined = undefined;

    if (isOutgoing) {
      // Sending money - check receiver first
      if (transaction.receiverWallet?.organization?.name) {
        counterpartyName = transaction.receiverWallet.organization.name;
        isToOrganization = true;
        counterpartyProfileImage = transaction.receiverWallet.organization.profile?.profileImage;
      } else if (transaction.receiverWallet?.user?.firstName || transaction.receiverWallet?.user?.lastName) {
        counterpartyName = `${transaction.receiverWallet.user.firstName || ''} ${transaction.receiverWallet.user.lastName || ''}`.trim();
        counterpartyProfileImage = transaction.receiverWallet.user.profile?.profileImage;
      } else if (transaction.description) {
        counterpartyName = transaction.description;
      } else {
        counterpartyName = 'Money Sent';
      }
    } else {
      // Receiving money - check sender first
      if (transaction.senderWallet?.organization?.name) {
        counterpartyName = transaction.senderWallet.organization.name;
        isToOrganization = true;
        counterpartyProfileImage = transaction.senderWallet.organization.profile?.profileImage;
      } else if (transaction.senderWallet?.user?.firstName || transaction.senderWallet?.user?.lastName) {
        counterpartyName = `${transaction.senderWallet.user.firstName || ''} ${transaction.senderWallet.user.lastName || ''}`.trim();
        counterpartyProfileImage = transaction.senderWallet.user.profile?.profileImage;
      } else if (transaction.description) {
        counterpartyName = transaction.description;
      } else {
        counterpartyName = 'Money Received';
      }
    }

    const status = transaction.status || 'completed'; // 'completed', 'pending', 'failed'
    const transactionType = isOutgoing ? 'Sent' : 'Received';

    return { amount, counterpartyName, transactionType, isOutgoing, isToOrganization, status, counterpartyProfileImage };
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">Recent transactions</h3>
        </div>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green dark:border-brand-gold mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">Recent transactions</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Unable to load transactions</p>
        </div>
      </div>
    );
  }

  const displayedTransactions = transactions.slice(0, 5);
  if (displayedTransactions.length === 0) {
    return (
      <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">Recent transactions</h3>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start by sending or receiving money!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 dark:border-darkBorder-light">
        <h3 className="text-base sm:text-lg text-[#00313A] dark:text-white font-semibold">Recent transactions</h3>
        <button
          onClick={() => router.push('/transactions')}
          className="relative text-sm text-brand-green dark:text-brand-gold hover:text-brand-green/80 dark:hover:text-brand-goldHover transition-colors duration-200 font-medium group"
        >
          View all
          <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green dark:bg-brand-gold group-hover:w-full transition-all duration-300 ease-out"></span>
        </button>
      </div>

      {/* Mobile & Desktop List View */}
      <div className="divide-y divide-gray-100 dark:divide-darkBorder-light">
        {displayedTransactions.map((transaction) => {
          const { amount, counterpartyName, transactionType, isOutgoing, isToOrganization, status, counterpartyProfileImage } = getTransactionDisplayInfo(transaction);

          // Determine circle color based on transaction type
          const getCircleColor = () => {
            if (isOutgoing) {
              return isToOrganization ? 'bg-blue-600 dark:bg-blue-600 text-white dark:text-white' : 'bg-green-600 dark:bg-green-600 text-white dark:text-white';
            }
            return 'bg-green-600 dark:bg-green-600 text-white dark:text-white';
          };

          const getStatusIcon = () => {
            switch (status) {
              case 'pending':
                return <Clock size={14} className="text-yellow-500" />;
              case 'failed':
                return <AlertCircle size={14} className="text-red-500" />;
              default:
                return <CheckCircle size={14} className="text-green-500" />;
            }
          };

          const getStatusText = () => {
            switch (status) {
              case 'pending':
                return 'Pending';
              case 'failed':
                return 'Failed';
              default:
                return 'Completed';
            }
          };

          const initials = getInitials(counterpartyName);

          return (
            <div
              key={transaction.id}
              className="p-3 sm:p-4 hover:bg-gray-100/50 dark:hover:bg-darkBg-interactive transition-colors duration-200 cursor-pointer"
              onClick={() => setSelectedTransaction(transaction)}
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  profileImage={counterpartyProfileImage}
                  firstName={counterpartyName.split(' ')[0]}
                  lastName={counterpartyName.split(' ')[1] || ''}
                  className="w-10 h-10"
                  userType={isToOrganization ? 'organization' : 'user'}
                />

                {/* Transaction details */}
                <div className="flex-1 min-w-0">
                  {/* First line: Name and Date */}
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate text-sm">{counterpartyName}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {getRelativeTime(transaction.createdAt)}
                    </span>
                  </div>

                  {/* Second line: Amount */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isOutgoing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {isOutgoing ? '-' : '+'} RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          currentUserId={currentUserId}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default RecentTransactions;