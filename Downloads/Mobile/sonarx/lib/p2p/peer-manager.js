// Expo Go compatible stub - WebRTC not available in Expo Go
// Run npx expo run:android for full WebRTC functionality
export const ICE_SERVERS = [];
class MockPeerManager {
    connections = new Map();
    async initiateConnection() {
        console.warn("WebRTC requires development build");
        throw new Error("WebRTC not available in Expo Go");
    }
    async handleOffer() {
        throw new Error("WebRTC not available in Expo Go");
    }
    async handleAnswer() {
        throw new Error("WebRTC not available in Expo Go");
    }
    async addIceCandidate() {
        throw new Error("WebRTC not available in Expo Go");
    }
    closeConnection(peerId) {
        this.connections.delete(peerId);
    }
    sendMessage() {
        return false;
    }
    onMessage() { }
    onStateChange() { }
    getConnectionState() {
        return "closed";
    }
}
export const peerManager = new MockPeerManager();
export const RTCPeerConnection = class {
    constructor() {
        throw new Error("WebRTC requires development build");
    }
};
export const RTCIceCandidate = class {
};
export const RTCSessionDescription = class {
};
