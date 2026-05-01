import React, { createContext, useCallback, useContext, useEffect, useRef, useState, } from "react";
import { Pressable, Text, View, } from "react-native";
import { MigrationsProvider } from "@/db/migrations";
import { DatabaseProvider } from "@/lib/hooks/useDb";
import { loadIdentity } from "@/lib/identity";
import SonarXLogo from "@/components/SonarXLogo";
import { DefaultTheme, DarkTheme, ThemeProvider as NavigationThemeProvider, } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming, } from "react-native-reanimated";
import "react-native-reanimated";
import "../global.css";
// Suppress GunDB's "No localStorage exists" message — expected on React Native;
// we disable localStorage in our Gun config (localStorage: false, radisk: false).
 
const _origConsoleLog = console.log;
 
console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('No localStorage'))
        return;
    _origConsoleLog(...args);
};
import { useIdentityStore } from "@/stores/identity.store";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeProvider, useTheme, } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import Avatar from "@/src/components/ui/Avatar";
import { rootLayoutStyles, toastStyles } from "@/src/theme/screenStyles";
// ─── Polyfill crypto.randomUUID ───────────────────────────────────────────────
if (!("randomUUID" in crypto)) {
    crypto.randomUUID = () => {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
        return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
    };
}
// ─── Notification handler (module level) ─────────────────────────────────────
// expo-notifications remote push is removed from Expo Go SDK 53+.
// Guard with executionEnvironment before require() to avoid the native crash.
const _isExpoGo = Constants.executionEnvironment === "storeClient";
if (!_isExpoGo) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require("expo-notifications");
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}
// ─── Expo Router exports ──────────────────────────────────────────────────────
export { ErrorBoundary } from "expo-router";
export const unstable_settings = {
    initialRouteName: "(tabs)",
};
SplashScreen.preventAutoHideAsync();
// ─── Navigation theme builder ─────────────────────────────────────────────────
function buildNavigationTheme(isDark) {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
        ...base,
        dark: isDark,
        colors: {
            primary: isDark ? '#FAF9F4' : '#25211E',
            background: isDark ? '#25211E' : '#FAF9F4',
            card: isDark ? '#302C29' : '#FFFFFF',
            text: isDark ? '#FAF9F4' : '#25211E',
            border: isDark ? '#3D3835' : '#E0DAD1',
            notification: isDark ? '#f87171' : '#ef4444',
        },
    };
}
const ToastContext = createContext({ showToast: () => { } });
export function useToast() {
    return useContext(ToastContext);
}
function Toast({ data, onDismiss, onTap, }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-120);
    const timerRef = useRef(null);
    useEffect(() => {
        translateY.value = withTiming(insets.top + spacing.xs, { duration: 350 });
        timerRef.current = setTimeout(() => {
            translateY.value = withTiming(-120, { duration: 300 }, (finished) => {
                if (finished)
                    runOnJS(onDismiss)();
            });
        }, 4000);
        return () => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    const handleTap = () => {
        if (timerRef.current)
            clearTimeout(timerRef.current);
        translateY.value = withTiming(-120, { duration: 250 }, (finished) => {
            if (finished)
                runOnJS(onDismiss)();
        });
        onTap();
    };
    return (<Animated.View style={[
            toastStyles.container,
            {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
            },
            animStyle,
        ]}>
      <Pressable onPress={handleTap} style={toastStyles.pressable}>
        <Avatar name={data.senderName} uri={data.senderAvatar} size="sm"/>
        <View style={toastStyles.content}>
          <Text style={[
            toastStyles.name,
            {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semiBold,
            },
        ]} numberOfLines={1}>
            {data.senderName}
          </Text>
          <Text style={[
            toastStyles.preview,
            {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
            },
        ]} numberOfLines={1}>
            {data.messagePreview.substring(0, 60)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>);
}
function ToastLayer() {
    const [toasts, setToasts] = useState([]);
    const router = useRouter();
    const showToast = useCallback((data) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...data, id }]);
    }, []);
    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    return (<ToastContext.Provider value={{ showToast }}>
      <View style={toastStyles.layer} pointerEvents="box-none">
        {toasts.map((toast) => (<Toast key={toast.id} data={toast} onDismiss={() => dismissToast(toast.id)} onTap={() => {
                dismissToast(toast.id);
                router.push(`/chat/${toast.chatPeerId}`);
            }}/>))}
      </View>
    </ToastContext.Provider>);
}
// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
    return (<MigrationsProvider>
      <RootLayoutContent />
    </MigrationsProvider>);
}
function RootLayoutContent() {
    // Fonts — Geist fonts will load automatically when added to assets/fonts/
    // Only SpaceMono is currently available; Geist falls back to system font.
    const [fontsLoaded, fontError] = useFonts({
        "Geist-Regular": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
        "Geist-Medium": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
        "Geist-SemiBold": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
        "Geist-Bold": require("../assets/fonts/SpaceGrotesk-Regular.otf"),
    });
    const [isIdentityChecked, setIsIdentityChecked] = useState(false);
    useEffect(() => {
        loadIdentity()
            .then(() => setIsIdentityChecked(true))
            .catch(() => setIsIdentityChecked(true));
    }, []);
    // Hide splash once fonts and identity are ready
    useEffect(() => {
        if ((fontsLoaded || fontError) && isIdentityChecked) {
            SplashScreen.hideAsync().catch(console.error);
        }
    }, [fontsLoaded, fontError, isIdentityChecked]);
    // isReady: navigator always mounts; loading overlay is removed once ready
    const isReady = (fontsLoaded || !!fontError) && isIdentityChecked;
    return (<SafeAreaProvider>
      <GestureHandlerRootView style={rootLayoutStyles.fill}>
        <DatabaseProvider>
          <ThemeProvider>
            <RootLayoutThemedNav isReady={isReady}/>
          </ThemeProvider>
        </DatabaseProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>);
}
function RootLayoutThemedNav({ isReady }) {
    const { isDark, colors } = useTheme();
    const navTheme = buildNavigationTheme(isDark);
    const router = useRouter();
    const segments = useSegments();
    const isOnboarded = useIdentityStore((state) => state.isOnboarded);
    // Navigation guard — runs only after the Stack is mounted (isReady)
    useEffect(() => {
        if (!isReady)
            return;
        const inOnboarding = segments[0] === "(onboarding)";
        if (!isOnboarded && !inOnboarding) {
            router.replace("/(onboarding)/welcome");
        }
        else if (isOnboarded && inOnboarding) {
            router.replace("/(tabs)/chats");
        }
    }, [isReady, isOnboarded, segments]);
    // Register for push notifications and set up deep-link handler
    useEffect(() => {
        if (_isExpoGo)
            return;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Notifications = require("expo-notifications");
        Notifications.requestPermissionsAsync().catch(console.error);
        const sub = Notifications.addNotificationResponseReceivedListener((response) => {
            const url = response.notification.request.content.data
                ?.url;
            if (url) {
                router.push(url);
            }
        });
        return () => sub.remove();
    }, []);
    return (<>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={colors.headerBackground}/>
      <NavigationThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }}/>
          <Stack.Screen name="chat/[peerId]" options={{ headerShown: false }}/>
          <Stack.Screen name="call/[peerId]" options={{ headerShown: false }}/>
          <Stack.Screen name="modal" options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
            contentStyle: { backgroundColor: "transparent" },
        }}/>
        </Stack>
      </NavigationThemeProvider>

      {/* Branded splash overlay — shown until fonts & identity are ready */}
      {!isReady && (<View style={[
                rootLayoutStyles.loadingOverlay,
                { backgroundColor: colors.background },
            ]}>
          <SonarXLogo size={88}/>
        </View>)}

      {/* In-app toast overlay — rendered above the navigation stack */}
      <ToastLayer />
    </>);
}
 
