import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography, spacing, borderRadius } from '@/src/theme/tokens';
import AnimatedPressable from './Pressable';
const SIZE_CONFIG = {
    sm: { minHeight: 40, paddingH: 12, paddingV: 9, fontSize: 12, iconSize: 16 },
    md: { minHeight: 44, paddingH: 12, paddingV: 10, fontSize: 14, iconSize: 18 },
    lg: { minHeight: 48, paddingH: 16, paddingV: 12, fontSize: 16, iconSize: 20 },
};
const VARIANT_STYLES = {
    primary: {
        backgroundColorKey: 'accent',
        borderColor: 'transparent',
        textColorKey: 'accentForeground',
        iconColorKey: 'accentForeground',
    },
    secondary: {
        backgroundColorKey: 'surface',
        borderColorKey: 'border',
        textColorKey: 'textPrimary',
        iconColorKey: 'textSecondary',
    },
    ghost: {
        backgroundColorKey: null,
        borderColor: 'transparent',
        textColorKey: 'accent',
        iconColorKey: 'accent',
    },
    danger: {
        backgroundColorKey: 'danger',
        borderColor: 'transparent',
        textColor: '#ffffff',
    },
};
const RESOLVED_RADIUS = {
    lg: 12,
    default: 8,
};
const getVariantStyle = (colors, variant) => {
    const config = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary;
    return {
        backgroundColor: config.backgroundColorKey ? colors[config.backgroundColorKey] : 'transparent',
        borderColor: config.borderColorKey ? colors[config.borderColorKey] : config.borderColor,
        textColor: config.textColorKey ? colors[config.textColorKey] : config.textColor,
        iconColor: config.iconColorKey ? colors[config.iconColorKey] : config.textColor,
    };
};
export default function Button({ text, label, onPress, variant = 'primary', size = 'md', icon, iconPosition = 'left', loading = false, disabled = false, fullWidth = false, rounded = false, style, }) {
    const { colors } = useTheme();
    const config = SIZE_CONFIG[size];
    const isDisabled = disabled || loading;
    const buttonText = text ?? label ?? '';
    const vs = getVariantStyle(colors, variant);
    const resolvedRadius = rounded ? borderRadius.full : RESOLVED_RADIUS[size] ?? RESOLVED_RADIUS.default;
    const renderIcon = () => {
        if (!icon || React.isValidElement(icon))
            return icon ?? null;
        return (<Ionicons name={icon} size={config.iconSize} color={vs.iconColor}/>);
    };
    return (<AnimatedPressable onPress={onPress} disabled={isDisabled} haptic hapticType="light" style={[
            styles.base,
            {
                minHeight: config.minHeight,
                paddingHorizontal: config.paddingH,
                paddingVertical: config.paddingV,
                backgroundColor: vs.backgroundColor,
                borderColor: vs.borderColor,
                borderRadius: resolvedRadius,
                opacity: isDisabled ? 0.6 : 1,
                alignSelf: fullWidth ? 'stretch' : 'flex-start',
            },
            style,
        ]}>
      <View style={styles.inner}>
        {loading ? (<ActivityIndicator size="small" color={vs.textColor} style={styles.spinner}/>) : (<>
            {icon && iconPosition === 'left' && (<View style={styles.iconLeft}>{renderIcon()}</View>)}
            <Text style={[
                styles.label,
                {
                    fontSize: config.fontSize,
                    color: vs.textColor,
                    fontFamily: typography.fontFamily.semiBold,
                    fontWeight: '600',
                },
            ]}>
              {buttonText}
            </Text>
            {icon && iconPosition === 'right' && (<View style={styles.iconRight}>{renderIcon()}</View>)}
          </>)}
      </View>
    </AnimatedPressable>);
}
const styles = StyleSheet.create({
    base: {
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        includeFontPadding: false,
    },
    iconLeft: {
        marginRight: spacing.xs,
    },
    iconRight: {
        marginLeft: spacing.xs,
    },
    spinner: {
        marginHorizontal: spacing.sm,
    },
});
