import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { MigrationsProvider } from "@/db/migrations";
import { DatabaseProvider } from "@/lib/hooks/useDb";
import { loadIdentity } from "@/lib/identity";
import {
  DefaultTheme,
  DarkTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import "react-native-reanimated";
import "../global.css";
import { useIdentityStore } from "@/stores/identity.store";
import { StatusBar } from "expo-status-bar";
import "react-native-get-random-values";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ThemeProvider,
  useTheme,
} from "@/src/theme/ThemeProvider";
import { borderRadius, shadows, spacing, typography } from "@/src/theme/tokens";
import Avatar from "@/src/components/ui/Avatar";
import type { Theme as ThemeMode } from "@react-navigation/native";

// ─── Polyfill crypto.randomUUID ───────────────────────────────────────────────

if (!("randomUUID" in crypto)) {
  (crypto as unknown as { randomUUID: () => string }).randomUUID = (): string => {
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
  const Notifications = require("expo-notifications") as typeof import("expo-notifications");
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

function buildNavigationTheme(isDark: boolean): ThemeMode {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      primary: isDark ? "#58a6ff" : "#0969da",
      background: isDark ? "#0d1117" : "#f6f8fa",
      card: isDark ? "#161b22" : "#ffffff",
      text: isDark ? "#c9d1d9" : "#24292f",
      border: isDark ? "#30363d" : "#d0d7de",
      notification: isDark ? "#f85149" : "#cf222e",
    },
  };
}

// ─── Toast system ─────────────────────────────────────────────────────────────

interface ToastData {
  id: string;
  senderName: string;
  messagePreview: string;
  senderAvatar?: string;
  chatPeerId: string;
}

interface ToastContextValue {
  showToast: (data: Omit<ToastData, "id">) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

function Toast({
  data,
  onDismiss,
  onTap,
}: {
  data: ToastData;
  onDismiss: () => void;
  onTap: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    translateY.value = withTiming(insets.top + spacing.xs, { duration: 350 });

    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, 4000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    translateY.value = withTiming(-120, { duration: 250 }, (finished) => {
      if (finished) runOnJS(onDismiss)();
    });
    onTap();
  };

  return (
    <Animated.View
      style={[
        toastStyles.container,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
        shadows.lg,
        animStyle,
      ]}
    >
      <Pressable onPress={handleTap} style={toastStyles.pressable}>
        <Avatar
          name={data.senderName}
          uri={data.senderAvatar}
          size="sm"
        />
        <View style={toastStyles.content}>
          <Text
            style={[
              toastStyles.name,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semiBold,
              },
            ]}
            numberOfLines={1}
          >
            {data.senderName}
          </Text>
          <Text
            style={[
              toastStyles.preview,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
            numberOfLines={1}
          >
            {data.messagePreview.substring(0, 60)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ToastLayer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const router = useRouter();

  const showToast = useCallback((data: Omit<ToastData, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...data, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View
        style={toastStyles.layer}
        pointerEvents="box-none"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            data={toast}
            onDismiss={() => dismissToast(toast.id)}
            onTap={() => {
              dismissToast(toast.id);
              router.push(`/chat/${toast.chatPeerId}` as never);
            }}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const toastStyles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  container: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  name: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  preview: {
    fontSize: typography.fontSize.sm,
    marginTop: 1,
  },
});

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <MigrationsProvider>
      <RootLayoutContent />
    </MigrationsProvider>
  );
}

function RootLayoutContent() {
  // Fonts — Geist fonts will load automatically when added to assets/fonts/
  // Only SpaceMono is currently available; Geist falls back to system font.
  const [fontsLoaded, fontError] = useFonts({
    "Geist-Regular": require("../assets/fonts/SpaceGrotesk-Variable.ttf"),
    "Geist-Medium": require("../assets/fonts/SpaceGrotesk-Variable.ttf"),
    "Geist-SemiBold": require("../assets/fonts/SpaceGrotesk-Variable.ttf"),
    "Geist-Bold": require("../assets/fonts/SpaceGrotesk-Variable.ttf"),
  });

  const [isIdentityChecked, setIsIdentityChecked] = useState(false);
  const isOnboarded = useIdentityStore((state) => state.isOnboarded);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadIdentity()
      .then(() => setIsIdentityChecked(true))
      .catch(() => setIsIdentityChecked(true));
  }, []);

  // Handle navigation based on onboarding state
  useEffect(() => {
    if (!isIdentityChecked) return;
    const inOnboarding = segments[0] === "(onboarding)";
    if (!isOnboarded && !inOnboarding) {
      router.replace("/(onboarding)/welcome");
    } else if (isOnboarded && inOnboarding) {
      router.replace("/(tabs)/chats");
    }
  }, [isIdentityChecked, isOnboarded, segments]);

  // Register for push notifications and set up deep-link handler
  useEffect(() => {
    if (_isExpoGo) return;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    Notifications.requestPermissionsAsync().catch(console.error);

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data
          ?.url as string | undefined;
        if (url) {
          router.push(url as never);
        }
      },
    );

    return () => sub.remove();
  }, []);

  // Hide splash once fonts are ready (font errors are graceful — use system font)
  useEffect(() => {
    if ((fontsLoaded || fontError) && isIdentityChecked) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [fontsLoaded, fontError, isIdentityChecked]);

  if ((!fontsLoaded && !fontError) || !isIdentityChecked) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={rootStyles.fill}>
        <DatabaseProvider>
          <ThemeProvider>
            <RootLayoutThemedNav />
          </ThemeProvider>
        </DatabaseProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutThemedNav() {
  const { isDark, colors } = useTheme();
  const navTheme = buildNavigationTheme(isDark);

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.headerBackground}
      />
      <NavigationThemeProvider value={navTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[peerId]" options={{ headerShown: false }} />
          <Stack.Screen name="call/[peerId]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </NavigationThemeProvider>

      {/* In-app toast overlay — rendered above the navigation stack */}
      <ToastLayer />
    </>
  );
}

const rootStyles = StyleSheet.create({
  fill: { flex: 1 },
});
