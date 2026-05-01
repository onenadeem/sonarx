import { useEffect } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View, } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, shadows, spacing, typography } from '@/src/theme/tokens';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
const DEFAULT_POSITION = { x: '10%', y: '40%' };
const getPositionValue = (position, axis, fallback) => position?.[axis] ?? fallback;
function ReactionButton({ emoji, onPress }) {
    return <Pressable onPress={onPress} style={({ pressed }) => [
        styles.emojiBtn,
        pressed && styles.emojiPressed,
    ]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </Pressable>;
}
export default function ReactionBar({ visible, onReact, onDismiss, position, }) {
    const { colors } = useTheme();
    const scale = useSharedValue(0);
    useEffect(() => {
        scale.value = withSpring(visible ? 1 : 0, { damping: 14, stiffness: 200 });
    }, [visible]);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));
    if (!visible)
        return null;
    return (<Modal transparent animationType="none" visible={visible} onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[
            styles.pill,
            {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                top: getPositionValue(position, 'y', DEFAULT_POSITION.y),
                left: getPositionValue(position, 'x', DEFAULT_POSITION.x),
            },
            shadows.lg,
            animStyle,
        ]}>
            {EMOJIS.map((emoji) => (
              <ReactionButton
                key={emoji}
                emoji={emoji}
                onPress={() => {
                  onReact(emoji);
                  onDismiss();
                }}
              />
            ))}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>);
}
const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    pill: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: borderRadius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        gap: spacing.xxs,
    },
    emojiBtn: {
        padding: spacing.xxs,
    },
    emojiPressed: {
        transform: [{ scale: 1.3 }],
    },
    emoji: {
        fontSize: typography.fontSize.xl,
        lineHeight: 32,
    },
});
