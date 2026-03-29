import { LoadingScreen } from "@/components/common/LoadingScreen";
import { ThemeProvider as AppThemeProvider } from "@/components/ThemeProvider";
import { useColorScheme } from "@/components/useColorScheme";
import { MigrationsProvider } from "@/db/migrations";
import { DatabaseProvider } from "@/lib/hooks/useDb";
import { loadIdentity } from "@/lib/identity";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { useIdentityStore } from "@/stores/identity.store";
import { StatusBar } from "expo-status-bar";
import Colors from "@/constants/Colors";
import "react-native-get-random-values";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Polyfill crypto.randomUUID for React Native (getRandomValues is provided by react-native-get-random-values)
if (!("randomUUID" in crypto)) {
  (crypto as any).randomUUID = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  };
}
import { THEME_STORAGE_KEY, type Theme } from "@/components/ThemeProvider";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

const getNavigationTheme = (scheme: "light" | "dark") => {
  if (scheme === "dark") {
    return {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: Colors.dark.tint,
        background: Colors.dark.background,
        card: Colors.dark.card,
        text: Colors.dark.text,
        border: Colors.dark.border,
        notification: Colors.dark.tint,
      },
    };
  }

  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.tint,
      background: Colors.light.background,
      card: Colors.light.card,
      text: Colors.light.text,
      border: Colors.light.border,
      notification: Colors.light.tint,
    },
  };
};

export default function RootLayout() {
  return (
    <MigrationsProvider>
      <RootLayoutContent />
    </MigrationsProvider>
  );
}

function RootLayoutContent() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [isIdentityChecked, setIsIdentityChecked] = useState(false);
  const [isThemeChecked, setIsThemeChecked] = useState(false);
  const [initialTheme, setInitialTheme] = useState<Theme>("system");
  const isOnboarded = useIdentityStore((state) => state.isOnboarded);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function checkIdentity() {
      await loadIdentity();
      setIsIdentityChecked(true);
    }
    checkIdentity();
  }, []);

  useEffect(() => {
    async function checkTheme() {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setInitialTheme(storedTheme as Theme);
      } else {
        setInitialTheme("system");
      }
      setIsThemeChecked(true);
    }
    checkTheme();
  }, []);

  useEffect(() => {
    if (!isIdentityChecked) return;

    const inOnboarding = segments[0] === "(onboarding)";

    if (!isOnboarded && !inOnboarding) {
      router.replace("/(onboarding)/welcome");
    } else if (isOnboarded && inOnboarding) {
      router.replace("/(tabs)/chats");
    }
  }, [isIdentityChecked, isOnboarded, segments]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isIdentityChecked) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isIdentityChecked]);

  if (!loaded || !isIdentityChecked || !isThemeChecked) {
    return <LoadingScreen message="Loading..." />;
  }

  return <RootLayoutNav initialTheme={initialTheme} />;
}

function RootLayoutNav({ initialTheme }: { initialTheme: Theme }) {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DatabaseProvider>
          <AppThemeProvider initialTheme={initialTheme}>
            <RootLayoutThemedNav />
          </AppThemeProvider>
        </DatabaseProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

function RootLayoutThemedNav() {
  const colorScheme = useColorScheme();

  return (
    <>
      <StatusBar
        style={colorScheme === "dark" ? "light" : "dark"}
        backgroundColor={Colors[colorScheme].background}
      />
      <NavigationThemeProvider value={getNavigationTheme(colorScheme)}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[peerId]" options={{ headerShown: false }} />
          <Stack.Screen name="call/[peerId]" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </NavigationThemeProvider>
    </>
  );
}
