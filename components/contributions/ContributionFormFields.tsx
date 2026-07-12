"use client";

import { Eye, EyeOff, Wallet } from "lucide-react";
import Input from "../ui/Input-ant";

export interface ContributionFormValues {
  title: string;
  note: string;
  goalAmount: string;
  contributionType: "fixed" | "flexible";
  amountPerMember: string;
  minimumAmount: string;
  deadline: string;
  visibilityMode: "all" | "admin_only" | "creator_only";
  disbursementPolicy: "hold" | "auto";
  disbursementRecipientId: string;
}

interface AdminMember {
  userId: string;
  userName?: string;
  userEmail?: string;
  role: string;
}

interface ContributionFormFieldsProps {
  variant: "group" | "public";
  values: ContributionFormValues;
  onChange: (patch: Partial<ContributionFormValues>) => void;
  adminMembers?: AdminMember[];
  disabled?: boolean;
  // When true, type / amountPerMember / minimumAmount are hidden (edit mode — amounts locked)
  editMode?: boolean;
}

const inputClass = "dark:bg-darkBg-interactive dark:border-darkBorder-light dark:text-white";

export function ContributionFormFields({
  variant,
  values,
  onChange,
  adminMembers = [],
  disabled = false,
  editMode = false,
}: ContributionFormFieldsProps) {
  const personLabel = variant === "group" ? "member" : "person";
  const visibilityPrivateKey = variant === "group" ? "admin_only" : "creator_only";
  const visibilityIsPublic = values.visibilityMode === "all";

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Campaign Title <span className="text-red-500">*</span>
        </label>
        <Input
          placeholder="e.g. Trip to Musanze"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Note (Optional)
        </label>
        <Input
          placeholder="What is the money for?"
          value={values.note}
          onChange={(e) => onChange({ note: e.target.value })}
          disabled={disabled}
          className={inputClass}
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
            className={`pl-12 ${inputClass}`}
            value={values.goalAmount}
            onChange={(e) => onChange({ goalAmount: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Contribution type — hidden in edit mode (locked after creation) */}
      {!editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contribution Type
          </label>
          <div className="flex rounded-lg border border-gray-200 dark:border-darkBorder-light overflow-hidden">
            <button
              type="button"
              onClick={() => onChange({ contributionType: "fixed" })}
              disabled={disabled}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                values.contributionType === "fixed"
                  ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                  : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
              }`}
            >
              Fixed per {personLabel}
            </button>
            <button
              type="button"
              onClick={() => onChange({ contributionType: "flexible" })}
              disabled={disabled}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                values.contributionType === "flexible"
                  ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                  : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
              }`}
            >
              Flexible amount
            </button>
          </div>
        </div>
      )}

      {/* Fixed: amount per member — hidden in edit mode */}
      {!editMode && values.contributionType === "fixed" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount per {personLabel} (RWF) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">RWF</span>
            </div>
            <Input
              type="number"
              min={0}
              placeholder="0"
              className={`pl-12 ${inputClass}`}
              value={values.amountPerMember}
              onChange={(e) => onChange({ amountPerMember: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Flexible: minimum — hidden in edit mode */}
      {!editMode && values.contributionType === "flexible" && (
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
              className={`pl-12 ${inputClass}`}
              value={values.minimumAmount}
              onChange={(e) => onChange({ minimumAmount: e.target.value })}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Deadline */}
      {!editMode && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deadline (Optional)
          </label>
          <Input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={values.deadline}
            onChange={(e) => onChange({ deadline: e.target.value })}
            disabled={disabled}
            className={inputClass}
          />
        </div>
      )}

      {/* Visibility toggle */}
      <button
        type="button"
        onClick={() =>
          onChange({ visibilityMode: visibilityIsPublic ? visibilityPrivateKey : "all" })
        }
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
          visibilityIsPublic
            ? "bg-brand-green/10 dark:bg-brand-gold/10 border-brand-green/30 dark:border-brand-gold/30"
            : "bg-gray-50 dark:bg-darkBg-interactive border-gray-200 dark:border-darkBorder-light"
        }`}
      >
        <div className="flex items-center gap-2">
          {visibilityIsPublic ? (
            <Eye size={15} className="text-brand-green dark:text-brand-gold" />
          ) : (
            <EyeOff size={15} className="text-gray-400" />
          )}
          <div className="text-left">
            <p
              className={`text-sm font-medium ${
                visibilityIsPublic
                  ? "text-brand-green dark:text-brand-gold"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              {visibilityIsPublic ? "Contributors visible to all" : `Contributors visible to ${variant === "group" ? "admin" : "you"} only`}
            </p>
            <p className="text-xs text-gray-400">
              {visibilityIsPublic
                ? `${variant === "group" ? "All members" : "Anyone with the link"} can see who has paid`
                : "Only you can see the contributor list"}
            </p>
          </div>
        </div>
        <div
          className={`w-9 h-5 rounded-full transition-colors relative ${
            visibilityIsPublic ? "bg-brand-green dark:bg-brand-gold" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              visibilityIsPublic ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </div>
      </button>

      {/* Disbursement policy */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What happens to the money?
        </label>
        <div className="flex rounded-lg border border-gray-200 dark:border-darkBorder-light overflow-hidden mb-2">
          <button
            type="button"
            onClick={() => onChange({ disbursementPolicy: "hold" })}
            disabled={disabled}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              values.disbursementPolicy === "hold"
                ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
            }`}
          >
            {variant === "group" ? "Hold in group wallet" : "Hold — I'll withdraw later"}
          </button>
          <button
            type="button"
            onClick={() => onChange({ disbursementPolicy: "auto" })}
            disabled={disabled}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              values.disbursementPolicy === "auto"
                ? "bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main"
                : "bg-white dark:bg-darkBg-interactive text-gray-600 dark:text-gray-400"
            }`}
          >
            {variant === "group" ? "Auto-transfer to member" : "Auto — transfer on goal"}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 px-1">
          {values.disbursementPolicy === "hold"
            ? variant === "group"
              ? "Funds stay in the group wallet until withdrawn."
              : "Funds stay in the campaign wallet until you withdraw them."
            : variant === "group"
              ? "Funds transfer to the selected admin when the goal is reached or the campaign is closed."
              : "Funds transfer to your wallet automatically when the goal is reached or the campaign is closed."}
        </p>

        {/* Recipient selector — group auto only */}
        {variant === "group" && values.disbursementPolicy === "auto" && (
          <div className="flex items-center gap-2 mt-2">
            <Wallet size={13} className="text-gray-400 shrink-0" />
            <select
              value={values.disbursementRecipientId}
              onChange={(e) => onChange({ disbursementRecipientId: e.target.value })}
              disabled={disabled}
              className="flex-1 text-xs rounded-lg border border-gray-200 dark:border-darkBorder-light bg-white dark:bg-darkBg-interactive text-gray-700 dark:text-white px-2 py-1.5 focus:outline-none"
            >
              <option value="">Select recipient…</option>
              {adminMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.userName ?? m.userEmail} ({m.role})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
