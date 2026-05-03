import { Image, Platform, View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Muted } from "@/components/ui/typography";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import SonarXLogo from "@/components/SonarXLogo";
import greetingsDark from "@/assets/images/greetings-dark.png";
import greetingsLight from "@/assets/images/greetings-light.png";
export default function WelcomeScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const buttonBackground = isDark ? colors.primary : colors.secondary;
    const buttonTextColor = isDark ? colors.background : colors.textPrimary;
    const featureHighlights = [
        {
            icon: "lock-closed-outline",
            title: "Safe messages",
            description: "Only you and the person you message can read each message.",
        },
        {
            icon: "globe-outline",
            title: "No middleman handling",
            description: "Messages move directly between devices, not through a central server.",
        },
        {
            icon: "videocam-outline",
            title: "Private calling",
            description: "Voice and video calls stay encrypted so your conversation stays private.",
        },
    ];
    const headingFont = typography.fontFamily.bold;
    const bodyFont = typography.fontFamily.regular;
    const buttonFont = typography.fontFamily.semiBold;
    return (<SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-start items-start pt-10" style={{
        backgroundColor: colors.background,
        alignSelf: "start",
        width: "100%",
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
      }}>
        {/* Greetings Illustration */}


        {/* Logo and Brand */}
        <View className="flex-row items-center justify-center" style={{ gap: 6 }}>
          <SonarXLogo size={32} />
          <Text style={{
            color: colors.textPrimary,
            fontFamily: headingFont,
            fontSize: typography.fontSize.xxl,
            marginTop: -spacing.xs,
          }}>resonar</Text>
        </View>
        <Text className="text-sm text-start mt-1 px-2" style={{
            color: colors.textSecondary,
            fontFamily: bodyFont,
            fontSize: typography.fontSize.sm,
        }}>
          Your chats and calls are direct, encrypted, and controlled by your device.
          No data is sold or copied. Your privacy your choice

        </Text>
        <Image
          source={isDark ? greetingsDark : greetingsLight}
          resizeMode="contain"
          style={{
            width: "100%",
            height: 380,
            alignSelf: "center",
            marginTop: 40,
          }}
        />
      </View>

      {/* Bottom CTA */}
      <View className="px-6 pb-8">
        {/* Feature highlights */}
        <View className="w-full mb-4">
          {featureHighlights.map((feature, index) => (<WelcomeFeature key={feature.title} icon={feature.icon} title={feature.title} description={feature.description} iconColor={colors.textPrimary} colors={colors} isLast={index === featureHighlights.length - 1}/>))}
        </View>

        <Button
          size="lg"
          className="w-full"
          variant="ghost"
          style={{ backgroundColor: buttonBackground }}
          onPress={() => router.push("/(onboarding)/phone")}
        >
          <View className="flex-row justify-between items-center w-full">
            <Text className="font-semibold" style={{ color: buttonTextColor, fontFamily: buttonFont }}>
              Get Started
            </Text>
            <Ionicons name="arrow-forward-outline" size={18} color={buttonTextColor}/>
          </View>
        </Button>

        <View style={{ height: 13 }} />
        <Muted
          className="text-center text-xs px-4"
          style={{
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
            marginBottom: 5,
          }}
        >
          By continuing, you agree to create a local identity on your device.
          No data is shared with any server.
        </Muted>
      </View>
    </SafeAreaView>);
}

function WelcomeFeature({ icon, title, description, iconColor, colors, isLast }) {
    return <View className="flex-row items-center px-4 py-3 rounded-xl border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        marginBottom: isLast ? 0 : 8,
      }}
    >
      <Ionicons name={icon} size={18} color={iconColor} style={{ marginRight: 20 }}/>
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm }}>{title}</Text>
        <Muted style={{ color: colors.textSecondary, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.xs }}>{description}</Muted>
      </View>
    </View>;
}
