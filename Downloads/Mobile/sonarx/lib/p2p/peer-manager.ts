// Expo Go compatible stub - WebRTC not available in Expo Go
// Run npx expo run:android for full WebRTC functionality

import type { PeerConnection } from "@/stores/peers.store";
import type { Identity } from "@/db/schema";

export const ICE_SERVERS: any[] = [];

type ConnectionRole = "caller" | "callee";

interface ManagedPeerConnection extends PeerConnection {
  role: ConnectionRole;
  pendingIceCandidates: any[];
}

class MockPeerManager {
  private connections: Map<string, ManagedPeerConnection> = new Map();

  async initiateConnection(): Promise<any> {
    console.warn("WebRTC requires development build");
    throw new Error("WebRTC not available in Expo Go");
  }

  async handleOffer(): Promise<any> {
    throw new Error("WebRTC not available in Expo Go");
  }

  async handleAnswer(): Promise<void> {
    throw new Error("WebRTC not available in Expo Go");
  }

  async addIceCandidate(): Promise<void> {
    throw new Error("WebRTC not available in Expo Go");
  }

  closeConnection(peerId: string): void {
    this.connections.delete(peerId);
  }

  sendMessage(): boolean {
    return false;
  }

  onMessage(): void {}
  onStateChange(): void {}

  getConnectionState(): string {
    return "closed";
  }
}

export const peerManager = new MockPeerManager();

export const RTCPeerConnection = class {
  constructor() {
    throw new Error("WebRTC requires development build");
  }
};
export const RTCIceCandidate = class {};
export const RTCSessionDescription = class {};
