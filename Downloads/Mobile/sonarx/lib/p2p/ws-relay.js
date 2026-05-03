/**
 * Simple WebSocket client for the sonarance message relay.
 *
 * The relay server (gun-server.js, port 8766) implements a minimal pub/sub
 * protocol so messages reliably reach the recipient even when GUN's complex
 * graph-sync fails to propagate cross-process puts.
 *
 * Protocol (JSON over WebSocket):
 *   → { type:"subscribe", inbox:"myPhoneNumber" }
 *   → { type:"send", to:"theirNumber", id:"msgUUID", data:{...} }
 *   ← { type:"message", id:"msgUUID", data:{...} }
 *   ← { type:"ack", id:"msgUUID" }
 */
import Constants from "expo-constants";

const ACK_TIMEOUT_MS = 6000;
const RECONNECT_DELAY_MS = 4000;

const parseRelayMessage = (rawData) => {
    if (typeof rawData !== "string") {
        return null;
    }
    try {
        return JSON.parse(rawData);
    }
    catch {
        return null;
    }
};

class WsRelayClient {
    ws = null;
    url = null;
    myId = null;
    msgListeners = new Set();
    ackListeners = new Map();
    reconnectTimer = null;
    connected = false;
    /** Call once at app start with the current user's phone number. */
    connect(myId) {
        if (this.myId === myId && this.connected)
            return;
        this.myId = myId;
        this.url = this._buildUrl();
        if (!this.url) {
            console.warn("[WsRelay] No relay URL — set up Metro first");
            return;
        }
        this._connect();
    }
    _buildUrl() {
        if (!__DEV__)
            return null; // no local relay in production
        const debuggerHost = Constants.expoGoConfig?.debuggerHost ??
            Constants.manifest2?.extra?.expoGo?.debuggerHost ??
            Constants.manifest?.debuggerHost;
        if (!debuggerHost)
            return null;
        const ip = debuggerHost.split(":")[0];
        return `ws://${ip}:8766`;
    }
    _connect() {
        if (!this.url || !this.myId)
            return;
        this._clearReconnect();
        const ws = new WebSocket(this.url);
        this.ws = ws;
        ws.onopen = () => {
            this.connected = true;
            // Subscribe to our inbox
            this._send({ type: "subscribe", inbox: this.myId });
        };
        ws.onmessage = this._handleMessage.bind(this);
        ws.onerror = () => {
            // connection errors are expected when local relay is not running
        };
        ws.onclose = () => {
            this.connected = false;
            this._scheduleReconnect();
        };
    }
    _send(obj) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(obj));
        }
    }
    _handleMessage(event) {
        const message = parseRelayMessage(event.data);
        if (!message || typeof message.type !== "string") {
            return;
        }
        if (message.type === "ack" && message.id) {
            this._handleAck(message.id);
            return;
        }
        if (message.type === "message") {
            this._notifyMessageListeners(message);
        }
    }
    _handleAck(messageId) {
        const onAck = this.ackListeners.get(messageId);
        if (!onAck) {
            return;
        }
        onAck();
        this.ackListeners.delete(messageId);
    }
    _notifyMessageListeners(message) {
        this.msgListeners.forEach((listener) => listener(message));
    }
    _scheduleReconnect() {
        this._clearReconnect();
        this.reconnectTimer = setTimeout(() => this._connect(), RECONNECT_DELAY_MS);
    }
    _clearReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    /**
     * Send an encrypted message payload to a peer.
     * Resolves when the relay acks or after a 6-second timeout.
     */
    sendMessage(to, id, data) {
        return new Promise((resolve) => {
            const finish = () => {
                clearTimeout(timer);
                this.ackListeners.delete(id);
                resolve();
            };
            const timer = setTimeout(() => {
                finish();
            }, ACK_TIMEOUT_MS);
            this.ackListeners.set(id, finish);
            if (!this.connected) {
                // Don't queue here; the server queues for the recipient, not the sender
                finish();
                return;
            }
            this._send({ type: "send", to, id, data });
        });
    }
    /** Subscribe to all incoming messages. Returns an unsubscribe fn. */
    onMessage(listener) {
        this.msgListeners.add(listener);
        return () => this.msgListeners.delete(listener);
    }
}
// Singleton
export const wsRelay = new WsRelayClient();
