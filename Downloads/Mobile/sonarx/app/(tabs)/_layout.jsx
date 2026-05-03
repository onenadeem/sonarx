
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePresenceBroadcaster } from "@/lib/hooks/usePresenceBroadcaster";
import { useGunMessaging } from "@/lib/hooks/useGunMessaging";
import { useTheme } from "@/src/theme/ThemeProvider";
import { buildTabBarStyle, getTabBarIconRenderer, TAB_BAR_HIDDEN_SCREENS, TAB_BAR_TABS } from "@/src/constants/tabBar";
export default function TabLayout() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    // Start broadcasting presence to Gun network
    usePresenceBroadcaster();
    // Subscribe to incoming encrypted messages via Gun
    useGunMessaging();
    return (<Tabs backBehavior="initialRoute" screenOptions={{
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
            tabBarShowLabel: false,
            tabBarStyle: buildTabBarStyle(colors, insets.bottom),
            tabBarIconStyle: { marginTop: -3 },
            headerShown: false,
            sceneStyle: { backgroundColor: colors.background },
        }} initialRouteName="chats">
      {/* Hide template screens from tabs */}
      {TAB_BAR_HIDDEN_SCREENS.map(({ name, options }) => <Tabs.Screen key={`hidden-${name}`} name={name} options={options}/>)}

      {/* Actual app tabs */}
      {TAB_BAR_TABS.map(({ name, title }) => {
            const iconRenderer = getTabBarIconRenderer(name);
            return <Tabs.Screen key={name} name={name} options={{
                    title,
                    tabBarIcon: ({ color, focused }) => {
                        const iconProps = iconRenderer?.({ color, focused }) || {
                            name: "ellipse-outline",
                            color,
                            size: 20,
                        };
                        return <Ionicons {...iconProps}/>;
                    },
                }}/>;
        })}
    </Tabs>);
}
