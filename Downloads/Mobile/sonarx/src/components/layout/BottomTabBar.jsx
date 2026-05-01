
import { StyleSheet, Text, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography, spacing } from '@/src/theme/tokens';
import { TAB_BAR_HEIGHT } from '@/src/constants/layout';
import AnimatedPressable from '../ui/Pressable';
function TabItem({ isFocused, label, icon, onPress, onLongPress }) {
    const { colors } = useTheme();
    const color = isFocused ? colors.tabBarActive : colors.tabBarInactive;
    return (<AnimatedPressable onPress={onPress} onLongPress={onLongPress} haptic hapticType="selection" style={styles.tab} accessibilityLabel={label}>
      <View style={styles.tabInner}>
        {icon?.({ color, focused: isFocused, size: 22 })}
        <Text style={[
            styles.tabLabel,
            {
                color,
                fontFamily: isFocused
                    ? typography.fontFamily.semiBold
                    : typography.fontFamily.regular,
            },
        ]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>);
}
export default function BottomTabBar({ state, descriptors, navigation, }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    return (<View style={[
            styles.container,
            {
                backgroundColor: colors.tabBar,
                borderTopColor: colors.borderMuted,
                paddingBottom: insets.bottom,
                height: TAB_BAR_HEIGHT + insets.bottom,
            },
        ]}>
      {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const { options } = descriptor;
            const isFocused = state.index === index;
            const label = typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : (options.title ?? route.name);
            const handlePress = () => {
                const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                }
            };
            const handleLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
            };
            return (<TabItem key={route.key} route={route} isFocused={isFocused} label={label} icon={options.tabBarIcon} onPress={handlePress} onLongPress={handleLongPress}/>);
        })}
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: spacing.xs,
    },
    tabInner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabLabel: {
        fontSize: typography.fontSize.xs,
        includeFontPadding: false,
    },
});
