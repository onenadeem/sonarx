import { useEffect, useRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/src/theme/ThemeProvider";
import { borderRadius, shadows, spacing } from "@/src/theme/tokens";

const PILL_WIDTH_ESTIMATE = 140;
const PILL_HEIGHT_ESTIMATE = 50;
const ABOVE_OFFSET = 16;
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ReactionBar({
  visible,
  messageId,
  isLiked,
  isDisliked,
  onLike,
  onDislike,
  onDismiss,
  position,
}) {
  const { colors } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const touchX = position?.x ?? SCREEN_WIDTH / 2;
  const touchY = position?.y ?? 200;
  let left = touchX - PILL_WIDTH_ESTIMATE / 2;
  let top = touchY - PILL_HEIGHT_ESTIMATE - ABOVE_OFFSET;

  // Clamp to screen bounds
  if (left < spacing.md) left = spacing.md;
  if (left + PILL_WIDTH_ESTIMATE > SCREEN_WIDTH - spacing.md) {
    left = SCREEN_WIDTH - spacing.md - PILL_WIDTH_ESTIMATE;
  }
  if (top < spacing.xl) top = touchY + ABOVE_OFFSET; // show below if not enough room above

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  top,
                  left,
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
                shadows.md,
              ]}
            >
              <Pressable
                onPress={() => {
                  onLike?.(messageId);
                  onDismiss();
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
                  size={20}
                  color={isLiked ? colors.accent : colors.textSecondary}
                />
              </Pressable>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <Pressable
                onPress={() => {
                  onDislike?.(messageId);
                  onDismiss();
                }}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={isDisliked ? "thumbs-down" : "thumbs-down-outline"}
                  size={20}
                  color={isDisliked ? colors.danger : colors.textSecondary}
                />
              </Pressable>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  pill: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth + 1,
    height: 20,
  },
});
