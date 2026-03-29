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

export function bytesToEmoji(bytes: Uint8Array): string[][] {
  const emojis: string[][] = [];
  const groupCount = 4;
  const emojisPerGroup = 3;

  for (let g = 0; g < groupCount; g++) {
    const group: string[] = [];
    for (let i = 0; i < emojisPerGroup; i++) {
      const byteIndex = g * emojisPerGroup + i;
      const byte = bytes[byteIndex % bytes.length];
      const emojiIndex = byte % EMOJI_SET.length;
      group.push(EMOJI_SET[emojiIndex]);
    }
    emojis.push(group);
  }

  return emojis;
}

export function formatFingerprint(groups: string[][]): string {
  return groups.map((group) => group.join(" ")).join("   ");
}

export function hexToEmoji(hex: string): string[][] {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytesToEmoji(bytes);
}

export async function publicKeyToEmoji(
  publicKey: Uint8Array,
): Promise<string[][]> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", publicKey as any);
  const hashBytes = new Uint8Array(hashBuffer);
  return bytesToEmoji(hashBytes);
}

export async function computeFingerprint(
  publicKey: Uint8Array,
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", publicKey as any);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
