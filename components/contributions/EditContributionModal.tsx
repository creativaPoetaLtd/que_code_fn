"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Loader2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateGroupContribution, updatePublicContribution } from "@/helpers/api";
import { ContributionFormFields, ContributionFormValues } from "./ContributionFormFields";

interface AdminMember {
  userId: string;
  userName?: string;
  userEmail?: string;
  role: string;
}

interface EditContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: "group" | "public";
  contributionId: string;
  groupId?: string;
  initial: {
    title: string;
    note?: string | null;
    goalAmount?: number | null;
    visibilityMode: "all" | "admin_only" | "creator_only";
    disbursementPolicy: "hold" | "auto";
    disbursementRecipientId?: string | null;
    contributionType: "fixed" | "flexible";
    allowContributorJoin?: boolean;
  };
  hasLinkedGroup?: boolean;
  adminMembers?: AdminMember[];
  onSaved?: (patch: Record<string, any>) => void;
}

export function EditContributionModal({
  isOpen,
  onClose,
  variant,
  contributionId,
  groupId,
  initial,
  hasLinkedGroup = false,
  adminMembers = [],
  onSaved,
}: EditContributionModalProps) {
  const [allowContributorJoin, setAllowContributorJoin] = useState(
    initial.allowContributorJoin ?? false
  );
  const [values, setValues] = useState<ContributionFormValues>(() => ({
    title: initial.title,
    note: initial.note ?? "",
    goalAmount: initial.goalAmount != null ? String(initial.goalAmount) : "",
    contributionType: initial.contributionType,
    amountPerMember: "",
    minimumAmount: "",
    deadline: "",
    visibilityMode: initial.visibilityMode,
    disbursementPolicy: initial.disbursementPolicy,
    disbursementRecipientId: initial.disbursementRecipientId ?? "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset whenever modal opens with new initial data
  useState(() => {
    if (isOpen) {
      setValues({
        title: initial.title,
        note: initial.note ?? "",
        goalAmount: initial.goalAmount != null ? String(initial.goalAmount) : "",
        contributionType: initial.contributionType,
        amountPerMember: "",
        minimumAmount: "",
        deadline: "",
        visibilityMode: initial.visibilityMode,
        disbursementPolicy: initial.disbursementPolicy,
        disbursementRecipientId: initial.disbursementRecipientId ?? "",
      });
    }
  });

  const handleSave = async () => {
    if (!values.title.trim()) {
      toast({ variant: "destructive", description: "Title cannot be empty" });
      return;
    }
    if (values.goalAmount && Number(values.goalAmount) <= 0) {
      toast({ variant: "destructive", description: "Goal amount must be greater than 0" });
      return;
    }
    if (variant === "group" && values.disbursementPolicy === "auto" && !values.disbursementRecipientId) {
      toast({ variant: "destructive", description: "Select a recipient for auto-transfer" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        title: values.title.trim(),
        note: values.note.trim() || null,
        goalAmount: values.goalAmount ? Number(values.goalAmount) : null,
        visibilityMode: values.visibilityMode,
        disbursementPolicy: values.disbursementPolicy,
      };

      if (variant === "group") {
        payload.disbursementRecipientId = values.disbursementPolicy === "auto"
          ? values.disbursementRecipientId
          : null;
        await updateGroupContribution(groupId!, contributionId, payload);
      } else {
        if (hasLinkedGroup) payload.allowContributorJoin = allowContributorJoin;
        await updatePublicContribution(contributionId, payload);
      }

      toast({ description: "Campaign updated successfully" });
      onSaved?.(payload);
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        description: err?.response?.data?.message || "Failed to update. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-lg dark:bg-darkBg-card dark:border-darkBorder-light max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
              <Pencil size={18} className="text-brand-green dark:text-brand-gold" />
            </div>
            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">
              Edit Campaign
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
            Update title, note, goal, visibility, or disbursement settings.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <ContributionFormFields
            variant={variant}
            values={values}
            onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            adminMembers={adminMembers}
            disabled={isSubmitting}
            editMode
          />
          {variant === "public" && hasLinkedGroup && (
            <div className="border border-gray-200 dark:border-darkBorder-light rounded-xl p-4">
              <button
                type="button"
                onClick={() => setAllowContributorJoin((v) => !v)}
                disabled={isSubmitting}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-brand-green dark:text-brand-gold" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Let contributors join group</p>
                    <p className="text-xs text-gray-500">Show join prompt after a successful contribution</p>
                  </div>
                </div>
                <div
                  className={`w-10 h-5 rounded-full transition-colors ${
                    allowContributorJoin ? "bg-brand-green dark:bg-brand-gold" : "bg-gray-200 dark:bg-darkBg-interactive"
                  } flex items-center px-0.5`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      allowContributorJoin ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto dark:border-darkBorder-light dark:text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!values.title || isSubmitting}
            className="w-full sm:w-auto bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
