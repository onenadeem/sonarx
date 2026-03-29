import "./prng";
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
}

export function encryptForPeer(
  message: string,
  peerPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): EncryptedPayload {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = new TextEncoder().encode(message);
  const encrypted = nacl.box(messageUint8, nonce, peerPublicKey, mySecretKey);

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

export function decryptFromPeer(
  payload: EncryptedPayload,
  senderPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): string | null {
  try {
    const decrypted = nacl.box.open(
      decodeBase64(payload.ciphertext),
      decodeBase64(payload.nonce),
      senderPublicKey,
      mySecretKey,
    );

    if (!decrypted) {
      return null;
    }

    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

export function encryptFileChunk(
  chunk: Uint8Array,
  fileKey: Uint8Array,
  nonce: Uint8Array,
): Uint8Array {
  return nacl.secretbox(chunk, nonce, fileKey);
}

export function decryptFileChunk(
  encrypted: Uint8Array,
  fileKey: Uint8Array,
  nonce: Uint8Array,
): Uint8Array | null {
  return nacl.secretbox.open(encrypted, nonce, fileKey);
}

export function computeSharedSecret(
  publicKey: Uint8Array,
  secretKey: Uint8Array,
): Uint8Array {
  return nacl.box.before(publicKey, secretKey);
}
