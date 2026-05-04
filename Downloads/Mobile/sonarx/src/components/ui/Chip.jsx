import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/src/theme/ThemeProvider";
import { typography, spacing, borderRadius } from "@/src/theme/tokens";
import AnimatedPressable from "./Pressable";
export default function Chip({
  label,
  onPress,
  selected = false,
  icon,
  style,
}) {
  const { colors } = useTheme();
  const colorStyles = useMemo(
    () => ({
      container: {
        backgroundColor: selected ? colors.accentMuted : colors.surface,
        borderColor: selected ? colors.accent : colors.border,
      },
      label: {
        color: selected ? colors.accent : colors.textSecondary,
      },
    }),
    [colors, selected],
  );
  const content = (
    <View style={[styles.chip, colorStyles.container, style]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={selected ? colors.accent : colors.textSecondary}
          style={styles.icon}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          colorStyles.label,
          { fontFamily: typography.fontFamily.medium },
        ]}
      >
        {label}
      </Text>
    </View>
  );
  if (onPress) {
    return (
      <AnimatedPressable onPress={onPress} haptic hapticType="selection">
        {content}
      </AnimatedPressable>
    );
  }
  return content;
}
const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  icon: {
    marginRight: spacing.xxs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
