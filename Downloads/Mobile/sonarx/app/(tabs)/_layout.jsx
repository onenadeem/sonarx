
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePresenceBroadcaster } from "@/lib/hooks/usePresenceBroadcaster";
import { useGunMessaging } from "@/lib/hooks/useGunMessaging";
import { useTheme } from "@/src/theme/ThemeProvider";
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
            tabBarStyle: {
                backgroundColor: colors.tabBar,
                borderTopWidth: 0,
                height: 65 + insets.bottom,
                paddingBottom: insets.bottom,
                paddingTop: 17,
            },
            headerShown: false,
        }} initialRouteName="chats">
      {/* Hide template screens from tabs */}
      <Tabs.Screen name="index" options={{ href: null }}/>
      <Tabs.Screen name="two" options={{ href: null }}/>

      {/* Actual app tabs */}
      <Tabs.Screen name="chats" options={{
            title: "Chats",
            tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={23} color={color}/>),
        }}/>
      <Tabs.Screen name="community" options={{
            title: "Community",
            tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "earth" : "earth-outline"} size={23} color={color}/>),
        }}/>
      <Tabs.Screen name="find" options={{
            title: "Find",
            tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "file-tray-stacked" : "file-tray-stacked-outline"} size={22} color={color}/>),
        }}/>
      <Tabs.Screen name="contacts" options={{
            title: "Contacts",
            tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "person" : "person-outline"} size={22} color={color}/>),
        }}/>
      <Tabs.Screen name="settings" options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (<Ionicons name={focused ? "settings" : "settings-outline"} size={23} color={color}/>),
        }}/>
    </Tabs>);
}
