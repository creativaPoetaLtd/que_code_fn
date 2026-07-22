"use client";

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

export interface SecureMediaEncryptionResult {
  encryptedFile: File;
  key: string;
  iv: string;
  originalName: string;
  originalType: string;
  originalSize: number;
}

export const encryptSecureMediaFile = async (file: File): Promise<SecureMediaEncryptionResult> => {
  const rawKey = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await window.crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    await file.arrayBuffer(),
  );
  const encryptedFile = new File([ciphertext], `${file.name}.qcenc`, {
    type: "application/octet-stream",
  });

  return {
    encryptedFile,
    key: toBase64Url(rawKey),
    iv: toBase64Url(iv),
    originalName: file.name,
    originalType: file.type || "application/octet-stream",
    originalSize: file.size,
  };
};

export const decryptSecureMediaBlob = async ({
  encryptedBlob,
  key,
  iv,
  originalType,
}: {
  encryptedBlob: Blob;
  key: string;
  iv: string;
  originalType: string;
}) => {
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    fromBase64Url(key),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const plaintext = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64Url(iv),
    },
    cryptoKey,
    await encryptedBlob.arrayBuffer(),
  );

  return new Blob([plaintext], { type: originalType });
};
