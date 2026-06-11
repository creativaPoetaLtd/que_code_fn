"use client"
import React, { useEffect, useState } from 'react';
import { Plus, Ticket, Target, ArrowRight, Users, BarChart3, ChevronDown } from 'lucide-react';
import { useAuthToken } from '@/hooks/use-auth-token';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import baseUrl from '@/helpers/baseUrl';
import { getMyGroupContributions } from '@/helpers/api';
import { getCurrentUserInfo } from '@/utils/tokenUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateGroupModal from '@/components/chat/create-group-modal';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentAction {
  id: string;
  name?: string;
  type: string;
  shortDescription?: string;
  metadata?: {
    actionName?: string;
    subActionName?: string;
    coverImage?: string;
  };
  status: string;
  availability?: { endsAt?: string; startsAt?: string };
  validUntil?: string;
  subActions?: any[];
  totalSubActionBalance?: number;
  currency?: string;
  coverImage?: string;
}

interface PendingContribution {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  type: 'fixed' | 'flexible';
  amountPerMember?: number;
  minimumAmount?: number;
  currency: string;
  goalAmount: number;
  collectedAmount: number;
}

interface RecentActionsProps {
  userId?: string;
  onCreateAction?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtRwf = (n: number, cur = 'RWF') =>
  new Intl.NumberFormat('en-RW', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const isExpired = (endsAt?: string) => !!endsAt && new Date(endsAt) < new Date();

const getDaysRemaining = (endsAt?: string) => {
  if (!endsAt) return null;
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  return days > 0 ? days : 0;
};

const statusClasses: Record<string, string> = {
  valid:     'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  used:      'bg-blue-100  dark:bg-blue-900/30  text-blue-700  dark:text-blue-400  border border-blue-200  dark:border-blue-800',
  expired:   'bg-red-100   dark:bg-red-900/30   text-red-700   dark:text-red-400   border border-red-200   dark:border-red-800',
  published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
  draft:     'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TicketRow({ action, onClick }: { action: RecentAction; onClick: () => void }) {
  const cover = action.coverImage || action.metadata?.coverImage;
  const name  = action.metadata?.actionName || action.name || 'Ticket';
  const tier  = action.metadata?.subActionName;
  const days  = getDaysRemaining(action.validUntil);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-darkBg-interactive hover:bg-emerald-50 dark:hover:bg-darkBg-main border border-gray-100 dark:border-darkBorder-light hover:border-brand-green/30 transition-all text-left group"
    >
      {/* Thumbnail */}
      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-emerald-100 dark:bg-darkBg-main flex items-center justify-center">
        {cover ? (
          <img src={cover} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Ticket size={18} className="text-brand-green dark:text-brand-gold" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
        {tier && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{tier}</p>}
        {days !== null && (
          <p className="text-xs text-brand-green dark:text-brand-gold mt-0.5">
            {days === 0 ? 'Ends today' : `${days}d left`}
          </p>
        )}
      </div>

      {/* Valid badge */}
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
        Valid
      </span>
    </button>
  );
}

function ContributionRow({ c, onClick }: { c: any; onClick: () => void }) {
  const progress = c.goalAmount > 0 ? Math.min((c.collectedAmount / c.goalAmount) * 100, 100) : 0;
  const isPaid = !!c.myPayment;
  const isActive = c.status === 'active';

  const dueLabel = c.type === 'fixed' && c.amountPerMember
    ? fmtRwf(Number(c.amountPerMember), c.currency)
    : c.minimumAmount
    ? `min ${fmtRwf(Number(c.minimumAmount), c.currency)}`
    : 'Flexible';

  const statusBadge: Record<string, string> = {
    active:  'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    expired: 'bg-red-100   dark:bg-red-900/30   text-red-700   dark:text-red-400',
    closed:  'bg-gray-100  dark:bg-darkBg-interactive text-gray-500 dark:text-gray-400',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700 transition-all text-left group"
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-lg flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
        <Target size={18} className="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.groupName}</p>
        <div className="mt-1.5 h-1 w-full bg-gray-200 dark:bg-darkBg-main rounded-full overflow-hidden">
          <div className="h-full bg-brand-green dark:bg-brand-gold rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Right side */}
      <div className="flex-shrink-0 text-right space-y-1">
        {!isActive || isPaid ? (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBadge[c.status] ?? statusBadge.closed}`}>
            {isPaid && isActive ? 'Paid' : c.status.charAt(0).toUpperCase() + c.status.slice(1)}
          </span>
        ) : (
          <>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{dueLabel}</p>
            <p className="text-[10px] text-gray-400">due</p>
          </>
        )}
      </div>
    </button>
  );
}

function OrgActionRow({
  action,
  onClick,
  onContinue,
}: {
  action: RecentAction;
  onClick: () => void;
  onContinue?: () => void;
}) {
  const expired = isExpired(action.availability?.endsAt);
  const days    = getDaysRemaining(action.availability?.endsAt);
  const status  = expired ? 'expired' : action.status?.toLowerCase() || 'draft';
  const statusCls = statusClasses[status] || 'bg-gray-100 dark:bg-darkBg-interactive text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-darkBorder-light';
  const statusLabel = expired ? 'Expired' : status.charAt(0).toUpperCase() + status.slice(1);
  const collected = action.totalSubActionBalance;
  const currency  = action.currency || 'RWF';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-darkBg-interactive hover:bg-emerald-50 dark:hover:bg-darkBg-main border border-gray-100 dark:border-darkBorder-light hover:border-brand-green/30 transition-all text-left group"
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-lg flex-shrink-0 bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center">
        <Ticket size={18} className="text-brand-green dark:text-brand-gold" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{action.name}</p>
        {action.shortDescription && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{action.shortDescription}</p>
        )}
        {collected !== undefined && collected !== null && collected > 0 && (
          <p className="text-xs font-semibold text-brand-green dark:text-brand-gold mt-0.5">
            {fmtRwf(collected, currency)} collected
          </p>
        )}
        {days !== null && !expired && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {days === 0 ? 'Ends today' : `${days}d left`}
          </p>
        )}
      </div>

      {/* Status + draft CTA */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>
          {statusLabel}
        </span>
        {action.status === 'draft' && onContinue && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onContinue(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onContinue(); } }}
            className="text-[11px] text-brand-green dark:text-brand-gold underline underline-offset-2 hover:no-underline"
          >
            Continue
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const RecentActions = ({ userId, onCreateAction }: RecentActionsProps) => {
  const [tickets, setTickets]                   = useState<RecentAction[]>([]);
  const [pendingContributions, setPending]       = useState<PendingContribution[]>([]);
  const [orgActions, setOrgActions]              = useState<RecentAction[]>([]);
  const [isOrganization, setIsOrganization]      = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const { getToken } = useAuthToken();
  const router = useRouter();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const token = getToken();
    if (!token) { setLoading(false); return; }
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      setLoading(true);
      try {
        // Detect account type from the JWT — reliable, no API call needed.
        // The org actions endpoint always returns 200 for any ID, so API-based
        // detection would misidentify every individual user as an organisation.
        const { accountType, organizationId } = getCurrentUserInfo();
        const isOrg = accountType === 'organization';
        setIsOrganization(isOrg);

        if (isOrg) {
          // Org account: fetch this org's published public actions
          const orgId = organizationId ?? userId;
          const orgRes = await axios
            .get(`${baseUrl}/organizations/${orgId}/actions/public`, { headers })
            .catch(() => null);
          const orgData: any[] = orgRes?.data?.data || orgRes?.data || [];
          const sorted = Array.isArray(orgData)
            ? orgData
                .filter((a: any) => !isExpired(a.availability?.endsAt) || a.status === 'draft')
                .sort((a: any, b: any) => {
                  if (a.status === 'draft' && b.status !== 'draft') return -1;
                  if (a.status !== 'draft' && b.status === 'draft') return 1;
                  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
                })
                .slice(0, 3)
            : [];
          setOrgActions(sorted);
          return;
        }

        // Individual user: fetch tickets + group contributions in parallel
        const [qrRes, contribRes] = await Promise.allSettled([
          axios.get(`${baseUrl}/users/${userId}/qr-objects`, { headers }),
          getMyGroupContributions(),
        ]);

        // Tickets: 2 most recent valid, non-expired
        if (qrRes.status === 'fulfilled') {
          const items: RecentAction[] = qrRes.value?.data?.data || qrRes.value?.data || [];
          const recent = Array.isArray(items)
            ? items
                .filter((i) => i.status?.toLowerCase() === 'valid' && !isExpired(i.validUntil))
                .slice(0, 2)
            : [];
          setTickets(recent);
        }

        // Contributions: active ones first (unpaid before paid), capped at 2.
        // Fall back to expired/closed only when there are no active ones at all.
        if (contribRes.status === 'fulfilled') {
          const all: any[] = contribRes.value?.data?.data || contribRes.value?.data || [];
          if (Array.isArray(all)) {
            const active = [
              ...all.filter((c: any) => c.status === 'active' && !c.myPayment),
              ...all.filter((c: any) => c.status === 'active' &&  c.myPayment),
            ];
            const toShow = active.length > 0
              ? active.slice(0, 2)
              : all.filter((c: any) => c.status !== 'active').slice(0, 2);
            setPending(toShow);
          }
        }
      } catch {
        // silently fail — card shows empty state
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]); // getToken intentionally omitted — reads storage, never changes meaningfully

  const goToActions    = () => router.push(`/action/${userId}`);
  const goToContribs   = (groupId?: string) =>
    router.push(`/action/${userId}?tab=contributions${groupId ? `&group=${groupId}` : ''}`);

  const hasContent = isOrganization
    ? orgActions.length > 0
    : tickets.length > 0 || pendingContributions.length > 0;

  return (
    <div className="bg-white dark:bg-darkBg-card rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100 dark:border-darkBorder-light overflow-hidden">

      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-darkBorder-light">
        <h3 className="text-base font-semibold text-[#00313A] dark:text-white">Recent Actions</h3>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-goldHover transition-colors px-3 py-1.5 rounded-full text-sm font-medium text-white dark:text-[#00313A] flex items-center gap-1.5">
              <Plus size={14} />
              <span>Create</span>
              <ChevronDown size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Group */}
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 cursor-pointer"
              onClick={() => setIsCreateGroupOpen(true)}
            >
              <div className="h-8 w-8 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                <Users size={15} className="text-brand-green dark:text-brand-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Group</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create a new group</p>
              </div>
            </DropdownMenuItem>

            {/* Contribution */}
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 cursor-pointer"
              onClick={() => router.push('/chat')}
            >
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Target size={15} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Contribution</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">View &amp; start fundraisers</p>
              </div>
            </DropdownMenuItem>

            {/* Vote */}
            <DropdownMenuItem
              className="flex items-center gap-3 py-2.5 cursor-pointer"
              onClick={() => toast({ description: "Open any group chat to start a vote." })}
            >
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={15} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Vote</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create a group poll</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="p-3 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Loading…</div>
        ) : !hasContent ? (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            {isOrganization ? 'No actions yet' : 'No tickets or contributions yet'}
          </div>
        ) : isOrganization ? (
          /* ── Org: action rows ── */
          <div className="space-y-2">
            {orgActions.map((a) => (
              <OrgActionRow
                key={a.id}
                action={a}
                onClick={goToActions}
                onContinue={goToActions}
              />
            ))}
          </div>
        ) : (
          /* ── Individual: tickets + pending contributions ── */
          <>
            {tickets.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Your Tickets
                </p>
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <TicketRow key={t.id} action={t} onClick={goToActions} />
                  ))}
                </div>
              </div>
            )}

            {pendingContributions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Contributions
                  </p>
                </div>
                <div className="space-y-2">
                  {pendingContributions.map((c: any) => (
                    <ContributionRow
                      key={c.id}
                      c={c}
                      onClick={() => goToContribs(c.groupId)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* View all */}
        {hasContent && !loading && (
          <button
            onClick={isOrganization ? goToActions : () => goToContribs()}
            className="w-full flex items-center justify-center gap-1 text-sm font-medium text-brand-green dark:text-brand-gold hover:opacity-80 transition-opacity pt-1"
          >
            View all
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        token={getToken()}
      />
    </div>
  );
};

export default RecentActions;
