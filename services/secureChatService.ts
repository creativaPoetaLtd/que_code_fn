"use client";

import baseUrl from "@/helpers/baseUrl";
import { assertTrustedDeviceIdentity, getIdentityFingerprint } from "@/lib/e2ee/identityTrustStore";
import { decryptSecureEnvelope, encryptSecureTextForRecipients } from "@/lib/e2ee/secureMessageCrypto";
import { encryptSecureMediaFile } from "@/lib/e2ee/secureMediaCrypto";
import { ensureRegisteredSecureDevice } from "@/services/e2eeDeviceService";
import type { Conversation, Message, ReplyPreview } from "@/types/chat.types";
import { getChatPreviewText } from "@/utils/chatPreview";
import type {
  PublicSecureDeviceBundle,
  SecureEncryptedEnvelope,
  StoredSecureDeviceState,
} from "@/types/e2ee.types";

const bundleCache = new Map<string, { cachedAt: number; devices: PublicSecureDeviceBundle[] }>();
const BUNDLE_CACHE_TTL_MS = 60 * 1000;

const isValidBase64UrlCoordinate = (value: unknown) =>
  typeof value === "string" && value.length >= 43 && value.length <= 44;

const hasUsablePublicBundle = (device: any) =>
  Boolean(
    device?.bundle &&
      device.bundle.algorithm === "qc-e2ee-p256-v1" &&
      device.bundle.identityPublicKey?.kty === "EC" &&
      device.bundle.identityPublicKey?.crv === "P-256" &&
      isValidBase64UrlCoordinate(device.bundle.identityPublicKey?.x) &&
      isValidBase64UrlCoordinate(device.bundle.identityPublicKey?.y) &&
      device.bundle.signedPreKeyPublic?.kty === "EC" &&
      device.bundle.signedPreKeyPublic?.crv === "P-256" &&
      isValidBase64UrlCoordinate(device.bundle.signedPreKeyPublic?.x) &&
      isValidBase64UrlCoordinate(device.bundle.signedPreKeyPublic?.y) &&
      typeof device.bundle.signedPreKeySignature === "string" &&
      device.bundle.signedPreKeySignature.length > 20,
  );

const getApiBaseUrl = () => {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return baseUrl;
};

const fetchJson = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, init);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message || "Secure chat request failed");
  }

  return payload;
};

const getSecureDeviceState = async (token: string, userId: string) => {
  const state = await ensureRegisteredSecureDevice({ token, userId });
  if (!state) {
    throw new Error("Secure device bootstrap is not available on this browser");
  }

  return state;
};

const parseSecureControlMessage = (content: string) => {
  try {
    const payload = JSON.parse(content);
    if (payload?.kind === "reaction" && payload?.targetMessageId) {
      return payload as {
        kind: "reaction";
        version?: number;
        targetMessageId: string;
        action: "set" | "remove";
        emoji?: string;
      };
    }
  } catch {
    return null;
  }

  return null;
};

const getConversationRecipient = (conversation: Conversation, userId: string) => {
  const recipient = conversation.participants.find((participant) => participant.userId !== userId);
  if (!recipient) {
    throw new Error("Unable to resolve the secure chat recipient");
  }

  return recipient.userId;
};

export const getSecureConversationRecipientId = (conversation: Conversation, userId: string) =>
  getConversationRecipient(conversation, userId);

