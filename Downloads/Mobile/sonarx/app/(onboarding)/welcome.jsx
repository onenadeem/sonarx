import { Image, View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, Muted } from "@/src/components/common/Typography";
import Button from "@/src/components/ui/Button";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import SonarXLogo from "@/components/SonarXLogo";
import greetingsDark from "@/assets/images/greetings-dark.png";
import greetingsLight from "@/assets/images/greetings-light.png";
import { ROUTES } from "@/src/constants/routes";

function WelcomeFeature({
  icon,
  title,
  description,
  iconColor,
  colors,
  isLast,
}) {
  return (
    <View
      style={[
        styles.feature,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginBottom: isLast ? 0 : spacing.sm,
          paddingHorizontal: spacing.xl,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={iconColor}
        style={styles.featureIcon}
      />
      <View style={styles.featureContent}>
        <Text
          style={{
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
            fontSize: typography.fontSize.md,
          }}
        >
          {title}
        </Text>
        <Muted
          numberOfLines={2}
          style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.fontSize.xs,
          }}
        >
          {description}
        </Muted>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const featureHighlights = [
    {
      icon: "lock-closed-outline",
      title: "Safe messages",
      description: "Only you and the person you message can read each message.",
    },
    {
      icon: "globe-outline",
      title: "No middleman handling",
      description:
        "Messages move directly between devices, not through a central server.",
    },
    {
      icon: "videocam-outline",
      title: "Private calling",
      description:
        "Voice and video calls stay encrypted so your conversation stays private.",
    },
  ];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.hero}>
        <View style={styles.logoRow}>
          <SonarXLogo size={32} />
          <Text
            style={{
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.xxl,
            }}
          >
            resonar
          </Text>
        </View>
        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.fontSize.sm,
            marginTop: spacing.xs,
            textAlign: "left",
          }}
        >
          Your chats and calls are direct, encrypted, and controlled by your
          device. No data is sold or copied. Your privacy your choice
        </Text>
        <Image
          source={isDark ? greetingsDark : greetingsLight}
          resizeMode="contain"
          style={styles.heroImage}
        />
      </View>

      <View style={styles.bottom}>
        <View style={styles.features}>
          {featureHighlights.map((feature, index) => (
            <WelcomeFeature
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              iconColor={colors.textPrimary}
              colors={colors}
              isLast={index === featureHighlights.length - 1}
            />
          ))}
        </View>

        <Button
          text="Get Started"
          icon="arrow-forward-outline"
          iconPosition="right"
          size="md"
          fullWidth
          paddingV={5}
          contentJustify="space-between"
          onPress={() => router.push(ROUTES.ONBOARDING_PHONE)}
        />

        <Text
          style={{
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.fontSize.xs,
            textAlign: "center",
            marginTop: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          By continuing, you agree to create a local identity on your device. No
          data is shared with any server.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  root: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroImage: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    marginTop: spacing.xxl,
  },
  bottom: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    flexShrink: 0,
  },
  features: {
    width: "100%",
    marginBottom: spacing.md,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  featureIcon: {
    marginRight: spacing.lg,
  },
  featureContent: {
    flex: 1,
  },
};
