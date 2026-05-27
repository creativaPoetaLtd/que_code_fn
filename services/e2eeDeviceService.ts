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
const MIN_ONE_TIME_PREKEY_COUNT = 4;
const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;
const SIGNED_PREKEY_ROTATION_MS = 7 * 24 * 60 * 60 * 1000;
const SUPPORTED_ALGORITHM: SupportedE2EEAlgorithm = "qc-e2ee-p256-v1";
const MAX_DB_SAFE_PREKEY_ID = 2_147_483_646;

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

const getRandomId = () =>
  Number(window.crypto.getRandomValues(new Uint32Array(1))[0] % MAX_DB_SAFE_PREKEY_ID) + 1;

const getUniqueRandomId = (usedIds: Set<number>) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const keyId = getRandomId();
    if (!usedIds.has(keyId)) {
      usedIds.add(keyId);
      return keyId;
    }
  }

  throw new Error("Unable to generate a unique secure pre-key id");
};

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

const generateOneTimePreKeys = async (
  count = ONE_TIME_PREKEY_COUNT,
  existingIds = new Set<number>(),
): Promise<StoredOneTimePreKey[]> => {
  const keys: StoredOneTimePreKey[] = [];

  for (let index = 0; index < count; index += 1) {
    const keyPair = await generateExchangeKeyPair();
    const exported = await exportPrivatePublicPair(keyPair);

    keys.push({
      keyId: getUniqueRandomId(existingIds),
      publicKey: exported.publicKey,
      privateKey: exported.privateKey,
    });
  }

  return keys;
};

const createSignedPreKey = async (identityPrivateKey: CryptoKey, usedIds = new Set<number>()) => {
  const signedPreKey = await generateExchangeKeyPair();
  const exportedSignedPreKey = await exportPrivatePublicPair(signedPreKey);
  const signature = await signSignedPreKey(identityPrivateKey, exportedSignedPreKey.publicKey);

  return {
    keyId: getUniqueRandomId(usedIds),
    publicKey: exportedSignedPreKey.publicKey,
    privateKey: exportedSignedPreKey.privateKey,
    signature,
    createdAt: new Date().toISOString(),
  };
};

const createFreshDeviceState = async (userId: string): Promise<StoredSecureDeviceState> => {
  const { deviceName, platform } = describeCurrentDevice();
  const identityKeys = await generateSigningKeyPair();
  const exportedIdentity = await exportPrivatePublicPair(identityKeys);
  const usedKeyIds = new Set<number>();
  const signedPreKey = await createSignedPreKey(identityKeys.privateKey, usedKeyIds);

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
    signedPreKey,
    oneTimePreKeys: await generateOneTimePreKeys(ONE_TIME_PREKEY_COUNT, usedKeyIds),
    lastServerSyncAt: null,
  };
};

const hasValidPreKeyIds = (state: StoredSecureDeviceState) =>
  state.signedPreKey.keyId > 0 &&
  state.signedPreKey.keyId <= MAX_DB_SAFE_PREKEY_ID &&
  state.oneTimePreKeys.every(
    (preKey) => preKey.keyId > 0 && preKey.keyId <= MAX_DB_SAFE_PREKEY_ID,
  );

const hasStaleSyncMarker = (state: StoredSecureDeviceState) => {
  if (!state.lastServerSyncAt) return true;

  const lastSyncAt = new Date(state.lastServerSyncAt).getTime();
  if (Number.isNaN(lastSyncAt)) return true;

  return Date.now() - lastSyncAt > SYNC_INTERVAL_MS;
};

const shouldRotateSignedPreKey = (state: StoredSecureDeviceState) => {
  if (!state.signedPreKey.createdAt) return true;

  const createdAt = new Date(state.signedPreKey.createdAt).getTime();
  if (Number.isNaN(createdAt)) return true;

  return Date.now() - createdAt > SIGNED_PREKEY_ROTATION_MS;
};

