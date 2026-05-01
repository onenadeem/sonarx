import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, withDelay, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing } from '@/src/theme/tokens';
const DOT_SIZE = 8;
const DOT_COUNT = 3;
const BOUNCE_DURATION = 400;
const STAGGER_MS = 150;
const BOUNCE_OFFSET = -6;
const BOUNCE_START = 0;
const buildDotStyle = (color) => ({ backgroundColor: color });
function Dot({ index }) {
    const { colors } = useTheme();
    const translateY = useSharedValue(0);
    useEffect(() => {
        translateY.value = withDelay(index * STAGGER_MS, withRepeat(withSequence(withTiming(BOUNCE_OFFSET, { duration: BOUNCE_DURATION }), withTiming(BOUNCE_START, { duration: BOUNCE_DURATION })), -1, false));
    }, [index]);
    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));
    return (<Animated.View style={[styles.dot, buildDotStyle(colors.textSecondary), animStyle]}/>);
}
export default function TypingIndicator({ visible }) {
    const { colors } = useTheme();
    const containerOpacity = useSharedValue(0);
    useEffect(() => {
        containerOpacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
    }, [visible]);
    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));
    if (!visible)
        return null;
    return (<Animated.View style={containerStyle}>
      <View style={[
            styles.bubble,
            {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.bubble.incomingBorder,
            },
        ]}>
        <View style={styles.dotsRow}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (<Dot key={i} index={i}/>))}
        </View>
      </View>
    </Animated.View>);
}
const styles = StyleSheet.create({
    bubble: {
        alignSelf: 'flex-start',
        borderRadius: borderRadius.lg,
        borderTopLeftRadius: borderRadius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        height: DOT_SIZE * 2,
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
    },
});
