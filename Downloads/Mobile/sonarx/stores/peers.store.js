import { create } from "zustand";
export const usePeersStore = create()((set, get) => ({
    connections: {},
    onlineStatus: {},
    incomingOffers: [],
    addConnection: (peerId, connection) => set((state) => ({
        connections: {
            ...state.connections,
            [peerId]: connection,
        },
    })),
    removeConnection: (peerId) => set((state) => {
        const remainingConnections = { ...state.connections };
        delete remainingConnections[peerId];
        return { connections: remainingConnections };
    }),
    updateConnectionState: (peerId, newState) => set((state) => {
        const conn = state.connections[peerId];
        if (!conn)
            return state;
        return {
            connections: {
                ...state.connections,
                [peerId]: { ...conn, state: newState },
            },
        };
    }),
    updateOnlineStatus: (peerId, status) => set((state) => ({
        onlineStatus: {
            ...state.onlineStatus,
            [peerId]: status,
        },
    })),
    addIncomingOffer: (offer) => set((state) => ({
        incomingOffers: [...state.incomingOffers, offer],
    })),
    removeIncomingOffer: (fromPeerId) => set((state) => ({
        incomingOffers: state.incomingOffers.filter((o) => o.fromPeerId !== fromPeerId),
    })),
    getConnection: (peerId) => get().connections[peerId],
    isConnected: (peerId) => {
        const conn = get().connections[peerId];
        return conn?.state === "connected";
    },
    clearAll: () => set({
        connections: {},
        onlineStatus: {},
        incomingOffers: [],
    }),
}));
