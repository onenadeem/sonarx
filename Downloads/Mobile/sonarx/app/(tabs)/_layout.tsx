import React from "react";
import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

// Hook to broadcast user online status
import { usePresenceBroadcaster } from "@/lib/hooks/usePresenceBroadcaster";
import { useGunMessaging } from "@/lib/hooks/useGunMessaging";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Start broadcasting presence to Gun network
  usePresenceBroadcaster();
  // Subscribe to incoming encrypted messages via Gun
  useGunMessaging();

  return (
    <Tabs
      backBehavior="initialRoute"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        tabBarInactiveTintColor: Colors[colorScheme].mutedForeground,
        tabBarStyle: {
          display: "none",
        },
        headerShown: false,
      }}
      initialRouteName="chats"
    >
      {/* Hide template screens from tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />

      {/* Actual app tabs */}
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubble" : "chatbubble-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
