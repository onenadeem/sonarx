import { useState } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { createIdentity } from "@/lib/identity";
import SonarXLogo from "@/components/SonarXLogo";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
export default function ProfileScreen() {
    const router = useRouter();
    const { phoneNumber } = useLocalSearchParams();
    const { colors, isDark } = useTheme();
    const buttonBackground = isDark ? colors.primary : colors.secondary;
    const buttonTextColor = isDark ? colors.background : colors.textPrimary;
    const buttonFont = typography.fontFamily.semiBold;
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
            router.replace("/(tabs)/chats");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create identity");
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: spacing.lg,
          }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          <View className="flex-1 justify-between pt-4">
            <View className="space-y-8">
              <View className="items-start">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <SonarXLogo size={32}/>
                  <Text style={{
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.bold,
                    fontSize: typography.fontSize.xxl,
                    marginTop: -spacing.xs,
                  }}>resonar</Text>
                </View>
                <Text className="text-xs my-2" style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  Step 2 of 2
                </Text>
                <H1 style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.bold,
                }}>Create Your Profile</H1>
                <Muted className="mt-2" style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.sm,
                  marginBottom: spacing.lg,
                }}>
                  Choose a display name and optional profile photo
                </Muted>
              </View>

              <View className="items-center mb-8">
                <View className="relative">
                  <Avatar uri={avatarUri} name={displayName || "?"} size={180} color={colors}/>
                  {avatarUri && (<Button variant="ghost" size="icon" onPress={() => setAvatarUri(null)} className="absolute -top-1 -right-1 w-6 h-6">
                      <Text style={{
                      color: colors.textPrimary,
                      fontFamily: typography.fontFamily.semiBold,
                    }}>×</Text>
                    </Button>)}
                </View>
                <View className="flex-row mt-4" style={{ gap: spacing.sm, paddingVertical: spacing.sm }}>
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="md"
                    onPress={handlePickImage}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, height: 42 }}
                  >
                    <Ionicons name="folder-outline" size={16} color={colors.textPrimary}/>
                    <Text style={{
                      marginLeft: 8,
                      color: colors.textPrimary,
                      fontFamily: typography.fontFamily.semiBold,
                    }}>Gallery</Text>
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="md"
                    onPress={handleTakePhoto}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, height: 42 }}
                  >
                    <Ionicons name="camera-outline" size={16} color={colors.textPrimary}/>
                    <Text style={{
                      marginLeft: 8,
                      color: colors.textPrimary,
                      fontFamily: typography.fontFamily.semiBold,
                    }}>Camera</Text>
                  </Button>
                </View>
              </View>

              <View className="space-y-4">
                <Text style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.sm,
                  marginBottom: 8,
                }}>
                  Display Name
                </Text>
                <Input
                  label=""
                  containerClassName="w-full"
                  placeholder="Enter your name"
                  value={displayName}
                  onChangeText={(value) => {
                    setDisplayName(value);
                    setError(null);
                  }}
                  maxLength={50}
                  error={error || undefined}
                  style={{
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    marginBottom: 10,
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.fontSize.md,
                  }}
                  placeholderTextColor={colors.textSecondary}
                />
                <Muted className="text-xs" style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                }}>
                  This name will be visible to your contacts. You can change it
                  later in settings.
                </Muted>
              </View>
            </View>

            <View>
              <Button
                size="lg"
                variant="ghost"
                style={{ backgroundColor: buttonBackground }}
                onPress={handleCreateIdentity}
                isLoading={isLoading}
                disabled={!displayName.trim()}
                className="w-full"
              >
                <View className="flex-row justify-between items-center w-full">
                  <Text style={{
                    color: buttonTextColor,
                    fontFamily: buttonFont,
                    fontSize: typography.fontSize.md,
                  }}>Create Identity</Text>
                  <Ionicons name="arrow-forward-outline" size={18} color={buttonTextColor}/>
                </View>
              </Button>
              <View style={{ height: 13 }} />
              <Muted className="text-center text-xs px-4" style={{
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
                marginBottom: 5,
              }}>
                Your profile is created and stored on your device only.
              </Muted>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>);
}
