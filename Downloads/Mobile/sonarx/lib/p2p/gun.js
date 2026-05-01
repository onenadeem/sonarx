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
function buildPeers() {
    const peers = [];
    if (__DEV__) {
        // Metro's host is the same machine we run `npm run relay` on.
        // Both new manifest and old manifest APIs are checked for compatibility.
        const debuggerHost = Constants.expoGoConfig?.debuggerHost ??
            Constants.manifest2?.extra?.expoGo?.debuggerHost ??
            Constants.manifest?.debuggerHost;
        if (debuggerHost) {
            const ip = debuggerHost.split(":")[0];
            const localRelay = `http://${ip}:8765/gun`;
            peers.push(localRelay);
        }
    }
    // Public fallback peers (gun-manhattan.herokuapp.com was shut down in 2022)
    peers.push("https://peer.wallie.io/gun", "https://gundb-relay-milheirofernandes.b4a.run/gun");
    return peers;
}
export const SL_NAMESPACE = "sonarx/v1";
let gunInstance = null;
export function getGun() {
    if (!gunInstance) {
        const peers = buildPeers();
        gunInstance = Gun({
            peers,
            localStorage: false,
            radisk: false,
        });
    }
    return gunInstance;
}
export function getSLNode() {
    return getGun().get(SL_NAMESPACE);
}
export async function writeToGun(path, data, ttlSeconds = 7 * 24 * 60 * 60) {
    const gun = getGun();
    const node = gun.get(path);
    const dataWithExpiry = {
        ...data,
        expiresAt: Date.now() + ttlSeconds * 1000,
    };
    return new Promise((resolve, reject) => {
        // Without relay file-storage, ack can arrive late — cap the wait at 6s
        const timer = setTimeout(() => {
            resolve();
        }, 6000);
        node.put(dataWithExpiry, (ack) => {
            clearTimeout(timer);
            if (ack.err) {
                reject(ack.err);
            }
            else {
                resolve();
            }
        });
    });
}
export function subscribeToGun(path, callback) {
    const gun = getGun();
    const node = gun.get(path);
    const handler = (data) => {
        if (!data)
            return;
        const expiry = data.expiresAt;
        if (expiry && Date.now() > expiry) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { expiresAt, ...cleanData } = data;
        callback(cleanData);
    };
    node.on(handler);
    // Return a no-op unsubscribe — calling node.off() removes ALL listeners
    // on that node which breaks other subscribers on the same path.
    return () => { };
}
export async function getFromGun(path) {
    const gun = getGun();
    const node = gun.get(path);
    return new Promise((resolve) => {
        node.once((data) => {
            if (!data) {
                resolve(null);
                return;
            }
            const expiry = data.expiresAt;
            if (expiry && Date.now() > expiry) {
                resolve(null);
                return;
            }
            const { expiresAt, ...cleanData } = data;
            resolve(cleanData);
        });
    });
}
