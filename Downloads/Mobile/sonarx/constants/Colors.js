import { darkTheme, lightTheme } from "@/src/theme/palette";

const createSemanticColors = (theme) => ({
    text: theme.textPrimary,
    background: theme.background,
    tint: theme.accent,
    mutedForeground: theme.textSecondary,
    card: theme.surface,
    border: theme.border,
    input: theme.border,
    tabIconSelected: theme.tabBarActive,
});

export default {
    light: createSemanticColors(lightTheme),
    dark: createSemanticColors(darkTheme),
};
