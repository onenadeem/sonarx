import "./prng";
import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export function encryptForPeer(message, peerPublicKey, mySecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = textEncoder.encode(message);
  const encrypted = nacl.box(messageUint8, nonce, peerPublicKey, mySecretKey);
  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}
export function decryptFromPeer(payload, senderPublicKey, mySecretKey) {
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
    return textDecoder.decode(decrypted);
  } catch {
    return null;
  }
}
export function encryptFileChunk(chunk, fileKey, nonce) {
  return nacl.secretbox(chunk, nonce, fileKey);
}
export function decryptFileChunk(encrypted, fileKey, nonce) {
  return nacl.secretbox.open(encrypted, nonce, fileKey);
}
export function computeSharedSecret(publicKey, secretKey) {
  return nacl.box.before(publicKey, secretKey);
}
