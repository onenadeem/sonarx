import { useEffect } from 'react'
import { Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View, } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, shadows, spacing, typography } from '@/src/theme/tokens';
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
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
                top: position?.y ?? '40%',
                left: position?.x ?? '10%',
            },
            shadows.lg,
            animStyle,
        ]}>
              {EMOJIS.map((emoji) => (<Pressable key={emoji} onPress={() => {
                onReact(emoji);
                onDismiss();
            }} style={({ pressed }) => [
                styles.emojiBtn,
                pressed && styles.emojiPressed,
            ]}>
                  <Text style={styles.emoji}>{emoji}</Text>
                </Pressable>))}
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
