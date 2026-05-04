import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { typography, spacing } from "@/src/theme/tokens";
const MIN_COUNT = 0;
const TONE_MAP = {
  accent: (colors) => colors.accent,
  error: (colors) => colors.danger,
};
const DEFAULT_TONE = TONE_MAP.accent;
const getBadgeToneColor = (tone, colors) =>
  (TONE_MAP[tone] ?? DEFAULT_TONE)(colors);
export default function Badge({
  count,
  max = 99,
  tone = "accent",
  style,
  textStyle,
}) {
  const { colors } = useTheme();
  if (count === MIN_COUNT) return null;
  const label = count > max ? `${max}+` : String(count);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: getBadgeToneColor(tone, colors) },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: colors.accentForeground }, textStyle]}
      >
        {label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 10,
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.fontWeight.semiBold,
  },
});
