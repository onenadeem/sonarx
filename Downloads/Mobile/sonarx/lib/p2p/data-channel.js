import { peerManager } from "./peer-manager";
import logger from "@/src/utils/logger";

const buildPacket = (type, payload) => ({
  type,
  payload,
});
const sendPacket = (peerId, packet) => {
  return peerManager.sendPacket(peerId, packet);
};
const dispatchHandler = (handler, payload) => {
  if (typeof handler !== "function") {
    return;
  }
  handler(payload);
};
export async function sendMessagePacket(
  peerId,
  messageId,
  encryptedBody,
  nonce,
  timestamp,
) {
  return sendPacket(
    peerId,
    buildPacket("message", { id: messageId, encryptedBody, nonce, timestamp }),
  );
}
export async function sendFileMetaPacket(peerId, meta) {
  return sendPacket(peerId, buildPacket("file_meta", meta));
}
export async function sendFileChunkPacket(peerId, chunk) {
  return sendPacket(peerId, buildPacket("file_chunk", chunk));
}
export async function sendFileAckPacket(peerId, fileId, chunkIndex) {
  return sendPacket(peerId, buildPacket("file_ack", { fileId, chunkIndex }));
}
export async function sendDeliveryReceipt(peerId, messageId) {
  return sendPacket(
    peerId,
    buildPacket("delivery_receipt", {
      messageId,
      deliveredAt: Date.now(),
    }),
  );
}
export async function sendReadReceipt(peerId, messageId) {
  return sendPacket(
    peerId,
    buildPacket("read_receipt", { messageId, readAt: Date.now() }),
  );
}
export async function sendTypingIndicator(peerId, isTyping) {
  return sendPacket(peerId, buildPacket("typing", { isTyping }));
}
export async function sendCallRequest(peerId, callId, isVideo, sdp) {
  return sendPacket(
    peerId,
    buildPacket("call_request", { callId, isVideo, sdp }),
  );
}
export async function sendCallAccept(peerId, callId, sdp) {
  return sendPacket(peerId, buildPacket("call_accept", { callId, sdp }));
}
export async function sendCallReject(peerId, callId, reason) {
  return sendPacket(peerId, buildPacket("call_reject", { callId, reason }));
}
export async function sendCallEnd(peerId, callId, duration) {
  return sendPacket(peerId, buildPacket("call_end", { callId, duration }));
}
export function handleIncomingPacket(packet, handlers) {
  if (!packet || !packet.type || !handlers) {
    logger.warn("Received invalid packet");
    return;
  }
  switch (packet.type) {
    case "message":
      dispatchHandler(handlers.onMessage, packet.payload);
      break;
    case "file_meta":
      dispatchHandler(handlers.onFileMetadata, packet.payload);
      break;
    case "file_chunk":
      dispatchHandler(handlers.onFileChunk, packet.payload);
      break;
    case "file_ack":
      dispatchHandler(handlers.onFileAck, packet.payload);
      break;
    case "delivery_receipt":
      dispatchHandler(handlers.onDeliveryReceipt, packet.payload);
      break;
    case "read_receipt":
      dispatchHandler(handlers.onReadReceipt, packet.payload);
      break;
    case "typing":
      dispatchHandler(handlers.onTyping, packet.payload);
      break;
    case "call_request":
      dispatchHandler(handlers.onCallRequest, packet.payload);
      break;
    case "call_accept":
      dispatchHandler(handlers.onCallAccept, packet.payload);
      break;
    case "call_reject":
      dispatchHandler(handlers.onCallReject, packet.payload);
      break;
    case "call_end":
      dispatchHandler(handlers.onCallEnd, packet.payload);
      break;
    default:
      logger.warn("Unknown packet type:", packet.type);
  }
}
