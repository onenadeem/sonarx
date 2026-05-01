import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import { View, useColorScheme } from "react-native";
const THEME_STORAGE_KEY = "app-theme-preference";
const ThemeContext = React.createContext(undefined);
export { THEME_STORAGE_KEY };
function ThemeProvider({ children, defaultTheme = "system", initialTheme, }) {
    const systemColorScheme = useColorScheme();
    const [theme, setThemeState] = React.useState(initialTheme ?? defaultTheme);
    React.useEffect(() => {
        if (initialTheme !== undefined) {
            return;
        }
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
            if (stored) {
                setThemeState(stored);
            }
        });
    }, [initialTheme]);
    const setTheme = React.useCallback((newTheme) => {
        AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        setThemeState(newTheme);
    }, []);
    const resolvedTheme = theme === "system"
        ? systemColorScheme || "light"
        : theme;
    const value = React.useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);
    return (<ThemeContext.Provider value={value}>
      <View className={resolvedTheme} style={{ flex: 1 }}>
        {children}
      </View>
    </ThemeContext.Provider>);
}
function useTheme() {
    const context = React.useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
export { ThemeProvider, useTheme };
