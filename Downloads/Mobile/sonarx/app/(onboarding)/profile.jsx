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
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
export default function ProfileScreen() {
    const router = useRouter();
    const { phoneNumber } = useLocalSearchParams();
    const colorScheme = useColorScheme();
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
    return (<SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView className="flex-1 px-6 py-8" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="items-center mb-8">
            <Text className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Step 2 of 2
            </Text>
            <H1 className="text-center mt-2">Create Your Profile</H1>
            <Muted className="text-center mt-2">
              Choose a display name and optional profile photo
            </Muted>
          </View>

          <View className="items-center mb-8">
            <View className="relative">
              <Avatar uri={avatarUri} name={displayName || "?"} size="lg"/>
              {avatarUri && (<Button variant="destructive" size="icon" onPress={() => setAvatarUri(null)} className="absolute -top-1 -right-1 w-6 h-6">
                  <Text className="text-xs text-destructive-foreground">×</Text>
                </Button>)}
            </View>
            <View className="flex-row mt-4 space-x-2">
              <Button variant="outline" size="sm" onPress={handlePickImage}>
                <Ionicons name="folder-outline" size={16} color={Colors[colorScheme].text}/>
                <Text className="ml-2">Gallery</Text>
              </Button>
              <Button variant="outline" size="sm" onPress={handleTakePhoto}>
                <Ionicons name="camera-outline" size={16} color={Colors[colorScheme].text}/>
                <Text className="ml-2">Camera</Text>
              </Button>
            </View>
          </View>

          <View className="space-y-4">
            <Input label="Display Name" placeholder="Enter your name" value={displayName} onChangeText={setDisplayName} maxLength={50} error={error || undefined}/>

            <Muted className="text-xs">
              This name will be visible to your contacts. You can change it
              later in settings.
            </Muted>
          </View>

          <View className="flex-1"/>

          <Button size="lg" onPress={handleCreateIdentity} isLoading={isLoading} disabled={!displayName.trim()} className="w-full">
            Create Identity
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>);
}
