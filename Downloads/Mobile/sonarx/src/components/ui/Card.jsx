
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing, } from '@/src/theme/tokens';
export default function Card({ children, bordered = true, padding = spacing.lg, style, }) {
    const { colors } = useTheme();
    return (<View style={[
            styles.card,
            {
                backgroundColor: colors.surface,
                borderColor: bordered ? colors.border : 'transparent',
                padding,
            },
            style,
        ]}>
      {children}
    </View>);
}
const styles = StyleSheet.create({
    card: {
        borderRadius: borderRadius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        // Subtle shadow matching Claude's clean aesthetic
        shadowColor: '#1A1917',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
});
