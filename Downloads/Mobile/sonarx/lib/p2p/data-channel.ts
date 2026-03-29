import { peerManager } from "./peer-manager";
import { decryptFromPeer, encryptForPeer } from "@/lib/crypto/box";

export interface MessagePacket {
  type: "message";
  payload: {
    id: string;
    encryptedBody: string;
    nonce: string;
    timestamp: number;
  };
}

export interface FileMetaPacket {
  type: "file_meta";
  payload: {
    fileId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    chunkCount: number;
    encryptionKey: string; // Base64 encrypted file key
  };
}

export interface FileChunkPacket {
  type: "file_chunk";
  payload: {
    fileId: string;
    chunkIndex: number;
    data: string; // Base64 encrypted chunk
    nonce: string;
    isLast: boolean;
  };
}

export interface FileAckPacket {
  type: "file_ack";
  payload: {
    fileId: string;
    chunkIndex: number;
  };
}

export interface DeliveryReceiptPacket {
  type: "delivery_receipt";
  payload: {
    messageId: string;
    deliveredAt: number;
  };
}

export interface ReadReceiptPacket {
  type: "read_receipt";
  payload: {
    messageId: string;
    readAt: number;
  };
}

export interface TypingPacket {
  type: "typing";
  payload: {
    isTyping: boolean;
  };
}

export interface CallRequestPacket {
  type: "call_request";
  payload: {
    callId: string;
    isVideo: boolean;
    sdp: string;
  };
}

export interface CallAcceptPacket {
  type: "call_accept";
  payload: {
    callId: string;
    sdp: string;
  };
}

export interface CallRejectPacket {
  type: "call_reject";
  payload: {
    callId: string;
    reason: string;
  };
}

export interface CallEndPacket {
  type: "call_end";
  payload: {
    callId: string;
    duration: number; // seconds
  };
}

export type DataChannelPacket =
  | MessagePacket
  | FileMetaPacket
  | FileChunkPacket
  | FileAckPacket
  | DeliveryReceiptPacket
  | ReadReceiptPacket
  | TypingPacket
  | CallRequestPacket
  | CallAcceptPacket
  | CallRejectPacket
  | CallEndPacket;

export interface PacketHandlers {
  onMessage: (msg: MessagePacket["payload"]) => void;
  onFileMetadata: (meta: FileMetaPacket["payload"]) => void;
  onFileChunk: (chunk: FileChunkPacket["payload"]) => void;
  onFileAck: (ack: FileAckPacket["payload"]) => void;
  onDeliveryReceipt: (receipt: DeliveryReceiptPacket["payload"]) => void;
  onReadReceipt: (receipt: ReadReceiptPacket["payload"]) => void;
  onTyping: (typing: TypingPacket["payload"]) => void;
  onCallRequest: (req: CallRequestPacket["payload"]) => void;
  onCallAccept: (accept: CallAcceptPacket["payload"]) => void;
  onCallReject: (reject: CallRejectPacket["payload"]) => void;
  onCallEnd: (end: CallEndPacket["payload"]) => void;
}

export async function sendMessagePacket(
  peerId: string,
  messageId: string,
  encryptedBody: string,
  nonce: string,
  timestamp: number,
): Promise<boolean> {
  const packet: MessagePacket = {
    type: "message",
    payload: {
      id: messageId,
      encryptedBody,
      nonce,
      timestamp,
    },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendFileMetaPacket(
  peerId: string,
  meta: FileMetaPacket["payload"],
): Promise<boolean> {
  const packet: FileMetaPacket = {
    type: "file_meta",
    payload: meta,
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendFileChunkPacket(
  peerId: string,
  chunk: FileChunkPacket["payload"],
): Promise<boolean> {
  const packet: FileChunkPacket = {
    type: "file_chunk",
    payload: chunk,
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendFileAckPacket(
  peerId: string,
  fileId: string,
  chunkIndex: number,
): Promise<boolean> {
  const packet: FileAckPacket = {
    type: "file_ack",
    payload: { fileId, chunkIndex },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendDeliveryReceipt(
  peerId: string,
  messageId: string,
): Promise<boolean> {
  const packet: DeliveryReceiptPacket = {
    type: "delivery_receipt",
    payload: {
      messageId,
      deliveredAt: Date.now(),
    },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendReadReceipt(
  peerId: string,
  messageId: string,
): Promise<boolean> {
  const packet: ReadReceiptPacket = {
    type: "read_receipt",
    payload: {
      messageId,
      readAt: Date.now(),
    },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendTypingIndicator(
  peerId: string,
  isTyping: boolean,
): Promise<boolean> {
  const packet: TypingPacket = {
    type: "typing",
    payload: { isTyping },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendCallRequest(
  peerId: string,
  callId: string,
  isVideo: boolean,
  sdp: string,
): Promise<boolean> {
  const packet: CallRequestPacket = {
    type: "call_request",
    payload: { callId, isVideo, sdp },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendCallAccept(
  peerId: string,
  callId: string,
  sdp: string,
): Promise<boolean> {
  const packet: CallAcceptPacket = {
    type: "call_accept",
    payload: { callId, sdp },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendCallReject(
  peerId: string,
  callId: string,
  reason: string,
): Promise<boolean> {
  const packet: CallRejectPacket = {
    type: "call_reject",
    payload: { callId, reason },
  };

  return peerManager.sendPacket(peerId, packet);
}
export async function sendCallEnd(
  peerId: string,
  callId: string,
  duration: number,
): Promise<boolean> {
  const packet: CallEndPacket = {
    type: "call_end",
    payload: { callId, duration },
  };

  return peerManager.sendPacket(peerId, packet);
}
export function handleIncomingPacket(
  packet: DataChannelPacket,
  handlers: PacketHandlers,
): void {
  if (!packet || !packet.type) {
    console.warn("Received invalid packet");
    return;
  }

  switch (packet.type) {
    case "message":
      handlers.onMessage(packet.payload);
      break;
    case "file_meta":
      handlers.onFileMetadata(packet.payload);
      break;
    case "file_chunk":
      handlers.onFileChunk(packet.payload);
      break;
    case "file_ack":
      handlers.onFileAck(packet.payload);
      break;
    case "delivery_receipt":
      handlers.onDeliveryReceipt(packet.payload);
      break;
    case "read_receipt":
      handlers.onReadReceipt(packet.payload);
      break;
    case "typing":
      handlers.onTyping(packet.payload);
      break;
    case "call_request":
      handlers.onCallRequest(packet.payload);
      break;
    case "call_accept":
      handlers.onCallAccept(packet.payload);
      break;
    case "call_reject":
      handlers.onCallReject(packet.payload);
      break;
    case "call_end":
      handlers.onCallEnd(packet.payload);
      break;
    default:
      console.warn("Unknown packet type:", (packet as any).type);
  }
}
