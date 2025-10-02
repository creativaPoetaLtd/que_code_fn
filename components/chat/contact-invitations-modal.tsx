import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, User, Mail, Calendar, Users2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useAcceptInvitationMutation,
  useDeclineInvitationMutation,
} from "@/states/contactInvitationSlice";
import { useAuthToken } from "@/hooks/use-auth-token";
// import type { Invitation } from "@/types"

interface ContactInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: "received" | "sent";
  setActiveTab: (tab: "received" | "sent") => void;
  pendingInvitations: any[];
  sentInvitations: any[];
  isLoading: boolean;
  onAcceptInvitation?: (invitationId: string) => void;
  onDeclineInvitation?: (invitationId: string) => void;
}

export default function ContactInvitationsModal({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  pendingInvitations,
  sentInvitations,
  isLoading,
  onAcceptInvitation,
  onDeclineInvitation,
}: ContactInvitationsModalProps) {
  const [acceptingInvitation, setAcceptingInvitation] = useState<string | null>(
    null
  );
  const [decliningInvitation, setDecliningInvitation] = useState<string | null>(
    null
  );

  const { getToken } = useAuthToken();
  const token = getToken();

  const [acceptInvitation, { isLoading: accepting }] =
    useAcceptInvitationMutation();
  const [declineInvitation, { isLoading: declining }] =
    useDeclineInvitationMutation();

  const handleAccept = async (invitationId: string) => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to accept invitations",
        variant: "destructive",
      });
      return;
    }

    setAcceptingInvitation(invitationId);

    try {
      await acceptInvitation({
        invitationId: parseInt(invitationId),
        token,
      }).unwrap();

      toast({
        title: "Success",
        description: "Invitation accepted! Contact and chat created.",
        variant: "default",
      });

      if (onAcceptInvitation) {
        onAcceptInvitation(invitationId);
      }

      // Close modal after successful acceptance
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAcceptingInvitation(null);
    }
  };

  const handleDecline = async (invitationId: string) => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to decline invitations",
        variant: "destructive",
      });
      return;
    }

    setDecliningInvitation(invitationId);

    try {
      await declineInvitation({
        invitationId: parseInt(invitationId),
        token,
      }).unwrap();

      toast({
        title: "Success",
        description: "Invitation declined successfully.",
        variant: "default",
      });

      if (onDeclineInvitation) {
        onDeclineInvitation(invitationId);
      }
    } catch (error: any) {
      console.error("Error declining invitation:", error);
      toast({
        title: "Error",
        description: error?.data?.message || "Failed to decline invitation",
        variant: "destructive",
      });
    } finally {
      setDecliningInvitation(null);
    }
  };

  const InvitationItem = ({
    invitation,
    isReceived,
  }: {
    invitation: any;
    isReceived: boolean;
  }) => {
    const isPending = invitation.status === "pending";
    const inviter = isReceived ? invitation.inviter : invitation.invitee;
    const actionText = isReceived ? "From" : "To";
    return (
      <div className="flex items-center justify-between border-b py-3 px-2">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-gray-400" />
          <div>
            <div className="font-medium">
              {actionText}: {inviter?.name || inviter?.email || "Unknown"}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {inviter?.email}
              <Calendar className="h-3 w-3 ml-2" />
              {new Date(invitation.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isReceived && isPending && (
            <>
              <Button
                size="icon"
                variant="ghost"
                disabled={acceptingInvitation === invitation.id || accepting}
                onClick={() => handleAccept(invitation.id)}
                aria-label="Accept"
              >
                <Check className="h-5 w-5 text-green-600" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={decliningInvitation === invitation.id || declining}
                onClick={() => handleDecline(invitation.id)}
                aria-label="Decline"
              >
                <X className="h-5 w-5 text-red-600" />
              </Button>
            </>
          )}
          {!isPending && (
            <Badge
              variant={
                invitation.status === "accepted" ? "default" : "secondary"
              }
            >
              {invitation.status.charAt(0).toUpperCase() +
                invitation.status.slice(1)}
            </Badge>
          )}
          {isPending && !isReceived && (
            <Badge variant="secondary">
              <Clock className="h-4 w-4 mr-1 inline" />
              Pending
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent className="sm:max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Contact Invitations</DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "received" | "sent")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="received"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Received{" "}
              {pendingInvitations.length > 0 && (
                <Badge className="ml-2">{pendingInvitations.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Sent{" "}
              {sentInvitations.length > 0 && (
                <Badge className="ml-2">{sentInvitations.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading...</p>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <p className="text-center text-gray-500">
                No pending invitations.
              </p>
            ) : (
              pendingInvitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  isReceived
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <p>Loading...</p>
              </div>
            ) : sentInvitations.length === 0 ? (
              <p className="text-center text-gray-500">No sent invitations.</p>
            ) : (
              sentInvitations.map((invitation) => (
                <InvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  isReceived={false}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
