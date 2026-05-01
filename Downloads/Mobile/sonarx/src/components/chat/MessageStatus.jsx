import { useEffect } from 'react'
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import Spinner from '@/src/components/ui/Spinner';
export default function MessageStatus({ status, size = 14 }) {
    const { colors } = useTheme();
    const opacity = useSharedValue(0);
    useEffect(() => {
        opacity.value = 0;
        opacity.value = withTiming(1, { duration: 200 });
    }, [status]);
    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));
    if (status === 'sending') {
        return <Spinner size="sm"/>;
    }
    const iconName = status === 'sent'
        ? 'checkmark-outline'
        : status === 'delivered'
            ? 'checkmark-done-outline'
            : 'checkmark-done';
    const iconColor = status === 'read' ? colors.accent : colors.textDisabled;
    return (<Animated.View style={[styles.container, animStyle]}>
      <Ionicons name={iconName} size={size} color={iconColor}/>
    </Animated.View>);
}
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
