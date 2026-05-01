
import { Platform, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/tokens';
import { TabNavigator } from './TabNavigator';
// ─── Placeholder screens ──────────────────────────────────────────────────────
function CallPlaceholder() {
    const { colors } = useTheme();
    return (<View style={[styles.placeholder, { backgroundColor: colors.background }]}>
      <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
        Call Screen
      </Text>
    </View>);
}
const Stack = createNativeStackNavigator();
// ─── Component ────────────────────────────────────────────────────────────────
export function StackNavigator() {
    const { colors } = useTheme();
    return (<Stack.Navigator screenOptions={{
            headerShown: false,
            animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
            headerStyle: {
                backgroundColor: colors.headerBackground,
            },
            headerTintColor: colors.accent,
            headerTitleStyle: {
                fontFamily: typography.fontFamily.semiBold,
                fontSize: typography.fontSize.lg,
                color: colors.textPrimary,
            },
            headerShadowVisible: false,
            contentStyle: {
                backgroundColor: colors.background,
            },
        }}>
      <Stack.Screen name="Tabs" component={TabNavigator}/>
      {/* Chat screen is provided by the app's expo-router app/chat/[peerId].tsx */}
      <Stack.Screen name="Call" component={CallPlaceholder} options={{ animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right' }}/>
    </Stack.Navigator>);
}
const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: typography.fontSize.lg,
        fontFamily: typography.fontFamily.regular,
        fontWeight: typography.fontWeight.regular,
    },
});
