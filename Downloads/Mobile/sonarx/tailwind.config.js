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
        // base: 16,
        // lg: 18,
        // xl: 20,
        // "2xl": 24,
        // "3xl": 30,
        // "4xl": 36,
        // "5xl": 48,
        // "6xl": 60,
        // "7xl": 72,
        // "8xl": 96,
        // "9xl": 128,
      },
      borderWidth: {
        DEFAULT: 0.5,
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Noto Sans",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
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
      },
    },
  },
};
