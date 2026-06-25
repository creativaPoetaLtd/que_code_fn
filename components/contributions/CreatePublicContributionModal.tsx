"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Target,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  QrCode,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPublicContribution } from "@/helpers/api";
import Input from "../ui/Input-ant";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = "form" | "share";
type ContributionType = "fixed" | "flexible";
type VisibilityMode = "all" | "creator_only";

export default function CreatePublicContributionModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("form");

  // form state
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [contributionType, setContributionType] = useState<ContributionType>("fixed");
  const [amountPerMember, setAmountPerMember] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("all");
  const [disbursementPolicy, setDisbursementPolicy] = useState<"hold" | "auto">("hold");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // share state
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setTitle("");
      setNote("");
      setGoalAmount("");
      setContributionType("fixed");
      setAmountPerMember("");
      setMinimumAmount("");
      setDeadline("");
      setVisibilityMode("all");
      setDisbursementPolicy("hold");
      setShareLink("");
      setCopied(false);
      setShowQR(false);
    }
  }, [isOpen]);

  const validate = () => {
    if (!title.trim()) {
      toast({ variant: "destructive", description: "Campaign title is required" });
      return false;
    }
    if (contributionType === "fixed" && (!amountPerMember || Number(amountPerMember) <= 0)) {
      toast({ variant: "destructive", description: "Enter the amount per person" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        note: note.trim() || undefined,
        ...(goalAmount ? { goalAmount: Number(goalAmount) } : {}),
        type: contributionType,
        visibilityMode,
        disbursementPolicy,
        ...(contributionType === "fixed" && amountPerMember
          ? { amountPerMember: Number(amountPerMember) }
          : {}),
        ...(contributionType === "flexible" && minimumAmount
          ? { minimumAmount: Number(minimumAmount) }
          : {}),
        ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
      };

      const res = await createPublicContribution(payload);
      const contribution = res?.data?.data;
      if (!contribution?.id) throw new Error("No contribution ID returned");

      const link = `${window.location.origin}/contribute/${contribution.id}`;
      setShareLink(link);
      setStep("share");
      toast({ description: `Campaign "${title}" created!` });
      onCreated?.();
    } catch (error: any) {
      toast({
        variant: "destructive",
        description:
          error?.response?.data?.message || "Failed to create campaign. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast({ description: "Link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Contribute to "${title}"`, url: shareLink });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  };

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg dark:bg-darkBg-card dark:border-darkBorder-light max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
              <Target size={20} className="text-brand-green dark:text-brand-gold" />
            </div>
            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">
              {step === "form" ? "Create Contribution Campaign" : "Share Your Campaign"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
            {step === "form"
              ? "Create a campaign and share the link with anyone — no group needed."
              : "Send the link or QR code to anyone you want to contribute."}
          </DialogDescription>
        </DialogHeader>

        {/* ─── FORM STEP ─── */}
        {step === "form" && (
          <div className="py-2 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Campaign Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Trip to Musanze"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Note (Optional)
              </label>
              <Input
                placeholder="What is the money for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
              />
            </div>

            {/* Goal amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Amount (RWF) <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  className="pl-12 dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Contribution type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contribution Type
              </label>
              <div className="flex rounded-lg border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                <button
                  type="button"
                  onClick={() => setContributionType("fixed")}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    contributionType === "fixed"
                      ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                      : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Fixed per person
                </button>
                <button
                  type="button"
                  onClick={() => setContributionType("flexible")}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    contributionType === "flexible"
                      ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                      : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Flexible amount
                </button>
              </div>
            </div>

            {contributionType === "fixed" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount per Person (RWF) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    className="pl-12 dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                    value={amountPerMember}
                    onChange={(e) => setAmountPerMember(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {contributionType === "flexible" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Minimum Amount (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    placeholder="No minimum"
                    className="pl-12 dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
                    value={minimumAmount}
                    onChange={(e) => setMinimumAmount(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            )}

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline (Optional)
              </label>
              <Input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                disabled={isSubmitting}
                className="dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white"
              />
            </div>

            {/* Visibility toggle */}
            <button
              type="button"
              onClick={() => setVisibilityMode((v) => (v === "all" ? "creator_only" : "all"))}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                visibilityMode === "all"
                  ? "bg-brand-green/10 dark:bg-brand-gold/10 border-brand-green/30 dark:border-brand-gold/30"
                  : "bg-gray-50 dark:bg-darkBg-interactive border-gray-200 dark:border-darkBorder-light"
              }`}
            >
              <div className="flex items-center gap-2">
                {visibilityMode === "all" ? (
                  <Eye size={15} className="text-brand-green dark:text-brand-gold" />
                ) : (
                  <EyeOff size={15} className="text-gray-400" />
                )}
                <div className="text-left">
                  <p
                    className={`text-sm font-medium ${
                      visibilityMode === "all"
                        ? "text-brand-green dark:text-brand-gold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {visibilityMode === "all" ? "Contributors visible to all" : "Contributors visible to you only"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {visibilityMode === "all"
                      ? "Anyone with the link can see who has paid"
                      : "Only you can see the contributor list"}
                  </p>
                </div>
              </div>
              <div
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  visibilityMode === "all" ? "bg-brand-green dark:bg-brand-gold" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    visibilityMode === "all" ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
            </button>

            {/* Disbursement policy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What happens to the money?
              </label>
              <div className="flex rounded-lg border border-gray-200 dark:border-darkBorder-light overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDisbursementPolicy("hold")}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    disbursementPolicy === "hold"
                      ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                      : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Hold — I'll withdraw later
                </button>
                <button
                  type="button"
                  onClick={() => setDisbursementPolicy("auto")}
                  disabled={isSubmitting}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    disbursementPolicy === "auto"
                      ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                      : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Auto — transfer on goal
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 px-1">
                {disbursementPolicy === "hold"
                  ? "Funds stay in the campaign wallet until you withdraw them."
                  : "Funds transfer to your wallet automatically when the goal is reached or the campaign is closed."}
              </p>
            </div>
          </div>
        )}

        {/* ─── SHARE STEP ─── */}
        {step === "share" && (
          <div className="py-4 space-y-5">
            <div className="bg-brand-green/5 dark:bg-brand-gold/5 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Shareable Link
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-darkBg-interactive border border-gray-200 dark:border-darkBorder-light rounded-lg px-3 py-2 text-xs text-gray-700 dark:text-gray-300 truncate font-mono">
                  {shareLink}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyLink}
                  className="shrink-0 h-8 w-8 p-0 dark:border-darkBorder-light"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </Button>
              </div>
              <Button
                size="sm"
                onClick={handleNativeShare}
                className="w-full h-9 bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:opacity-90"
              >
                <Share2 size={14} className="mr-2" /> Share Link
              </Button>
            </div>

            {/* QR code toggle */}
            <button
              type="button"
              onClick={() => setShowQR((v) => !v)}
              className="w-full flex items-center justify-center gap-2 text-xs text-brand-green dark:text-brand-gold font-medium py-2"
            >
              <QrCode size={14} />
              {showQR ? "Hide QR Code" : "Show QR Code"}
            </button>

            {showQR && (
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrApiUrl}
                    alt="QR code for contribution link"
                    width={200}
                    height={200}
                    className="rounded"
                  />
                </div>
                <p className="text-[11px] text-gray-400">Scan to contribute</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          {step === "form" ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto dark:border-darkBorder-light dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!title || isSubmitting}
                className="w-full sm:w-auto bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={onClose}
              className="w-full sm:w-auto bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main"
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
