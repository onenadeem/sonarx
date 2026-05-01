import { create } from "zustand";
const removeConnectionFromMap = (connections, peerId) => {
    const remainingConnections = { ...connections };
    delete remainingConnections[peerId];
    return remainingConnections;
};
const replaceConnectionState = (connections, peerId, state) => {
    const connection = connections[peerId];
    if (!connection) {
        return null;
    }
    return { ...connection, state };
};
const removeOffersByPeer = (offers, fromPeerId) => offers.filter((o) => o.fromPeerId !== fromPeerId);
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
    removeConnection: (peerId) => set((state) => ({
        connections: removeConnectionFromMap(state.connections, peerId),
    })),
    updateConnectionState: (peerId, newState) => set((state) => {
        const updatedConnection = replaceConnectionState(state.connections, peerId, newState);
        if (!updatedConnection) {
            return state;
        }
        return {
            connections: {
                ...state.connections,
                [peerId]: updatedConnection,
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
        incomingOffers: removeOffersByPeer(state.incomingOffers, fromPeerId),
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
