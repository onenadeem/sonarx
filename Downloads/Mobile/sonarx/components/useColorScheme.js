import { useTheme } from "@/components/ThemeProvider";
import { useColorScheme as useColorSchemeCore } from "react-native";
export const useColorScheme = () => {
    try {
        const { resolvedTheme } = useTheme();
        return resolvedTheme;
    }
    catch {
        const coreScheme = useColorSchemeCore();
        return coreScheme === "dark" ? "dark" : "light";
    }
};
