import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'
import BottomTabBar from '@/src/components/layout/BottomTabBar'
import ChatListScreen from '@/src/screens/ChatListScreen'
import ContactsScreen from '@/src/screens/ContactsScreen'
import SettingsScreen from '@/src/screens/SettingsScreen'

// ─── Tab param list ───────────────────────────────────────────────────────────

export type TabParamList = {
  chats: undefined
  contacts: undefined
  settings: undefined
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  {
    name: 'chats' as const,
    label: 'Messages',
    icon: 'chatbubbles' as const,
    iconOutline: 'chatbubbles-outline' as const,
    Screen: ChatListScreen,
  },
  {
    name: 'contacts' as const,
    label: 'Contacts',
    icon: 'people' as const,
    iconOutline: 'people-outline' as const,
    Screen: ContactsScreen,
  },
  {
    name: 'settings' as const,
    label: 'Settings',
    icon: 'settings' as const,
    iconOutline: 'settings-outline' as const,
    Screen: SettingsScreen,
  },
]

const Tab = createBottomTabNavigator<TabParamList>()

// ─── Component ────────────────────────────────────────────────────────────────

export function TabNavigator() {
  const { colors } = useTheme()

  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      initialRouteName="chats"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.borderMuted,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      {TABS.map(({ name, label, icon, iconOutline, Screen }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={Screen}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                name={focused ? icon : iconOutline}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  )
}
