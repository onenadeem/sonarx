
import { Pressable, StyleSheet, } from 'react-native';
import * as Haptics from '@/src/utils/haptics';
const HAPTIC_MAP = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
};
export default function AnimatedPressable({ onPress, onLongPress, haptic = false, hapticType = 'light', style, children, disabled = false, hitSlop, accessibilityLabel, }) {
    const handlePress = () => {
        if (haptic) {
            if (hapticType === 'selection') {
                Haptics.selectionAsync();
            }
            else {
                Haptics.impactAsync(HAPTIC_MAP[hapticType]);
            }
        }
        onPress?.();
    };
    const handleLongPress = () => {
        if (haptic) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        onLongPress?.();
    };
    return (<Pressable onPress={handlePress} onLongPress={onLongPress ? handleLongPress : undefined} disabled={disabled} hitSlop={hitSlop} accessibilityLabel={accessibilityLabel} style={({ pressed }) => [
            styles.pressable,
            pressed && !disabled && styles.pressed,
            style,
        ]}>
      {children}
    </Pressable>);
}
const styles = StyleSheet.create({
    pressable: {},
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
});
