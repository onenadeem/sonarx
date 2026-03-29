import { create } from "zustand";
import type { RTCPeerConnection } from "react-native-webrtc";

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel?: ReturnType<RTCPeerConnection["createDataChannel"]>;
  state: "connecting" | "connected" | "disconnected" | "failed" | "closed";
}

export interface PendingOffer {
  fromPeerId: string;
  offer: RTCSessionDescriptionInit;
  timestamp: number;
}

export interface OnlineStatus {
  isOnline: boolean;
  lastSeen: Date | null;
}

interface PeersState {
  connections: Record<string, PeerConnection>;
  onlineStatus: Record<string, OnlineStatus>;
  incomingOffers: PendingOffer[];
  addConnection: (peerId: string, connection: PeerConnection) => void;
  removeConnection: (peerId: string) => void;
  updateConnectionState: (
    peerId: string,
    state: PeerConnection["state"],
  ) => void;
  updateOnlineStatus: (peerId: string, status: OnlineStatus) => void;
  addIncomingOffer: (offer: PendingOffer) => void;
  removeIncomingOffer: (fromPeerId: string) => void;
  getConnection: (peerId: string) => PeerConnection | undefined;
  isConnected: (peerId: string) => boolean;
  clearAll: () => void;
}

export const usePeersStore = create<PeersState>()((set, get) => ({
  connections: {},
  onlineStatus: {},
  incomingOffers: [],

  addConnection: (peerId, connection) =>
    set((state) => ({
      connections: {
        ...state.connections,
        [peerId]: connection,
      },
    })),

  removeConnection: (peerId) =>
    set((state) => {
      const { [peerId]: _, ...rest } = state.connections;
      return { connections: rest };
    }),

  updateConnectionState: (peerId, newState) =>
    set((state) => {
      const conn = state.connections[peerId];
      if (!conn) return state;

      return {
        connections: {
          ...state.connections,
          [peerId]: { ...conn, state: newState },
        },
      };
    }),

  updateOnlineStatus: (peerId, status) =>
    set((state) => ({
      onlineStatus: {
        ...state.onlineStatus,
        [peerId]: status,
      },
    })),

  addIncomingOffer: (offer) =>
    set((state) => ({
      incomingOffers: [...state.incomingOffers, offer],
    })),

  removeIncomingOffer: (fromPeerId) =>
    set((state) => ({
      incomingOffers: state.incomingOffers.filter(
        (o) => o.fromPeerId !== fromPeerId,
      ),
    })),

  getConnection: (peerId) => get().connections[peerId],

  isConnected: (peerId) => {
    const conn = get().connections[peerId];
    return conn?.state === "connected";
  },

  clearAll: () =>
    set({
      connections: {},
      onlineStatus: {},
      incomingOffers: [],
    }),
}));
