import { useState, useEffect } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { normalizePhoneNumber, formatPhoneDisplay } from "@/lib/phone/format";
import { readSimPhoneNumber, getCarrierInfo } from "@/lib/phone/verify";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function PhoneScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [detectedNumber, setDetectedNumber] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSimNumber() {
      const carrierInfo = await getCarrierInfo();
      if (carrierInfo.isoCountryCode) {
        setCountryCode(carrierInfo.isoCountryCode.toUpperCase());
      }

      const simNumber = await readSimPhoneNumber();
      if (simNumber) {
        setDetectedNumber(simNumber);
        setPhoneNumber(formatPhoneDisplay(simNumber));
        setIsValid(true);
      }
    }

    checkSimNumber();
  }, []);

  useEffect(() => {
    const normalized = normalizePhoneNumber(phoneNumber, countryCode as any);
    setIsValid(!!normalized);
    if (normalized) {
      setError(null);
    }
  }, [phoneNumber, countryCode]);

  const handleContinue = () => {
    const normalized = normalizePhoneNumber(phoneNumber, countryCode as any);
    if (!normalized) {
      setError("Please enter a valid phone number");
      return;
    }

    router.push({
      pathname: "/(onboarding)/profile",
      params: { phoneNumber: normalized },
    });
  };

  const handleUseDetectedNumber = () => {
    if (detectedNumber) {
      setPhoneNumber(formatPhoneDisplay(detectedNumber));
      setIsValid(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6 py-8"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-4">
              <Ionicons
                name="phone-portrait-outline"
                size={28}
                color={Colors[colorScheme].text}
              />
            </View>
            <H1 className="text-center">Your Phone Number</H1>
            <Text className="text-xs tracking-[0.2em] text-muted-foreground mt-2 uppercase">
              Step 1 of 2
            </Text>
            <Muted className="text-center mt-2">
              This becomes your permanent ID.{"\n"}No one else can use it.
            </Muted>
          </View>

          <View className="space-y-4">
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              error={error || undefined}
            />

            {detectedNumber && (
              <View className="bg-secondary rounded-xl border border-border p-3">
                <View className="flex-row items-center">
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={Colors[colorScheme].text}
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-sm text-foreground">
                    Detected from your SIM: {formatPhoneDisplay(detectedNumber)}
                  </Text>
                </View>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={handleUseDetectedNumber}
                  className="mt-2"
                >
                  Use this number
                </Button>
              </View>
            )}

            {Platform.OS === "ios" && !detectedNumber && (
              <View className="bg-secondary rounded-xl border border-border p-3">
                <View className="flex-row items-start">
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={Colors[colorScheme].text}
                    style={{ marginRight: 6, marginTop: 2 }}
                  />
                  <Text className="text-sm text-foreground">
                    We'll use the number you enter. Make sure it matches your
                    SIM.
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="flex-1" />

          <Button
            size="lg"
            onPress={handleContinue}
            disabled={!isValid}
            className="w-full"
          >
            Continue →
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
