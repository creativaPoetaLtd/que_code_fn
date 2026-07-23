"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, AlertCircle, Home, Users } from "lucide-react"
import { useRespondToJoinRequestMutation } from "@/states/groupSlice"
import { useAuthToken } from "@/hooks/use-auth-token"

type ResponseState = "loading" | "success" | "error" | "invalid" | "unauthorized"

interface JoinRequestDetails {
    groupId: string
    requestId: string
    action: "approve" | "decline"
}

export default function RespondToGroupJoinRequestPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const params = useParams()
    const { getToken } = useAuthToken()
    const authToken = getToken()

    const [responseState, setResponseState] = useState<ResponseState>("loading")
    const [requestDetails, setRequestDetails] = useState<JoinRequestDetails | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [groupName, setGroupName] = useState<string>("")
    const [userName, setUserName] = useState<string>("")
    const processedRequestKeyRef = useRef<string | null>(null)

    const [respondToJoinRequest, { isLoading }] = useRespondToJoinRequestMutation()

    useEffect(() => {
        const groupId = params.groupId as string
        const requestId = params.requestId as string
        const action = searchParams.get("action")

        const normalizedAction = action === 'reject' ? 'decline' : action

        if (!groupId || !requestId || !normalizedAction || !["approve", "decline"].includes(normalizedAction)) {
            setResponseState("invalid")
            setErrorMessage("Invalid group join request link. Please check the link and try again.")
            return
        }

        if (!authToken) {
            setResponseState("unauthorized")
            setErrorMessage("Please log in to respond to this group join request.")
            return
        }

        const details: JoinRequestDetails = {
            groupId,
            requestId,
            action: normalizedAction as "approve" | "decline",
        }

        const requestKey = `${details.groupId}:${details.requestId}:${details.action}`

        if (processedRequestKeyRef.current === requestKey) {
            return
        }

        processedRequestKeyRef.current = requestKey
        setRequestDetails(details)
        handleJoinRequestResponse(details)
    }, [searchParams, params, authToken])

    const handleJoinRequestResponse = async (details: JoinRequestDetails) => {
        if (!authToken) {
            setResponseState("unauthorized")
            return
        }

        try {
            setResponseState("loading")
            const result = await respondToJoinRequest({
                groupId: details.groupId,
                requestId: details.requestId,
                action: details.action,
                token: authToken,
            }).unwrap()

            if (result.data?.groupName) {
                setGroupName(result.data.groupName)
            }
            if (result.data?.userName) {
                setUserName(result.data.userName)
            }

            setResponseState("success")
        } catch (error: any) {
            console.error("Group join request response error:", error)
            let errorMsg = "An unexpected error occurred. Please try again."

            if (error?.data?.message) {
                errorMsg = error.data.message
            } else if (error?.message) {
                errorMsg = error.message
            }

            if (errorMsg.includes("not found") || errorMsg.includes("already processed")) {
                errorMsg = "This group join request is no longer valid or has already been processed."
            } else if (errorMsg.includes("permission")) {
                errorMsg = "You do not have permission to respond to this request."
            }

            setErrorMessage(errorMsg)
            setResponseState("error")
        }
    }

    const handleRetry = () => {
        if (requestDetails) {
            processedRequestKeyRef.current = null
            handleJoinRequestResponse(requestDetails)
        }
    }

    const getActionText = (action: string) => {
        return action === "approve" ? "approving" : "declining"
    }

    const getActionPastTense = (action: string) => {
        return action === "approve" ? "approved" : "declined"
    }

    const renderContent = () => {
        switch (responseState) {
            case "loading":
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Processing Join Request</h2>
                            <p className="text-gray-600 text-center">
                                {requestDetails
                                    ? `${getActionText(requestDetails.action).charAt(0).toUpperCase() + getActionText(requestDetails.action).slice(1)} the join request...`
                                    : "Loading request details..."}
                            </p>
                        </CardContent>
                    </Card>
                )

            case "success":
                const isApproved = requestDetails?.action === "approve"
                return (
                    <Card className="w-full max-w-md mx-auto">
                        <CardContent className="flex flex-col items-center justify-center p-8">
                            <div className={`p-3 rounded-full mb-4 ${isApproved ? "bg-green-100" : "bg-red-100"}`}>
                                {isApproved ? (
                                    <CheckCircle size={48} className="text-green-600" />
                                ) : (
                                    <XCircle size={48} className="text-red-600" />
                                )}
                            </div>
                            <h2 className="text-xl font-semibold mb-2">
                                Join Request{" "}
                                {getActionPastTense(requestDetails?.action || "").charAt(0).toUpperCase() + getActionPastTense(requestDetails?.action || "").slice(1)}
                            </h2>
                            <p className="text-gray-600 text-center mb-6">
                                {isApproved
                                    ? `${userName || "The user"}'s request to join ${groupName ? `"${groupName}"` : "the group"} has been approved.`
                                    : `${userName || "The user"}'s request to join ${groupName ? `"${groupName}"` : "the group"} has been declined.`}
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={() => router.push("/chat")} className="flex items-center">
                                    <Users size={16} className="mr-2" />
                                    View Groups
                                </Button>
                                <Button variant="outline" onClick={() => router.push("/")} className="flex items-center">
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
                            <h2 className="text-xl font-semibold mb-2">Error Processing Join Request</h2>
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
                            <h2 className="text-xl font-semibold mb-2">Invalid Join Request Link</h2>
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
                                <Button onClick={() => router.push(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)} className="flex items-center">
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
