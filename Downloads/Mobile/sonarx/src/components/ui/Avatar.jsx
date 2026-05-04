
import { StyleSheet, Text, View, } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/tokens';
const DEFAULT_SELECTED_BORDER_WIDTH = 2;
const MIN_BADGE_SIZE = 8;
const BADGE_POSITION_OFFSET = 1;
const DEFAULT_BG = '#e5e7eb';
const INITIALS_COLOR = '#ffffff';
const MIN_INITIAL_FONT_SIZE = 12;
const SIZE_MAP = {
    xs: 32,
    sm: 40,
    md: 48,
    lg: 56,
    xl: 64,
};
const FALLBACK_COLORS = ['#7AAEC8', '#5B9AB8', '#4A8BAA', '#3D7A9A', '#6BA0BC'];
const resolveBorderStyle = (colors, selected) => ({
    borderColor: selected ? colors.accent : 'transparent',
    borderWidth: selected ? DEFAULT_SELECTED_BORDER_WIDTH : 0,
});
function getColorFromName(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
        hash &= hash;
    }
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.trim().charAt(0).toUpperCase();
}
export default function Avatar({ uri, name, size = 'md', showOnlineBadge = false, isOnline = false, style, }) {
    const { colors } = useTheme();
    const dimension = typeof size === 'number' ? size : SIZE_MAP[size];
    const initialsSize = Math.max(MIN_INITIAL_FONT_SIZE, Math.round(dimension * 0.34));
    const initials = getInitials(name);
    const badgeSize = Math.max(MIN_BADGE_SIZE, Math.round(dimension * 0.25));
    return (<View style={[styles.container, style]}>
      {uri ? (<Image source={{ uri }} style={[
                styles.avatar,
                {
                    width: dimension,
                    height: dimension,
                    borderRadius: dimension / 2,
                    borderWidth: StyleSheet.hairlineWidth,
                },
            ]} contentFit="cover"/>) : (<View style={[
                styles.avatar,
                {
                    width: dimension,
                    height: dimension,
                    borderRadius: dimension / 2,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                },
            ]}>
          <Text style={[
                styles.initials,
                {
                    fontSize: initialsSize,
                },
            ]}>
            {initials}
          </Text>
        </View>)}

      {showOnlineBadge ? (<View style={[
                styles.badge,
                {
                    width: badgeSize,
                    height: badgeSize,
                    borderRadius: badgeSize / 2,
                    backgroundColor: isOnline ? colors.online : colors.border,
                    borderColor: colors.background,
                    right: BADGE_POSITION_OFFSET,
                    bottom: BADGE_POSITION_OFFSET,
                },
            ]}/>) : null}
    </View>);
}
const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignSelf: 'flex-start',
    },
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: DEFAULT_BG,
    },
    initials: {
        color: INITIALS_COLOR,
        fontFamily: typography.fontFamily.semiBold,
        fontWeight: '600',
    },
    badge: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        borderWidth: 2,
    },
});
