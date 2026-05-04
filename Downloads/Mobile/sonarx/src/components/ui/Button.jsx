import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography, spacing, borderRadius } from '@/src/theme/tokens';

const SIZE_CONFIG = {
  sm: { minHeight: 40, paddingH: 12, paddingV: 9, fontSize: 12, iconSize: 16 },
  md: { minHeight: 44, paddingH: 12, paddingV: 10, fontSize: 14, iconSize: 18 },
  lg: { minHeight: 48, paddingH: 16, paddingV: 12, fontSize: 16, iconSize: 20 },
};

const VARIANT_STYLES = {
  primary: {
    backgroundColorKey: 'primary',
    borderColor: 'transparent',
    textColorKey: 'primaryForeground',
    iconColorKey: 'primaryForeground',
  },
  secondary: {
    backgroundColorKey: 'surface',
    borderColorKey: 'border',
    textColorKey: 'textPrimary',
    iconColorKey: 'textSecondary',
  },
  outline: {
    backgroundColorKey: null,
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

export default function Button({
  text,
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading,
  isLoading,
  disabled = false,
  fullWidth = false,
  rounded = false,
  children,
  style,
  contentJustify = 'center',
  paddingV,
}) {
  const { colors } = useTheme();
  const config = SIZE_CONFIG[size];
  const isLoadingResolved = loading ?? isLoading ?? false;
  const isDisabled = disabled || isLoadingResolved;
  const buttonText = text ?? label ?? '';
  const vs = getVariantStyle(colors, variant);
  const resolvedRadius = rounded ? borderRadius.full : RESOLVED_RADIUS[size] ?? RESOLVED_RADIUS.default;

  const renderIcon = () => {
    if (!icon || React.isValidElement(icon)) return icon ?? null;
    return <Ionicons name={icon} size={config.iconSize} color={vs.iconColor} />;
  };

  const hasVisibleBorder = vs.borderColor && vs.borderColor !== 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[{ alignSelf: fullWidth ? 'stretch' : 'flex-start', opacity: isDisabled ? 0.6 : 1 }, style]}
    >
      <View
        style={{
          minHeight: config.minHeight,
          paddingHorizontal: config.paddingH,
          paddingVertical: paddingV ?? config.paddingV,
          backgroundColor: vs.backgroundColor,
          borderColor: vs.borderColor,
          borderWidth: hasVisibleBorder ? 1 : 0,
          borderRadius: resolvedRadius,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {isLoadingResolved ? (
          <ActivityIndicator size="small" color={vs.textColor} />
        ) : children ? (
          children
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: contentJustify, flex: contentJustify === 'space-between' ? 1 : undefined }}>
            {icon && iconPosition === 'left' && (
              <View style={{ marginRight: spacing.xs }}>{renderIcon()}</View>
            )}
            {buttonText ? (
              <Text
                style={{
                  fontSize: config.fontSize,
                  color: vs.textColor,
                  fontFamily: typography.fontFamily.semiBold,
                  fontWeight: '600',
                  includeFontPadding: false,
                }}
              >
                {buttonText}
              </Text>
            ) : null}
            {icon && iconPosition === 'right' && (
              <View style={{ marginLeft: spacing.xs }}>{renderIcon()}</View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}
