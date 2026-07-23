"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Users, CheckCircle, XCircle, AlertCircle, Home, Clock, Lock } from "lucide-react"
import { useJoinGroupByLinkMutation } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"
import { toast } from "@/hooks/use-toast"

type JoinState = "loading" | "joining" | "success" | "pending" | "error" | "invalid"

interface JoinResult {
    groupId?: string
    groupName?: string
    status?: string
    requiresApproval?: boolean
    message?: string
}

function JoinGroupContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { getToken } = useAuthToken()
    const token = getToken()

    const [joinState, setJoinState] = useState<JoinState>("loading")
    const [joinResult, setJoinResult] = useState<JoinResult | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>("")

    const [joinGroupByLink, { isLoading }] = useJoinGroupByLinkMutation()

    const accessToken = searchParams.get("token")

    useEffect(() => {
        if (!accessToken) {
            setJoinState("invalid")
            setErrorMessage("No access token provided. Please use a valid group join link.")
            return
        }

        if (!token) {
            setJoinState("invalid")
            setErrorMessage("Please log in to join a group.")
            return
        }

        // Auto-join when page loads with valid token
        handleJoinGroup()
    }, [accessToken, token])

    const handleJoinGroup = async () => {
        if (!accessToken || !token) return

        setJoinState("joining")

        try {
            const result = await joinGroupByLink({
                joinData: { accessToken },
                token,
            }).unwrap()

            setJoinResult(result.data)

            // Check if requires approval (private group)
            if (result.data?.requiresApproval || String(result.data?.status || "").toLowerCase() === "pending") {
                setJoinState("pending")
                toast({
                    title: "Request Sent",
                    description: result.message || "Your join request has been sent to the group owner.",
                })
            } else {
                setJoinState("success")
                toast({
                    title: "Success!",
                    description: result.message || `You've successfully joined the group!`,
                })
            }
        } catch (error: any) {
            console.error("Join group error:", error)
            const message = error?.data?.message || error?.message || "Failed to join group."
            setErrorMessage(message)
            setJoinState("error")
            toast({
                title: "Error",
                description: message,
                variant: "destructive",
            })
        }
    }

    const renderContent = () => {
        switch (joinState) {
            case "loading":
            case "joining":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-4 rounded-full bg-brand-green/10 dark:bg-brand-gold/10 mb-4">
                                <Loader2 size={48} className="animate-spin text-brand-green dark:text-brand-gold" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                {joinState === "loading" ? "Preparing..." : "Joining Group..."}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center">
                                Please wait while we process your request.
                            </p>
                        </CardContent>
                    </Card>
                )

            case "success":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                Successfully Joined!
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                You&apos;ve joined <strong className="text-gray-900 dark:text-white">
                                    {joinResult?.groupName || "the group"}
                                </strong>. You can now participate in group activities.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => router.push("/chat")}
                                    className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                >
                                    <Users size={16} className="mr-2" />
                                    View Groups
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/home")}>
                                    <Home size={16} className="mr-2" />
                                    Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

            case "pending":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                                <Clock size={48} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                Request Pending
                            </h2>
                            <div className="flex items-center gap-2 mb-4">
                                <Lock size={16} className="text-gray-500" />
                                <span className="text-sm text-gray-500">Private Group</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                Your request to join <strong className="text-gray-900 dark:text-white">
                                    {joinResult?.groupName || "the group"}
                                </strong> has been sent. The group owner will review your request.
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 text-center mb-6">
                                You&apos;ll receive a notification when your request is approved or declined.
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => router.push("/chat")}
                                    className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                >
                                    <Users size={16} className="mr-2" />
                                    My Groups
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/home")}>
                                    <Home size={16} className="mr-2" />
                                    Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

            case "error":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <XCircle size={48} className="text-red-600 dark:text-red-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                Unable to Join
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                {errorMessage}
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleJoinGroup}
                                    disabled={isLoading}
                                    className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={16} className="mr-2 animate-spin" />
                                            Trying...
                                        </>
                                    ) : (
                                        "Try Again"
                                    )}
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/home")}>
                                    <Home size={16} className="mr-2" />
                                    Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

            case "invalid":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
                                <AlertCircle size={48} className="text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                Invalid Link
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                {errorMessage || "This join link is invalid or has expired."}
                            </p>
                            <div className="flex gap-3">
                                {!token ? (
                                    <Button
                                        onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                                        className="bg-brand-green dark:bg-brand-gold hover:bg-brand-green/90 dark:hover:bg-brand-gold/90 text-white dark:text-darkBg-main"
                                    >
                                        Log In
                                    </Button>
                                ) : null}
                                <Button variant="outline" onClick={() => router.push("/home")}>
                                    <Home size={16} className="mr-2" />
                                    Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-darkBg-main flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {renderContent()}
            </div>
        </div>
    )
}

export default function JoinGroupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 dark:bg-darkBg-main flex items-center justify-center p-4">
                <Card className="w-full max-w-md mx-auto">
                    <CardContent className="flex flex-col items-center justify-center p-8">
                        <Loader2 size={48} className="animate-spin text-brand-green dark:text-brand-gold mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <JoinGroupContent />
        </Suspense>
    )
}
