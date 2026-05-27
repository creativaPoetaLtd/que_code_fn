export type SupportedE2EEAlgorithm = "qc-e2ee-p256-v1";

export interface PublicPreKey {
  keyId: number;
  publicKey: JsonWebKey;
}

export interface SecureDeviceBundlePayload {
  algorithm: SupportedE2EEAlgorithm;
  identityPublicKey: JsonWebKey;
  signedPreKey: {
    keyId: number;
    publicKey: JsonWebKey;
    signature: string;
  };
  registrationId: number;
  oneTimePreKeys: PublicPreKey[];
}

export interface StoredOneTimePreKey extends PublicPreKey {
  privateKey: JsonWebKey;
}

export interface StoredSecureDeviceState {
  version: 1;
  ownerUserId: string;
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
  algorithm: SupportedE2EEAlgorithm;
  registrationId: number;
  identity: {
    publicKey: JsonWebKey;
    privateKey: JsonWebKey;
  };
  signedPreKey: {
    keyId: number;
    publicKey: JsonWebKey;
    privateKey: JsonWebKey;
    signature: string;
  };
  oneTimePreKeys: StoredOneTimePreKey[];
  lastServerSyncAt?: string | null;
}

export interface PublicSecureDeviceBundle {
  userId: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
  bundle: {
    algorithm: SupportedE2EEAlgorithm;
    identityPublicKey: JsonWebKey;
    signedPreKeyId: number;
    signedPreKeyPublic: JsonWebKey;
    signedPreKeySignature: string;
    registrationId: number;
  };
  oneTimePreKeys: PublicPreKey[];
}

export interface SecureEncryptedEnvelope {
  version: 1;
  protocolVersion: "secure-dm-v1";
  algorithm: SupportedE2EEAlgorithm;
  senderUserId: string;
  senderDeviceId: string;
  recipientUserId: string;
  recipientDeviceId: string;
  recipientOneTimePreKeyId?: number | null;
  ephemeralPublicKey: JsonWebKey;
  wrappedMessageKey: string;
  wrappedMessageKeyIv: string;
  ciphertext: string;
  ciphertextIv: string;
  createdAt: string;
  signature: string;
}

export interface SecureRecipientPayload {
  recipientUserId: string;
  recipientDeviceId: string;
  encryptedEnvelope: SecureEncryptedEnvelope;
}
