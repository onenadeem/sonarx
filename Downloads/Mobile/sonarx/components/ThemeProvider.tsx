import AsyncStorage from "@react-native-async-storage/async-storage";
import * as React from "react";
import { View, useColorScheme } from "react-native";

const THEME_STORAGE_KEY = "app-theme-preference";

type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

export { THEME_STORAGE_KEY };

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  initialTheme?: Theme;
}

function ThemeProvider({
  children,
  defaultTheme = "system",
  initialTheme,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = React.useState<Theme>(initialTheme ?? defaultTheme);

  React.useEffect(() => {
    if (initialTheme !== undefined) {
      return;
    }

    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored) {
        setThemeState(stored as Theme);
      }
    });
  }, [initialTheme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system"
      ? (systemColorScheme as "light" | "dark") || "light"
      : theme;

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className={resolvedTheme} style={{ flex: 1 }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

function useTheme() {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export { ThemeProvider, useTheme };
export type { Theme, ThemeContextValue, ThemeProviderProps };

