import { encryptForPeer } from "@/lib/crypto/box";
import { wsRelay } from "./ws-relay";
import logger from "@/src/utils/logger";
function buildRelayMessage(data) {
  if (!data || typeof data !== "object") {
    return null;
  }
  if (!data.ciphertext || !data.nonce || !data.fromPeerId || !data.id) {
    return null;
  }
  return {
    id: String(data.id),
    fromPeerId: String(data.fromPeerId),
    ciphertext: String(data.ciphertext),
    nonce: String(data.nonce),
    timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now(),
  };
}
/**
 * Encrypt and send a message to the recipient via the WebSocket relay.
 * The relay delivers it immediately if the recipient is online, or queues
 * it until they reconnect.
 */
export async function sendGunMessage(
  toPeerId,
  messageId,
  body,
  peerPublicKey,
  mySecretKey,
  fromPeerId,
) {
  const { ciphertext, nonce } = encryptForPeer(
    body,
    peerPublicKey,
    mySecretKey,
  );
  logger.log("[Messaging] Sending to:", toPeerId, "id:", messageId);
  await wsRelay.sendMessage(toPeerId, messageId, {
    id: messageId,
    fromPeerId,
    ciphertext,
    nonce,
    timestamp: Date.now(),
  });
}
/**
 * Subscribe to all incoming messages via the WebSocket relay.
 * Returns an unsubscribe function.
 */
export function subscribeToInbox(myPeerId, onMessage) {
  // Connect (no-op if already connected for this peerId)
  wsRelay.connect(myPeerId);
  const unsub = wsRelay.onMessage((relayMsg) => {
    const normalized = buildRelayMessage(relayMsg.data);
    if (normalized) {
      onMessage(normalized);
    }
  });
  return unsub;
}
