import { useMemo } from 'react';
import { usePresenceStore } from '@/src/store/presenceStore';
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const getLastSeenText = (minutes) => {
    if (minutes < 1)
        return 'Last seen just now';
    if (minutes < MINUTES_IN_HOUR)
        return `Last seen ${minutes}m ago`;
    const hours = Math.floor(minutes / MINUTES_IN_HOUR);
    if (hours < HOURS_IN_DAY)
        return `Last seen ${hours}h ago`;
    return `Last seen ${Math.floor(hours / HOURS_IN_DAY)}d ago`;
};
export function usePresence(peerId) {
    const status = usePresenceStore((state) => state.onlineStatus[peerId]);
    const statusText = useMemo(() => {
        if (!status)
            return 'Connecting...';
        if (status.isOnline)
            return 'Online';
        if (status.lastSeen) {
            const diffMs = Date.now() - status.lastSeen.getTime();
            const minutes = Math.floor(diffMs / 60_000);
            return getLastSeenText(minutes);
        }
        return 'Connecting...';
    }, [status]);
    return {
        isOnline: status?.isOnline ?? false,
        lastSeen: status?.lastSeen ?? null,
        statusText,
    };
}
export function usePresenceUpdater() {
    const setOnline = usePresenceStore((state) => state.setOnline);
    const setOffline = usePresenceStore((state) => state.setOffline);
    const setTyping = usePresenceStore((state) => state.setTyping);
    return { setOnline, setOffline, setTyping };
}
