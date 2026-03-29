/**
 * Simple WebSocket client for the SonarX message relay.
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

export interface RelayMessage {
  type: "message";
  id: string;
  data: Record<string, unknown>;
}

type AckListener = (id: string) => void;
type MsgListener = (msg: RelayMessage) => void;

class WsRelayClient {
  private ws: WebSocket | null = null;
  private url: string | null = null;
  private myId: string | null = null;
  private msgListeners: Set<MsgListener> = new Set();
  private ackListeners: Map<string, AckListener> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;

  /** Call once at app start with the current user's phone number. */
  connect(myId: string): void {
    if (this.myId === myId && this.connected) return;
    this.myId = myId;
    this.url = this._buildUrl();
    if (!this.url) {
      console.warn("[WsRelay] No relay URL — set up Metro first");
      return;
    }
    this._connect();
  }

  private _buildUrl(): string | null {
    if (!__DEV__) return null; // no local relay in production
    const debuggerHost: string | undefined =
      (Constants as any).expoGoConfig?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;
    if (!debuggerHost) return null;
    const ip = debuggerHost.split(":")[0];
    return `ws://${ip}:8766`;
  }

  private _connect(): void {
    if (!this.url || !this.myId) return;
    this._clearReconnect();

    console.log("[WsRelay] Connecting to", this.url);
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.connected = true;
      console.log("[WsRelay] ✅ Connected");
      // Subscribe to our inbox
      this._send({ type: "subscribe", inbox: this.myId });
    };

    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (msg.type === "ack" && msg.id) {
        const cb = this.ackListeners.get(msg.id);
        if (cb) {
          cb(msg.id);
          this.ackListeners.delete(msg.id);
        }
      } else if (msg.type === "message") {
        this.msgListeners.forEach((l) => l(msg as RelayMessage));
      }
    };

    ws.onerror = (e) => {
      console.warn("[WsRelay] Error:", (e as any)?.message ?? "unknown");
    };

    ws.onclose = () => {
      this.connected = false;
      console.log("[WsRelay] Disconnected — reconnecting in 4s");
      this._scheduleReconnect();
    };
  }

  private _send(obj: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  private _scheduleReconnect(): void {
    this._clearReconnect();
    this.reconnectTimer = setTimeout(() => this._connect(), 4000);
  }

  private _clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send an encrypted message payload to a peer.
   * Resolves when the relay acks or after a 6-second timeout.
   */
  sendMessage(
    to: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.ackListeners.delete(id);
        console.warn("[WsRelay] Send timeout for:", id);
        resolve(); // resolve anyway — retry is future work
      }, 6000);

      this.ackListeners.set(id, () => {
        clearTimeout(timer);
        console.log("[WsRelay] ✅ Acked:", id);
        resolve();
      });

      if (!this.connected) {
        console.warn("[WsRelay] Not connected — message will be lost:", id);
        // Don't queue here; the server queues for the recipient, not the sender
        clearTimeout(timer);
        this.ackListeners.delete(id);
        resolve();
        return;
      }

      this._send({ type: "send", to, id, data });
    });
  }

  /** Subscribe to all incoming messages. Returns an unsubscribe fn. */
  onMessage(listener: MsgListener): () => void {
    this.msgListeners.add(listener);
    return () => this.msgListeners.delete(listener);
  }
}

// Singleton
export const wsRelay = new WsRelayClient();
