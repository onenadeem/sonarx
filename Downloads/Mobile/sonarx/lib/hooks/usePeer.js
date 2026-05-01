import { useEffect, useState, useCallback, useMemo } from "react";
import { peerManager } from "@/lib/p2p/peer-manager";
import { sendMessagePacket, handleIncomingPacket, } from "@/lib/p2p/data-channel";

const createPeerHandlers = ({ setIsConnected, setIsConnecting, setConnectionError }) => {
    return {
        onMessage: (msg) => {
            console.log("Received message:", msg);
        },
        onFileMetadata: (meta) => {
            console.log("File transfer started:", meta);
        },
        onFileChunk: (chunk) => {
            console.log("Received file chunk:", chunk.chunkIndex);
        },
        onFileAck: (ack) => {
            console.log("File chunk acknowledged:", ack.chunkIndex);
        },
        onDeliveryReceipt: (receipt) => {
            console.log("Message delivered:", receipt.messageId);
        },
        onReadReceipt: (receipt) => {
            console.log("Message read:", receipt.messageId);
        },
        onTyping: (typing) => {
            console.log("Peer typing:", typing.isTyping);
        },
        onCallRequest: (req) => {
            console.log("Incoming call:", req.callId);
        },
        onCallAccept: (accept) => {
            console.log("Call accepted:", accept.callId);
        },
        onCallReject: (reject) => {
            console.log("Call rejected:", reject.callId);
        },
        onCallEnd: (end) => {
            console.log("Call ended:", end.callId, "duration:", end.duration);
        },
        onStateChange: (state) => {
            setIsConnected(state === "connected");
            setIsConnecting(state === "connecting");
            if (state === "failed") {
                setConnectionError("Connection failed");
            }
        },
    };
};

export function usePeer(peerId) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState(null);

    const handlers = useMemo(
        () =>
            createPeerHandlers({
                setIsConnected,
                setIsConnecting,
                setConnectionError,
            }),
        [setIsConnected, setIsConnecting, setConnectionError],
    );

    useEffect(() => {
        peerManager.onMessage(peerId, (packet) => {
            handleIncomingPacket(packet, handlers);
        });
        peerManager.onStateChange(peerId, handlers.onStateChange);
    }, [peerId, handlers]);

    const connect = useCallback(() => {
        setIsConnecting(true);
        setConnectionError(null);
    }, []);

    const disconnect = useCallback(() => {
        peerManager.closeConnection(peerId);
        setIsConnected(false);
        setIsConnecting(false);
    }, [peerId]);

    const sendMessage = useCallback(async (message) => {
        if (!isConnected) {
            return false;
        }
        return sendMessagePacket(peerId, crypto.randomUUID(), message.encryptedBody || "", "", Date.now());
    }, [peerId, isConnected]);

    return {
        isConnected,
        isConnecting,
        connectionError,
        connect,
        disconnect,
        sendMessage,
    };
}
