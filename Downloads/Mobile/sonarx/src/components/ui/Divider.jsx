import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { typography, spacing } from "@/src/theme/tokens";
export default function Divider({ label, style }) {
  const { colors } = useTheme();
  const lineColorStyle = useMemo(
    () => ({ backgroundColor: colors.border }),
    [colors.border],
  );
  if (label) {
    return (
      <View style={[styles.row, style]}>
        <View style={[styles.line, lineColorStyle]} />
        <Text
          style={[
            styles.labelText,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
        >
          {label}
        </Text>
        <View style={[styles.line, lineColorStyle]} />
      </View>
    );
  }
  return <View style={[styles.hairline, lineColorStyle, style]} />;
}
const styles = StyleSheet.create({
  hairline: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  labelText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
});
