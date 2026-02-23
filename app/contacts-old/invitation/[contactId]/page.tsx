"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/hooks/use-auth-token";
import { 
  useGetInvitationByTokenQuery,
  useRespondToInvitationByTokenMutation,
  useRespondToInvitationEnhancedMutation
} from "@/states/contactSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Check, 
  X, 
  Clock, 
  User, 
  Mail, 
  AlertCircle,
  ArrowLeft,
  UserPlus
} from "lucide-react";

interface ContactInvitationPageProps {
  params: {
    contactId: string;
  };
}

const ContactInvitationPage = ({ params }: ContactInvitationPageProps) => {
  const router = useRouter();
  const authHook = useAuthToken();
  const token = authHook.getToken();
  const { contactId: invitationToken } = params;
  const [isResponding, setIsResponding] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [responseAction, setResponseAction] = useState<"accept" | "decline" | null>(null);

  // Get invitation details by token
  const { 
    data: invitationData, 
    isLoading, 
    error,
    refetch
  } = useGetInvitationByTokenQuery(invitationToken);

  // Mutations for responding to invitation
  const [respondByToken] = useRespondToInvitationByTokenMutation();
  const [respondById] = useRespondToInvitationEnhancedMutation();

  const invitation = invitationData?.invitation;
  const isExpired = invitationData?.isExpired;
  const canRespond = invitationData?.canRespond;

  useEffect(() => {
    // Check URL parameters for automatic action
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'accept' || action === 'decline') {
      setResponseAction(action);
    }
  }, []);

  const handleResponse = async (action: "accept" | "decline") => {
    if (!invitation || !canRespond) return;

    setIsResponding(true);
    setResponseAction(action);

    try {
      let result;
      
      if (token) {
        // User is authenticated, use enhanced endpoint
        result = await respondById({
          invitationId: invitation.id,
          action,
          token,
        }).unwrap();
      } else {
        // Public response via token
        result = await respondByToken({
          token: invitationToken,
          action,
        }).unwrap();
      }

      setHasResponded(true);
      
      toast({
        title: action === "accept" ? "Invitation accepted!" : "Invitation declined",
        description: result.message,
      });

      // Refetch to get updated status
      refetch();
      
    } catch (error: any) {
      console.error("Response error:", error);
      toast({
        title: "Error",
        description: error.data?.message || `Failed to ${action} invitation`,
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return "??";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "accepted": return "default";
      case "declined": return "destructive";
      case "expired": return "outline";
      default: return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or has been removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push("/contacts")} 
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Contacts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Invitation</h1>
          <p className="text-gray-600 mt-2">
            You've been invited to connect
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {getInitials(invitation.inviter?.firstName, invitation.inviter?.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <CardTitle className="text-xl">
              {invitation.inviter?.firstName} {invitation.inviter?.lastName}
            </CardTitle>
            
            <CardDescription className="flex items-center justify-center gap-2 mt-2">
              <Mail className="h-4 w-4" />
              {invitation.inviter?.email}
            </CardDescription>

            <div className="flex justify-center mt-4">
              <Badge variant={getStatusColor(invitation.status)}>
                {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-700">
                <strong>{invitation.inviter?.firstName} {invitation.inviter?.lastName}</strong>
                {" "}wants to add you to their contacts.
              </p>
              
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Sent {new Date(invitation.invitedAt).toLocaleDateString()}
                </div>
                {invitation.expiresAt && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {isExpired ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-gray-600 mb-4">This invitation has expired.</p>
                <Button variant="outline" onClick={() => router.push("/contacts")} className="text-sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Contacts
                </Button>
              </div>
            ) : invitation.status === "pending" && canRespond ? (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleResponse("accept")}
                  disabled={isResponding}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isResponding && responseAction === "accept" ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResponse("decline")}
                  disabled={isResponding}
                  className="flex-1"
                >
                  {isResponding && responseAction === "decline" ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Decline
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-gray-700 mb-4">
                  {invitation.status === "accepted" 
                    ? `You have successfully accepted the contact invitation from ${invitation?.inviter?.firstName} ${invitation?.inviter?.lastName}. They have been added to your contacts.`
                    : `You have declined this contact invitation.`
                  }
                </p>
                <Button onClick={() => router.push("/contacts")} className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  View Contacts
                </Button>
              </div>
            )}

            {invitation.status !== "pending" && !isExpired && (
              <div className="pt-4 border-t text-center">
                <p className="text-sm text-gray-500 mb-3">
                  {invitation.status === "accepted" 
                    ? "This invitation has already been accepted."
                    : "This invitation has already been declined."
                  }
                </p>
                <Button variant="outline" onClick={() => router.push("/contacts")} className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Contacts
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Don't have an account?{" "}
            <a href="/auth/register" className="text-blue-600 hover:text-blue-500">
              Sign up now
            </a>
          </p>
        </div>

        {hasResponded && invitation.status === "pending" && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              {responseAction === "accept" ? "Invitation accepted!" : "Invitation declined"}
            </p>
            <p className="text-green-600 text-sm mt-1">
              {responseAction === "accept" 
                ? "You are now connected and can view each other in your contacts."
                : "The invitation has been declined and removed."
              }
            </p>
            <Button variant="outline" onClick={() => router.push("/contacts")} className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactInvitationPage;
