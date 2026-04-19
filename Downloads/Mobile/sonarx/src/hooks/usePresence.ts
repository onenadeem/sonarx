import { useMemo } from 'react'

import { usePresenceStore } from '@/src/store/presenceStore'

export function usePresence(peerId: string) {
  const status = usePresenceStore((state) => state.onlineStatus[peerId])

  const statusText = useMemo(() => {
    if (!status) return 'Connecting...'
    if (status.isOnline) return 'Online'
    if (status.lastSeen) {
      const diffMs = Date.now() - status.lastSeen.getTime()
      const minutes = Math.floor(diffMs / 60_000)
      if (minutes < 1) return 'Last seen just now'
      if (minutes < 60) return `Last seen ${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `Last seen ${hours}h ago`
      return `Last seen ${Math.floor(hours / 24)}d ago`
    }
    return 'Connecting...'
  }, [status])

  return {
    isOnline: status?.isOnline ?? false,
    lastSeen: status?.lastSeen ?? null,
    statusText,
  }
}

export function usePresenceUpdater() {
  const setOnline = usePresenceStore((state) => state.setOnline)
  const setOffline = usePresenceStore((state) => state.setOffline)
  const setTyping = usePresenceStore((state) => state.setTyping)

  return { setOnline, setOffline, setTyping }
}
