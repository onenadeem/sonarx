import { View, ScrollView, Alert, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Muted } from "@/components/ui/typography";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { useIdentityStore } from "@/stores/identity.store";
import { useTheme } from "@/components/ThemeProvider";
import * as SecureStore from "expo-secure-store";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

function SettingsItem({
  icon,
  iconColor,
  title,
  description,
  textColor,
  descriptionColor,
  onPress,
  rightElement,
  showChevron = true,
  destructive = false,
}: {
  icon: string;
  iconColor: string;
  title: string;
  textColor?: string;
  descriptionColor?: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center pl-1 pr-4 py-3"
      activeOpacity={0.7}
      disabled={!onPress}
      style={{
        opacity: onPress ? 1 : 0.94,
      }}
    >
      <View
        className="items-center justify-center mr-3"
        style={{ width: 24, height: 24, borderRadius: 12 }}
      >
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1 mr-2">
        <Text
          style={{
            color: destructive ? "#ef4444" : textColor,
          }}
          className={`text-sm ${destructive ? "font-semibold" : "font-medium"} text-foreground`}
        >
          {title}
        </Text>
        {description ? (
          <Muted
            style={descriptionColor ? { color: descriptionColor } : undefined}
            className="text-[11px] mt-0.5"
          >
            {description}
          </Muted>
        ) : null}
      </View>
      {rightElement ??
        (onPress && showChevron ? (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        ) : null)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const colorScheme = useColorScheme() ?? resolvedTheme;
  const resolvedColors = Colors[colorScheme];
  const identity = useIdentityStore((state) => state.identity);
  const clearIdentity = useIdentityStore((state) => state.clearIdentity);

  const handleDeleteData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your messages, contacts, and identity. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync("sonarx-secret-keys");
            await SecureStore.deleteItemAsync("sonarx-signing-keys");
            clearIdentity();
            router.replace("/(onboarding)/welcome");
          },
        },
      ],
    );
  };

  const handleBackup = () => {
    Alert.alert("Backup", "Backup functionality coming soon");
  };

  if (!identity) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text>Not logged in</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="mx-4 mb-6">
          <Text style={{ color: resolvedColors.text }} className="text-2xl font-bold">
            Settings
          </Text>
          <Text style={{ color: resolvedColors.mutedForeground }} className="text-[11px] mt-1">
            Manage app preferences
          </Text>
        </View>
        <View className="mx-4 mb-3">
          <Text
            style={{ color: resolvedColors.mutedForeground }}
            className="text-[11px] tracking-wide ml-1 mb-2"
          >
            Account
          </Text>
          <View className="space-y-0">
            <SettingsItem
              icon="person-outline"
              iconColor={resolvedColors.text}
              title="Your name"
              description={identity.displayName}
              textColor={resolvedColors.text}
              descriptionColor={resolvedColors.mutedForeground}
              onPress={() => router.push("/profile/edit" as any)}
            />
            <SettingsItem
              icon="phone-portrait-outline"
              iconColor={resolvedColors.text}
              title="Phone number"
              description={identity.phoneNumber}
              textColor={resolvedColors.text}
              descriptionColor={resolvedColors.mutedForeground}
              showChevron={false}
            />
          </View>
        </View>

        {/* Preferences */}
        <View className="mx-4 mb-3">
          <Text
            style={{ color: resolvedColors.mutedForeground }}
            className="text-[11px] tracking-wide ml-1 mb-2"
          >
            Preferences
          </Text>
          <View className="space-y-0">
            <SettingsItem
              icon={resolvedTheme === "dark" ? "moon" : "moon-outline"}
              iconColor={resolvedColors.text}
              title="Dark mode"
              description="Switch between light and dark themes"
              textColor={resolvedColors.text}
              descriptionColor={resolvedColors.mutedForeground}
              showChevron={false}
              rightElement={
                <Switch
                  checked={resolvedTheme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              }
            />
            <SettingsItem
              icon="cloud-upload-outline"
              iconColor={resolvedColors.text}
              title="Backup Identity"
              description="Save keys and profile metadata"
              textColor={resolvedColors.text}
              descriptionColor={resolvedColors.mutedForeground}
              onPress={handleBackup}
            />
            <SettingsItem
              icon="trash-outline"
              iconColor="#ef4444"
              title="Delete all data"
              description="Permanently remove data on this device"
              textColor="#ef4444"
              descriptionColor={resolvedColors.mutedForeground}
              onPress={handleDeleteData}
              destructive
            />
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