const fetchPublicDeviceBundles = async (
  token: string,
  userId: string,
  options?: { forceRefresh?: boolean },
) => {
  const cacheKey = `bundles:${userId}`;
  const cached = bundleCache.get(cacheKey);
  if (!options?.forceRefresh && cached && Date.now() - cached.cachedAt < BUNDLE_CACHE_TTL_MS) {
    return cached.devices;
  }

  const payload = await fetchJson(`${getApiBaseUrl()}/e2ee/users/${userId}/device-bundles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rawDevices = (payload?.data || []).map((device: any) => ({
    userId,
    deviceId: device.deviceId,
    deviceName: device.deviceName,
    platform: device.platform,
    bundle: device.bundle,
    oneTimePreKeys: device.oneTimePreKeys || [],
  })) as PublicSecureDeviceBundle[];

  const usableDevices = rawDevices.filter((device) => {
    const valid = hasUsablePublicBundle(device);
    if (!valid) {
      console.warn("Skipping invalid secure device bundle", {
        userId,
        deviceId: device.deviceId,
      });
    }
    return valid;
  });
  const devices = await Promise.all(
    usableDevices.map(async (device) => {
      await assertTrustedDeviceIdentity({
        userId,
        deviceId: device.deviceId,
        identityPublicKey: device.bundle.identityPublicKey,
      });

      return device;
    }),
  );

  bundleCache.set(cacheKey, {
    cachedAt: Date.now(),
    devices,
  });

  return devices;
};

const isUnavailableOneTimePreKeyError = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes("unavailable one-time pre-key") ||
    error.message.includes("already consumed"));

export const fetchSecureDeviceIdentitySummaries = async ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) => {
  const devices = await fetchPublicDeviceBundles(token, userId);

  return Promise.all(
    devices.map(async (device) => ({
      userId,
      deviceId: device.deviceId,
      deviceName: device.deviceName || "Secure device",
      platform: device.platform || "unknown",
      fingerprint: await getIdentityFingerprint(device.bundle.identityPublicKey),
      availableOneTimePreKeys: device.oneTimePreKeys.length,
    })),
  );
};

const decryptSecureApiMessage = async ({
  rawMessage,
  state,
  token,
}: {
  rawMessage: any;
  state: StoredSecureDeviceState;
  token: string;
}) => {
  const envelope = rawMessage.encryptedEnvelope as SecureEncryptedEnvelope;
  const senderDevices = await fetchPublicDeviceBundles(token, rawMessage.sender.id);
  const senderDevice = senderDevices.find((device) => device.deviceId === envelope.senderDeviceId);

  if (!senderDevice?.bundle?.identityPublicKey) {
    throw new Error("Unable to resolve the sender secure identity");
  }

  const decryptedContent = await decryptSecureEnvelope({
    envelope,
    senderIdentityPublicKey: senderDevice.bundle.identityPublicKey,
    recipientState: state,
  });
  let content = decryptedContent;
  let mediaFields: Partial<Message> = {};

  if (rawMessage.messageType !== "text") {
    try {
      const mediaPayload = JSON.parse(decryptedContent);
      content =
        mediaPayload.caption ||
        getChatPreviewText({ messageType: mediaPayload.mediaType || rawMessage.messageType });
      mediaFields = {
        mediaUrl: mediaPayload.mediaUrl,
        mediaType: mediaPayload.mediaType,
        fileSize: mediaPayload.originalSize,
        fileName: mediaPayload.originalName,
        mimeType: mediaPayload.originalType,
        secureMediaKey: mediaPayload.encryptedKey,
        secureMediaIv: mediaPayload.encryptedIv,
        isSecureMedia: true,
      } as Partial<Message>;
    } catch {
      content = "[Unable to decode secure media metadata]";
    }
  }
  return {
    id: rawMessage.id,
    chatId: rawMessage.chatId,
    content,
    ...mediaFields,
    messageType: rawMessage.messageType,
    replyToMessageId: rawMessage.replyToMessageId || null,
    replyTo: null as ReplyPreview | null,
    reactions: [],
    status: rawMessage.status,
    deliveredAt: rawMessage.deliveredAt || undefined,
    readAt: rawMessage.readAt || undefined,
    createdAt: rawMessage.createdAt,
    sender: rawMessage.sender,
    readBy: rawMessage.readBy || [],
    deliveryConfirmed: Boolean(rawMessage.deliveredAt),
  } satisfies Message;
};

export const fetchSecureChatMessages = async ({
  token,
  userId,
  chatId,
  page = 1,
  limit = 50,
}: {
  token: string;
  userId: string;
  chatId: string;
  page?: number;
  limit?: number;
}) => {
  const state = await getSecureDeviceState(token, userId);
  const payload = await fetchJson(
    `${getApiBaseUrl()}/e2ee/chats/${chatId}/messages?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-qc-device-id": state.deviceId,
      },
    },
  );

  const decryptedMessages = await Promise.all(
    ((payload?.data?.messages as any[]) || []).map(async (rawMessage) => {
      try {
        return await decryptSecureApiMessage({ rawMessage, state, token });
      } catch (error) {
        console.error("Failed to decrypt secure message", error);
        return {
          id: rawMessage.id,
          chatId: rawMessage.chatId,
          content: "[Unable to decrypt secure message]",
          messageType: rawMessage.messageType,
          replyToMessageId: rawMessage.replyToMessageId || null,
          replyTo: null,
          reactions: [],
          status: rawMessage.status,
          deliveredAt: rawMessage.deliveredAt || undefined,
          readAt: rawMessage.readAt || undefined,
          createdAt: rawMessage.createdAt,
          sender: rawMessage.sender,
          readBy: rawMessage.readBy || [],
          deliveryConfirmed: Boolean(rawMessage.deliveredAt),
        } satisfies Message;
      }
    }),
  );

  const chronologicalMessages = decryptedMessages.reverse();
  const visibleMessages: Message[] = [];

  for (const message of chronologicalMessages) {
    const controlMessage = parseSecureControlMessage(message.content);

    if (controlMessage?.kind === "reaction") {
      const target = visibleMessages.find((item) => item.id === controlMessage.targetMessageId);
      if (target) {
        const existingReactions = target.reactions || [];
        const withoutSender = existingReactions.filter(
          (reaction) => reaction.userId !== message.sender.id,
        );

        target.reactions =
          controlMessage.action === "set" && controlMessage.emoji
            ? [...withoutSender, { userId: message.sender.id, emoji: controlMessage.emoji }]
            : withoutSender;
      }
      continue;
    }

    visibleMessages.push(message);
  }

  return visibleMessages;
};