const getRegisteredDeviceSummary = async (token: string, deviceId: string) => {
  if (!baseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/e2ee/devices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    const devices = Array.isArray(payload?.data) ? payload.data : [];
    return devices.find((device: any) => device.deviceId === deviceId) || null;
  } catch {
    return null;
  }
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

const rotateServerSignedPreKey = async (token: string, state: StoredSecureDeviceState) => {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/e2ee/devices/${state.deviceId}/signed-prekey`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      signedPreKey: {
        keyId: state.signedPreKey.keyId,
        publicKey: state.signedPreKey.publicKey,
        signature: state.signedPreKey.signature,
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw Object.assign(new Error(payload?.message || "Failed to rotate signed pre-key"), {
      statusCode: response.status,
    });
  }
};

const uploadAdditionalOneTimePreKeys = async (
  token: string,
  state: StoredSecureDeviceState,
  preKeys: StoredOneTimePreKey[],
) => {
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/e2ee/devices/${state.deviceId}/one-time-prekeys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      oneTimePreKeys: preKeys.map<PublicPreKey>((preKey) => ({
        keyId: preKey.keyId,
        publicKey: preKey.publicKey,
      })),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw Object.assign(new Error(payload?.message || "Failed to upload one-time pre-keys"), {
      statusCode: response.status,
    });
  }
};

const importIdentityPrivateKey = (privateKey: JsonWebKey) =>
  window.crypto.subtle.importKey(
    "jwk",
    privateKey,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"],
  );

const refreshDeviceKeyMaterial = async (
  token: string,
  state: StoredSecureDeviceState,
  serverAvailableOneTimePreKeys: number | null,
) => {
  let nextState = state;
  const usedKeyIds = new Set<number>([
    state.signedPreKey.keyId,
    ...state.oneTimePreKeys.map((preKey) => preKey.keyId),
  ]);

  if (shouldRotateSignedPreKey(state)) {
    const identityPrivateKey = await importIdentityPrivateKey(state.identity.privateKey);
    nextState = {
      ...nextState,
      signedPreKey: await createSignedPreKey(identityPrivateKey, usedKeyIds),
      lastServerSyncAt: null,
    };
    await rotateServerSignedPreKey(token, nextState);
    nextState = {
      ...nextState,
      lastServerSyncAt: new Date().toISOString(),
    };
    await saveStoredSecureDeviceState(nextState);
  }

  const availableOneTimePreKeys =
    serverAvailableOneTimePreKeys ?? nextState.oneTimePreKeys.length;

  if (availableOneTimePreKeys < MIN_ONE_TIME_PREKEY_COUNT) {
    const missingCount = ONE_TIME_PREKEY_COUNT - availableOneTimePreKeys;
    const freshPreKeys = await generateOneTimePreKeys(missingCount, usedKeyIds);
    nextState = {
      ...nextState,
      oneTimePreKeys: [...nextState.oneTimePreKeys, ...freshPreKeys],
      lastServerSyncAt: new Date().toISOString(),
    };
    await uploadAdditionalOneTimePreKeys(token, nextState, freshPreKeys);
    await saveStoredSecureDeviceState(nextState);
  }

  return nextState;
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

  if (!hasValidPreKeyIds(state)) {
    state = await createFreshDeviceState(userId);
    await saveStoredSecureDeviceState(state);
  }

  const registeredDevice = await getRegisteredDeviceSummary(token, state.deviceId);

  const needsServerSync =
    !registeredDevice ||
    !registeredDevice.bundle?.algorithm ||
    Number(registeredDevice.availableOneTimePreKeys || 0) <= 0;

  if (needsServerSync) {
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
  }

  try {
    state = await refreshDeviceKeyMaterial(
      token,
      state,
      Number(registeredDevice.availableOneTimePreKeys || 0),
    );
  } catch (error) {
    console.error("Secure device key refresh failed:", error);
  }

  if (hasStaleSyncMarker(state)) {
    const nextState = {
      ...state,
      lastServerSyncAt: new Date().toISOString(),
    };
    await saveStoredSecureDeviceState(nextState);
    return nextState;
  }

  return state;
};
