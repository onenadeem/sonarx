
import { StyleSheet, Text, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { HEADER_HEIGHT, HEADER_HEIGHT_LARGE } from '@/src/constants/layout';
import { useResponsive } from '@/src/hooks/useResponsive';
import { spacing, typography } from '@/src/theme/tokens';
import AnimatedPressable from './Pressable';
export default function Header({ title, subtitle, leftIcon, onLeftPress, leftAccessory, centerAccessory, rightActions, rightAccessory, style, titleAlign = 'center', titlePaddingHorizontal = 0, centerPillCentered = false, }) {
    const { colors } = useTheme();
    const { isTablet, isDesktop } = useResponsive();
    const height = isTablet || isDesktop ? HEADER_HEIGHT_LARGE : HEADER_HEIGHT;
    const hasLeftAction = Boolean(leftAccessory || leftIcon);
    const computedTitleAlign = titleAlign === 'start' ? 'flex-start' : 'center';
    const titlePadding = titleAlign === 'start' && titlePaddingHorizontal > 0
        ? { paddingHorizontal: titlePaddingHorizontal }
        : null;
    const iconColor = colors.textPrimary;
    const titleColor = colors.textPrimary;
    const subtitleColor = colors.textSecondary;
    const rightButtons = rightActions ?? [];
    const hasCenterAccessory = centerAccessory !== undefined && centerAccessory !== null;
    const renderedLeft = leftAccessory ? (leftAccessory) : leftIcon ? (<AnimatedPressable onPress={onLeftPress} accessibilityLabel={title} style={styles.iconButton}>
            <Ionicons name={leftIcon} size={22} color={iconColor}/>
          </AnimatedPressable>) : null;
    return (<View style={[
            styles.container,
            centerPillCentered ? styles.centerPillContainer : null,
            {
                height,
                backgroundColor: colors.headerBackground,
            },
            style,
        ]}>
      <View style={[
            styles.leftSection,
            centerPillCentered ? [
                styles.centerPillSideSection,
                styles.centerPillLeftSection,
            ] : null,
        ]}>
        {hasLeftAction && renderedLeft}
      </View>

      <View style={[
            styles.centerSection,
            centerPillCentered ? styles.centerPillCenterSection : null,
            { alignItems: computedTitleAlign },
        ]}>
        {hasCenterAccessory ? (centerAccessory) : <View style={[styles.titleBlock, titlePadding]}>
            <Text style={[
                styles.title,
                {
                    color: titleColor,
                    fontFamily: typography.fontFamily.bold,
                    textAlign: computedTitleAlign === 'flex-start' ? 'left' : 'center',
                },
            ]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (<Text style={[
                    styles.subtitle,
                {
                    color: subtitleColor,
                    fontFamily: typography.fontFamily.regular,
                    paddingBottom: spacing.md,
                    textAlign: computedTitleAlign === 'flex-start' ? 'left' : 'center',
                },
                ]} numberOfLines={1}>
                {subtitle}
              </Text>) : null}
          </View>}
      </View>

      <View style={[
            styles.rightSection,
            centerPillCentered ? [
                styles.centerPillSideSection,
                styles.centerPillRightSection,
            ] : null,
        ]}>
        {rightButtons.map((action) => (<AnimatedPressable key={action.accessibilityLabel} onPress={action.onPress} accessibilityLabel={action.accessibilityLabel} style={styles.iconButton}>
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
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    centerPillContainer: {
        position: 'relative',
        justifyContent: 'flex-start',
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 0,
        gap: 0,
        flexShrink: 0,
        minHeight: 45,
        justifyContent: 'center',
    },
    centerPillSideSection: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerPillLeftSection: {
        left: spacing.sm,
    },
    centerPillRightSection: {
        right: spacing.sm,
    },
    centerSection: {
        flex: 1,
        alignItems: 'center',
        minWidth: 0,
        minHeight: 45,
        justifyContent: 'center',
    },
    centerPillCenterSection: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    titleBlock: {
        minWidth: 0,
        justifyContent: 'center',
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
        minHeight: 45,
        justifyContent: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
