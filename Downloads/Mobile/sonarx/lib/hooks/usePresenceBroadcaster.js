import { announcePresence } from "@/lib/p2p/discovery";
import { useIdentityStore } from "@/src/store/identityStore";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect } from "react";
import { decodeBase64 } from "tweetnacl-util";
const SIGNING_KEY_STORE_KEY = "resonar-signing-keys";
const ANNOUNCE_INTERVAL_MS = 30 * 1000;
export function usePresenceBroadcaster() {
  const identity = useIdentityStore((state) => state.identity);
  const broadcast = useCallback(async () => {
    if (!identity) return;
    const signingKeyStr = await SecureStore.getItemAsync(SIGNING_KEY_STORE_KEY);
    if (!signingKeyStr) return;
    const signingSecretKey = decodeBase64(signingKeyStr);
    await announcePresence(identity, signingSecretKey);
  }, [identity]);
  useEffect(() => {
    if (!identity) return;
    let isMounted = true;
    let intervalId;
    const executeBroadcast = async () => {
      if (!isMounted) return;
      try {
        await broadcast();
      } catch (error) {
        console.error("[Presence] Broadcast failed:", error);
      }
    };
    // Broadcast immediately on mount / login
    executeBroadcast();
    // Then continually broadcast to stay online
    intervalId = setInterval(executeBroadcast, ANNOUNCE_INTERVAL_MS);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [identity, broadcast]);
}
