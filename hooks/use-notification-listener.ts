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

    // Listen for fundraising progress updates
    const handleFundraisingProgress = (data: any) => {
      notificationService.notifyGroupDonation({
        groupName: data.groupName,
        donorName: data.donorName,
        amount: data.donationAmount,
      });
    };

    // Register socket listeners
    socketService.onContactRequest(handleContactRequest);
    socketService.onGroupInvitation(handleGroupInvitation);
    socketService.onGroupDonation(handleGroupDonation);
    socketService.onFundraisingProgress(handleFundraisingProgress);

    // Cleanup
    return () => {
      socketService.offContactRequest(handleContactRequest);
      socketService.offGroupInvitation(handleGroupInvitation);
      socketService.offGroupDonation(handleGroupDonation);
      socketService.offFundraisingProgress(handleFundraisingProgress);
    };
  }, [getUserId]);
};
