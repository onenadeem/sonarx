import { announcePresence } from "@/lib/p2p/discovery";
import { useIdentityStore } from "@/stores/identity.store";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { decodeBase64 } from "tweetnacl-util";

const SIGNING_KEY_STORE_KEY = "sonarx-signing-keys";
const ANNOUNCE_INTERVAL_MS = 30 * 1000;

export function usePresenceBroadcaster() {
  const identity = useIdentityStore((state) => state.identity);

  useEffect(() => {
    if (!identity) return;

    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const broadcast = async () => {
      if (!isMounted) return;
      try {
        const signingKeyStr = await SecureStore.getItemAsync(
          SIGNING_KEY_STORE_KEY,
        );
        if (!signingKeyStr) return;

        const signingSecretKey = decodeBase64(signingKeyStr);
        await announcePresence(identity as any, signingSecretKey);
      } catch (_err) {
      }
    };

    // Broadcast immediately on mount / login
    broadcast();
    // Then continually broadcast to stay online
    intervalId = setInterval(broadcast, ANNOUNCE_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [identity]);
}
