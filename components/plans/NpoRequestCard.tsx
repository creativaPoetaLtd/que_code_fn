"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Clock, HeartHandshake, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useCancelNpoRequestMutation, useRequestNpoMutation } from "@/states/planSlice"
import { formatDate } from "@/components/plans/planDisplay"
import type { MyPlan } from "@/types/plan.types"

interface NpoRequestCardProps {
    plan: MyPlan
    onSent?: () => void
}

const MIN_NOTE_LENGTH = 10

/**
 * Lets a Business organization ask QC for the NPO (non-profit) account type, and shows
 * a pending request. QC approves it from the admin side; until then the account stays Business.
 */
export const NpoRequestCard: React.FC<NpoRequestCardProps> = ({ plan, onSent }) => {
    const [note, setNote] = useState("")
    const [error, setError] = useState("")
    const [requestNpo, { isLoading: sending }] = useRequestNpoMutation()
    const [cancelNpoRequest, { isLoading: withdrawing }] = useCancelNpoRequestMutation()

    if (plan.tier === "NPO") return null

    const handleSend = async () => {
        setError("")
        try {
            const res = await requestNpo({ note: note.trim() }).unwrap()
            toast({ title: "Request sent", description: res.message })
            setNote("")
            onSent?.()
        } catch (err: any) {
            setError(err?.data?.message || "Could not send the request")
        }
    }

    const handleWithdraw = async () => {
        try {
            await cancelNpoRequest().unwrap()
            toast({ title: "Request withdrawn" })
        } catch (err: any) {
            toast({ title: "Could not withdraw", description: err?.data?.message, variant: "destructive" })
        }
    }

    return (
        <Card className="dark:bg-darkBg-card dark:border-darkBorder-light">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                    <HeartHandshake className="h-5 w-5 text-brand-green dark:text-brand-gold" />
                    Non-profit organisation (NPO)
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                    Free account for charities and associations: receive tagged donations for your causes, USD/EUR, and
                    a 500 000 RWF daily limit. QC reviews each request.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {plan.npoRequest ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 dark:bg-amber-400/10 p-3">
                        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                            <Clock className="h-4 w-4" />
                            Request sent on {formatDate(plan.npoRequest.requestedAt)} - waiting for QC to review it.
                        </p>
                        <Button variant="ghost" size="sm" onClick={handleWithdraw} disabled={withdrawing}>
                            {withdrawing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Withdraw
                        </Button>
                    </div>
                ) : (
                    <>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Tell us about your non-profit
                        </label>
                        <Textarea
                            rows={4}
                            maxLength={1000}
                            placeholder="What your organisation does, who it serves, and your registration details (e.g. RGB number)."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                        <Button
                            onClick={handleSend}
                            disabled={sending || note.trim().length < MIN_NOTE_LENGTH}
                            className="bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main hover:bg-brand-green/90 dark:hover:bg-brand-gold/90"
                        >
                            {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request NPO account
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default NpoRequestCard
