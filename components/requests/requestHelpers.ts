import { formatDistanceToNowStrict } from 'date-fns';
import type { PaymentRequest } from '@/types/dashboard';
import type { PaymentRequestTab } from '@/helpers/api';

/** Must match PAYMENT_REQUEST_TTL_DAYS and the remind cooldown on the server. */
export const REQUEST_TTL_DAYS = 30;
export const REMIND_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const formatAmount = (amount: number | string, currency = 'RWF') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

export const fullName = (person?: { firstName?: string; lastName?: string } | null) =>
  person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Someone' : 'Someone';

/** The person on the other side of a request, from the viewer's point of view. */
export const otherParty = (request: PaymentRequest, viewerId: string | null) => {
  const iAsked = request.senderId === viewerId;
  const person = iAsked ? request.recipient : request.sender;
  return {
    person,
    name: fullName(person),
    photo: person?.profile?.profileImage || person?.profile?.avatar,
    /** "From" when they asked me, "To" when I asked them. */
    direction: iAsked ? ('To' as const) : ('From' as const),
  };
};

/** Days left before a pending request expires, or null when it is not pending. */
export const daysLeft = (request: PaymentRequest) => {
  if (request.status !== 'pending') return null;
  const expiresAt = new Date(request.createdAt).getTime() + REQUEST_TTL_DAYS * DAY_MS;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / DAY_MS));
};

/** Show the countdown only in the last week, when it matters. */
export const expiryHint = (request: PaymentRequest) => {
  const left = daysLeft(request);
  if (left === null || left > 7) return null;
  if (left === 0) return 'Expires today';
  return `Expires in ${left} day${left === 1 ? '' : 's'}`;
};

export const remindedAgo = (request: PaymentRequest) =>
  request.lastRemindedAt ? formatDistanceToNowStrict(new Date(request.lastRemindedAt), { addSuffix: true }) : null;

/** When the requester may send the next reminder; null when they can now. */
export const nextReminderAt = (request: PaymentRequest) => {
  if (!request.lastRemindedAt) return null;
  const next = new Date(request.lastRemindedAt).getTime() + REMIND_COOLDOWN_MS;
  return next > Date.now() ? new Date(next) : null;
};

export const STATUS_BADGES: Record<PaymentRequest['status'], { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
  paid: { label: 'Paid', className: 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300' },
  declined: { label: 'Declined', className: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300' },
  expired: { label: 'Expired', className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300' },
};

export const TABS: { id: PaymentRequestTab; label: string }[] = [
  { id: 'to_pay', label: 'To pay' },
  { id: 'requested', label: 'Requested' },
  { id: 'history', label: 'History' },
];

export const EMPTY_STATES: Record<PaymentRequestTab, { title: string; body: string }> = {
  to_pay: { title: 'Nothing to pay', body: 'When someone asks you for money, it shows up here.' },
  requested: { title: 'No open requests', body: 'Ask someone for money and you can follow it here.' },
  history: { title: 'No history yet', body: 'Paid, declined, cancelled and expired requests end up here.' },
};
