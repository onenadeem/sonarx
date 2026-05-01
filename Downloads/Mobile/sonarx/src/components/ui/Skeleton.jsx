import { useEffect } from 'react'
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
export default function Skeleton({ width = '100%', height = 16, borderRadius = 6, style, }) {
    const { colors } = useTheme();
    const opacity = useSharedValue(0.9);
    useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 700 }), withTiming(0.9, { duration: 700 })), -1, false);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));
    return (<Animated.View style={[
            styles.skeleton,
            {
                width: width,
                height,
                borderRadius,
                backgroundColor: colors.surface,
            },
            animatedStyle,
            style,
        ]}/>);
}
const styles = StyleSheet.create({
    skeleton: {},
});
