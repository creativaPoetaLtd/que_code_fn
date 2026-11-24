"use client"

import React from "react"
import { Check, Minus } from "lucide-react"
import { formatCurrency } from "@/utils/currency"
import type { FeatureAccess, FeatureKey, TierDefinition } from "@/types/plan.types"

// Shared by the Settings → Plan tab and the "Choose your plan" onboarding step.

export const SUPPORT_LABELS: Record<TierDefinition["support"], string> = {
    email: "Email, Mon–Fri 8AM–4PM",
    mail_chat: "Mail or chat, Mon–Fri 8AM–4PM",
    "24_7": "Mail, chat & phone, 24/7",
}

// Shown on the plan cards; Settings → Plan also has the full comparison table.
export const HIGHLIGHT_FEATURES: FeatureKey[] = [
    "comment",
    "personalizedTransfer",
    "scheduledPayment",
    "blockedTransfer",
    "bulkPayment",
    "paymentAmountSetting",
]

export const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })

export const formatPrice = (price: number | null) =>
    price == null ? "On quote" : price === 0 ? "Free" : `${formatCurrency(price)}/month`

export const formatLimit = (limit: number | null) => (limit == null ? "On demand" : `${formatCurrency(limit)}/day`)

export const FeatureValue = ({ access }: { access: FeatureAccess }) => {
    if (access.allowed) {
        return access.fee > 0 ? (
            <span className="text-xs text-gray-600 dark:text-gray-300">{formatCurrency(access.fee)}/use</span>
        ) : (
            <Check className="h-4 w-4 text-green-500" aria-label="Included" />
        )
    }
    if (access.onDemand) return <span className="text-xs text-gray-500">On demand</span>
    return <Minus className="h-4 w-4 text-gray-300 dark:text-gray-600" aria-label="Not included" />
}
