import { StyleSheet, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { borderRadius, spacing } from "@/src/theme/tokens";
const SHADOW_CONFIG = {
  color: "#1A1917",
  offset: { width: 0, height: 1 },
  opacity: 0.06,
  radius: 3,
};
const resolveBorderColor = (colors, bordered) =>
  bordered ? colors.border : "transparent";
export default function Card({
  children,
  bordered = true,
  padding = spacing.lg,
  style,
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: resolveBorderColor(colors, bordered),
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: SHADOW_CONFIG.color,
    shadowOffset: SHADOW_CONFIG.offset,
    shadowOpacity: SHADOW_CONFIG.opacity,
    shadowRadius: SHADOW_CONFIG.radius,
    elevation: 2,
  },
});
