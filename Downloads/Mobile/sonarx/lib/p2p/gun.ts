import Gun from "gun";
import Constants from "expo-constants";

/**
 * Build the peer list at runtime so we can inject the local dev relay.
 *
 * In development, the app auto-detects the Metro bundler's host IP and
 * tries to connect to a GUN relay running on the same machine (port 8765).
 * Run `npm run relay` in a separate terminal to start it.
 *
 * Public relay servers are kept as fallbacks for production / when the
 * local relay is not running.
 */
function buildPeers(): string[] {
  const peers: string[] = [];

  if (__DEV__) {
    // Metro's host is the same machine we run `npm run relay` on.
    // Both new manifest and old manifest APIs are checked for compatibility.
    const debuggerHost: string | undefined =
      (Constants as any).expoGoConfig?.debuggerHost ??
      (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ??
      (Constants as any).manifest?.debuggerHost;

    if (debuggerHost) {
      const ip = debuggerHost.split(":")[0];
      const localRelay = `http://${ip}:8765/gun`;
      peers.push(localRelay);
      console.log("[Gun] Dev relay:", localRelay);
      console.log("[Gun] Run 'npm run relay' on your dev machine if not already running.");
    }
  }

  // Public fallback peers (gun-manhattan.herokuapp.com was shut down in 2022)
  peers.push(
    "https://peer.wallie.io/gun",
    "https://gundb-relay-milheirofernandes.b4a.run/gun",
  );

  return peers;
}

export const SL_NAMESPACE = "sonarx/v1";

let gunInstance: ReturnType<typeof Gun> | null = null;

export function getGun(): ReturnType<typeof Gun> {
  if (!gunInstance) {
    const peers = buildPeers();
    console.log("[Gun] Initializing with peers:", peers);
    gunInstance = Gun({
      peers,
      localStorage: false,
      radisk: false,
    });

    // Log which peers actually connect
    (gunInstance as any).on("hi", (peer: any) => {
      console.log("[Gun] ✅ Connected to peer:", peer?.url ?? peer?.id ?? "unknown");
    });
    (gunInstance as any).on("bye", (peer: any) => {
      console.log("[Gun] ❌ Disconnected from peer:", peer?.url ?? peer?.id ?? "unknown");
    });
  }
  return gunInstance;
}

export function getSLNode() {
  return getGun().get(SL_NAMESPACE);
}

export async function writeToGun(
  path: string,
  data: Record<string, unknown>,
  ttlSeconds: number = 7 * 24 * 60 * 60,
): Promise<void> {
  const gun = getGun();
  const node = gun.get(path);
  console.log("[writeToGun] Writing to:", path);

  const dataWithExpiry = {
    ...data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };

  return new Promise((resolve, reject) => {
    // Without relay file-storage, ack can arrive late — cap the wait at 6s
    const timer = setTimeout(() => {
      console.warn("[writeToGun] Ack timeout, assuming success at:", path);
      resolve();
    }, 6000);

    node.put(dataWithExpiry, (ack: any) => {
      clearTimeout(timer);
      if (ack.err) {
        console.error("[writeToGun] Error:", ack.err);
        reject(ack.err);
      } else {
        console.log("[writeToGun] ✅ Acked at:", path);
        resolve();
      }
    });
  });
}

export function subscribeToGun(
  path: string,
  callback: (data: unknown) => void,
): () => void {
  const gun = getGun();
  const node = gun.get(path);

  const handler = (data: Record<string, unknown> | null) => {
    if (!data) return;

    const expiry = data.expiresAt as number | undefined;
    if (expiry && Date.now() > expiry) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expiresAt, ...cleanData } = data;
    callback(cleanData);
  };

  node.on(handler as any);

  // Return a no-op unsubscribe — calling node.off() removes ALL listeners
  // on that node which breaks other subscribers on the same path.
  return () => {};
}

export async function getFromGun<T>(path: string): Promise<T | null> {
  const gun = getGun();
  const node = gun.get(path);

  return new Promise((resolve) => {
    node.once((data: any) => {
      if (!data) {
        resolve(null);
        return;
      }

      const expiry = data.expiresAt as number | undefined;
      if (expiry && Date.now() > expiry) {
        resolve(null);
        return;
      }

      const { expiresAt, ...cleanData } = data;
      resolve(cleanData as T);
    });
  });
}
