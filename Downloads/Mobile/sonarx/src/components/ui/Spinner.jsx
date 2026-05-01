import { useEffect } from 'react'
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
const SIZE_MAP = { sm: 16, md: 24, lg: 36 };
export default function Spinner({ size = 'md', color }) {
    const { colors } = useTheme();
    const rotation = useSharedValue(0);
    useEffect(() => {
        rotation.value = withRepeat(withTiming(360, {
            duration: 800,
            easing: Easing.linear,
        }), -1, false);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));
    const dim = SIZE_MAP[size];
    const spinnerColor = color ?? colors.accent;
    return (<Animated.View style={[
            styles.spinner,
            {
                width: dim,
                height: dim,
                borderRadius: dim / 2,
                borderColor: spinnerColor,
            },
            animatedStyle,
        ]}/>);
}
const styles = StyleSheet.create({
    spinner: {
        borderWidth: 2,
        borderTopColor: 'transparent',
        borderRightColor: 'transparent',
    },
});
