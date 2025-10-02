"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Home,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import {
  useRespondToInvitationMutation,
  useGetPendingInvitationsQuery,
} from "@/states/contactInvitationSlice";
import { useAuthToken } from "@/hooks/use-auth-token";
import { get } from "http";

type PageState =
  | "loading"
  | "ready"
  | "responding"
  | "success"
  | "error"
  | "not-found"
  | "unauthorized";

export default function InvitationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getToken } = useAuthToken();
  const authToken = getToken();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [invitation, setInvitation] = useState<any>(null);
  const [responseAction, setResponseAction] = useState<
    "accept" | "decline" | null
  >(null);

  const contactId = params.contactId as string;
  const action = searchParams.get("action") as "accept" | "reject" | null;

  const {
    data: pendingInvitations,
    isLoading: isPendingLoading,
    error: pendingError,
  } = useGetPendingInvitationsQuery(authToken as string, {
    skip: !authToken,
  });

  const [respondToInvitation, { isLoading: isResponding }] =
    useRespondToInvitationMutation();

  useEffect(() => {
    if (!authToken) {
      setPageState("unauthorized");
      setErrorMessage("Please log in to view this invitation.");
      return;
    }

    if (!contactId) {
      setPageState("not-found");
      setErrorMessage("Invalid invitation link.");
      return;
    }

    // If we have pending invitations data, find the specific invitation
    if (pendingInvitations?.data) {
      const foundInvitation = pendingInvitations.data.find(
        (inv: any) => inv.id === contactId
      );

      if (foundInvitation) {
        setInvitation(foundInvitation);
        setPageState("ready");
      } else if (!isPendingLoading) {
        setPageState("not-found");
        setErrorMessage(
          "Invitation not found or has already been responded to."
        );
      }
    }
  }, [authToken, contactId, pendingInvitations, isPendingLoading]);

  useEffect(() => {
    // If there's an action in the URL, auto-respond
    if (action && invitation && pageState === "ready") {
      handleResponse(action);
    }
  }, [action, invitation, pageState]);

  const handleResponse = async (selectedAction: "accept" | "reject") => {
    if (!authToken || !invitation) return;

    try {
      setPageState("responding");
      const mappedAction = selectedAction === "reject" ? "decline" : "accept";
      setResponseAction(mappedAction);

      const result = await respondToInvitation({
        invitationId: parseInt(invitation.id),
        action: mappedAction,
        token: authToken,
      }).unwrap();

      setPageState("success");
    } catch (error: any) {
      console.error("Invitation response error:", error);

      let errorMsg = "An unexpected error occurred. Please try again.";

      if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }

      setErrorMessage(errorMsg);
      setPageState("error");
    }
  };

  const renderContent = () => {
    switch (pageState) {
      case "loading":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Loading Invitation</h2>
              <p className="text-gray-600 text-center">
                Please wait while we load the invitation details...
              </p>
            </CardContent>
          </Card>
        );

      case "ready":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User size={20} className="mr-2 text-blue-600" />
                Contact Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Inviter Details */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg">
                    {invitation.inviter.firstName?.charAt(0)}
                    {invitation.inviter.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {invitation.inviter.firstName} {invitation.inviter.lastName}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Mail size={14} className="mr-1" />
                    {invitation.inviter.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar size={14} className="mr-1" />
                    Invited:{" "}
                    {new Date(invitation.invitedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Invitation Message */}
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>
                    {invitation.inviter.firstName} {invitation.inviter.lastName}
                  </strong>{" "}
                  wants to add you to their contacts.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleResponse("accept")}
                  disabled={isResponding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Accept
                </Button>
                <Button
                  onClick={() => handleResponse("reject")}
                  disabled={isResponding}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle size={16} className="mr-2" />
                  Decline
                </Button>
              </div>

              {/* Navigation */}
              <div className="text-center pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/contacts")}
                  className="text-sm"
                >
                  <ArrowLeft size={14} className="mr-1" />
                  Back to Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "responding":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {responseAction === "accept" ? "Accepting" : "Declining"}{" "}
                Invitation
              </h2>
              <p className="text-gray-600 text-center">Please wait...</p>
            </CardContent>
          </Card>
        );

      case "success":
        const isAccepted = responseAction === "accept";
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div
                className={`p-3 rounded-full mb-4 ${
                  isAccepted ? "bg-green-100" : "bg-orange-100"
                }`}
              >
                {isAccepted ? (
                  <CheckCircle size={48} className="text-green-600" />
                ) : (
                  <XCircle size={48} className="text-orange-600" />
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Invitation {isAccepted ? "Accepted" : "Declined"}
              </h2>
              <p className="text-gray-600 text-center mb-6">
                {isAccepted
                  ? `You have successfully accepted the contact invitation from ${invitation?.inviter.firstName} ${invitation?.inviter.lastName}. They have been added to your contacts.`
                  : `You have declined the contact invitation from ${invitation?.inviter.firstName} ${invitation?.inviter.lastName}.`}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push("/contacts")}
                  className="flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  View Contacts
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/home")}
                  className="flex items-center"
                >
                  <Home size={16} className="mr-2" />
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "error":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="p-3 rounded-full bg-red-100 mb-4">
                <AlertCircle size={48} className="text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Error Processing Invitation
              </h2>
              <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setPageState("ready")}
                  className="flex items-center"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/contacts")}
                  className="flex items-center"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Contacts
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "not-found":
        return (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center p-8">
              <div className="p-3 rounded-full bg-yellow-100 mb-4">
                <AlertCircle size={48} className="text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                Invitation Not Found
              </h2>
              <p className="text-gray-600 text-center mb-6">{errorMessage}</p>
              <Button
                variant="outline"
                onClick={() => router.push("/contacts")}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Contacts
              </Button>
            </CardContent>
          </Card>
        );

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
                  onClick={() => router.push("/login")}
                  className="flex items-center"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex items-center"
                >
                  <Home size={16} className="mr-2" />
                  Home
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">{renderContent()}</div>
    </div>
  );
}
