import { useEffect, useMemo, useState } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, Muted } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import SonarXLogo from "@/components/SonarXLogo";
import { normalizePhoneNumber, formatPhoneDisplay } from "@/lib/phone/format";
import { readSimPhoneNumber, getCarrierInfo } from "@/lib/phone/verify";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import { getCountryCallingCode } from "libphonenumber-js";
export default function PhoneScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const buttonBackground = isDark ? colors.primary : colors.secondary;
    const buttonTextColor = isDark ? colors.background : colors.textPrimary;
    const buttonFont = typography.fontFamily.semiBold;
    const [phoneNumber, setPhoneNumber] = useState("");
    const [countryCode, setCountryCode] = useState("US");
    const [detectedNumber, setDetectedNumber] = useState(null);
    const [isValid, setIsValid] = useState(false);
    const [error, setError] = useState(null);
    const [isPrefilling, setIsPrefilling] = useState(false);
    const callingCode = useMemo(() => {
        try {
            return `+${getCountryCallingCode(countryCode)}`;
        }
        catch {
            return "+1";
        }
    }, [countryCode]);
    useEffect(() => {
        async function checkSimNumber() {
            setIsPrefilling(true);
            try {
                const carrierInfo = await getCarrierInfo();
                const resolvedCountryCode = carrierInfo.isoCountryCode
                    ? carrierInfo.isoCountryCode.toUpperCase()
                    : countryCode;
                if (resolvedCountryCode) {
                    setCountryCode(resolvedCountryCode);
                }
                const simNumber = await readSimPhoneNumber();
                if (simNumber) {
                    const normalized = normalizePhoneNumber(simNumber, resolvedCountryCode);
                    const finalNormalized = normalized ?? normalizePhoneNumber(simNumber, countryCode);
                    if (finalNormalized) {
                        setDetectedNumber(finalNormalized);
                        setPhoneNumber(formatPhoneDisplay(finalNormalized));
                    }
                }
            }
            catch {
                // ignore pre-fill errors; user can still continue manually
            }
            finally {
                setIsPrefilling(false);
            }
        }
        checkSimNumber();
    }, []);
    useEffect(() => {
        const normalized = normalizePhoneNumber(phoneNumber, countryCode);
        const validDigits = phoneNumber.replace(/\D/g, "").length === 10;
        setIsValid(!!normalized && validDigits);
        if (normalized) {
            setError(null);
        }
    }, [phoneNumber, countryCode]);
    const handleContinue = () => {
        if (phoneNumber.replace(/\D/g, "").length !== 10) {
            setError("Phone number must be 10 digits");
            return;
        }
        const normalized = normalizePhoneNumber(phoneNumber, countryCode);
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
            setError(null);
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
          <View className="flex-1 justify-between">
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
                  Step 1 of 2
                </Text>
                <H1 style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.bold,
                }}>Your Phone Number</H1>
                <Muted className="mt-2" style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.sm,
                }}>
                  This becomes your permanent ID.
                  No one else can use it.
                </Muted>
              </View>

              <View className="space-y-4">
                <Text style={{
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.sm,
                  marginBottom: 8,
                }}>
                  Phone Number
                </Text>
                <View className="flex-row items-center">
                  <View className="rounded-lg border px-3 py-2.5 mr-2" style={{
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    minWidth: 84,
                  }}>
                    <Text style={{
                      color: colors.textPrimary,
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                    }}>
                      {callingCode}
                    </Text>
                  </View>
                  <Input
                    containerClassName="flex-1"
                    label=""
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={(value) => {
                      setPhoneNumber(value);
                      setError(null);
                    }}
                    style={{
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.md,
                      borderColor: colors.border,
                    }}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    error={error || undefined}
                  />
                </View>
              </View>

              {detectedNumber && (<View className="rounded-xl border border-emerald-500 p-3" style={{ backgroundColor: colors.successMuted, borderColor: colors.success }}>
                  <View className="flex-row items-start">
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginRight: 10, marginTop: 2 }}/>
                    <View className="flex-1">
                      <Text className="text-sm" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.regular }}>
                        Detected from your SIM:
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }}>
                        {formatPhoneDisplay(detectedNumber)}
                      </Text>
                    </View>
                  </View>
                  <Button variant="ghost" size="sm" onPress={handleUseDetectedNumber} className="mt-2">
                    Use this number
                  </Button>
                </View>)}

              {Platform.OS === "ios" && !detectedNumber && (<View className="rounded-xl border p-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle-outline" size={16} color={colors.textPrimary} style={{ marginRight: 10, marginTop: 2 }}/>
                    <Text className="text-sm" style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.regular }}>
                      We'll use the number you enter. Make sure it matches your
                      SIM.
                    </Text>
                  </View>
                </View>)}
            </View>

            <View>
              <Button
                size="lg"
                variant="ghost"
                style={{ backgroundColor: buttonBackground }}
                onPress={handleContinue}
                disabled={!isValid}
                isLoading={isPrefilling}
                className="w-full"
              >
                <View className="flex-row justify-between items-center w-full">
                  <Text style={{
                    color: buttonTextColor,
                    fontFamily: buttonFont,
                    fontSize: typography.fontSize.md,
                  }}>Continue</Text>
                  <Ionicons name="arrow-forward-outline" size={18} color={buttonTextColor}/>
                </View>
              </Button>
              <View style={{ height: 13 }} />
              <Muted className="text-center text-xs px-4" style={{
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
                marginBottom: 5,
              }}>
                By continuing, this number will be your unique identity and is used to connect you with others.
              </Muted>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>);
}

