"use client";

import type {
  PublicSecureDeviceBundle,
  SecureEncryptedEnvelope,
  SecureRecipientPayload,
  StoredSecureDeviceState,
  SupportedE2EEAlgorithm,
} from "@/types/e2ee.types";

const SUPPORTED_ALGORITHM: SupportedE2EEAlgorithm = "qc-e2ee-p256-v1";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
};

const toBase64Url = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const importIdentityPrivateKey = (jwk: JsonWebKey) =>
  window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"],
  );

const importIdentityPublicKey = (jwk: JsonWebKey) =>
  window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"],
  );

const importExchangePrivateKey = (jwk: JsonWebKey) =>
  window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveBits"],
  );

const importExchangePublicKey = (jwk: JsonWebKey) =>
  window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    [],
  );

const deriveWrappingKey = async ({
  privateKey,
  publicKey,
  senderDeviceId,
  recipientDeviceId,
}: {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  senderDeviceId: string;
  recipientDeviceId: string;
}) => {
  const sharedSecret = await window.crypto.subtle.deriveBits(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    256,
  );

  const hkdfKey = await window.crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, [
    "deriveKey",
  ]);

  return window.crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("qc-secure-dm-v1-salt"),
      info: encoder.encode(`${senderDeviceId}:${recipientDeviceId}:message-wrap`),
    },
    hkdfKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
};

const signEnvelopePayload = async (
  identityPrivateKey: CryptoKey,
  payload: Omit<SecureEncryptedEnvelope, "signature">,
) => {
  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    identityPrivateKey,
    encoder.encode(stableStringify(payload)),
  );

  return toBase64Url(signature);
};

const verifyEnvelopePayload = async ({
  identityPublicKey,
  payload,
}: {
  identityPublicKey: JsonWebKey;
  payload: SecureEncryptedEnvelope;
}) => {
  const cryptoKey = await importIdentityPublicKey(identityPublicKey);
  const { signature, ...unsignedPayload } = payload;
  return window.crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    cryptoKey,
    fromBase64Url(signature),
    encoder.encode(stableStringify(unsignedPayload)),
  );
};

const verifySignedPreKey = async (bundle: PublicSecureDeviceBundle) => {
  const identityKey = await importIdentityPublicKey(bundle.bundle.identityPublicKey);
  return window.crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    identityKey,
    fromBase64Url(bundle.bundle.signedPreKeySignature),
    encoder.encode(stableStringify(bundle.bundle.signedPreKeyPublic)),
  );
};

