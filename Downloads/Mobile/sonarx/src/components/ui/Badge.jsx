
import { StyleSheet, Text, View, } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography, spacing } from '@/src/theme/tokens';
export default function Badge({ count, max = 99, tone = 'accent', style, textStyle, }) {
    const { colors } = useTheme();
    if (count === 0)
        return null;
    const label = count > max ? `${max}+` : String(count);
    return (<View style={[
            styles.badge,
            { backgroundColor: tone === 'error' ? colors.danger : colors.accent },
            style,
        ]}>
      <Text style={[styles.text, { color: colors.accentForeground }, textStyle]}>
        {label}
      </Text>
    </View>);
}
const styles = StyleSheet.create({
    badge: {
        minWidth: 20,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: spacing.xs,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 10,
        fontFamily: typography.fontFamily.semiBold,
        fontWeight: typography.fontWeight.semiBold,
        lineHeight: 12,
    },
});
