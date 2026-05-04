import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
const ONLINE_BLINK_MIN = 0.4;
const ONLINE_BLINK_MAX = 1;
const ONLINE_BLINK_DURATION_MS = 800;
const DEFAULT_SIZE = 10;
export default function OnlineBadge({ isOnline, size = 10, style }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (isOnline) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(ONLINE_BLINK_MIN, { duration: ONLINE_BLINK_DURATION_MS }),
          withTiming(ONLINE_BLINK_MAX, { duration: ONLINE_BLINK_DURATION_MS }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = 1;
    }
  }, [isOnline]);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[
        styles.dot,
        {
          width: size ?? DEFAULT_SIZE,
          height: size ?? DEFAULT_SIZE,
          borderRadius: (size ?? DEFAULT_SIZE) / 2,
          backgroundColor: isOnline ? colors.online : colors.textDisabled,
        },
        animStyle,
        style,
      ]}
    />
  );
}
const styles = StyleSheet.create({
  dot: {},
});
