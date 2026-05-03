import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react'
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './tokens';
export const THEME_STORAGE_KEY = 'resonar-theme-mode';
const ThemeContext = createContext(undefined);
export function ThemeProvider({ children, initialMode, }) {
    const systemScheme = useColorScheme();
    const [mode, setModeState] = useState(initialMode ?? 'system');
    // Load persisted preference async on mount
    useEffect(() => {
        let mounted = true;
        AsyncStorage.getItem(THEME_STORAGE_KEY).then((saved) => {
            if (mounted && (saved === 'light' || saved === 'dark' || saved === 'system')) {
                setModeState(saved);
            }
        }).catch(() => { });
        return () => {
            mounted = false;
        };
    }, []);
    const setMode = useCallback((newMode) => {
        AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(console.error);
        setModeState(newMode);
    }, []);
    const isDark = useMemo(() => {
        if (mode === 'system')
            return systemScheme === 'dark';
        return mode === 'dark';
    }, [mode, systemScheme]);
    const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);
    const value = useMemo(() => ({ colors, mode, isDark, setMode }), [colors, mode, isDark]);
    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}
