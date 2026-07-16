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
import { Target, Loader2, Copy, Check, Share2, QrCode, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createPublicContribution, createCampaignGroup } from "@/helpers/api";
import { ContributionFormFields, ContributionFormValues } from "./ContributionFormFields";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

type Step = "form" | "share";

const emptyForm: ContributionFormValues = {
  title: "", note: "", goalAmount: "", contributionType: "fixed",
  amountPerMember: "", minimumAmount: "", deadline: "",
  visibilityMode: "all", disbursementPolicy: "hold", disbursementRecipientId: "",
};

export default function CreatePublicContributionModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<ContributionFormValues>(emptyForm);
  const [createGroup, setCreateGroup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [contributionId, setContributionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("form");
      setForm(emptyForm);
      setCreateGroup(false);
      setShareLink("");
      setContributionId("");
      setCopied(false);
      setShowQR(false);
    }
  }, [isOpen]);

  const validate = () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", description: "Campaign title is required" });
      return false;
    }
    if (form.contributionType === "fixed" && (!form.amountPerMember || Number(form.amountPerMember) <= 0)) {
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
        title: form.title.trim(),
        note: form.note.trim() || undefined,
        ...(form.goalAmount ? { goalAmount: Number(form.goalAmount) } : {}),
        type: form.contributionType,
        visibilityMode: form.visibilityMode as "all" | "creator_only",
        disbursementPolicy: form.disbursementPolicy,
        ...(form.contributionType === "fixed" && form.amountPerMember
          ? { amountPerMember: Number(form.amountPerMember) }
          : {}),
        ...(form.contributionType === "flexible" && form.minimumAmount
          ? { minimumAmount: Number(form.minimumAmount) }
          : {}),
        ...(form.deadline ? { deadline: new Date(form.deadline).toISOString() } : {}),
      };

      const res = await createPublicContribution(payload);
      const contribution = res?.data?.data;
      if (!contribution?.id) throw new Error("No contribution ID returned");

      if (createGroup) {
        try {
          await createCampaignGroup(contribution.id, {
            name: form.title.trim(),
            description: "",
            isOpen: true,
          });
        } catch {
          toast({ variant: "destructive", description: "Campaign created but community group setup failed." });
        }
      }

      const link = `${window.location.origin}/contribute/${contribution.id}`;
      setShareLink(link);
      setContributionId(contribution.id);
      setStep("share");
      toast({ description: `Campaign "${form.title}" created!` });
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
        await navigator.share({ title: form.title, text: `Contribute to "${form.title}"`, url: shareLink });
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
            <ContributionFormFields
              variant="public"
              values={form}
              onChange={(patch) => setForm((v) => ({ ...v, ...patch }))}
              disabled={isSubmitting}
            />

            {/* Community group toggle */}
            <button
              type="button"
              onClick={() => setCreateGroup((v) => !v)}
              disabled={isSubmitting}
              className="flex items-center justify-between w-full border border-gray-200 dark:border-darkBorder-light rounded-xl p-4"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-green dark:text-brand-gold" />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Create a community group</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Contributors can join and stay connected</p>
                </div>
              </div>
              <div
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  createGroup ? "bg-brand-green dark:bg-brand-gold" : "bg-gray-200 dark:bg-darkBg-interactive"
                } flex items-center px-0.5`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    createGroup ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
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
                disabled={!form.title || isSubmitting}
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
