import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { memo, useMemo } from "react";
import { usePresenceBroadcaster } from "@/lib/hooks/usePresenceBroadcaster";
import { useGunMessaging } from "@/lib/hooks/useGunMessaging";
import { useTheme } from "@/src/theme/ThemeProvider";
import {
  buildTabBarStyle,
  getTabBarIconRenderer,
  TAB_BAR_HIDDEN_SCREENS,
  TAB_BAR_TABS,
} from "@/src/constants/tabBar";

function TabIcon({ routeName, color, focused }) {
  const iconRenderer = getTabBarIconRenderer(routeName);
  const iconProps = iconRenderer?.({ color, focused }) || {
    name: "ellipse-outline",
    color,
    size: 20,
  };
  return <Ionicons {...iconProps} />;
}

const MemoTabIcon = memo(TabIcon);
const TAB_BAR_BUTTON_HIT_SLOP = {
  top: 10,
  bottom: 10,
};

function useTabOptions() {
  return useMemo(() => {
    const map = {};
    for (const { name, title } of TAB_BAR_TABS) {
      map[name] = {
        title,
        tabBarIcon: ({ color, focused }) => (
          <MemoTabIcon routeName={name} color={color} focused={focused} />
        ),
      };
    }
    return map;
  }, []);
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  usePresenceBroadcaster();
  useGunMessaging();

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colors.tabBarActive,
      tabBarInactiveTintColor: colors.tabBarInactive,
      tabBarShowLabel: false,
      tabBarStyle: buildTabBarStyle(colors, insets.bottom),
      tabBarIconStyle: { marginTop: -3 },
      tabBarButton: (props) => (
        <Pressable {...props} hitSlop={TAB_BAR_BUTTON_HIT_SLOP} />
      ),
      headerShown: false,
      sceneStyle: { backgroundColor: colors.background },
    }),
    [colors, insets.bottom],
  );

  const tabOptions = useTabOptions();

  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={screenOptions}
      initialRouteName="chats"
    >
      {/* Hide template screens from tabs */}
      {TAB_BAR_HIDDEN_SCREENS.map(({ name, options }) => (
        <Tabs.Screen key={`hidden-${name}`} name={name} options={options} />
      ))}

      {/* Actual app tabs */}
      {TAB_BAR_TABS.map(({ name }) => (
        <Tabs.Screen key={name} name={name} options={tabOptions[name]} />
      ))}
    </Tabs>
  );
}
