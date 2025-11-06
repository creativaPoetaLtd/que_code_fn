"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, AlertCircle, Home, Users } from "lucide-react"
import { useRespondToGroupInvitationMutation } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"

type ResponseState = "loading" | "success" | "error" | "invalid" | "unauthorized"

interface GroupInvitationDetails {
    membershipId: string
    action: "accept" | "reject"
    token?: string
}

export default function RespondToGroupInvitationPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { getToken } = useAuthToken()
    const authToken = getToken()

    const [responseState, setResponseState] = useState<ResponseState>("loading")
    const [invitationDetails, setInvitationDetails] = useState<GroupInvitationDetails | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [groupName, setGroupName] = useState<string>("")
    const [inviterName, setInviterName] = useState<string>("")

    const [respondToGroupInvitation, { isLoading }] = useRespondToGroupInvitationMutation()

    useEffect(() => {
        // Extract parameters from URL
        const membershipId = searchParams.get("membershipId")
        const action = searchParams.get("action")
        const token: string = searchParams.get("token") ?? ""

        // Validate parameters
        if (!membershipId || !action || !["accept", "reject"].includes(action)) {
            setResponseState("invalid")
            setErrorMessage("Invalid group invitation link. Please check the link and try again.")
            return
        }

        const details: GroupInvitationDetails = {
            membershipId,
            action: action as "accept" | "reject",
            token,
        }

        setInvitationDetails(details)
        // Process the invitation (will handle auth inside the handler)
        handleInvitationResponse(details)
    }, [searchParams, authToken])

    // Retry invitation response when user gets authenticated
    useEffect(() => {
        if (authToken && invitationDetails && responseState === "unauthorized") {
            handleInvitationResponse(invitationDetails)
        }
    }, [authToken, invitationDetails, responseState])

    const handleInvitationResponse = async (details: GroupInvitationDetails) => {
        if (!authToken) {
            setResponseState("unauthorized")
            setErrorMessage("Please log in to respond to this group invitation.")
            return
        }

        try {
            setResponseState("loading")
            const result = await respondToGroupInvitation({
                membershipId: details.membershipId,
                responseData: { action: details.action },
                token: authToken,
            }).unwrap()

            // Extract group and inviter information from response if available
            if (result.data?.groupName) {
                setGroupName(result.data.groupName)
            }
            if (result.data?.inviterName) {
                setInviterName(result.data.inviterName)
            }

            setResponseState("success")
        } catch (error: any) {
            console.error("Group invitation response error:", error)
            let errorMsg = "An unexpected error occurred. Please try again."

            if (error?.data?.message) {
                errorMsg = error.data.message
            } else if (error?.message) {
                errorMsg = error.message
            }

            // Handle specific error cases
            if (errorMsg.includes("not found") || errorMsg.includes("already responded")) {
                errorMsg = "This group invitation is no longer valid or has already been responded to."
            } else if (errorMsg.includes("expired")) {
                errorMsg = "This group invitation has expired. Please request a new invitation."
            }

            setErrorMessage(errorMsg)
            setResponseState("error")
        }
    }

    const handleRetry = () => {
        if (invitationDetails) {
            handleInvitationResponse(invitationDetails)
        }
    }

    const getActionText = (action: string) => {
        return action === "accept" ? "accepting" : "rejecting"
    }

    const getActionPastTense = (action: string) => {
        return action === "accept" ? "accepted" : "rejected"
    }

    const renderContent = () => {
        switch (responseState) {
            case "loading":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Processing Group Invitation</h2>
                            <p className="text-gray-600 text-center">
                                {invitationDetails
                                    ? `${getActionText(invitationDetails.action).charAt(0).toUpperCase() + getActionText(invitationDetails.action).slice(1)} the group invitation...`
                                    : "Loading invitation details..."}
                            </p>
                        </CardContent>
                    </Card>
                )

            case "success":
                const isAccepted = invitationDetails?.action === "accept"
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className={`p-3 rounded-full mb-4 ${isAccepted ? "bg-green-100" : "bg-orange-100"}`}>
                                {isAccepted ? (
                                    <CheckCircle size={48} className="text-green-600" />
                                ) : (
                                    <XCircle size={48} className="text-orange-600" />
                                )}
                            </div>
                            <h2 className="text-xl font-semibold mb-2">
                                Group Invitation{" "}
                                {getActionPastTense(invitationDetails?.action || "")
                                    .charAt(0)
                                    .toUpperCase() + getActionPastTense(invitationDetails?.action || "").slice(1)}
                            </h2>
                            <p className="text-gray-600 text-center mb-6">
                                {isAccepted
                                    ? `You have successfully joined ${groupName ? `"${groupName}"` : "the group"}${inviterName ? ` invited by ${inviterName}` : ""}. You can now participate in group conversations.`
                                    : `You have declined the invitation to join ${groupName ? `"${groupName}"` : "the group"}${inviterName ? ` from ${inviterName}` : ""}.`}
                            </p>
                            <div className="flex gap-3">
                                {isAccepted && (
                                    <Button onClick={() => router.push("/chat")} className="flex items-center">
                                        <Users size={16} className="mr-2" />
                                        View Groups
                                    </Button>
                                )}
                                <Button
                                    variant={isAccepted ? "outline" : "default"}
                                    onClick={() => router.push("/")}
                                    className="flex items-center"
                                >
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
                            <div className="p-3 rounded-full bg-red-100 mb-4">
                                <AlertCircle size={48} className="text-red-600" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Error Processing Group Invitation</h2>
                            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
                            <div className="flex gap-3">
                                <Button onClick={handleRetry} disabled={isLoading} className="flex items-center">
                                    {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : "Try Again"}
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/")} className="flex items-center">
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
                            <div className="p-3 rounded-full bg-yellow-100 mb-4">
                                <AlertCircle size={48} className="text-yellow-600" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Invalid Group Invitation Link</h2>
                            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
                            <Button variant="outline" onClick={() => router.push("/")} className="flex items-center">
                                <Home size={16} className="mr-2" />
                                Go Home
                            </Button>
                        </CardContent>
                    </Card>
                )

            case "unauthorized":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className="p-3 rounded-full bg-blue-100 mb-4">
                                <AlertCircle size={48} className="text-blue-600" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
                            <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
                            <div className="flex gap-3">
                                <Button 
                                    onClick={() => {
                                        const currentUrl = window.location.href;
                                        router.push(`/auth/login?returnUrl=${encodeURIComponent(currentUrl)}`);
                                    }} 
                                    className="flex items-center"
                                >
                                    Login
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/")} className="flex items-center">
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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">{renderContent()}</div>
        </div>
    )
}
