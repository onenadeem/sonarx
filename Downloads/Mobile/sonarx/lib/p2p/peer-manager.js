const WEBRTC_UNAVAILABLE_MESSAGE = "WebRTC requires development build";
const createNotAvailableError = () => new Error(WEBRTC_UNAVAILABLE_MESSAGE);

// Expo Go compatible stub - WebRTC not available in Expo Go
// Run npx expo run:android for full WebRTC functionality
export const ICE_SERVERS = [];
class MockPeerManager {
  connections = new Map();
  async initiateConnection() {
    console.warn(WEBRTC_UNAVAILABLE_MESSAGE);
    throw createNotAvailableError();
  }
  async handleOffer() {
    throw createNotAvailableError();
  }
  async handleAnswer() {
    throw createNotAvailableError();
  }
  async addIceCandidate() {
    throw createNotAvailableError();
  }
  closeConnection(peerId) {
    this.connections.delete(peerId);
  }
  sendMessage() {
    return false;
  }
  onMessage() {}
  onStateChange() {}
  getConnectionState() {
    return "closed";
  }
}
export const peerManager = new MockPeerManager();
export const RTCPeerConnection = class {
  constructor() {
    throw createNotAvailableError();
  }
};
export const RTCIceCandidate = class {};
export const RTCSessionDescription = class {};
