"use client";

const TRUST_STORAGE_KEY = "qc:secure-device-identity-pins";
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

const toBase64Url = (value: ArrayBuffer | Uint8Array) => {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const readPins = () => {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  try {
    const raw = window.localStorage.getItem(TRUST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const writePins = (pins: Record<string, string>) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(pins));
};

export const getIdentityFingerprint = async (identityPublicKey: JsonWebKey) => {
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    encoder.encode(stableStringify(identityPublicKey)),
  );

  return toBase64Url(digest);
};

export const assertTrustedDeviceIdentity = async ({
  userId,
  deviceId,
  identityPublicKey,
}: {
  userId: string;
  deviceId: string;
  identityPublicKey: JsonWebKey;
}) => {
  const fingerprint = await getIdentityFingerprint(identityPublicKey);
  const pinKey = `${userId}:${deviceId}`;
  const pins = readPins();
  const existing = pins[pinKey];

  if (existing && existing !== fingerprint) {
    throw new Error("Secure device identity changed. Verify this contact before continuing.");
  }

  if (!existing) {
    pins[pinKey] = fingerprint;
    writePins(pins);
  }

  return fingerprint;
};
