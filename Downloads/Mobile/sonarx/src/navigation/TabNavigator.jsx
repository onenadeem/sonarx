
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import BottomTabBar from '@/src/components/layout/BottomTabBar';
import ChatListScreen from '@/src/screens/ChatListScreen';
import ContactsScreen from '@/src/screens/ContactsScreen';
import SettingsScreen from '@/src/screens/SettingsScreen';
// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
    {
        name: 'chats',
        label: 'Messages',
        icon: 'chatbubbles',
        iconOutline: 'chatbubbles-outline',
        Screen: ChatListScreen,
    },
    {
        name: 'contacts',
        label: 'Contacts',
        icon: 'people',
        iconOutline: 'people-outline',
        Screen: ContactsScreen,
    },
    {
        name: 'settings',
        label: 'Settings',
        icon: 'settings',
        iconOutline: 'settings-outline',
        Screen: SettingsScreen,
    },
];
const Tab = createBottomTabNavigator();
// ─── Component ────────────────────────────────────────────────────────────────
export function TabNavigator() {
    const { colors } = useTheme();
    return (<Tab.Navigator tabBar={(props) => <BottomTabBar {...props}/>} initialRouteName="chats" screenOptions={{
            headerShown: false,
            tabBarStyle: {
                backgroundColor: colors.tabBar,
                borderTopColor: colors.borderMuted,
            },
            tabBarActiveTintColor: colors.tabBarActive,
            tabBarInactiveTintColor: colors.tabBarInactive,
        }}>
      {TABS.map(({ name, label, icon, iconOutline, Screen }) => (<Tab.Screen key={name} name={name} component={Screen} options={{
                tabBarLabel: label,
                tabBarIcon: ({ color, focused, size }) => (<Ionicons name={focused ? icon : iconOutline} size={size} color={color}/>),
            }}/>))}
    </Tab.Navigator>);
}
