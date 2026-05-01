import { useEffect, useState } from "react";
import { subscribeToPeerPresence, } from "@/lib/p2p/discovery";
export function useOnlineStatus(peerId) {
    const [status, setStatus] = useState({
        isOnline: false,
        lastSeen: null,
    });
    useEffect(() => {
        if (!peerId)
            return;
        const unsubscribe = subscribeToPeerPresence(peerId, (newStatus) => {
            setStatus(newStatus);
        });
        return () => {
            unsubscribe();
        };
    }, [peerId]);
    return status;
}
export function useMultipleOnlineStatus(peerIds) {
    const [statuses, setStatuses] = useState({});
    useEffect(() => {
        if (!peerIds.length)
            return;
        const unsubscribers = [];
        peerIds.forEach((peerId) => {
            const unsub = subscribeToPeerPresence(peerId, (status) => {
                setStatuses((prev) => ({
                    ...prev,
                    [peerId]: status,
                }));
            });
            unsubscribers.push(unsub);
        });
        return () => {
            unsubscribers.forEach((unsub) => unsub());
        };
    }, [peerIds.join(",")]);
    return statuses;
}
