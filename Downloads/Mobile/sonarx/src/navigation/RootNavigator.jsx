import { useMemo } from 'react'
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from '@/src/theme/ThemeProvider';
import { StackNavigator } from './StackNavigator';
// ─── Inner: builds the React Navigation theme from app theme tokens ───────────
function NavigationRoot() {
    const { colors, isDark } = useTheme();
    const navTheme = useMemo(() => ({
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            primary: colors.accent,
            background: colors.background,
            card: colors.headerBackground,
            text: colors.textPrimary,
            border: colors.borderMuted,
            notification: colors.accent,
        },
    }), [isDark, colors]);
    return (<NavigationContainer theme={navTheme}>
      <StackNavigator />
    </NavigationContainer>);
}
// ─── Root Navigator ───────────────────────────────────────────────────────────
export function RootNavigator() {
    return (<SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <ThemeProvider>
          <NavigationRoot />
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>);
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
