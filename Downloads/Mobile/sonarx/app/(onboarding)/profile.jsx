import { useState } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { H1, Muted, Text } from "@/src/components/common/Typography";
import Button from "@/src/components/ui/Button";
import TextInput from "@/src/components/ui/TextInput";
import Avatar from "@/src/components/ui/Avatar";
import { createIdentity } from "@/lib/identity";
import SonarXLogo from "@/components/SonarXLogo";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import { ROUTES } from "@/src/constants/routes";

export default function ProfileScreen() {
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams();
  const { colors } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError("Camera permission is required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleCreateIdentity = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }
    if (!phoneNumber) {
      setError("Phone number is missing");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await createIdentity({
        phoneNumber,
        displayName: displayName.trim(),
        avatarUri: avatarUri || undefined,
      });
      router.replace(ROUTES.TABS_CHATS);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create identity",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.top}>
            <View style={styles.headerArea}>
              <View style={styles.logoRow}>
                <SonarXLogo size={32} />
                <Text style={[styles.appName, { color: colors.textPrimary }]}>
                  resonar
                </Text>
              </View>
              <Text style={[styles.stepBadge, { color: colors.textSecondary }]}>
                Step 2 of 2
              </Text>
              <H1
                style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.bold,
                }}
              >
                Create Your Profile
              </H1>
              <Muted
                style={{
                  marginTop: spacing.xs,
                  fontSize: typography.fontSize.sm,
                }}
              >
                Choose a display name and optional profile photo
              </Muted>
            </View>

            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                {avatarUri ? (
                  <Avatar
                    uri={avatarUri}
                    name={displayName || "?"}
                    size={180}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={60}
                      color={colors.textSecondary}
                    />
                  </View>
                )}
                {avatarUri && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setAvatarUri(null)}
                    style={styles.removeAvatarBtn}
                  >
                    <Text
                      style={[
                        styles.removeAvatarText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      X
                    </Text>
                  </Button>
                )}
              </View>
              <View style={styles.imageButtons}>
                <Button
                  variant="secondary"
                  size="md"
                  onPress={handlePickImage}
                  style={styles.imageBtn}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="folder-outline"
                      size={16}
                      color={colors.textPrimary}
                      style={{ marginRight: spacing.xs }}
                    />
                    <Text
                      style={[
                        styles.imageBtnText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Gallery
                    </Text>
                  </View>
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onPress={handleTakePhoto}
                  style={styles.imageBtn}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={16}
                      color={colors.textPrimary}
                      style={{ marginRight: spacing.xs }}
                    />
                    <Text
                      style={[
                        styles.imageBtnText,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Camera
                    </Text>
                  </View>
                </Button>
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                Display Name
              </Text>
              <TextInput
                placeholder="Enter your name"
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setError(null);
                }}
                maxLength={50}
                error={error || undefined}
                inputStyle={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.md,
                }}
                inputWrapperStyle={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
                placeholderTextColor={colors.textSecondary}
              />
              <Muted style={styles.hint}>
                This name will be visible to your contacts. You can change it
                later in settings.
              </Muted>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomArea}>
        <Button
          text="Create Identity"
          icon="arrow-forward-outline"
          iconPosition="right"
          size="md"
          fullWidth
          onPress={handleCreateIdentity}
          isLoading={isLoading}
          disabled={!displayName.trim()}
        />
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          Your profile is created and stored on your device only. Number is used
          to connect you with others.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  top: { gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  headerArea: { alignItems: "flex-start" },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  appName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xxl,
    marginTop: -spacing.xs,
  },
  stepBadge: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  avatarSection: { alignItems: "center" },
  avatarWrapper: { position: "relative" },
  avatarPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  removeAvatarBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    minHeight: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  removeAvatarText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md,
  },
  imageButtons: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  imageBtn: { flex: 1, height: 42 },
  imageBtnText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  fieldSection: { gap: spacing.sm },
  fieldLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: typography.fontSize.xs,
  },
  bottomArea: {
    paddingHorizontal: spacing.md,
  },
  disclaimer: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: 10,
  },
};
