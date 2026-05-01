import { useEffect } from 'react'
import { StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, } from 'react-native-reanimated';
import { useTheme } from '@/src/theme/ThemeProvider';
import Spinner from '@/src/components/ui/Spinner';
const STATUS_ICON = {
    sent: {
        name: 'checkmark-outline',
        style: 'default',
    },
    delivered: {
        name: 'checkmark-done-outline',
        style: 'secondary',
    },
    read: {
        name: 'checkmark-done',
        style: 'read',
    },
};
const resolveIconForStatus = (status, accentColor, disabledColor) => {
    const entry = STATUS_ICON[status] ?? { name: STATUS_ICON.read.name, style: 'default' };
    return { name: entry.name, color: entry.style === 'read' ? accentColor : disabledColor };
};
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
    const { name: iconName, color: iconColor } = resolveIconForStatus(status, colors.accent, colors.textDisabled);
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
