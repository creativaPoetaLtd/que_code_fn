"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Target, Loader2, Users } from "lucide-react"
import type { Conversation } from "@/types/chat.types"
import { toast } from "@/hooks/use-toast"
import { getCurrentUserId, getTokenFromStorage } from "@/utils/tokenUtils"
import { useSendMessageMutation } from "@/states/chatSlice"
import { useGetGroupMembersQuery } from "@/states/groupSlice"
import { createGroupContribution } from "@/helpers/api"
import { ContributionFormFields, ContributionFormValues } from "@/components/contributions/ContributionFormFields"

interface Props {
  isOpen: boolean
  onClose: () => void
  conversation: Conversation | null
  creatorName?: string
}

export default function CreateContributionModal({
  isOpen,
  onClose,
  conversation,
  creatorName = "Admin",
}: Props) {
  const currentUserId = getCurrentUserId()
  const token = useMemo(() => getTokenFromStorage(), [])
  const [sendMessageHttp] = useSendMessageMutation()

  const groupId = conversation?.groupId ?? null
  const { data: membersData } = useGetGroupMembersQuery(
    { groupId: groupId!, token: token! },
    { skip: !groupId || !token || !isOpen }
  )
  const adminMembers = useMemo(
    () =>
      (membersData?.data?.members ?? []).filter(
        (m: any) => m.status === "active" && ["owner", "admin"].includes(m.role)
      ),
    [membersData]
  )

  const emptyForm: ContributionFormValues = {
    title: "", note: "", goalAmount: "", contributionType: "fixed",
    amountPerMember: "", minimumAmount: "", deadline: "",
    visibilityMode: "all", disbursementPolicy: "hold", disbursementRecipientId: "",
  }
  const [form, setForm] = useState<ContributionFormValues>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) setForm(emptyForm)
  }, [isOpen])

  const validate = () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", description: "Campaign title is required" })
      return false
    }
    if (form.contributionType === "fixed" && (!form.amountPerMember || Number(form.amountPerMember) <= 0)) {
      toast({ variant: "destructive", description: "Enter the amount per member" })
      return false
    }
    if (form.disbursementPolicy === "auto" && !form.disbursementRecipientId) {
      toast({ variant: "destructive", description: "Select a recipient for auto-transfer" })
      return false
    }
    if (form.goalAmount && Number(form.amountPerMember) > Number(form.goalAmount)) {
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
      const payload: Parameters<typeof createGroupContribution>[1] = {
        title: form.title.trim(),
        note: form.note.trim() || undefined,
        ...(form.goalAmount ? { goalAmount: Number(form.goalAmount) } : {}),
        type: form.contributionType,
        visibilityMode: form.visibilityMode as "all" | "admin_only",
        ...(form.contributionType === "fixed" && form.amountPerMember
          ? { amountPerMember: Number(form.amountPerMember) }
          : {}),
        ...(form.contributionType === "flexible" && form.minimumAmount
          ? { minimumAmount: Number(form.minimumAmount) }
          : {}),
        ...(form.deadline ? { deadline: new Date(form.deadline).toISOString() } : {}),
        disbursementPolicy: form.disbursementPolicy,
        ...(form.disbursementPolicy === "auto" ? { disbursementRecipientId: form.disbursementRecipientId } : {}),
      }

      const response = await createGroupContribution(conversation.groupId, payload)
      const contribution = response?.data?.data || response?.data
      const contributionId = contribution?.id

      if (!contributionId) throw new Error("No contribution ID returned")

      const recipientMember = adminMembers.find((m: any) => m.userId === form.disbursementRecipientId)
      const disbursementRecipientName = recipientMember
        ? `${recipientMember.userName ?? recipientMember.userEmail ?? ""}`.trim()
        : undefined

      const chatPayload = {
        type: "group_contribution",
        contributionId,
        groupId: conversation.groupId,
        title: form.title.trim(),
        note: form.note.trim() || "",
        goalAmount: form.goalAmount ? Number(form.goalAmount) : undefined,
        collectedAmount: 0,
        contributorCount: 0,
        contributionType: form.contributionType,
        amountPerMember: form.contributionType === "fixed" ? Number(form.amountPerMember) : undefined,
        minimumAmount: form.contributionType === "flexible" && form.minimumAmount ? Number(form.minimumAmount) : undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        visibilityMode: form.visibilityMode,
        disbursementPolicy: form.disbursementPolicy,
        ...(form.disbursementPolicy === "auto" && disbursementRecipientName
          ? { disbursementRecipientName }
          : {}),
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

      toast({ description: `Contribution campaign "${form.title}" created!` })
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

        <div className="py-2">
          <ContributionFormFields
            variant="group"
            values={form}
            onChange={(patch) => setForm((v) => ({ ...v, ...patch }))}
            adminMembers={adminMembers}
            disabled={isSubmitting}
          />
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-darkBg-interactive rounded-lg px-3 py-2 mt-4">
            <Users size={13} />
            <span>All active members will be notified when you create this campaign.</span>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto dark:border-darkBorder-light dark:text-gray-300 dark:hover:bg-darkBg-interactive"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
