import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";

export default function NotFoundScreen() {
    const { colors } = useTheme();
    const styles = makeStyles(colors);
    return (
      <>
        <Stack.Screen options={{ title: "Oops!" }} />
        <View style={styles.container}>
          <Text style={styles.title}>This screen doesn't exist.</Text>
          <Link href="/" style={styles.link}>
            <Text style={styles.linkText}>Go to home screen!</Text>
          </Link>
        </View>
      </>
    );
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: typography.fontSize.xl,
      fontFamily: typography.fontFamily.bold,
      color: colors.textPrimary,
    },
    link: {
      marginTop: spacing.md,
      paddingVertical: spacing.md,
    },
    linkText: {
      fontSize: typography.fontSize.md,
      fontFamily: typography.fontFamily.semiBold,
      color: colors.accent,
    },
  });
}
