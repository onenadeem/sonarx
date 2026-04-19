import { create } from 'zustand'

interface OnlineEntry {
  isOnline: boolean
  lastSeen: Date | null
}

interface PresenceState {
  onlineStatus: Record<string, OnlineEntry>
  /** peerId -> isTyping */
  typingStatus: Record<string, boolean>
}

interface PresenceActions {
  setOnline: (peerId: string) => void
  setOffline: (peerId: string) => void
  updateLastSeen: (peerId: string, lastSeen: Date) => void
  setTyping: (peerId: string, isTyping: boolean) => void
  clearAll: () => void
}

export const usePresenceStore = create<PresenceState & PresenceActions>()(
  (set) => ({
    onlineStatus: {},
    typingStatus: {},

    setOnline: (peerId) =>
      set((state) => ({
        onlineStatus: {
          ...state.onlineStatus,
          [peerId]: {
            isOnline: true,
            lastSeen: state.onlineStatus[peerId]?.lastSeen ?? null,
          },
        },
      })),

    setOffline: (peerId) =>
      set((state) => ({
        onlineStatus: {
          ...state.onlineStatus,
          [peerId]: {
            isOnline: false,
            lastSeen: new Date(),
          },
        },
      })),

    updateLastSeen: (peerId, lastSeen) =>
      set((state) => ({
        onlineStatus: {
          ...state.onlineStatus,
          [peerId]: {
            isOnline: state.onlineStatus[peerId]?.isOnline ?? false,
            lastSeen,
          },
        },
      })),

    setTyping: (peerId, isTyping) =>
      set((state) => ({
        typingStatus: { ...state.typingStatus, [peerId]: isTyping },
      })),

    clearAll: () => set({ onlineStatus: {}, typingStatus: {} }),
  }),
)
