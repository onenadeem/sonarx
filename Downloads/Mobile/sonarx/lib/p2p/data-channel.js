import { peerManager } from "./peer-manager";
export async function sendMessagePacket(peerId, messageId, encryptedBody, nonce, timestamp) {
    const packet = {
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
export async function sendFileMetaPacket(peerId, meta) {
    const packet = {
        type: "file_meta",
        payload: meta,
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendFileChunkPacket(peerId, chunk) {
    const packet = {
        type: "file_chunk",
        payload: chunk,
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendFileAckPacket(peerId, fileId, chunkIndex) {
    const packet = {
        type: "file_ack",
        payload: { fileId, chunkIndex },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendDeliveryReceipt(peerId, messageId) {
    const packet = {
        type: "delivery_receipt",
        payload: {
            messageId,
            deliveredAt: Date.now(),
        },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendReadReceipt(peerId, messageId) {
    const packet = {
        type: "read_receipt",
        payload: {
            messageId,
            readAt: Date.now(),
        },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendTypingIndicator(peerId, isTyping) {
    const packet = {
        type: "typing",
        payload: { isTyping },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendCallRequest(peerId, callId, isVideo, sdp) {
    const packet = {
        type: "call_request",
        payload: { callId, isVideo, sdp },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendCallAccept(peerId, callId, sdp) {
    const packet = {
        type: "call_accept",
        payload: { callId, sdp },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendCallReject(peerId, callId, reason) {
    const packet = {
        type: "call_reject",
        payload: { callId, reason },
    };
    return peerManager.sendPacket(peerId, packet);
}
export async function sendCallEnd(peerId, callId, duration) {
    const packet = {
        type: "call_end",
        payload: { callId, duration },
    };
    return peerManager.sendPacket(peerId, packet);
}
export function handleIncomingPacket(packet, handlers) {
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
            console.warn("Unknown packet type:", packet.type);
    }
}
