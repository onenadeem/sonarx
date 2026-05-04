import { useEffect } from "react";
import Animated, {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTheme } from "@/src/theme/ThemeProvider";
const MIN_OPACITY = 0.3;
const MAX_OPACITY = 0.9;
const FADE_DURATION_MS = 700;
export default function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 6,
  style,
}) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.9);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(MIN_OPACITY, { duration: FADE_DURATION_MS }),
        withTiming(MAX_OPACITY, { duration: FADE_DURATION_MS }),
      ),
      -1,
      false,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  return (
    <Animated.View
      style={[
        {
          borderRadius,
          backgroundColor: colors.surface,
          width: width,
          height,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}
