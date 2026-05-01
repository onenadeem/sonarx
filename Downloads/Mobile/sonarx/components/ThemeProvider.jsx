import { ThemeProvider as SourceThemeProvider, useTheme as useSourceTheme, } from "@/src/theme/ThemeProvider";
const THEME_STORAGE_KEY = "app-theme-preference";
export { THEME_STORAGE_KEY };
function ThemeProvider({ children, defaultTheme = "system", initialTheme, ...props }) {
    const resolvedMode = initialTheme ?? defaultTheme;
    return <SourceThemeProvider initialMode={resolvedMode} {...props}>{children}</SourceThemeProvider>;
}
function useTheme() {
    const context = useSourceTheme();
    return {
        theme: context.mode,
        resolvedTheme: context.mode === "system"
            ? context.isDark
                ? "dark"
                : "light"
            : context.mode,
        setTheme: context.setMode,
        ...context,
    };
}
export { ThemeProvider, useTheme };
