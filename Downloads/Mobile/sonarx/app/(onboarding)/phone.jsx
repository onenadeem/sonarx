import { useEffect, useMemo, useState } from "react";
import { View, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { H1, Muted, Text } from "@/src/components/common/Typography";
import Button from "@/src/components/ui/Button";
import TextInput from "@/src/components/ui/TextInput";
import SonarXLogo from "@/components/SonarXLogo";
import { normalizePhoneNumber, formatPhoneDisplay } from "@/lib/phone/format";
import { readSimPhoneNumber, getCarrierInfo } from "@/lib/phone/verify";
import { useTheme } from "@/src/theme/ThemeProvider";
import { spacing, typography } from "@/src/theme/tokens";
import { getCountryCallingCode } from "libphonenumber-js";
import { ROUTES } from "@/src/constants/routes";

export default function PhoneScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [detectedNumber, setDetectedNumber] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState(null);
  const [isPrefilling, setIsPrefilling] = useState(false);

  const callingCode = useMemo(() => {
    try {
      return `+${getCountryCallingCode(countryCode)}`;
    } catch {
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
      } catch {
        // ignore pre-fill errors; user can still continue manually
      } finally {
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
      pathname: ROUTES.ONBOARDING_PROFILE,
      params: { phoneNumber: normalized },
    });
  };

  const handleUseDetectedNumber = () => {
    if (detectedNumber) {
      setPhoneNumber(formatPhoneDisplay(detectedNumber));
      setError(null);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.flex}
      >
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
                <Text style={[styles.appName, { color: colors.textPrimary }]}>resonar</Text>
              </View>
              <Text style={[styles.stepBadge, { color: colors.textSecondary }]}>Step 1 of 2</Text>
              <H1 style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.bold }}>
                Your Phone Number
              </H1>
              <Muted style={{ marginTop: spacing.xs, fontSize: typography.fontSize.sm }}>
                This becomes your permanent ID. No one else can use it.
              </Muted>
            </View>

            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={[styles.codePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.codeText, { color: colors.textPrimary }]}>{callingCode}</Text>
                </View>
                <View style={styles.flex}>
                  <TextInput
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChangeText={(value) => {
                      setPhoneNumber(value);
                      setError(null);
                    }}
                    inputStyle={{
                      color: colors.textPrimary,
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.md,
                    }}
                    inputWrapperStyle={{
                      backgroundColor: colors.surface,
                      borderColor: error ? colors.danger : colors.border,
                      height: 44,
                    }}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    error={error || undefined}
                  />
                </View>
              </View>
            </View>

            {detectedNumber && (
              <View style={[styles.simCard, { backgroundColor: colors.successMuted, borderColor: colors.success }]}>
                <View style={styles.simRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                  <View style={styles.flex}>
                    <Text style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm }}>
                      Detected from your SIM:
                    </Text>
                    <Text style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold, fontSize: typography.fontSize.sm }}>
                      {formatPhoneDisplay(detectedNumber)}
                    </Text>
                  </View>
                </View>
                <Button variant="ghost" size="sm" onPress={handleUseDetectedNumber}>
                  Use this number
                </Button>
              </View>
            )}

            {Platform.OS === "ios" && !detectedNumber && (
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.simRow}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textPrimary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
                  <Text style={{ color: colors.textPrimary, fontFamily: typography.fontFamily.regular, fontSize: typography.fontSize.sm, flex: 1 }}>
                    We'll use the number you enter. Make sure it matches your SIM.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomArea}>
        <Button
          text="Continue"
          icon="arrow-forward-outline"
          iconPosition="right"
          size="md"
          fullWidth
          onPress={handleContinue}
          disabled={!isValid}
          isLoading={isPrefilling}
        />
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          By continuing, this number will be your unique identity and is used to connect you with others.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  top: { gap: 15, paddingHorizontal: spacing.md, paddingTop: spacing.md },
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
  fieldSection: { gap: spacing.sm },
  fieldLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  phoneRow: { flexDirection: "row", alignItems: "center" },
  codePill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    minWidth: 84,
    justifyContent: "center",
    alignItems: "center",
    height: 44,
  },
  codeText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
  },
  simCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.sm,
  },
  simRow: { flexDirection: "row", alignItems: "flex-start" },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.sm,
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
