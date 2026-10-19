import Image from "next/image";
import { useEffect, useState } from 'react';
import { getTransactionHistory, getUserWallet, getOrganizationWallet } from '@/helpers/api';
import { Transaction } from '@/types/dashboard';
import { useRouter } from 'next/navigation';
import { getValidToken } from '@/utils/tokenUtils';
import { getUserIdFromToken, isTokenExpired } from '@/utils/jwtUtils';
import { CheckCircle, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { TransactionDetailsModal } from '@/components/TransactionDetailsModal';
import { cn } from '@/lib/utils';
import { DASHBOARD_SURFACE } from './Dashboard/DashboardCard';
import SplitBillHistoryDialog, { splitBillRowInfo } from '@/components/bills/SplitBillHistoryDialog';

export const RecentTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserWalletId, setCurrentUserWalletId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        // Read the token synchronously from storage (same source api.ts trusts).
        // The stateful useAuthToken().getToken() is null on first mount, and this
        // effect only runs once — using it left the panel permanently errored.
        const token = getValidToken();
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
    const split = splitBillRowInfo(transaction);
    if (split) {
      return {
        amount: split.amount,
        counterpartyName: split.title,
        transactionType: 'Split',
        isOutgoing: false,
        isToOrganization: false,
        status: transaction.status || 'completed',
        counterpartyProfileImage: undefined as string | undefined,
        split,
      };
    }

    // Determine if it's outgoing based on sender ownership matching current identity
    const isOutgoing =
      transaction.senderWallet?.userId === currentUserId ||
      transaction.senderWallet?.organizationId === currentUserId;
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

    return { amount, counterpartyName, transactionType, isOutgoing, isToOrganization, status, counterpartyProfileImage, split: null };
  };

  if (loading) {
    return (
      <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">Recent transactions</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green dark:border-brand-gold mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-3">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">Recent transactions</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <p className="text-red-500 dark:text-red-400 font-medium">{error}</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Unable to load transactions</p>
        </div>
      </div>
    );
  }

  const displayedTransactions = transactions.slice(0, 5);
  if (displayedTransactions.length === 0) {
    return (
      <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
          <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">Recent transactions</h3>
        </div>
        <div className="px-4 py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Start by sending or receiving money!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(DASHBOARD_SURFACE, "overflow-hidden")}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 dark:border-darkBorder-light">
        <h3 className="text-sm font-semibold text-[#00313A] dark:text-white">Recent transactions</h3>
        <button
          onClick={() => router.push('/transactions')}
          className="text-xs font-semibold text-brand-green transition-opacity hover:opacity-70 dark:text-brand-gold"
        >
          View all
        </button>
      </div>

      {/* Mobile & Desktop List View */}
      <div className="divide-y divide-gray-100 dark:divide-darkBorder-light">
        {displayedTransactions.map((transaction) => {
          const { amount, counterpartyName, transactionType, isOutgoing, isToOrganization, status, counterpartyProfileImage, split } = getTransactionDisplayInfo(transaction);
          const sign = split ? split.sign : isOutgoing ? '-' : '+';
          const amountColor = split?.sign === ''
            ? 'text-gray-500 dark:text-gray-400'
            : isOutgoing ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400';

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
              className="group/txn px-4 py-2.5 hover:bg-gray-100/50 dark:hover:bg-darkBg-interactive transition-colors duration-200 cursor-pointer"
              onClick={() => setSelectedTransaction(transaction)}
            >
              {/* Who and when on the left, how much on the right — the amount used
                  to sit on its own line under the name, which doubled the row's
                  height for two short strings. */}
              <div className="flex items-center gap-3">
                <UserAvatar
                  userId={(isOutgoing ? transaction.receiverWallet?.userId : transaction.senderWallet?.userId) ?? undefined}
                  profileImage={counterpartyProfileImage}
                  firstName={counterpartyName.split(' ')[0]}
                  lastName={counterpartyName.split(' ')[1] || ''}
                  className="w-9 h-9 flex-shrink-0"
                  userType={isToOrganization ? 'organization' : 'user'}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{counterpartyName}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getRelativeTime(transaction.createdAt)}
                  </span>
                </div>

                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <span className={`whitespace-nowrap text-[13px] font-semibold tabular-nums sm:text-sm ${amountColor}`}>
                    {sign} RWF {isNaN(Math.abs(amount)) ? '0' : Math.abs(amount).toLocaleString()}
                  </span>
                  {/* Hidden until hover on pointer devices; always visible on touch,
                      where there is no hover to reveal it. Not shown for a split-bill
                      row — there's nothing to "send again" for a bill split. */}
                  {!split && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const recipientData = {
                                id: isOutgoing ? transaction.receiverWallet?.userId : transaction.senderWallet?.userId,
                                name: counterpartyName,
                                phone: '',
                                avatar: counterpartyProfileImage || '',
                                type: isToOrganization ? 'organization' : 'user'
                            };
                            sessionStorage.setItem('selectedRecipient', JSON.stringify(recipientData));
                            sessionStorage.setItem('initialAmount', transaction.amount.toString());
                            router.push('/home/transfer/amount');
                        }}
                        title="Send again"
                        aria-label="Send again"
                        className="rounded-full p-1.5 text-gray-400 opacity-100 transition hover:text-blue-600 focus-visible:opacity-100 sm:opacity-0 sm:group-hover/txn:opacity-100 dark:hover:text-blue-400"
                    >
                        <RefreshCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && splitBillRowInfo(selectedTransaction) && (
        <SplitBillHistoryDialog transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
      )}
      {selectedTransaction && !splitBillRowInfo(selectedTransaction) && (
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