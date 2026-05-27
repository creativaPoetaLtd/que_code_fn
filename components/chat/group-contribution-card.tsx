"use client";

import React from "react";
import {
  Users,
  CheckCircle,
  Clock,
  Ban,
  Lock,
  ArrowRight,
  CalendarClock,
  Target,
  ShieldAlert,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  contributeToGroup,
  getGroupContribution,
  closeGroupContribution,
  extendGroupContributionDeadline,
} from "@/helpers/api";
import { getCurrentUserId } from "@/utils/tokenUtils";
import { toast } from "@/hooks/use-toast";
import socketService from "@/services/socketService";

// ─── types ───────────────────────────────────────────────────────────────────

export interface GroupContributionData {
  type: "group_contribution";
  contributionId: string;
  groupId: string;
  title: string;
  note?: string;
  goalAmount: number;
  collectedAmount: number;
  contributorCount: number;
  contributionType: "fixed" | "flexible";
  amountPerMember?: number;
  minimumAmount?: number;
  deadline?: string;
  visibilityMode: "all" | "admin_only";
  status: "active" | "completed" | "closed" | "expired";
  currency: string;
  createdByName: string;
  timestamp: string;
}

interface Props {
  data: GroupContributionData;
  isMe: boolean;
  chatId?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number, cur = "RWF") =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtDeadline = (date: string) =>
  new Intl.DateTimeFormat("en-RW", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

// ─── component ───────────────────────────────────────────────────────────────

export function GroupContributionCard({ data, isMe, chatId }: Props) {
  const currentUserId = React.useMemo(() => getCurrentUserId(), []);

  // live state — updated by API check on mount + socket events
  const [localStatus, setLocalStatus] = React.useState(data.status);
  const [localCollected, setLocalCollected] = React.useState(
    data.collectedAmount
  );
  const [localCount, setLocalCount] = React.useState(data.contributorCount);
  const [hasPaid, setHasPaid] = React.useState(false);
  const [loadingCheck, setLoadingCheck] = React.useState(true);

  // contribution flow
  type Step =
    | "idle"
    | "enter_amount"
    | "enter_pin"
    | "loading"
    | "confirm_close"
    | "extend_date";
  const [step, setStep] = React.useState<Step>("idle");
  const [customAmount, setCustomAmount] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [newDeadline, setNewDeadline] = React.useState("");

  // ── on mount: fetch fresh state to know if user already paid ──────────────
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getGroupContribution(
          data.groupId,
          data.contributionId
        );
        const contribution = res?.data?.data;
        if (contribution && !cancelled) {
          setLocalStatus(contribution.status);
          setLocalCollected(Number(contribution.collectedAmount));
          setLocalCount(contribution.contributorCount);
          setHasPaid(!!contribution.myPayment);
        }
      } catch {
        // silently fail — fall back to message snapshot
      } finally {
        if (!cancelled) setLoadingCheck(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data.contributionId, data.groupId]);

  // ── socket: live progress updates ────────────────────────────────────────
  React.useEffect(() => {
    const handleUpdate = (event: any) => {
      if (event.contributionId !== data.contributionId) return;
      setLocalCollected(Number(event.collectedAmount));
      setLocalCount(event.contributorCount);
      setLocalStatus(event.status);
      // if the current user just paid (echoed back from another device)
      if (event.payerId === currentUserId) setHasPaid(true);
    };
    const handleCompleted = (event: any) => {
      if (event.contributionId !== data.contributionId) return;
      setLocalStatus("completed");
      setLocalCollected(Number(event.collectedAmount));
    };
    const handleClosed = (event: any) => {
      if (event.contributionId !== data.contributionId) return;
      setLocalStatus(event.status || "closed");
    };

    socketService.onGroupContributionUpdated(handleUpdate);
    socketService.onGroupContributionCompleted(handleCompleted);
    socketService.onGroupContributionClosed(handleClosed);
    return () => {
      socketService.offGroupContributionUpdated(handleUpdate);
      socketService.offGroupContributionCompleted(handleCompleted);
      socketService.offGroupContributionClosed(handleClosed);
    };
  }, [data.contributionId, currentUserId]);

  // ── derived values ────────────────────────────────────────────────────────
  const goal = Number(data.goalAmount);
  const progress = goal > 0 ? Math.min((localCollected / goal) * 100, 100) : 0;
  const isActive = localStatus === "active";
  const isCompleted = localStatus === "completed";
  const isClosed =
    localStatus === "closed" || localStatus === "expired";
  const canContribute = isActive && !hasPaid && !loadingCheck;
  const isDeadlinePast =
    data.deadline && new Date(data.deadline) < new Date();

  // ── status pill ───────────────────────────────────────────────────────────
  const StatusPill = () => {
    if (isCompleted)
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle size={11} /> Goal Reached
        </span>
      );
    if (isClosed)
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <Ban size={11} />
          {localStatus === "expired" ? "Expired" : "Closed"}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
        <Clock size={11} /> Active
      </span>
    );
  };

  // ── contribute handler ────────────────────────────────────────────────────
  const getAmount = () =>
    data.contributionType === "fixed"
      ? Number(data.amountPerMember)
      : Number(customAmount);

  const handleProceed = () => {
    if (data.contributionType === "flexible") {
      const amt = Number(customAmount);
      if (!amt || amt <= 0) {
        toast({ variant: "destructive", description: "Enter a valid amount" });
        return;
      }
      if (data.minimumAmount && amt < Number(data.minimumAmount)) {
        toast({
          variant: "destructive",
          description: `Minimum contribution is ${fmt(Number(data.minimumAmount), data.currency)}`,
        });
        return;
      }
    }
    setStep("enter_pin");
  };

  const handleContribute = async () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast({ variant: "destructive", description: "Enter your 4-digit PIN" });
      return;
    }
    setStep("loading");
    try {
      const amount = getAmount();
      await contributeToGroup(
        data.groupId,
        data.contributionId,
        amount,
        pin
      );
      toast({ description: "Contribution successful!" });
      setHasPaid(true);
      // Don't touch localCollected/localCount here — the socket event the
      // backend emits immediately after the DB commit will set both with the
      // authoritative server values. Updating here too causes a double-count
      // when the socket arrives before this callback finishes.
      setStep("idle");
      setPin("");
      setCustomAmount("");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Contribution failed. Try again.";
      toast({ variant: "destructive", description: msg });
      setStep(
        data.contributionType === "flexible" ? "enter_amount" : "enter_pin"
      );
    }
  };

  const handleCancel = () => {
    setStep("idle");
    setPin("");
    setCustomAmount("");
  };

  // ── admin: close campaign ────────────────────────────────────────────────
  const handleClose = async () => {
    setStep("loading");
    try {
      await closeGroupContribution(data.groupId, data.contributionId);
      toast({ description: "Campaign closed." });
      setLocalStatus("closed");
      setStep("idle");
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err?.response?.data?.message || "Failed to close campaign",
      });
      setStep("idle");
    }
  };

  // ── admin: extend deadline ────────────────────────────────────────────────
  const handleExtend = async () => {
    if (!newDeadline) {
      toast({ variant: "destructive", description: "Pick a new deadline date" });
      return;
    }
    setStep("loading");
    try {
      await extendGroupContributionDeadline(
        data.groupId,
        data.contributionId,
        new Date(newDeadline).toISOString()
      );
      toast({ description: "Deadline extended." });
      setStep("idle");
      setNewDeadline("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err?.response?.data?.message || "Failed to extend deadline",
      });
      setStep("extend_date");
    }
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-[280px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
      {/* accent strip */}
      <div
        className={
          isCompleted
            ? "h-1 bg-green-500"
            : isClosed
            ? "h-1 bg-gray-400"
            : "h-1 bg-brand-green dark:bg-brand-gold"
        }
      />

      <div className="p-4 space-y-3">
        {/* header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-full ${
                isCompleted
                  ? "bg-green-100 dark:bg-green-900/30"
                  : isClosed
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-brand-green/10 dark:bg-brand-gold/10"
              }`}
            >
              <Target
                size={14}
                className={
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isClosed
                    ? "text-gray-400"
                    : "text-brand-green dark:text-brand-gold"
                }
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Contribution Request
            </span>
          </div>
          <StatusPill />
        </div>

        {/* title + note */}
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
            {data.title}
          </p>
          {data.note && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
              {data.note}
            </p>
          )}
        </div>

        {/* progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {fmt(localCollected, data.currency)}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {fmt(goal, data.currency)} goal
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {Math.round(progress)}% collected
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
              <Users size={11} />
              {localCount}{" "}
              {localCount === 1 ? "contributor" : "contributors"}
            </span>
          </div>
        </div>

        {/* details row */}
        <div className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          {data.contributionType === "fixed" && data.amountPerMember ? (
            <span>
              Fixed:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {fmt(Number(data.amountPerMember), data.currency)} / member
              </span>
            </span>
          ) : (
            <span>
              Flexible
              {data.minimumAmount
                ? ` (min ${fmt(Number(data.minimumAmount), data.currency)})`
                : ""}
            </span>
          )}
          {data.deadline && (
            <span
              className={`inline-flex items-center gap-1 ${
                isDeadlinePast ? "text-red-500 dark:text-red-400" : ""
              }`}
            >
              <CalendarClock size={11} />
              {isDeadlinePast ? "Deadline passed " : "Due "}
              {fmtDeadline(data.deadline)}
            </span>
          )}
        </div>

        {/* ── contribute flow ── */}
        {step === "idle" && (
          <>
            {hasPaid && (
              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                <CheckCircle size={13} />
                You have contributed
              </div>
            )}
            {canContribute && (
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main"
                onClick={() =>
                  data.contributionType === "fixed"
                    ? setStep("enter_pin")
                    : setStep("enter_amount")
                }
              >
                Contribute{" "}
                {data.contributionType === "fixed" && data.amountPerMember
                  ? fmt(Number(data.amountPerMember), data.currency)
                  : ""}
                <ArrowRight size={13} className="ml-1" />
              </Button>
            )}
          </>
        )}

        {/* flexible amount entry */}
        {step === "enter_amount" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter amount{" "}
              {data.minimumAmount
                ? `(min ${fmt(Number(data.minimumAmount), data.currency)})`
                : ""}
            </p>
            <Input
              type="number"
              placeholder="Amount (RWF)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90"
                onClick={handleProceed}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* PIN entry */}
        {step === "enter_pin" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <Lock size={11} className="inline mr-1" />
              Confirm with your PIN
              {data.contributionType === "flexible" && customAmount
                ? ` — ${fmt(Number(customAmount), data.currency)}`
                : data.contributionType === "fixed" && data.amountPerMember
                ? ` — ${fmt(Number(data.amountPerMember), data.currency)}`
                : ""}
            </p>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="h-8 text-sm tracking-widest"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90"
                onClick={handleContribute}
              >
                Pay
              </Button>
            </div>
          </div>
        )}

        {/* loading */}
        {step === "loading" && (
          <div className="flex items-center justify-center py-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-green dark:border-brand-gold border-t-transparent" />
            Processing…
          </div>
        )}

        {/* ── admin controls (only shown to campaign creator) ── */}
        {isMe && (isActive || localStatus === "expired") && step === "idle" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Admin Controls
            </p>
            <div className="flex gap-2">
              {isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-[11px] border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
                  onClick={() => setStep("confirm_close")}
                >
                  <ShieldAlert size={11} className="mr-1" /> Close
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[11px] text-brand-green dark:text-brand-gold border-brand-green/30 dark:border-brand-gold/30 hover:bg-brand-green/5 dark:hover:bg-brand-gold/5"
                onClick={() => setStep("extend_date")}
              >
                <CalendarPlus size={11} className="mr-1" /> Extend
              </Button>
            </div>
          </div>
        )}

        {/* confirm close */}
        {step === "confirm_close" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Close this campaign? Members won't be able to contribute after this.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[11px]"
                onClick={() => setStep("idle")}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px] bg-red-500 hover:bg-red-600 text-white"
                onClick={handleClose}
              >
                Yes, Close
              </Button>
            </div>
          </div>
        )}

        {/* extend deadline */}
        {step === "extend_date" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1 space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">New deadline date:</p>
            <Input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-[11px]"
                onClick={() => { setStep("idle"); setNewDeadline(""); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px] bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90"
                onClick={handleExtend}
              >
                Extend
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
