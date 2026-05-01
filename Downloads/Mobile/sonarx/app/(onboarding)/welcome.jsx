import { View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import { useTheme } from "@/src/theme/ThemeProvider";
export default function WelcomeScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const featureHighlights = [
        {
            icon: "lock-closed-outline",
            title: "End-to-End Encrypted",
            description: "Only you and the recipient can read your messages",
        },
        {
            icon: "globe-outline",
            title: "Peer-to-Peer",
            description: "Direct connections — no central servers",
        },
        {
            icon: "videocam-outline",
            title: "Voice & Video Calls",
            description: "Crystal-clear encrypted calls with your contacts",
        },
    ];
    return (<SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center items-center bg-background">
        {/* Logo / Icon */}
        <View className="w-24 h-24 rounded-full bg-primary items-center justify-center mb-8">
          <Ionicons name="radio-outline" size={46} color={colors.textPrimary}/>
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
          {featureHighlights.map((feature) => (<WelcomeFeature key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} iconColor={colors.textPrimary}/>))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-6 pb-8">
        <Button size="lg" className="w-full" onPress={() => router.push("/(onboarding)/phone")}>
          Get Started →
        </Button>

        <Muted className="text-center mt-4 text-xs px-4">
          By continuing, you agree to create a local identity on your device.
          No data is shared with any server.
        </Muted>
      </View>
    </SafeAreaView>);
}

function WelcomeFeature({ icon, title, description, iconColor }) {
    return <View className="flex-row items-center px-4 py-3 bg-card rounded-xl border border-border">
      <Ionicons name={icon} size={24} color={iconColor} style={{ marginRight: 12 }}/>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Muted>{description}</Muted>
      </View>
    </View>;
}
