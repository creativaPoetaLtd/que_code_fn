"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthToken } from "@/hooks/use-auth-token"
import { getPaymentRequests, declinePaymentRequest } from "@/helpers/api"
import { Header } from "@/components/Header"
import Navigation from "@/components/Navigation"
import { useSidebar } from "@/context/SidebarContext"
import { cn } from "@/lib/utils"
import { BackButton } from "@/components/shared/BackButton"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HandCoins, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { UserAvatar } from "@/components/UserAvatar"
import type { PaymentRequest } from "@/types/dashboard"
import { toast } from "@/hooks/use-toast"
import { useAccent } from "@/hooks/use-accent"

export default function RequestsPage() {
    const { isExpanded } = useSidebar()
    const { getToken } = useAuthToken()
    const router = useRouter()
    const accent = useAccent()
    
    const [receivedRequests, setReceivedRequests] = useState<PaymentRequest[]>([])
    const [sentRequests, setSentRequests] = useState<PaymentRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("received")
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null)

    useEffect(() => {
        const fetchRequests = async () => {
            setIsLoading(true)
            try {
                const [receivedRes, sentRes] = await Promise.all([
                    getPaymentRequests('received'),
                    getPaymentRequests('sent')
                ])
                
                if (receivedRes.data?.success) setReceivedRequests(receivedRes.data.data)
                if (sentRes.data?.success) setSentRequests(sentRes.data.data)
            } catch (error) {
                console.error("Failed to fetch requests:", error)
                toast({
                    title: "Error",
                    description: "Failed to load payment requests",
                    variant: "destructive"
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchRequests()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'paid': return 'bg-green-100 text-green-700 border-green-200'
            case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200'
            case 'expired': return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-blue-100 text-blue-700 border-blue-200'
        }
    }

    const handleDeclineRequest = async (requestId: string) => {
        try {
            setProcessingRequestId(requestId)
            const res: any = await declinePaymentRequest(requestId)
            const payload = res?.data ?? res

            if (payload?.success) {
                setReceivedRequests((prev) =>
                    prev.map((req) =>
                        req.id === requestId ? { ...req, status: "cancelled" as any } : req
                    )
                )

                toast({
                    title: "Request declined",
                    description: "You declined this payment request.",
                })
            } else {
                toast({
                    title: "Decline failed",
                    description: payload?.message || "Could not decline request",
                    variant: "destructive",
                })
            }
        } catch (error: any) {
            toast({
                title: "Decline failed",
                description: error?.response?.data?.message || "Could not decline request",
                variant: "destructive",
            })
        } finally {
            setProcessingRequestId(null)
        }
    }

    const RequestCard = ({ request, type }: { request: PaymentRequest, type: 'sent' | 'received' }) => {
        const otherParty = type === 'received' ? request.sender : request.recipient
        const isPending = request.status === 'pending'

        return (
            <Card className="p-4 mb-3 hover:shadow-md transition-all border-gray-100 dark:border-darkBorder-light bg-white dark:bg-darkBg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <UserAvatar
                            profileImage={(otherParty as any)?.profile?.profileImage || otherParty?.profile?.avatar}
                            firstName={otherParty?.firstName}
                            lastName={otherParty?.lastName}
                            userId={otherParty?.id}
                            className="h-10 w-10 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                    {otherParty?.firstName} {otherParty?.lastName}
                                </p>
                                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-1.5 py-0", getStatusColor(request.status))}>
                                    {request.status}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {request.note || "No note provided"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-2 sm:flex-shrink-0">
                        <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1 whitespace-nowrap sm:self-end">
                            {type === 'received' ? (
                                <ArrowDownLeft size={16} className="text-red-500" />
                            ) : (
                                <ArrowUpRight size={16} className="text-green-500" />
                            )}
                            {request.amount.toLocaleString()} {request.currency}
                        </div>

                        {type === 'received' && isPending && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 flex-1 sm:flex-none"
                                    disabled={processingRequestId === request.id}
                                    onClick={() => handleDeclineRequest(request.id)}
                                >
                                    Decline
                                </Button>
                                <Button
                                    size="sm"
                                    className={`${accent.solidDark} text-white h-8 flex-1 sm:flex-none`}
                                    onClick={() => router.push(`/home/transfer/amount?requestId=${request.id}`)}
                                >
                                    Pay Now
                                    <ChevronRight size={14} className="ml-1" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <div className={`flex min-h-screen bg-gray-50 ${accent.darkBgPage}`}>
            <Navigation />
            
            <div className={cn(
                "flex-1 transition-all duration-300",
                isExpanded ? "lg:ml-64" : "lg:ml-20"
            )}>
                <div className="px-4 sm:px-6 lg:px-8 py-4">
                    <Header />
                </div>
                
                <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-6">
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-6">
                            <BackButton className="mb-4" />
                            <div className="flex items-center gap-3">
                                <div className={`p-2 ${accent.lightIconBg} rounded-lg ${accent.lightIconColor}`}>
                                    <HandCoins size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Money Requests</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Manage your pending payments</p>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="received" className="w-full" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-darkBg-card p-1">
                                <TabsTrigger value="received" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-interactive data-[state=active]:shadow-sm">
                                    Received ({receivedRequests.length})
                                </TabsTrigger>
                                <TabsTrigger value="sent" className="data-[state=active]:bg-white dark:data-[state=active]:bg-darkBg-interactive data-[state=active]:shadow-sm">
                                    Sent ({sentRequests.length})
                                </TabsTrigger>
                            </TabsList>

                            {isLoading ? (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-24 bg-gray-200 dark:bg-darkBg-card animate-pulse rounded-xl" />
                                    ))}
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="received" className="mt-0">
                                        {receivedRequests.length === 0 ? (
                                            <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                                                <HandCoins size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400">No payment requests received yet</p>
                                            </div>
                                        ) : (
                                            receivedRequests.map(req => (
                                                <RequestCard key={req.id} request={req} type="received" />
                                            ))
                                        )}
                                    </TabsContent>

                                    <TabsContent value="sent" className="mt-0">
                                        {sentRequests.length === 0 ? (
                                            <div className="text-center py-12 bg-white dark:bg-darkBg-card rounded-xl border border-dashed border-gray-200 dark:border-darkBorder-light">
                                                <ArrowUpRight size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400">You haven't sent any payment requests yet</p>
                                            </div>
                                        ) : (
                                            sentRequests.map(req => (
                                                <RequestCard key={req.id} request={req} type="sent" />
                                            ))
                                        )}
                                    </TabsContent>
                                </>
                            )}
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    )
}
