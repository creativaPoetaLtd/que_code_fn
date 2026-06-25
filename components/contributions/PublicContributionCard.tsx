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
  Wallet,
  Share2,
  Copy,
  Check,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  contributeToPublic,
  closePublicContribution,
  extendPublicContributionDeadline,
  withdrawPublicContribution,
} from "@/helpers/api";
import { toast } from "@/hooks/use-toast";
import socketService from "@/services/socketService";
import { useRouter } from "next/navigation";

// ─── types ────────────────────────────────────────────────────────────────────

export interface PublicContributionData {
  id: string;
  createdBy: string;
  title: string;
  note?: string | null;
  goalAmount?: number | null;
  collectedAmount: number;
  contributorCount: number;
  type: "fixed" | "flexible";
  amountPerMember?: number | null;
  minimumAmount?: number | null;
  deadline?: string | null;
  visibilityMode: "all" | "creator_only";
  disbursementPolicy: "hold" | "auto";
  status: "active" | "completed" | "closed" | "expired";
  currency: string;
  isCreator?: boolean;
  myPayment?: { amount: number } | null;
  payments?: Array<{ payerId: string; amount: number; payer?: { firstName: string; lastName: string } }>;
  creator?: { id: string; firstName: string; lastName: string };
}

interface Props {
  data: PublicContributionData;
  onUpdated?: (patch: Partial<PublicContributionData>) => void;
  isAuthenticated?: boolean;
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

export function PublicContributionCard({ data, onUpdated, isAuthenticated = true }: Props) {
  const [localStatus, setLocalStatus] = React.useState(data.status);
  const [localCollected, setLocalCollected] = React.useState(Number(data.collectedAmount));
  const [localCount, setLocalCount] = React.useState(data.contributorCount);
  const [hasPaid, setHasPaid] = React.useState(!!data.myPayment);

  type Step =
    | "idle"
    | "enter_amount"
    | "enter_pin"
    | "loading"
    | "confirm_close"
    | "extend_date"
    | "confirm_withdraw";
  const [step, setStep] = React.useState<Step>("idle");
  const [customAmount, setCustomAmount] = React.useState("");
  const [pin, setPin] = React.useState("");
  const [newDeadline, setNewDeadline] = React.useState("");
  const [showShare, setShowShare] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);
  const [showContributors, setShowContributors] = React.useState(false);

  const router = useRouter();

  // ── real-time socket updates ───────────────────────────────────────────────
  React.useEffect(() => {
    const handleUpdated = (ev: any) => {
      if (ev.contributionId !== data.id) return;
      setLocalCollected(Number(ev.collectedAmount));
      setLocalCount(ev.contributorCount);
      setLocalStatus(ev.status);
      onUpdated?.({ collectedAmount: Number(ev.collectedAmount), contributorCount: ev.contributorCount, status: ev.status });
    };
    const handleCompleted = (ev: any) => {
      if (ev.contributionId !== data.id) return;
      setLocalCollected(Number(ev.collectedAmount));
      setLocalStatus("completed");
      onUpdated?.({ collectedAmount: Number(ev.collectedAmount), status: "completed" });
    };
    const handleClosed = (ev: any) => {
      if (ev.contributionId !== data.id) return;
      setLocalStatus(ev.status || "closed");
      onUpdated?.({ status: ev.status || "closed" });
    };
    const handleDisbursed = (ev: any) => {
      if (ev.contributionId !== data.id) return;
      setLocalCollected(0);
      onUpdated?.({ collectedAmount: 0 });
    };

    socketService.onPublicContributionUpdated(handleUpdated);
    socketService.onPublicContributionCompleted(handleCompleted);
    socketService.onPublicContributionClosed(handleClosed);
    socketService.onPublicContributionDisbursed(handleDisbursed);
    return () => {
      socketService.offPublicContributionUpdated(handleUpdated);
      socketService.offPublicContributionCompleted(handleCompleted);
      socketService.offPublicContributionClosed(handleClosed);
      socketService.offPublicContributionDisbursed(handleDisbursed);
    };
  }, [data.id, onUpdated]);

