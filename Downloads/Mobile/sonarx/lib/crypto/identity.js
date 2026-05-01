import "./prng";
import nacl from "tweetnacl";
export function generateBoxKeypair() {
    const keypair = nacl.box.keyPair();
    return {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
    };
}
export function generateSignKeypair() {
    const keypair = nacl.sign.keyPair();
    return {
        publicKey: keypair.publicKey,
        secretKey: keypair.secretKey,
    };
}
export async function storeSecretKeys() {
    throw new Error("Use expo-secure-store directly in lib/identity.ts");
}
export async function loadSecretKeys() {
    throw new Error("Use expo-secure-store directly in lib/identity.ts");
}
export async function computeFingerprint(publicKey) {
    try {
        if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
            const hashBuffer = await crypto.subtle.digest("SHA-256", publicKey);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        }
    }
    catch {
        // Fall back to tweetnacl hash for non-web/native environments.
    }
    const hashArray = Array.from(nacl.hash(publicKey)).slice(0, 32);
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function fingerprintToEmoji(hex) {
    const EMOJI_SET = [
        "🌟",
        "🦊",
        "🌙",
        "🔥",
        "💧",
        "🌊",
        "🎯",
        "🌈",
        "🦋",
        "⚡",
        "🌺",
        "🎪",
        "🏄",
        "🦁",
        "🌸",
        "🎭",
        "🚀",
        "🎸",
        "🦄",
        "🌍",
        "🔮",
        "🎨",
        "🦅",
        "🌴",
        "🐬",
        "🦋",
        "🍀",
        "🎯",
        "🌙",
        "🔥",
        "💎",
        "🎪",
    ];
    const emojis = [];
    for (let i = 0; i < 24; i += 2) {
        const byte = parseInt(hex.slice(i, i + 2), 16);
        const emojiIndex = byte % EMOJI_SET.length;
        emojis.push(EMOJI_SET[emojiIndex]);
    }
    return emojis;
}