export const createOrGetSecureDmChat = async ({
  token,
  participantId,
}: {
  token: string;
  participantId: string;
}) => {
  const payload = await fetchJson(`${getApiBaseUrl()}/e2ee/dms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      participantId,
    }),
  });

  return payload?.data as {
    chatId: string;
    securityMode: "secure_dm_v1";
    protocolVersion: string | null;
  };
};

export const createOrGetLegacyDmChat = async ({
  token,
  participantId,
}: {
  token: string;
  participantId: string;
}) => {
  const payload = await fetchJson(`${getApiBaseUrl()}/chats/dm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      participantId,
    }),
  });

  return payload?.data as {
    chatId: string;
    securityMode?: "legacy" | "secure_dm_v1";
    protocolVersion?: string | null;
  };
};

export const createOrGetPreferredDmChat = async ({
  token,
  participantId,
}: {
  token: string;
  participantId: string;
}) => {
  const secureChat = await createOrGetSecureDmChat({
    token,
    participantId,
  });

  return {
    ...secureChat,
    usedSecure: true,
  };
};

export const sendSecureTextMessage = async ({
  token,
  userId,
  chatId,
  conversation,
  content,
  replyToMessageId,
}: {
  token: string;
  userId: string;
  chatId: string;
  conversation: Conversation;
  content: string;
  replyToMessageId?: string;
}) => {
  const state = await getSecureDeviceState(token, userId);
  const recipientUserId = getConversationRecipient(conversation, userId);

  const sendAttempt = async (forceRefresh: boolean) => {
    const [senderDevices, recipientDevices] = await Promise.all([
      fetchPublicDeviceBundles(token, userId, { forceRefresh }),
      fetchPublicDeviceBundles(token, recipientUserId, { forceRefresh }),
    ]);

    const { recipientPayloads } = await encryptSecureTextForRecipients({
      content,
      senderUserId: userId,
      senderState: state,
      recipientDevices: [...senderDevices, ...recipientDevices],
    });

    return fetchJson(`${getApiBaseUrl()}/e2ee/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-qc-device-id": state.deviceId,
      },
      body: JSON.stringify({
        messageType: "text",
        replyToMessageId: replyToMessageId || null,
        recipientPayloads,
      }),
    });
  };

  let payload: any;
  try {
    payload = await sendAttempt(false);
  } catch (error) {
    if (!isUnavailableOneTimePreKeyError(error)) {
      throw error;
    }

    bundleCache.delete(`bundles:${userId}`);
    bundleCache.delete(`bundles:${recipientUserId}`);
    payload = await sendAttempt(true);
  }

  bundleCache.delete(`bundles:${userId}`);
  bundleCache.delete(`bundles:${recipientUserId}`);

  return {
    id: payload.data.id,
    chatId,
    content,
    messageType: "text",
    replyToMessageId: replyToMessageId || null,
    replyTo: null,
    reactions: [],
    status: payload.data.status || "sent",
    createdAt: payload.data.createdAt,
    sender: payload.data.sender,
    readBy: [],
  } satisfies Message;
};

export const sendSecureMediaMessage = async ({
  token,
  userId,
  chatId,
  conversation,
  file,
  caption,
}: {
  token: string;
  userId: string;
  chatId: string;
  conversation: Conversation;
  file: File;
  caption?: string;
}) => {
  const state = await getSecureDeviceState(token, userId);
  const encryptedMedia = await encryptSecureMediaFile(file);
  const formData = new FormData();
  formData.append("file", encryptedMedia.encryptedFile);

  const uploadResponse = await fetch(`${getApiBaseUrl()}/e2ee/chats/${chatId}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-qc-device-id": state.deviceId,
    },
    body: formData,
  });
  const uploadPayload = await uploadResponse.json().catch(() => null);

  if (!uploadResponse.ok || !uploadPayload?.data?.url) {
    throw new Error(uploadPayload?.message || "Failed to upload secure media");
  }

  const recipientUserId = getConversationRecipient(conversation, userId);
  const mediaType = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : "document";
  const encryptedContent = JSON.stringify({
    mediaUrl: uploadPayload.data.url,
    mediaType,
    encryptedKey: encryptedMedia.key,
    encryptedIv: encryptedMedia.iv,
    originalName: encryptedMedia.originalName,
    originalType: encryptedMedia.originalType,
    originalSize: encryptedMedia.originalSize,
    caption: caption || "",
  });
  const sendAttempt = async (forceRefresh: boolean) => {
    const [senderDevices, recipientDevices] = await Promise.all([
      fetchPublicDeviceBundles(token, userId, { forceRefresh }),
      fetchPublicDeviceBundles(token, recipientUserId, { forceRefresh }),
    ]);
    const { recipientPayloads } = await encryptSecureTextForRecipients({
      content: encryptedContent,
      senderUserId: userId,
      senderState: state,
      recipientDevices: [...senderDevices, ...recipientDevices],
    });

    return fetchJson(`${getApiBaseUrl()}/e2ee/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-qc-device-id": state.deviceId,
      },
      body: JSON.stringify({
        messageType: mediaType,
        recipientPayloads,
      }),
    });
  };

  let messagePayload: any;
  try {
    messagePayload = await sendAttempt(false);
  } catch (error) {
    if (!isUnavailableOneTimePreKeyError(error)) {
      throw error;
    }

    bundleCache.delete(`bundles:${userId}`);
    bundleCache.delete(`bundles:${recipientUserId}`);
    messagePayload = await sendAttempt(true);
  }

  bundleCache.delete(`bundles:${userId}`);
  bundleCache.delete(`bundles:${recipientUserId}`);

  return {
    id: messagePayload.data.id,
    chatId,
    content: caption || getChatPreviewText({ messageType: mediaType }),
    messageType: mediaType,
    mediaUrl: uploadPayload.data.url,
    mediaType,
    fileSize: encryptedMedia.originalSize,
    fileName: encryptedMedia.originalName,
    mimeType: encryptedMedia.originalType,
    secureMediaKey: encryptedMedia.key,
    secureMediaIv: encryptedMedia.iv,
    isSecureMedia: true,
    replyToMessageId: null,
    replyTo: null,
    reactions: [],
    status: messagePayload.data.status || "sent",
    createdAt: messagePayload.data.createdAt,
    sender: messagePayload.data.sender,
    readBy: [],
  } satisfies Message;
};

export const sendSecureReactionMessage = async ({
  token,
  userId,
  chatId,
  conversation,
  targetMessageId,
  emoji,
  action,
}: {
  token: string;
  userId: string;
  chatId: string;
  conversation: Conversation;
  targetMessageId: string;
  emoji?: string;
  action: "set" | "remove";
}) => {
  const state = await getSecureDeviceState(token, userId);
  const recipientUserId = getConversationRecipient(conversation, userId);

  const sendAttempt = async (forceRefresh: boolean) => {
    const [senderDevices, recipientDevices] = await Promise.all([
      fetchPublicDeviceBundles(token, userId, { forceRefresh }),
      fetchPublicDeviceBundles(token, recipientUserId, { forceRefresh }),
    ]);
    const { recipientPayloads } = await encryptSecureTextForRecipients({
      content: JSON.stringify({
        kind: "reaction",
        version: 1,
        targetMessageId,
        action,
        emoji: action === "set" ? emoji : null,
      }),
      senderUserId: userId,
      senderState: state,
      recipientDevices: [...senderDevices, ...recipientDevices],
    });

    return fetchJson(`${getApiBaseUrl()}/e2ee/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-qc-device-id": state.deviceId,
      },
      body: JSON.stringify({
        messageType: "text",
        replyToMessageId: targetMessageId,
        recipientPayloads,
      }),
    });
  };

  try {
    await sendAttempt(false);
  } catch (error) {
    if (!isUnavailableOneTimePreKeyError(error)) {
      throw error;
    }

    bundleCache.delete(`bundles:${userId}`);
    bundleCache.delete(`bundles:${recipientUserId}`);
    await sendAttempt(true);
  }

  bundleCache.delete(`bundles:${userId}`);
  bundleCache.delete(`bundles:${recipientUserId}`);
};

export const markSecureChatAsRead = async ({
  token,
  userId,
  chatId,
}: {
  token: string;
  userId: string;
  chatId: string;
}) => {
  const state = await getSecureDeviceState(token, userId);
  await fetchJson(`${getApiBaseUrl()}/e2ee/chats/${chatId}/read`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-qc-device-id": state.deviceId,
    },
  });
};
