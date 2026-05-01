import { useTheme as useAppTheme } from "@/src/theme/ThemeProvider";
import { useColorScheme as useColorSchemeCore } from "react-native";
export const useColorScheme = () => {
    try {
        const { isDark } = useAppTheme();
        const resolvedTheme = isDark ? "dark" : "light";
        return resolvedTheme;
    }
    catch {
        const coreScheme = useColorSchemeCore();
        return coreScheme === "dark" ? "dark" : "light";
    }
};