export const encryptSecureTextForRecipients = async ({
  content,
  senderUserId,
  senderState,
  recipientDevices,
}: {
  content: string;
  senderUserId: string;
  senderState: StoredSecureDeviceState;
  recipientDevices: PublicSecureDeviceBundle[];
}) => {
  if (!content.trim()) {
    throw new Error("Cannot encrypt an empty secure message");
  }

  const identityPrivateKey = await importIdentityPrivateKey(senderState.identity.privateKey);
  const rawMessageKey = window.crypto.getRandomValues(new Uint8Array(32));
  const messageKey = await window.crypto.subtle.importKey(
    "raw",
    rawMessageKey,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"],
  );
  const ciphertextIv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: ciphertextIv,
    },
    messageKey,
    encoder.encode(content),
  );

  const createdAt = new Date().toISOString();
  const recipientPayloads: SecureRecipientPayload[] = [];

  for (const recipientDevice of recipientDevices) {
    if (!(await verifySignedPreKey(recipientDevice))) {
      throw new Error(`Secure device bundle verification failed for ${recipientDevice.deviceId}`);
    }

    const ephemeralKeyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveBits"],
    );
    const selectedOneTimePreKey = recipientDevice.oneTimePreKeys[0] || null;
    const recipientPublicKey = await importExchangePublicKey(
      selectedOneTimePreKey?.publicKey || recipientDevice.bundle.signedPreKeyPublic,
    );
    const wrappingKey = await deriveWrappingKey({
      privateKey: ephemeralKeyPair.privateKey,
      publicKey: recipientPublicKey,
      senderDeviceId: senderState.deviceId,
      recipientDeviceId: recipientDevice.deviceId,
    });
    const wrappingIv = window.crypto.getRandomValues(new Uint8Array(12));
    const wrappedMessageKey = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: wrappingIv,
      },
      wrappingKey,
      rawMessageKey,
    );
    const ephemeralPublicKey = (await window.crypto.subtle.exportKey(
      "jwk",
      ephemeralKeyPair.publicKey,
    )) as JsonWebKey;

    const unsignedEnvelope: Omit<SecureEncryptedEnvelope, "signature"> = {
      version: 1,
      protocolVersion: "secure-dm-v1",
      algorithm: SUPPORTED_ALGORITHM,
      senderUserId,
      senderDeviceId: senderState.deviceId,
      recipientUserId: recipientDevice.userId,
      recipientDeviceId: recipientDevice.deviceId,
      recipientOneTimePreKeyId: selectedOneTimePreKey?.keyId || null,
      ephemeralPublicKey,
      wrappedMessageKey: toBase64Url(wrappedMessageKey),
      wrappedMessageKeyIv: toBase64Url(wrappingIv),
      ciphertext: toBase64Url(ciphertext),
      ciphertextIv: toBase64Url(ciphertextIv),
      createdAt,
    };
    const signature = await signEnvelopePayload(identityPrivateKey, unsignedEnvelope);

    recipientPayloads.push({
      recipientUserId: recipientDevice.userId,
      recipientDeviceId: recipientDevice.deviceId,
      encryptedEnvelope: {
        ...unsignedEnvelope,
        signature,
      },
    });
  }

  return {
    createdAt,
    recipientPayloads,
  };
};

export const decryptSecureEnvelope = async ({
  envelope,
  senderIdentityPublicKey,
  recipientState,
}: {
  envelope: SecureEncryptedEnvelope;
  senderIdentityPublicKey: JsonWebKey;
  recipientState: StoredSecureDeviceState;
}) => {
  if (envelope.algorithm !== SUPPORTED_ALGORITHM) {
    throw new Error("Unsupported secure message algorithm");
  }

  if (envelope.recipientDeviceId !== recipientState.deviceId) {
    throw new Error("Secure message envelope does not target this device");
  }

  const isAuthentic = await verifyEnvelopePayload({
    identityPublicKey: senderIdentityPublicKey,
    payload: envelope,
  });

  if (!isAuthentic) {
    throw new Error("Secure message signature verification failed");
  }

  const recipientOneTimePreKeyId = envelope.recipientOneTimePreKeyId || null;
  const oneTimePreKey = recipientOneTimePreKeyId
    ? recipientState.oneTimePreKeys.find((preKey) => preKey.keyId === recipientOneTimePreKeyId)
    : null;

  if (recipientOneTimePreKeyId && !oneTimePreKey) {
    throw new Error("Secure message one-time pre-key is not available on this device");
  }

  const recipientPreKeyPrivate = await importExchangePrivateKey(
    oneTimePreKey?.privateKey || recipientState.signedPreKey.privateKey,
  );
  const ephemeralPublicKey = await importExchangePublicKey(envelope.ephemeralPublicKey);
  const wrappingKey = await deriveWrappingKey({
    privateKey: recipientPreKeyPrivate,
    publicKey: ephemeralPublicKey,
    senderDeviceId: envelope.senderDeviceId,
    recipientDeviceId: envelope.recipientDeviceId,
  });
  const rawMessageKey = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64Url(envelope.wrappedMessageKeyIv),
    },
    wrappingKey,
    fromBase64Url(envelope.wrappedMessageKey),
  );
  const messageKey = await window.crypto.subtle.importKey(
    "raw",
    rawMessageKey,
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64Url(envelope.ciphertextIv),
    },
    messageKey,
    fromBase64Url(envelope.ciphertext),
  );

  return decoder.decode(plaintext);
};
