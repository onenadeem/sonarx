import "./prng";
import nacl from "tweetnacl";
import {
  bytesToEmojiList,
  bytesFromHex,
  computeFingerprint as computeFingerprintHash,
} from "./fingerprint";
export function generateBoxKeypair() {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  };
}
export function generateSignKeypair() {
  const keypair = nacl.sign.keyPair();
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey,
  };
}
export async function storeSecretKeys() {
  throw new Error("Use expo-secure-store directly in lib/identity.js");
}
export async function loadSecretKeys() {
  throw new Error("Use expo-secure-store directly in lib/identity.js");
}
export async function computeFingerprint(publicKey) {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
      return computeFingerprintHash(publicKey);
    }
  } catch {
    // Fall back to tweetnacl hash for non-web/native environments.
  }
  const hashArray = Array.from(nacl.hash(publicKey)).slice(0, 32);
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function fingerprintToEmoji(hex) {
  return bytesToEmojiList(bytesFromHex(hex));
}
