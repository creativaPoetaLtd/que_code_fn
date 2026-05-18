"use client";

import baseUrl from "@/helpers/baseUrl";
import {
  clearStoredSecureDeviceState,
  getStoredSecureDeviceState,
  saveStoredSecureDeviceState,
} from "@/lib/e2ee/deviceStore";
import type {
  PublicPreKey,
  SecureDeviceBundlePayload,
  StoredOneTimePreKey,
  StoredSecureDeviceState,
  SupportedE2EEAlgorithm,
} from "@/types/e2ee.types";

const ACTIVE_APP_VERSION = "web-pwa-v1";
const ONE_TIME_PREKEY_COUNT = 12;
const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
const SUPPORTED_ALGORITHM: SupportedE2EEAlgorithm = "qc-e2ee-p256-v1";

const encoder = new TextEncoder();

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

const toBase64Url = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const getRandomId = () => window.crypto.getRandomValues(new Uint32Array(1))[0] ?? Date.now();

const describeCurrentDevice = () => {
  const nav = window.navigator as Navigator & {
    userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }> };
  };

  const platform = nav.userAgentData?.platform || nav.platform || "web";
  const browser =
    nav.userAgentData?.brands?.[0]?.brand ||
    (/Chrome/i.test(nav.userAgent)
      ? "Chrome"
      : /Edg/i.test(nav.userAgent)
        ? "Edge"
        : /Firefox/i.test(nav.userAgent)
          ? "Firefox"
          : "Browser");
  const mode = window.matchMedia?.("(display-mode: standalone)")?.matches ? "PWA" : "Browser";

  return {
    platform,
    deviceName: `${mode} ${browser}`.trim(),
  };
};

const generateSigningKeyPair = () =>
  window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );

const generateExchangeKeyPair = () =>
  window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true,
    ["deriveBits"],
  );

const exportPrivatePublicPair = async (keyPair: CryptoKeyPair) => ({
  publicKey: (await window.crypto.subtle.exportKey("jwk", keyPair.publicKey)) as JsonWebKey,
  privateKey: (await window.crypto.subtle.exportKey("jwk", keyPair.privateKey)) as JsonWebKey,
});

const signSignedPreKey = async (
  identityPrivateKey: CryptoKey,
  signedPreKeyPublic: JsonWebKey,
) => {
  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    identityPrivateKey,
    encoder.encode(stableStringify(signedPreKeyPublic)),
  );

  return toBase64Url(signature);
};

const generateOneTimePreKeys = async (): Promise<StoredOneTimePreKey[]> => {
  const keys: StoredOneTimePreKey[] = [];

  for (let index = 0; index < ONE_TIME_PREKEY_COUNT; index += 1) {
    const keyPair = await generateExchangeKeyPair();
    const exported = await exportPrivatePublicPair(keyPair);

    keys.push({
      keyId: getRandomId(),
      publicKey: exported.publicKey,
      privateKey: exported.privateKey,
    });
  }

  return keys;
};

const createFreshDeviceState = async (userId: string): Promise<StoredSecureDeviceState> => {
  const { deviceName, platform } = describeCurrentDevice();
  const identityKeys = await generateSigningKeyPair();
  const signedPreKey = await generateExchangeKeyPair();
  const exportedIdentity = await exportPrivatePublicPair(identityKeys);
  const exportedSignedPreKey = await exportPrivatePublicPair(signedPreKey);
  const signature = await signSignedPreKey(identityKeys.privateKey, exportedSignedPreKey.publicKey);

  return {
    version: 1,
    ownerUserId: userId,
    deviceId: window.crypto.randomUUID(),
    deviceName,
    platform,
    appVersion: ACTIVE_APP_VERSION,
    algorithm: SUPPORTED_ALGORITHM,
    registrationId: Number(getRandomId() % 16380) + 1,
    identity: exportedIdentity,
    signedPreKey: {
      keyId: getRandomId(),
      publicKey: exportedSignedPreKey.publicKey,
      privateKey: exportedSignedPreKey.privateKey,
      signature,
    },
    oneTimePreKeys: await generateOneTimePreKeys(),
    lastServerSyncAt: null,
  };
};

const shouldResync = (state: StoredSecureDeviceState) => {
  if (!state.lastServerSyncAt) return true;

  const lastSyncAt = new Date(state.lastServerSyncAt).getTime();
  if (Number.isNaN(lastSyncAt)) return true;

  return Date.now() - lastSyncAt > SYNC_INTERVAL_MS;
};

const buildPublicBundlePayload = (
  state: StoredSecureDeviceState,
): SecureDeviceBundlePayload => ({
  algorithm: state.algorithm,
  identityPublicKey: state.identity.publicKey,
  signedPreKey: {
    keyId: state.signedPreKey.keyId,
    publicKey: state.signedPreKey.publicKey,
    signature: state.signedPreKey.signature,
  },
  registrationId: state.registrationId,
  oneTimePreKeys: state.oneTimePreKeys.map<PublicPreKey>((preKey) => ({
    keyId: preKey.keyId,
    publicKey: preKey.publicKey,
  })),
});

const registerBundle = async (token: string, state: StoredSecureDeviceState) => {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/e2ee/devices/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      deviceId: state.deviceId,
      deviceName: state.deviceName,
      platform: state.platform,
      appVersion: state.appVersion,
      bundle: buildPublicBundlePayload(state),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message || "Failed to register secure device";
    throw Object.assign(new Error(message), { statusCode: response.status });
  }
};

export const ensureRegisteredSecureDevice = async ({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) => {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return null;
  }

  let state = await getStoredSecureDeviceState();

  if (!state || state.ownerUserId !== userId) {
    if (state && state.ownerUserId !== userId) {
      await clearStoredSecureDeviceState();
    }
    state = await createFreshDeviceState(userId);
    await saveStoredSecureDeviceState(state);
  }

  if (!shouldResync(state)) {
    return state;
  }

  try {
    await registerBundle(token, state);
    const nextState: StoredSecureDeviceState = {
      ...state,
      lastServerSyncAt: new Date().toISOString(),
    };
    await saveStoredSecureDeviceState(nextState);
    return nextState;
  } catch (error: any) {
    if (error?.statusCode === 409) {
      const regenerated = await createFreshDeviceState(userId);
      await registerBundle(token, regenerated);
      const nextState: StoredSecureDeviceState = {
        ...regenerated,
        lastServerSyncAt: new Date().toISOString(),
      };
      await saveStoredSecureDeviceState(nextState);
      return nextState;
    }

    console.error("Secure device bootstrap failed:", error);
    return state;
  }
};
