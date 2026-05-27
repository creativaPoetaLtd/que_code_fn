"use client";

import baseUrl from "@/helpers/baseUrl";
import { assertTrustedDeviceIdentity } from "@/lib/e2ee/identityTrustStore";
import { saveStoredSecureDeviceState } from "@/lib/e2ee/deviceStore";
import { decryptSecureEnvelope, encryptSecureTextForRecipients } from "@/lib/e2ee/secureMessageCrypto";
import { ensureRegisteredSecureDevice } from "@/services/e2eeDeviceService";
import type { Conversation, Message, ReplyPreview } from "@/types/chat.types";
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

const getConversationRecipient = (conversation: Conversation, userId: string) => {
  const recipient = conversation.participants.find((participant) => participant.userId !== userId);
  if (!recipient) {
    throw new Error("Unable to resolve the secure chat recipient");
  }

  return recipient.userId;
};

const fetchPublicDeviceBundles = async (token: string, userId: string) => {
  const cacheKey = `bundles:${userId}`;
  const cached = bundleCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < BUNDLE_CACHE_TTL_MS) {
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

  const content = await decryptSecureEnvelope({
    envelope,
    senderIdentityPublicKey: senderDevice.bundle.identityPublicKey,
    recipientState: state,
  });
  const recipientOneTimePreKeyId = envelope.recipientOneTimePreKeyId || null;

  if (recipientOneTimePreKeyId) {
    const remainingOneTimePreKeys = state.oneTimePreKeys.filter(
      (preKey) => preKey.keyId !== recipientOneTimePreKeyId,
    );

    if (remainingOneTimePreKeys.length !== state.oneTimePreKeys.length) {
      state.oneTimePreKeys = remainingOneTimePreKeys;
      await saveStoredSecureDeviceState(state);
    }
  }

  return {
    id: rawMessage.id,
    chatId: rawMessage.chatId,
    content,
    messageType: rawMessage.messageType,
    replyToMessageId: rawMessage.replyToMessageId || null,
    replyTo: null as ReplyPreview | null,
    reactions: [],
    status: rawMessage.status,
    deliveredAt: rawMessage.deliveredAt || undefined,
    readAt: rawMessage.readAt || undefined,
    createdAt: rawMessage.createdAt,
    sender: rawMessage.sender,
    readBy: [],
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
          readBy: [],
        } satisfies Message;
      }
    }),
  );

  return decryptedMessages.reverse();
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
  const [senderDevices, recipientDevices] = await Promise.all([
    fetchPublicDeviceBundles(token, userId),
    fetchPublicDeviceBundles(token, recipientUserId),
  ]);

  const { recipientPayloads } = await encryptSecureTextForRecipients({
    content,
    senderUserId: userId,
    senderState: state,
    recipientDevices: [...senderDevices, ...recipientDevices],
  });

  const payload = await fetchJson(`${getApiBaseUrl()}/e2ee/chats/${chatId}/messages`, {
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

  bundleCache.delete(`bundles:${userId}`);

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
