import { Transaction } from '@/types/dashboard';
import { splitBillRowInfo } from '@/components/bills/SplitBillHistoryDialog';

export type CounterpartyType = 'user' | 'organization' | 'group' | 'campaign' | 'system';

export interface TransactionDisplay {
  /** Who is on the other side, or what the row stands for. */
  name: string;
  /** Short label for the kind of movement, e.g. "Sent", "Deposit", "Split bill". */
  label: string;
  note: string;
  counterpartyType: CounterpartyType;
  counterpartyUserId?: string;
  counterpartyOrganizationId?: string;
  profileImage?: string;
  isOutgoing: boolean;
  /** Signed effect on this wallet in currency units; 0 when it never moved money here. */
  balanceChange: number;
  /** What to print, without sign. */
  displayAmount: number;
  sign: '+' | '-' | '';
  /** Money only moved for completed rows. */
  settled: boolean;
  /** Failed or cancelled: never moved and never will. */
  voided: boolean;
  isSplit: boolean;
  isCovered: boolean;
}

const fullName = (user?: { firstName?: string; lastName?: string } | null) =>
  user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

/**
 * Everything the list, the details panel and the export need to show one row, from the
 * point of view of the account `ownerId` (a user id or an organization id).
 */
export const describeTransaction = (tx: Transaction, ownerId: string | null): TransactionDisplay => {
  const split = splitBillRowInfo(tx);
  const settled = tx.status === 'completed';
  const voided = tx.status === 'failed' || tx.status === 'cancelled';

  if (split) {
    const isCovered = !!tx.coveredShare;
    return {
      name: split.title,
      label: isCovered ? 'Covered for you' : 'Split bill',
      note: split.subtitle.replace(/^Split · /, ''),
      counterpartyType: 'group',
      isOutgoing: false,
      // A covered share was paid from someone else's wallet: no effect on this balance.
      balanceChange: isCovered || !settled ? 0 : split.amount,
      displayAmount: split.amount,
      sign: voided ? '' : split.sign,
      settled,
      voided,
      isSplit: true,
      isCovered,
    };
  }

  const isOutgoing =
    !!ownerId &&
    (tx.senderWallet?.userId === ownerId || tx.senderWallet?.organizationId === ownerId);
  const amount = Number(tx.amount) || 0;
  const fee = Number(tx.fee) || 0;
  const total = Number(tx.totalAmount) || amount + fee;
  const outgoingAmount = total;

  const wallet = isOutgoing ? tx.receiverWallet : tx.senderWallet;
  let name = '';
  let counterpartyType: CounterpartyType = 'system';
  let profileImage: string | undefined;
  if (wallet?.user) {
    name = fullName(wallet.user);
    counterpartyType = 'user';
    profileImage = wallet.user.profile?.profileImage;
  } else if (wallet?.organization) {
    name = wallet.organization.name || '';
    counterpartyType = 'organization';
    profileImage = wallet.organization.profile?.profileImage;
  } else if (wallet?.group) {
    name = wallet.group.name || '';
    counterpartyType = 'group';
    profileImage = wallet.group.profilePictureUrl || undefined;
  } else if (wallet?.publicContribution) {
    name = wallet.publicContribution.title || '';
    counterpartyType = 'campaign';
  }

  const externalName = (tx as Transaction & { externalSenderName?: string }).externalSenderName;
  let label: string;
  switch (tx.type) {
    case 'topup':
      label = 'Deposit';
      name = name || externalName || 'Wallet top-up';
      break;
    case 'withdrawal':
      label = 'Withdrawal';
      name = name || 'Withdrawal';
      break;
    case 'donation':
      label = 'Contribution';
      break;
    case 'vote':
      label = 'Vote';
      break;
    default:
      // Matches the history filter: money out to anything but a person or organization
      // (group, campaign, shared wallet) is a contribution.
      label =
        isOutgoing && counterpartyType !== 'user' && counterpartyType !== 'organization'
          ? 'Contribution'
          : isOutgoing
            ? 'Sent'
            : 'Received';
  }
  if (!name) name = tx.description || externalName || (isOutgoing ? 'Money sent' : 'Money received');

  const note = tx.description && tx.description !== name ? tx.description : '';
  const displayAmount = isOutgoing ? outgoingAmount : amount;

  return {
    name,
    label,
    note,
    counterpartyType,
    counterpartyUserId: wallet?.userId || undefined,
    counterpartyOrganizationId: wallet?.organizationId || undefined,
    profileImage,
    isOutgoing,
    balanceChange: settled ? (isOutgoing ? -outgoingAmount : amount) : 0,
    displayAmount,
    sign: voided ? '' : isOutgoing ? '-' : '+',
    settled,
    voided,
    isSplit: false,
    isCovered: false,
  };
};

/** "Send again" only makes sense for money you sent to a person or an organization. */
export const canSendAgain = (d: TransactionDisplay) =>
  d.isOutgoing &&
  !d.isSplit &&
  ((d.counterpartyType === 'user' && !!d.counterpartyUserId) ||
    (d.counterpartyType === 'organization' && !!d.counterpartyOrganizationId));

/** Chat is between people only. */
export const canMessage = (d: TransactionDisplay) =>
  !d.isSplit && d.counterpartyType === 'user' && !!d.counterpartyUserId;

export const STATUS_BADGES: Record<string, { label: string; className: string } | undefined> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
  },
};

export const amountClassName = (d: TransactionDisplay) => {
  if (d.voided) return 'text-gray-500 dark:text-gray-400 line-through';
  if (d.sign === '+') return 'text-green-700 dark:text-green-400';
  if (d.sign === '-') return 'text-gray-900 dark:text-white';
  return 'text-gray-500 dark:text-gray-400';
};

export const formatMoney = (value: number) =>
  Math.abs(value).toLocaleString('en-US', { maximumFractionDigits: 2 });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** "Today · Oct 28", "Yesterday · Oct 27", "Oct 25" (with the year when it isn't this year). */
export const dayLabel = (iso: string, now = new Date()) => {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  const short = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
  if (days === 0) return `Today · ${short}`;
  if (days === 1) return `Yesterday · ${short}`;
  return short;
};

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export const groupByDay = <T extends { createdAt: string }>(items: T[]) => {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = dayLabel(item.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
};
