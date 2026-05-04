import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "@/db/client";
import { typography } from "@/src/theme/tokens";
import Avatar from "@/src/components/ui/Avatar";
import { callScreenStyles } from "@/src/theme/screenStyles";
import { useTheme } from "@/src/theme/ThemeProvider";
export default function CallScreen() {
  const { peerId, video } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [peer, setPeer] = useState(null);
  const isVideo = video === "true";
  useEffect(() => {
    db.query.peers
      .findFirst({ where: (p, { eq }) => eq(p.id, peerId) })
      .then((p) => p && setPeer(p))
      .catch(console.error);
  }, [peerId]);
  const displayName = peer?.displayName ?? peerId ?? "Unknown";
  return (
    <View
      style={[
        callScreenStyles.root,
        {
          backgroundColor: colors.chatBackground ?? colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style={colors.statusBarStyle} />

      <View style={callScreenStyles.topSection}>
        <Avatar name={displayName} uri={peer?.avatarUri} size="xl" />
        <Text
          style={[
            callScreenStyles.name,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.semiBold,
            },
          ]}
        >
          {displayName}
        </Text>
        <Text
          style={[
            callScreenStyles.status,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
        >
          {isVideo ? "Video call" : "Voice call"} · Not available in Expo Go
        </Text>
        <View
          style={[
            callScreenStyles.noticeBox,
            { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <Text
            style={[
              callScreenStyles.noticeText,
              {
                color: colors.textDisabled,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
          >
            Calls require a development build.{"\n"}Run: npx expo run:android
          </Text>
        </View>
      </View>

      <View style={callScreenStyles.controls}>
        <Pressable
          style={[
            callScreenStyles.controlButton,
            { backgroundColor: colors.danger },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons
            name="call"
            size={28}
            color={colors.textPrimary}
            style={{ transform: [{ rotate: "135deg" }] }}
          />
        </Pressable>
      </View>
    </View>
  );
}
