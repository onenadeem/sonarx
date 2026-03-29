import { View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center items-center bg-background">
        {/* Logo / Icon */}
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-8">
          <Ionicons
            name="radio-outline"
            size={46}
            color={Colors[colorScheme].text}
          />
        </View>

        {/* Title */}
        <H1 className="text-center mb-2">Welcome to SonarX</H1>
        <Text className="text-muted-foreground text-sm text-center mt-1">
          Secure peer-to-peer communication
        </Text>

        {/* Description */}
        <Muted className="text-center mb-8 px-4 leading-6">
          A peer-to-peer encrypted messaging app.{"\n"}
          Your messages, your privacy — no servers, no middlemen.
        </Muted>

        {/* Feature highlights */}
        <View className="w-full mb-10 space-y-4">
          <View className="flex-row items-center px-4 py-3 bg-card rounded-xl border border-border">
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={Colors[colorScheme].text}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">End-to-End Encrypted</Text>
              <Muted>Only you and the recipient can read your messages</Muted>
            </View>
          </View>

          <View className="flex-row items-center px-4 py-3 bg-card rounded-xl border border-border">
            <Ionicons
              name="globe-outline"
              size={24}
              color={Colors[colorScheme].text}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Peer-to-Peer</Text>
              <Muted>Direct connections — no central servers</Muted>
            </View>
          </View>

          <View className="flex-row items-center px-4 py-3 bg-card rounded-xl border border-border">
            <Ionicons
              name="videocam-outline"
              size={24}
              color={Colors[colorScheme].text}
              style={{ marginRight: 12 }}
            />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Voice & Video Calls</Text>
              <Muted>Crystal-clear encrypted calls with your contacts</Muted>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-6 pb-8">
        <Button
          size="lg"
          className="w-full"
          onPress={() => router.push("/(onboarding)/phone")}
        >
          Get Started →
        </Button>

        <Muted className="text-center mt-4 text-xs px-4">
          By continuing, you agree to create a local identity on your device.
          No data is shared with any server.
        </Muted>
      </View>
    </SafeAreaView>
  );
}
