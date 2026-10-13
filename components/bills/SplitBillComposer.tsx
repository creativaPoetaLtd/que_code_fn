"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, RotateCcw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getCurrentUserId } from "@/utils/tokenUtils"
import { useGetAcceptedContactsQuery } from "@/states/contactSlice"
import { useCreateBillMutation } from "@/states/billSlice"
import FindPersonByLink, { FoundPerson } from "./FindPersonByLink"

interface SplitRecipient {
    id: string
    name: string
    type?: string
}

interface SplitBillComposerProps {
    recipient: SplitRecipient
    total: number
    currency?: string
    onBack: () => void
}

interface ContactRow {
    id: string
    name: string
    avatar?: string
}

const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 })

// Amounts are handled in minor units (cents) so an uneven split never drifts off the total.
const toInput = (minor: number) => {
    const value = minor / 100
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
}
const toMinor = (raw: string | undefined) => {
    const value = parseFloat(raw || "")
    return Number.isFinite(value) ? Math.round(value * 100) : 0
}

export default function SplitBillComposer({ recipient, total, currency = "RWF", onBack }: SplitBillComposerProps) {
    const router = useRouter()
    const { getToken } = useAuthToken()
    const token = getToken()
    const myId = getCurrentUserId()

    const [title, setTitle] = useState("Split bill")
    const [note, setNote] = useState("")
    const [includeMe, setIncludeMe] = useState(true)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [amounts, setAmounts] = useState<Record<string, string>>({})
    const [customized, setCustomized] = useState(false)
    const [search, setSearch] = useState("")
    // People added by profile link or QR who aren't in the contact list.
    const [addedPeople, setAddedPeople] = useState<ContactRow[]>([])

    const [createBill, { isLoading: creating }] = useCreateBillMutation()
    const { data: contactsData, isLoading: loadingContacts } = useGetAcceptedContactsQuery(token!, { skip: !token })

    const contacts: ContactRow[] = useMemo(
        () =>
            (contactsData?.contacts || [])
                .map((c: any) => ({
                    id: c.otherUser.id,
                    name: `${c.otherUser.firstName} ${c.otherUser.lastName}`,
                    avatar: c.otherUser.avatar,
                }))
                .filter((c: ContactRow) => c.id !== recipient.id),
        [contactsData, recipient.id]
    )

    const people = useMemo(() => [...addedPeople, ...contacts], [addedPeople, contacts])
    const filteredContacts = people.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    const nameOf = (id: string) => (id === myId ? "You" : people.find((c) => c.id === id)?.name || "Someone")

    const validateFound = (person: FoundPerson) => {
        if (person.id === myId) return "That's your own profile. Use \"Include me\" to take a share."
        if (person.id === recipient.id) return `${person.name} is receiving this payment, so they can't pay a share.`
        if (selectedIds.includes(person.id)) return `${person.name} is already in this split.`
        return null
    }

    const handleFound = (person: FoundPerson) => {
        if (!people.some((p) => p.id === person.id)) setAddedPeople((prev) => [person, ...prev])
        setCustomized(false)
        setSelectedIds((prev) => [...prev, person.id])
        toast({ title: `${person.name} added to the split` })
    }

    const participantIds = useMemo(
        () => [...(includeMe && myId ? [myId] : []), ...selectedIds],
        [includeMe, myId, selectedIds]
    )

    const totalMinor = Math.round(total * 100)

    // Even split by default; the leftover minor units go to the first few people so the shares
    // always add up to the total exactly.
    useEffect(() => {
        if (customized) return
        const count = participantIds.length
        if (count === 0) {
            setAmounts({})
            return
        }
        const base = Math.floor(totalMinor / count)
        const remainder = totalMinor - base * count
        const next: Record<string, string> = {}
        participantIds.forEach((id, i) => {
            next[id] = toInput(base + (i < remainder ? 1 : 0))
        })
        setAmounts(next)
    }, [participantIds, totalMinor, customized])

    const assignedMinor = participantIds.reduce((sum, id) => sum + toMinor(amounts[id]), 0)
    const remainingMinor = totalMinor - assignedMinor
    const everyShareHasAmount = participantIds.every((id) => toMinor(amounts[id]) > 0)
    const canSubmit =
        participantIds.length >= 1 &&
        remainingMinor === 0 &&
        everyShareHasAmount &&
        title.trim().length > 0 &&
        !creating

    // Changing who's in the split invalidates any hand-edited amounts, so go back to even.
    const toggleContact = (id: string) => {
        setCustomized(false)
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    const handleAmountChange = (id: string, value: string) => {
        setCustomized(true)
        setAmounts((prev) => ({ ...prev, [id]: value.replace(/[^\d.]/g, "") }))
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        try {
            const res: any = await createBill({
                ...(recipient.type === "organization"
                    ? { recipientOrganizationId: recipient.id }
                    : { recipientUserId: recipient.id }),
                totalAmount: total,
                title: title.trim(),
                note: note.trim() || undefined,
                shares: participantIds.map((id) => ({ payerId: id, amount: toMinor(amounts[id]) / 100 })),
            }).unwrap()
            toast({ title: "Split created", description: "Everyone has been notified of their share." })
            router.push(`/home/bills/${res.data.id}`)
        } catch (err: any) {
            toast({
                title: "Could not create the split",
                description: err?.data?.message || "Something went wrong",
                variant: "destructive",
            })
        }
    }

    const cardClass =
        "bg-white dark:bg-darkBg-card rounded-2xl border border-gray-100 dark:border-darkBorder-light p-4 mb-4"

    return (
        <div className="animate-fadeIn">
            <div className={cardClass}>
                <p className="text-sm text-gray-500 dark:text-gray-400">Splitting</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currency} {fmt(total)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Everyone pays their own share directly to <span className="font-semibold">{recipient.name}</span>.
                </p>
            </div>

            <div className={cardClass}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What is it for?</label>
                <Input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-3 mb-1">Note (optional)</label>
                <Input value={note} maxLength={250} placeholder="Dinner at..." onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className={cardClass}>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Who is splitting it?</p>

                <label className="flex items-center gap-3 py-2 cursor-pointer">
                    <Checkbox checked={includeMe} onCheckedChange={(v) => { setCustomized(false); setIncludeMe(Boolean(v)) }} />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Include me (I pay a share too)</span>
                </label>

                <div className="relative my-2">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input className="pl-9" placeholder="Search contacts" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-darkBorder-light p-1">
                    {loadingContacts ? (
                        <div className="flex items-center justify-center py-6 text-sm text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading contacts...
                        </div>
                    ) : filteredContacts.length === 0 ? (
                        <p className="text-center text-sm text-gray-500 py-6">No contacts to show. You can add people by link or QR below.</p>
                    ) : (
                        filteredContacts.map((c) => (
                            <label key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-darkBg-interactive">
                                <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleContact(c.id)} />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={c.avatar || "/placeholder.svg"} alt={c.name} />
                                    <AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.name}</span>
                            </label>
                        ))
                    )}
                </div>

                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-4 mb-1">Someone who isn&apos;t a contact?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Add them with their profile link or by scanning their QR code.</p>
                <FindPersonByLink onFound={handleFound} validate={validateFound} disabled={creating} />
            </div>

            {participantIds.length > 0 && (
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Shares</p>
                        {customized && (
                            <button
                                type="button"
                                onClick={() => setCustomized(false)}
                                className="text-xs font-semibold text-brand-green dark:text-brand-gold inline-flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset to even split
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {participantIds.map((id) => (
                            <div key={id} className="flex items-center justify-between gap-3">
                                <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{nameOf(id)}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Input
                                        inputMode="decimal"
                                        className="w-32 text-right"
                                        value={amounts[id] ?? ""}
                                        onChange={(e) => handleAmountChange(id, e.target.value)}
                                    />
                                    <span className="text-xs text-gray-500 w-8">{currency}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-darkBorder-light text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                            Assigned {fmt(assignedMinor / 100)} of {fmt(total)}
                        </span>
                        <span className={remainingMinor === 0 ? "font-semibold text-green-600" : "font-semibold text-red-500"}>
                            {remainingMinor === 0
                                ? "Adds up"
                                : remainingMinor > 0
                                    ? `${fmt(remainingMinor / 100)} left to assign`
                                    : `${fmt(Math.abs(remainingMinor) / 100)} over`}
                        </span>
                    </div>
                </div>
            )}

            <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="w-full bg-brand-green dark:bg-brand-gold text-white dark:text-darkBg-main font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
                {creating ? <Loader2 className="animate-spin" size={20} /> : "Create split"}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
                No money moves yet. Each person pays their own share (with their own PIN) from the split page.
            </p>

            <button
                onClick={onBack}
                className="w-full mt-4 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
                Go Back
            </button>
        </div>
    )
}
