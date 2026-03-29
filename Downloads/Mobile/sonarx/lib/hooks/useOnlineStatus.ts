import { useEffect, useState } from "react";
import {
  subscribeToPeerPresence,
  type PeerPresence,
} from "@/lib/p2p/discovery";

export function useOnlineStatus(peerId: string): {
  isOnline: boolean;
  lastSeen: Date | null;
} {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    lastSeen: Date | null;
  }>({
    isOnline: false,
    lastSeen: null,
  });

  useEffect(() => {
    if (!peerId) return;

    const unsubscribe = subscribeToPeerPresence(peerId, (newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
    };
  }, [peerId]);

  return status;
}

export function useMultipleOnlineStatus(
  peerIds: string[],
): Record<string, { isOnline: boolean; lastSeen: Date | null }> {
  const [statuses, setStatuses] = useState<
    Record<string, { isOnline: boolean; lastSeen: Date | null }>
  >({});

  useEffect(() => {
    if (!peerIds.length) return;

    const unsubscribers: (() => void)[] = [];

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
