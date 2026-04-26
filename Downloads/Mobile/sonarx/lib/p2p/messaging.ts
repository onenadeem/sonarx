import { encryptForPeer } from "@/lib/crypto/box";
import { wsRelay } from "./ws-relay";

export interface GunMessage {
  id: string;
  fromPeerId: string;
  ciphertext: string;
  nonce: string;
  timestamp: number;
}

/**
 * Encrypt and send a message to the recipient via the WebSocket relay.
 * The relay delivers it immediately if the recipient is online, or queues
 * it until they reconnect.
 */
export async function sendGunMessage(
  toPeerId: string,
  messageId: string,
  body: string,
  peerPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
  fromPeerId: string,
): Promise<void> {
  const { ciphertext, nonce } = encryptForPeer(body, peerPublicKey, mySecretKey);

  console.log("[Messaging] Sending to:", toPeerId, "id:", messageId);

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
export function subscribeToInbox(
  myPeerId: string,
  onMessage: (msg: GunMessage) => void,
): () => void {
  // Connect (no-op if already connected for this peerId)
  wsRelay.connect(myPeerId);

  const unsub = wsRelay.onMessage((relayMsg) => {
    const data = relayMsg.data;
    if (!data || typeof data !== "object") return;
    if (!data.ciphertext || !data.nonce || !data.fromPeerId || !data.id) return;

    onMessage({
      id: String(data.id),
      fromPeerId: String(data.fromPeerId),
      ciphertext: String(data.ciphertext),
      nonce: String(data.nonce),
      timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now(),
    });
  });

  return unsub;
}
