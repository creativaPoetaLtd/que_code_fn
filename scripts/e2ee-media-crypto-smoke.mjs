import assert from "node:assert/strict";

globalThis.window = {
  crypto: globalThis.crypto,
};

const { decryptSecureMediaBlob, encryptSecureMediaFile } = await import(
  "../lib/e2ee/secureMediaCrypto.ts"
);

const readText = async (blob) => Buffer.from(await blob.arrayBuffer()).toString("utf8");
const toBase64Url = (bytes) =>
  Buffer.from(bytes).toString("base64url");

const originalText = "QC secure media smoke payload";
const originalFile = new File([originalText], "proof.txt", { type: "text/plain" });
const encrypted = await encryptSecureMediaFile(originalFile);

assert.equal(encrypted.originalName, "proof.txt");
assert.equal(encrypted.originalType, "text/plain");
assert.equal(encrypted.originalSize, originalFile.size);
assert.equal(encrypted.encryptedFile.type, "application/octet-stream");
assert.notEqual(await readText(encrypted.encryptedFile), originalText);

const decrypted = await decryptSecureMediaBlob({
  encryptedBlob: encrypted.encryptedFile,
  key: encrypted.key,
  iv: encrypted.iv,
  originalType: encrypted.originalType,
});

assert.equal(decrypted.type, "text/plain");
assert.equal(await readText(decrypted), originalText);

await assert.rejects(
  () =>
    decryptSecureMediaBlob({
      encryptedBlob: encrypted.encryptedFile,
      key: toBase64Url(new Uint8Array(32).fill(7)),
      iv: encrypted.iv,
      originalType: encrypted.originalType,
    }),
  /decrypt|operation|data|key/i,
);

const tamperedBytes = new Uint8Array(await encrypted.encryptedFile.arrayBuffer());
tamperedBytes[tamperedBytes.length - 1] ^= 1;

await assert.rejects(
  () =>
    decryptSecureMediaBlob({
      encryptedBlob: new Blob([tamperedBytes], { type: "application/octet-stream" }),
      key: encrypted.key,
      iv: encrypted.iv,
      originalType: encrypted.originalType,
    }),
  /decrypt|operation|data/i,
);

console.log("E2EE media crypto smoke checks passed");
