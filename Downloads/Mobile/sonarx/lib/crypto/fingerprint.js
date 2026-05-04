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

const DEFAULT_EMOJI_GROUP_COUNT = 4;
const DEFAULT_EMOJIS_PER_GROUP = 3;

export function bytesToEmoji(bytes) {
  return bytesToGroupedEmoji(bytes, {
    groupCount: DEFAULT_EMOJI_GROUP_COUNT,
    emojisPerGroup: DEFAULT_EMOJIS_PER_GROUP,
  });
}

export function bytesToEmojiList(bytes) {
  return bytesToGroupedEmoji(bytes, {
    groupCount: DEFAULT_EMOJI_GROUP_COUNT,
    emojisPerGroup: DEFAULT_EMOJIS_PER_GROUP,
  }).flat();
}

function bytesToGroupedEmoji(
  bytes,
  {
    groupCount = DEFAULT_EMOJI_GROUP_COUNT,
    emojisPerGroup = DEFAULT_EMOJIS_PER_GROUP,
  } = {},
) {
  const emojis = [];
  for (let g = 0; g < groupCount; g++) {
    const group = [];
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

export function formatFingerprint(groups) {
  return groups.map((group) => group.join(" ")).join("   ");
}

export function bytesFromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function hexToEmoji(hex) {
  return bytesToEmoji(bytesFromHex(hex));
}

async function digestToHex(value) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", value);
  const hashBytes = new Uint8Array(hashBuffer);
  return Array.from(hashBytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function publicKeyToEmoji(publicKey) {
  return bytesToEmoji(
    new Uint8Array(await crypto.subtle.digest("SHA-256", publicKey)),
  );
}

export async function computeFingerprint(publicKey) {
  return digestToHex(publicKey);
}
