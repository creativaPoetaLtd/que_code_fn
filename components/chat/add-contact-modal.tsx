"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Input from "../ui/Input-ant";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserPlus, QrCode, Link, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import QRCodeScanner from "./qr-code-scanner";
import { useSendInvitationMutation } from "@/states/contactInvitationSlice";
import { useAuthToken } from "@/hooks/use-auth-token";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({
  isOpen,
  onClose,
}: AddContactModalProps) {
  const [profileLink, setProfileLink] = useState<string>("");
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);

  // Redux hooks
  const { getToken } = useAuthToken();
  const token = getToken();
  const [sendInvitation, { isLoading: isInviting }] =
    useSendInvitationMutation();

  const handleProfileLinkSubmit = async () => {
    if (!profileLink.trim()) {
      toast({
        title: "Error",
        description: "Please enter a profile link",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to send invitations",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await sendInvitation({
        profileUrl: profileLink.trim(),
        token,
      }).unwrap();

      toast({
        title: "Invitation Sent",
        description: result.message || "Invitation sent successfully",
      });

      handleClose();
    } catch (error: any) {
      console.error("Invitation error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Failed to send invitation";
      toast({
        title: "Invitation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setProfileLink("");
    onClose();
  };

  const handleScanComplete = async (result: string) => {
    setIsQRScannerOpen(false);

    // The QR code should contain a profile link
    setProfileLink(result);

    if (!token) {
      toast({
        title: "Authentication Error",
        description: "Please log in to send invitations",
        variant: "destructive",
      });
      return;
    }

    try {
      const invitationResult = await sendInvitation({
        profileUrl: result,
        token,
      }).unwrap();

      toast({
        title: "Invitation Sent",
        description:
          invitationResult.message ||
          "Invitation sent successfully from QR code",
      });

      handleClose();
    } catch (error: any) {
      console.error("QR Invitation error:", error);
      const errorMessage =
        error?.data?.message || error?.message || "Failed to send invitation";
      toast({
        title: "Invitation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-full">
                <UserPlus size={20} className="text-blue-600" />
              </div>
              <div>
                <DialogTitle>Add Contact</DialogTitle>
                <p className="text-sm text-gray-500">
                  Enter a profile link to send a connection invitation
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden mb-4">
            {/* Profile Link Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Profile Link
                </label>
                <Input
                  placeholder="Enter profile link (e.g., https://app.com/welcome/user-id)"
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleProfileLinkSubmit()
                  }
                />
              </div>

              <Button
                onClick={handleProfileLinkSubmit}
                disabled={isInviting || !profileLink.trim()}
                className="w-full bg-[#00B512] hover:bg-[#00B512]/90"
              >
                {isInviting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <UserPlus size={16} className="mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>

            {/* QR Scanner Section */}
            <Separator className="my-6" />
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Or scan a contact's QR code
              </p>
              <Button
                onClick={() => setIsQRScannerOpen(true)}
                variant="outline"
                disabled={isInviting}
                className="w-full"
              >
                <QrCode size={16} className="mr-2" />
                Scan QR Code
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isInviting}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScanComplete={handleScanComplete}
        title="Scan Contact QR Code"
      />
    </>
  );
}
