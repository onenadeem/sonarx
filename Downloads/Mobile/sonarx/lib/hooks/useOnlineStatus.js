import { useEffect, useState } from "react";
import { subscribeToPeerPresence } from "@/lib/p2p/discovery";

const createEmptyStatus = () => ({
  isOnline: false,
  lastSeen: null,
});

const sortedPeerIdsKey = (peerIds) => peerIds.filter(Boolean).sort().join(",");

function subscribePeers(peerIds, onStatus) {
  const unsubscribers = peerIds
    .filter(Boolean)
    .map((peerId) =>
      subscribeToPeerPresence(peerId, (status) => {
        onStatus(peerId, status);
      }),
    );

  return () => {
    unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
  };
}

export function useOnlineStatus(peerId) {
  const [status, setStatus] = useState(createEmptyStatus());

  useEffect(() => {
    if (!peerId) {
      return;
    }

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
  const peerIdsKey = sortedPeerIdsKey(peerIds);

  useEffect(() => {
    if (!peerIds.length) {
      return;
    }

    const cleanup = subscribePeers(peerIds, (peerId, status) => {
      setStatuses((prev) => ({
        ...prev,
        [peerId]: status,
      }));
    });

    return cleanup;
  }, [peerIdsKey]);

  return statuses;
}
