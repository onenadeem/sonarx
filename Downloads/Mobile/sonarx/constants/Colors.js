import { darkTheme, lightTheme } from "@/src/theme/palette";
export default {
    light: {
        text: lightTheme.textPrimary,
        background: lightTheme.background,
        tint: lightTheme.accent,
        mutedForeground: lightTheme.textSecondary,
        card: lightTheme.surface,
        border: lightTheme.border,
        input: lightTheme.border,
        tabIconSelected: lightTheme.tabBarActive,
    },
    dark: {
        text: darkTheme.textPrimary,
        background: darkTheme.background,
        tint: darkTheme.accent,
        mutedForeground: darkTheme.textSecondary,
        card: darkTheme.surface,
        border: darkTheme.border,
        input: darkTheme.border,
        tabIconSelected: darkTheme.tabBarActive,
    },
};
