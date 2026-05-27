"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Target, Loader2, Users, Eye, EyeOff } from "lucide-react"
import type { Conversation } from "@/types/chat.types"
import { toast } from "@/hooks/use-toast"
import { getCurrentUserId } from "@/utils/tokenUtils"
import { useSendMessageMutation } from "@/states/chatSlice"
import { createGroupContribution } from "@/helpers/api"
import Input from "../ui/Input-ant"

interface Props {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  creatorName?: string
}

type ContributionType = "fixed" | "flexible"
type VisibilityMode = "all" | "admin_only"

export default function CreateContributionModal({
  isOpen,
  onClose,
  conversation,
  creatorName = "Admin",
}: Props) {
  const currentUserId = getCurrentUserId()
  const [sendMessageHttp] = useSendMessageMutation()

  const [title, setTitle] = useState("")
  const [note, setNote] = useState("")
  const [goalAmount, setGoalAmount] = useState("")
  const [contributionType, setContributionType] = useState<ContributionType>("fixed")
  const [amountPerMember, setAmountPerMember] = useState("")
  const [minimumAmount, setMinimumAmount] = useState("")
  const [deadline, setDeadline] = useState("")
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>("all")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle("")
      setNote("")
      setGoalAmount("")
      setContributionType("fixed")
      setAmountPerMember("")
      setMinimumAmount("")
      setDeadline("")
      setVisibilityMode("all")
    }
  }, [isOpen])

  const validate = () => {
    if (!title.trim()) {
      toast({ variant: "destructive", description: "Campaign title is required" })
      return false
    }
    if (!goalAmount || Number(goalAmount) <= 0) {
      toast({ variant: "destructive", description: "Enter a valid goal amount" })
      return false
    }
    if (contributionType === "fixed" && (!amountPerMember || Number(amountPerMember) <= 0)) {
      toast({ variant: "destructive", description: "Enter the amount per member" })
      return false
    }
    if (Number(amountPerMember) > Number(goalAmount)) {
      toast({ variant: "destructive", description: "Amount per member cannot exceed goal" })
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!conversation?.id || !conversation?.groupId) {
      toast({ variant: "destructive", description: "No active group chat found" })
      return
    }
    if (!validate()) return

    setIsSubmitting(true)
    try {
      // Step 1: Create the contribution record
      const payload: Parameters<typeof createGroupContribution>[1] = {
        title: title.trim(),
        note: note.trim() || undefined,
        goalAmount: Number(goalAmount),
        type: contributionType,
        visibilityMode,
        ...(contributionType === "fixed" && amountPerMember
          ? { amountPerMember: Number(amountPerMember) }
          : {}),
        ...(contributionType === "flexible" && minimumAmount
          ? { minimumAmount: Number(minimumAmount) }
          : {}),
        ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
      }

      const response = await createGroupContribution(conversation.groupId, payload)
      const contribution = response?.data?.data || response?.data
      const contributionId = contribution?.id

      if (!contributionId) throw new Error("No contribution ID returned")

      // Step 2: Send as a chat message so the card appears in the thread
      const chatPayload = {
        type: "group_contribution",
        contributionId,
        groupId: conversation.groupId,
        title: title.trim(),
        note: note.trim() || "",
        goalAmount: Number(goalAmount),
        collectedAmount: 0,
        contributorCount: 0,
        contributionType,
        amountPerMember: contributionType === "fixed" ? Number(amountPerMember) : undefined,
        minimumAmount: contributionType === "flexible" && minimumAmount ? Number(minimumAmount) : undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        visibilityMode,
        status: "active",
        currency: "RWF",
        createdBy: currentUserId,
        createdByName: creatorName,
        timestamp: new Date().toISOString(),
      }

      await sendMessageHttp({
        chatId: conversation.id,
        content: JSON.stringify(chatPayload),
        messageType: "money",
      }).unwrap()

      toast({ description: `Contribution campaign "${title}" created!` })
      onClose()
    } catch (error: any) {
      toast({
        variant: "destructive",
        description:
          error?.response?.data?.message ||
          error?.data?.message ||
          "Failed to create contribution. Try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-2xl dark:bg-darkBg-card dark:border-darkBorder-light max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <div className="bg-brand-green/10 dark:bg-brand-gold/10 p-2 rounded-full mr-3">
              <Target size={20} className="text-brand-green dark:text-brand-gold" />
            </div>
            <DialogTitle className="text-gray-900 dark:text-white text-xl font-semibold">
              Request Contribution
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-sm">
            Create a group fundraising campaign. Members will be notified to contribute.
          </DialogDescription>
        </DialogHeader>

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
              Goal Amount (RWF) <span className="text-red-500">*</span>
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

          {/* Contribution type toggle */}
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
                Fixed per member
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

          {/* Fixed: amount per member */}
          {contributionType === "fixed" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount per Member (RWF) <span className="text-red-500">*</span>
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

          {/* Flexible: minimum amount */}
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
            onClick={() =>
              setVisibilityMode((v) => (v === "all" ? "admin_only" : "all"))
            }
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
                  {visibilityMode === "all"
                    ? "Contributors visible to all"
                    : "Contributors visible to admin only"}
                </p>
                <p className="text-xs text-gray-400">
                  {visibilityMode === "all"
                    ? "All members can see who has paid"
                    : "Only you can see the contributor list"}
                </p>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full transition-colors relative ${
                visibilityMode === "all"
                  ? "bg-brand-green dark:bg-brand-gold"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  visibilityMode === "all" ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </div>
          </button>

          {/* Members info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-darkBg-interactive rounded-lg px-3 py-2">
            <Users size={13} />
            <span>All active members will be notified when you create this campaign.</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !goalAmount || isSubmitting}
            className="bg-brand-green dark:bg-brand-gold hover:opacity-90 text-white dark:text-darkBg-main min-w-[140px]"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
