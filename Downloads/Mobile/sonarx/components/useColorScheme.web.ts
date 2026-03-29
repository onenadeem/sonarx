import { useTheme } from "@/components/ThemeProvider";

export function useColorScheme(): "light" | "dark" {
  try {
    const { resolvedTheme } = useTheme();
    return resolvedTheme;
  } catch {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }
}
