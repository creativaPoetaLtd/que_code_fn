"use client";

import { useEffect } from 'react';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';
import { useAuthToken } from '@/hooks/use-auth-token';

export const useNotificationListener = () => {
  const { getUserId } = useAuthToken();

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    // Update notification service with current user
    notificationService.setUserId(userId);

    // Listen for contact requests
    const handleContactRequest = (request: any) => {
      notificationService.notifyContactRequest({
        from: `${request.inviter?.firstName} ${request.inviter?.lastName}`,
        action: 'received',
      });
    };

    // Listen for group invitations
    const handleGroupInvitation = (invitation: any) => {
      notificationService.notifyGroupInvitation({
        groupName: invitation.groupName || 'a group',
        inviterName: invitation.inviterName || 'Someone',
      });
    };

    // Listen for group donations
    const handleGroupDonation = (data: any) => {
      notificationService.notifyGroupDonation({
        groupName: data.groupName,
        donorName: data.donorName,
        amount: data.amount,
      });
    };

    // Note: "fundraising_progress_update" is intentionally not turned into a toast here.
    // It fires alongside "group_donation_received" for the same donation event (see
    // chatMoneyController), and is consumed elsewhere (group-details-content.tsx,
    // chat-header.tsx) purely to update the progress bar UI. Notifying on both would
    // show the user two toasts/sounds for one donation.

    // Register socket listeners
    socketService.onContactRequest(handleContactRequest);
    socketService.onGroupInvitation(handleGroupInvitation);
    socketService.onGroupDonation(handleGroupDonation);

    // Cleanup
    return () => {
      socketService.offContactRequest(handleContactRequest);
      socketService.offGroupInvitation(handleGroupInvitation);
      socketService.offGroupDonation(handleGroupDonation);
    };
  }, [getUserId]);
};
