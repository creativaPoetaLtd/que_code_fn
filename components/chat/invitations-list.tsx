"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Check, X, Loader2, Clock, Mail } from "lucide-react";
import Input from "../ui/Input-ant";
import { useAuthToken } from "@/hooks/use-auth-token";
import {
  useGetPendingInvitationsQuery,
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
  type ContactInvitation,
} from "@/states/contactInvitationSlice";
import { toast } from "@/hooks/use-toast";

interface InvitationsListProps {
  className?: string;
}

export default function InvitationsList({
  className = "",
}: InvitationsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { getToken } = useAuthToken();
  const authToken = getToken();

  // Fetch pending invitations
  const {
    data: invitationsData,
    isLoading,
    error,
    refetch,
  } = useGetPendingInvitationsQuery(authToken!, {
    skip: !authToken,
  });

  const [acceptInvitation] = useAcceptInvitationMutation();
  const [declineInvitation] = useDeclineInvitationMutation();

  const invitations = invitationsData?.data || [];

  // Filter invitations based on search term
  const filteredInvitations = invitations?.filter((invitation) => {
    if (!searchTerm) return true;
    
    if (!invitation.inviter) return false;
    
    const fullName =
      `${invitation.inviter.firstName} ${invitation.inviter.lastName}`.toLowerCase();
    const email = invitation.inviter.email.toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower)
    );
  }) || [];  const handleAcceptInvitation = async (invitation: ContactInvitation) => {
    if (processingId) return;

    setProcessingId(invitation.id);
    try {
      await acceptInvitation({
        invitationId: invitation.id,
        token: authToken!,
      }).unwrap();

      toast({
        title: "Invitation Accepted",
        description: `You are now connected with ${invitation.inviter?.firstName} ${invitation.inviter?.lastName}`,
      });

      refetch(); // Refresh the invitations list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (invitation: ContactInvitation) => {
    if (processingId) return;

    setProcessingId(invitation.id);
    try {
      await declineInvitation({
        invitationId: invitation.id,
        token: authToken!,
      }).unwrap();

      toast({
        title: "Invitation Declined",
        description: `Invitation from ${invitation.inviter?.firstName} ${invitation.inviter?.lastName} was declined`,
      });

      refetch(); // Refresh the invitations list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.data?.message || "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (!authToken) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 text-gray-500 ${className}`}
      >
        <p className="text-sm">Please log in to view invitations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 ${className}`}
      >
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-40 text-gray-500 ${className}`}
      >
        <p className="text-sm mb-2">Failed to load invitations</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            placeholder="Search invitations..."
            className="rounded-full bg-gray-100 border-0 py-1.5 pl-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {invitations.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {filteredInvitations.length} of {invitations.length} invitation
            {invitations.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Invitations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredInvitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            {searchTerm ? (
              <>
                <Search className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">
                  No invitations found for "{searchTerm}"
                </p>
                <p className="text-xs text-gray-400">
                  Try a different search term
                </p>
              </>
            ) : (
              <>
                <Mail className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm">No pending invitations</p>
                <p className="text-xs text-gray-400">
                  You'll see connection requests here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredInvitations.map((invitation: ContactInvitation) => {
              // Skip invitations without inviter data
              if (!invitation.inviter) {
                return null;
              }
              
              const expired = isExpired(invitation.expiresAt);
              const isProcessing = processingId === invitation.id;

              return (
                <div
                  key={invitation.id}
                  className={`p-4 transition-colors ${
                    expired ? "bg-gray-50 opacity-75" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
                        <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                          {invitation.inviter?.firstName?.[0]}
                          {invitation.inviter?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {invitation.inviter?.firstName}{" "}
                            {invitation.inviter?.lastName}
                          </p>
                          {expired && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate mb-1">
                          {invitation.inviter?.email}
                        </p>
                        <p className="text-xs text-gray-400">
                          Invited {formatTimeAgo(invitation.invitedAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Expires{" "}
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!expired && (
                      <div className="flex space-x-2 ml-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={isProcessing}
                          className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineInvitation(invitation)}
                          disabled={isProcessing}
                          className="h-8 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Additional Info for Expired Invitations */}
                  {expired && (
                    <div className="mt-2 p-2 bg-red-50 rounded-md">
                      <p className="text-xs text-red-600">
                        This invitation has expired. Ask{" "}
                        {invitation.inviter?.firstName} to send a new invitation.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with invitation count */}
      {invitations.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Total: {invitations.length} pending invitation
            {invitations.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
