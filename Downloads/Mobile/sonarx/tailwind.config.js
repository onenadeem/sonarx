const FONT_FAMILY_SANS = [
  "-apple-system",
  "BlinkMacSystemFont",
  "Segoe UI",
  "Noto Sans",
  "Helvetica",
  "Arial",
  "sans-serif",
];
const FONT_FAMILY_MONO = [
  "SFMono-Regular",
  "Menlo",
  "Monaco",
  "Consolas",
  "monospace",
];
const APP_COLORS = {
  border: "#e4e4e7",
  input: "#e4e4e7",
  ring: "#18181b",
  background: "#ffffff",
  foreground: "#09090b",
  surface: "#fafafa",
  divider: "#e4e4e7",
  success: "#22c55e",
  warning: "#f59e0b",
  disabled: "#a1a1aa",
  primary: {
    DEFAULT: "#18181b",
    foreground: "#fafafa",
  },
  secondary: {
    DEFAULT: "#f4f4f5",
    foreground: "#09090b",
  },
  muted: {
    DEFAULT: "#f4f4f5",
    foreground: "#71717a",
  },
  accent: {
    DEFAULT: "#18181b",
    foreground: "#fafafa",
  },
  destructive: {
    DEFAULT: "#ef4444",
    foreground: "#ffffff",
  },
  card: {
    DEFAULT: "#fafafa",
    foreground: "#09090b",
  },
};
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontSize: {
        xs: 11,
        sm: 12,
      },
      borderWidth: {
        DEFAULT: 0.5,
      },
      fontFamily: {
        sans: FONT_FAMILY_SANS,
        mono: FONT_FAMILY_MONO,
      },
      colors: APP_COLORS,
    },
  },
};