  const shareLink = typeof window !== "undefined"
    ? `${window.location.origin}/contribute/${data.id}`
    : `/contribute/${data.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({ description: "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: data.title, text: `Contribute to "${data.title}"`, url: shareLink });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const goal = Number(data.goalAmount);
  const progress = goal > 0 ? Math.min((localCollected / goal) * 100, 100) : 0;
  const isActive = localStatus === "active";
  const isCompleted = localStatus === "completed";
  const isClosed = localStatus === "closed" || localStatus === "expired";
  const isDeadlinePast = data.deadline && new Date(data.deadline) < new Date();
  const canContribute = isActive && !hasPaid;

  // ── status pill ───────────────────────────────────────────────────────────
  const StatusPill = () => {
    if (isCompleted)
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          <CheckCircle size={11} /> {goal > 0 ? "Goal Reached" : "Completed"}
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

  const getAmount = () =>
    data.type === "fixed" ? Number(data.amountPerMember) : Number(customAmount);

  const handleProceed = () => {
    if (data.type === "flexible") {
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
      const res = await contributeToPublic(data.id, amount, pin);
      const updated = res?.data?.data?.contribution;
      toast({ description: "Contribution successful!" });
      setHasPaid(true);
      if (updated) {
        setLocalCollected(Number(updated.collectedAmount));
        setLocalStatus(updated.status);
        onUpdated?.({ collectedAmount: Number(updated.collectedAmount), status: updated.status });
      }
      setStep("idle");
      setPin("");
      setCustomAmount("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Contribution failed. Try again.";
      toast({ variant: "destructive", description: msg });
      setStep(data.type === "flexible" ? "enter_amount" : "enter_pin");
    }
  };

  const handleClose = async () => {
    setStep("loading");
    try {
      await closePublicContribution(data.id);
      toast({ description: "Campaign closed." });
      setLocalStatus("closed");
      onUpdated?.({ status: "closed" });
      setStep("idle");
    } catch (err: any) {
      toast({ variant: "destructive", description: err?.response?.data?.message || "Failed to close campaign" });
      setStep("idle");
    }
  };

  const handleExtend = async () => {
    if (!newDeadline) {
      toast({ variant: "destructive", description: "Pick a new deadline date" });
      return;
    }
    setStep("loading");
    try {
      await extendPublicContributionDeadline(data.id, new Date(newDeadline).toISOString());
      toast({ description: "Deadline extended." });
      if (localStatus === "expired") setLocalStatus("active");
      onUpdated?.({ deadline: newDeadline, status: localStatus === "expired" ? "active" : localStatus });
      setStep("idle");
      setNewDeadline("");
    } catch (err: any) {
      toast({ variant: "destructive", description: err?.response?.data?.message || "Failed to extend deadline" });
      setStep("extend_date");
    }
  };

  const handleWithdraw = async () => {
    setStep("loading");
    try {
      const res = await withdrawPublicContribution(data.id);
      const withdrawn = res?.data?.data?.withdrawn;
      toast({ description: `${fmt(withdrawn, data.currency)} withdrawn to your wallet!` });
      setStep("idle");
    } catch (err: any) {
      toast({ variant: "destructive", description: err?.response?.data?.message || "Withdrawal failed" });
      setStep("idle");
    }
  };

  const handleCancel = () => {
    setStep("idle");
    setPin("");
    setCustomAmount("");
  };

  return (
    <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow border border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
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

      <div className="p-5 space-y-4">
        {/* header */}
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
                size={15}
                className={
                  isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : isClosed
                    ? "text-gray-400"
                    : "text-brand-green dark:text-brand-gold"
                }
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Contribution Campaign
              </p>
              {data.creator && (
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  by {data.creator.firstName} {data.creator.lastName}
                </p>
              )}
            </div>
          </div>
          <StatusPill />
        </div>

        {/* title + note */}
        <div>
          <p className="text-base font-bold text-gray-900 dark:text-white leading-snug">
            {data.title}
          </p>
          {data.note && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
              {data.note}
            </p>
          )}
        </div>

        {/* progress */}
        {goal > 0 ? (
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
                {localCount} {localCount === 1 ? "contributor" : "contributors"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {fmt(localCollected, data.currency)} collected
            </span>
            <span className="inline-flex items-center gap-1">
              <Users size={11} />
              {localCount} {localCount === 1 ? "contributor" : "contributors"}
            </span>
          </div>
        )}

        {/* details */}
        <div className="flex flex-col gap-1 text-[11px] text-gray-500 dark:text-gray-400">
          {data.type === "fixed" && data.amountPerMember ? (
            <span>
              Fixed:{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {fmt(Number(data.amountPerMember), data.currency)} / person
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
            {!isAuthenticated && isActive && (
              <Button
                size="sm"
                className="w-full h-9 text-sm bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main"
                onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(`/contribute/${data.id}`)}`)}
              >
                Login to Contribute
                <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
            {isAuthenticated && canContribute && (
              <Button
                size="sm"
                className="w-full h-9 text-sm bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main"
                onClick={() =>
                  data.type === "fixed" ? setStep("enter_pin") : setStep("enter_amount")
                }
              >
                Contribute{" "}
                {data.type === "fixed" && data.amountPerMember
                  ? fmt(Number(data.amountPerMember), data.currency)
                  : ""}
                <ArrowRight size={14} className="ml-1" />
              </Button>
            )}
          </>
        )}

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
              className="h-9 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleCancel}>
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

        {step === "enter_pin" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <Lock size={11} className="inline mr-1" />
              Confirm with your PIN
              {data.type === "flexible" && customAmount
                ? ` — ${fmt(Number(customAmount), data.currency)}`
                : data.type === "fixed" && data.amountPerMember
                ? ` — ${fmt(Number(data.amountPerMember), data.currency)}`
                : ""}
            </p>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-9 text-sm tracking-widest"
              autoFocus
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={handleCancel}>
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

        {step === "loading" && (
          <div className="flex items-center justify-center py-3 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-green dark:border-brand-gold border-t-transparent" />
            Processing…
          </div>
        )}

        {/* ── creator controls ── */}
        {data.isCreator && (isActive || localStatus === "expired") && step === "idle" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-4 mt-1 space-y-2">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              Campaign Controls
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
            {/* Withdraw button (hold policy only, some funds collected) */}
            {data.disbursementPolicy === "hold" && localCollected > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[11px] text-brand-green dark:text-brand-gold border-brand-green/30 dark:border-brand-gold/30 hover:bg-brand-green/5 dark:hover:bg-brand-gold/5"
                onClick={() => setStep("confirm_withdraw")}
              >
                <Wallet size={11} className="mr-1" />
                Withdraw {fmt(localCollected, data.currency)}
              </Button>
            )}

            {/* Share row */}
            <button
              onClick={() => { setShowShare((p) => !p); setShowQR(false); }}
              className="w-full flex items-center justify-center gap-1.5 h-7 rounded-md text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-gold hover:bg-gray-50 dark:hover:bg-darkBg-interactive transition-colors border border-dashed border-gray-200 dark:border-darkBorder-light"
            >
              <Share2 size={11} />
              {showShare ? "Hide share" : "Share campaign"}
            </button>

            {showShare && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-darkBg-interactive rounded-lg px-2.5 py-1.5">
                  <span className="flex-1 text-[10px] text-gray-500 dark:text-gray-400 truncate font-mono">{shareLink}</span>
                  <button
                    onClick={copyLink}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-darkBg-card transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check size={12} className="text-brand-green dark:text-brand-gold" /> : <Copy size={12} className="text-gray-400" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-[11px]"
                    onClick={handleNativeShare}
                  >
                    <Share2 size={11} className="mr-1" /> Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 text-[11px]"
                    onClick={() => setShowQR((p) => !p)}
                  >
                    <QrCode size={11} className="mr-1" /> {showQR ? "Hide QR" : "QR Code"}
                  </Button>
                </div>
                {showQR && (
                  <div className="flex justify-center pt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareLink)}`}
                      alt="QR Code"
                      className="rounded-lg border border-gray-100 dark:border-darkBorder-light"
                      width={160}
                      height={160}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* confirm close */}
        {step === "confirm_close" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Close this campaign? People won&apos;t be able to contribute after this.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => setStep("idle")}>
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
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => { setStep("idle"); setNewDeadline(""); }}>
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

        {/* confirm withdraw */}
        {step === "confirm_withdraw" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1 space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
              Withdraw {fmt(localCollected, data.currency)} to your personal wallet?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => setStep("idle")}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-7 text-[11px] bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90"
                onClick={handleWithdraw}
              >
                Withdraw
              </Button>
            </div>
          </div>
        )}

        {/* ── contributor list ── */}
        {data.payments && data.payments.length > 0 && data.isCreator && step === "idle" && (
          <div className="border-t border-gray-100 dark:border-darkBorder-light pt-3 mt-1">
            <button
              onClick={() => setShowContributors((p) => !p)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-green dark:hover:text-brand-gold transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Users size={12} />
                {data.payments.length} contributor{data.payments.length !== 1 ? "s" : ""}
              </span>
              <span className="text-[10px]">{showContributors ? "▲ hide" : "▼ show"}</span>
            </button>
            {showContributors && (
              <div className="mt-2 space-y-1.5">
                {data.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-600 dark:text-gray-300">
                      {p.payer ? `${p.payer.firstName} ${p.payer.lastName}` : "Anonymous"}
                    </span>
                    <span className="font-semibold text-brand-green dark:text-brand-gold">
                      {fmt(Number(p.amount), data.currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
