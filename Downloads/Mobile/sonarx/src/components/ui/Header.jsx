
import { StyleSheet, Text, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useResponsive } from '@/src/hooks/useResponsive';
import { spacing, typography } from '@/src/theme/tokens';
import AnimatedPressable from './Pressable';
export default function Header({ title, subtitle, leftIcon, onLeftPress, leftAccessory, rightActions, rightAccessory, style, }) {
    const { colors } = useTheme();
    const { isTablet, isDesktop } = useResponsive();
    const height = isTablet || isDesktop ? 64 : 56;
    // Icon and text color adapt to header background:
    // light header → dark (textPrimary), dark header → light (primaryForeground)
    const iconColor = colors.textPrimary;
    const titleColor = colors.textPrimary;
    const subtitleColor = colors.textSecondary;
    return (<View style={[
            styles.container,
            {
                height,
                backgroundColor: colors.headerBackground,
            },
            style,
        ]}>
      <View style={styles.leftSection}>
        {leftAccessory ? (leftAccessory) : leftIcon ? (<AnimatedPressable onPress={onLeftPress} accessibilityLabel={title} style={styles.iconButton}>
            <Ionicons name={leftIcon} size={22} color={iconColor}/>
          </AnimatedPressable>) : null}

        <View style={styles.titleBlock}>
          <Text style={[
            styles.title,
            { color: titleColor, fontFamily: typography.fontFamily.bold },
        ]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (<Text style={[
                styles.subtitle,
                { color: subtitleColor, fontFamily: typography.fontFamily.regular },
            ]} numberOfLines={1}>
              {subtitle}
            </Text>) : null}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightActions?.map((action) => (<AnimatedPressable key={action.accessibilityLabel} onPress={action.onPress} accessibilityLabel={action.accessibilityLabel} style={styles.iconButton}>
            <Ionicons name={action.icon} size={22} color={iconColor}/>
          </AnimatedPressable>))}
        {rightAccessory}
      </View>
    </View>);
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
        gap: spacing.sm,
    },
    titleBlock: {
        justifyContent: 'center',
        minWidth: 0,
    },
    title: {
        ...typography.bodyBold,
        fontSize: 18,
    },
    subtitle: {
        ...typography.caption,
        marginTop: 2,
    },
    rightSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginLeft: spacing.md,
    },
    iconButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
