import { sendPushNotification } from '@/services/pushAlertService';

export const triggerPushNotification = async (type: string, data: any) => {
  const notifications: Record<string, { title: string; message: string; url?: string }> = {
    // Chat notifications
    'new_message': {
      title: 'New Message',
      message: `${data.senderName}: ${data.message}`,
      url: `/chat`,
    },
    'group_message': {
      title: `${data.groupName}`,
      message: `${data.senderName}: ${data.message}`,
      url: `/chat`,
    },

    // Contact notifications
    'contact_request': {
      title: 'New Contact Request',
      message: `${data.senderName} wants to connect with you`,
      url: `/contacts`,
    },
    'contact_accepted': {
      title: 'Contact Request Accepted',
      message: `${data.userName} accepted your contact request`,
      url: `/contacts`,
    },

    // Group notifications
    'group_invitation': {
      title: 'Group Invitation',
      message: `You've been invited to join ${data.groupName}`,
      url: `/chat`,
    },
    'group_join_request': {
      title: 'Group Join Request',
      message: `${data.userName} wants to join ${data.groupName}`,
      url: `/chat`,
    },
    'group_request_approved': {
      title: 'Join Request Approved',
      message: `Your request to join ${data.groupName} was approved`,
      url: `/chat`,
    },

    // Payment notifications
    'payment_received': {
      title: 'Payment Received',
      message: `You received ${data.amount} from ${data.senderName}`,
      url: `/transactions`,
    },
    'payment_sent': {
      title: 'Payment Sent',
      message: `You sent ${data.amount} to ${data.recipientName}`,
      url: `/transactions`,
    },
    'payment_request': {
      title: 'Payment Request',
      message: `${data.senderName} requested ${data.amount}`,
      url: `/transactions`,
    },
  };

  const notification = notifications[type];
  if (notification) {
    await sendPushNotification({
      title: notification.title,
      message: notification.message,
      url: notification.url ? `${window.location.origin}${notification.url}` : undefined,
      subscriberId: data.subscriberId,
    });
  }
};
