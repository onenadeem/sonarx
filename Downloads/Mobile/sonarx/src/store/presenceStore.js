import { create } from 'zustand';
export const usePresenceStore = create()((set) => ({
    onlineStatus: {},
    typingStatus: {},
    setOnline: (peerId) => set((state) => ({
        onlineStatus: {
            ...state.onlineStatus,
            [peerId]: {
                isOnline: true,
                lastSeen: state.onlineStatus[peerId]?.lastSeen ?? null,
            },
        },
    })),
    setOffline: (peerId) => set((state) => ({
        onlineStatus: {
            ...state.onlineStatus,
            [peerId]: {
                isOnline: false,
                lastSeen: new Date(),
            },
        },
    })),
    updateLastSeen: (peerId, lastSeen) => set((state) => ({
        onlineStatus: {
            ...state.onlineStatus,
            [peerId]: {
                isOnline: state.onlineStatus[peerId]?.isOnline ?? false,
                lastSeen,
            },
        },
    })),
    setTyping: (peerId, isTyping) => set((state) => ({
        typingStatus: { ...state.typingStatus, [peerId]: isTyping },
    })),
    clearAll: () => set({ onlineStatus: {}, typingStatus: {} }),
}));
