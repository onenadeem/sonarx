import { useTheme as useAppTheme } from "@/src/theme/ThemeProvider";
export function useColorScheme() {
    try {
        const { isDark } = useAppTheme();
        const resolvedTheme = isDark ? "dark" : "light";
        return resolvedTheme;
    }
    catch {
        if (typeof window !== "undefined" &&
            window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    }
}
