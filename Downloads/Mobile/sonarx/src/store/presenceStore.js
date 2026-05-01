import { create } from 'zustand';
const setStatusFlags = (state, peerId, values) => ({
    onlineStatus: {
        ...state.onlineStatus,
        [peerId]: {
            ...state.onlineStatus[peerId],
            ...values,
        },
    },
});
const updateTypingState = (state, peerId, isTyping) => ({
    typingStatus: { ...state.typingStatus, [peerId]: isTyping },
});
export const usePresenceStore = create()((set) => ({
    onlineStatus: {},
    typingStatus: {},
    setOnline: (peerId) => set((state) => ({
        onlineStatus: setStatusFlags(state, peerId, {
            isOnline: true,
            lastSeen: state.onlineStatus[peerId]?.lastSeen ?? null,
        }).onlineStatus,
    })),
    setOffline: (peerId) => set((state) => ({
        onlineStatus: setStatusFlags(state, peerId, {
            isOnline: false,
            lastSeen: new Date(),
        }).onlineStatus,
    })),
    updateLastSeen: (peerId, lastSeen) => set((state) => ({
        onlineStatus: setStatusFlags(state, peerId, {
            isOnline: state.onlineStatus[peerId]?.isOnline ?? false,
            lastSeen,
        }).onlineStatus,
    })),
    setTyping: (peerId, isTyping) => set((state) => updateTypingState(state, peerId, isTyping)),
    clearAll: () => set({ onlineStatus: {}, typingStatus: {} }),
}));
