import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/src/theme/ThemeProvider";
import { typography, spacing } from "@/src/theme/tokens";
import { db } from "@/db/client";
import { peers } from "@/db/schema";
import { addContactModalStyles } from "@/src/theme/screenStyles";
export default function AddContactModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const canSave = phone.trim().length > 5 && name.trim().length > 0;
  const fieldTextStyles = {
    label: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    input: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.regular,
    },
    title: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semiBold,
    },
    muted: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    headerAction: {
      color: canSave ? colors.accent : colors.textDisabled,
      fontFamily: typography.fontFamily.semiBold,
    },
    cancelAction: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
  };
  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const existing = await db.query.peers.findFirst({
        where: (p, { eq }) => eq(p.id, phone.trim()),
      });
      if (existing) {
        Alert.alert(
          "Contact exists",
          "A contact with this number already exists.",
        );
        return;
      }
      await db
        .insert(peers)
        .values({
          id: phone.trim(),
          displayName: name.trim(),
          publicKey: "",
          signingPublicKey: "",
          avatarUri: null,
          lastSeen: null,
          addedAt: new Date(),
        })
        .onConflictDoNothing();
      router.back();
    } catch (e) {
      console.error("[AddContact]", e);
      Alert.alert("Error", "Could not save contact.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <View style={addContactModalStyles.root}>
      <StatusBar style={colors.statusBarStyle} />

      {/* Backdrop — tap to dismiss */}
      <Pressable
        style={[
          addContactModalStyles.backdrop,
          { backgroundColor: colors.overlay },
        ]}
        onPress={() => router.back()}
      />

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            addContactModalStyles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.xl),
            },
          ]}
        >
          {/* Handle */}
          <View
            style={[
              addContactModalStyles.handle,
              { backgroundColor: colors.border },
            ]}
          />

          {/* Sheet header */}
          <View
            style={[
              addContactModalStyles.sheetHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable
              onPress={() => router.back()}
              style={addContactModalStyles.headerBtn}
              hitSlop={10}
              accessibilityLabel="Cancel"
            >
              <Text
                style={[
                  addContactModalStyles.headerBtnText,
                  fieldTextStyles.cancelAction,
                ]}
              >
                Cancel
              </Text>
            </Pressable>

            <Text
              style={[addContactModalStyles.sheetTitle, fieldTextStyles.title]}
            >
              New Contact
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={!canSave || saving}
              style={addContactModalStyles.headerBtn}
              hitSlop={10}
              accessibilityLabel="Save contact"
            >
              <Text
                style={[
                  addContactModalStyles.headerBtnText,
                  fieldTextStyles.headerAction,
                ]}
              >
                {saving ? "Saving…" : "Save"}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={addContactModalStyles.body}
          >
            {/* Avatar placeholder */}
            <View
              style={[
                addContactModalStyles.avatarPlaceholder,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Ionicons name="person" size={36} color={colors.textDisabled} />
            </View>

            {/* Form fields */}
            <View
              style={[
                addContactModalStyles.fieldGroup,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  addContactModalStyles.field,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    addContactModalStyles.fieldLabel,
                    fieldTextStyles.label,
                  ]}
                >
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Full name"
                  placeholderTextColor={colors.textDisabled}
                  style={[
                    addContactModalStyles.fieldInput,
                    fieldTextStyles.input,
                  ]}
                  autoFocus
                  returnKeyType="next"
                />
              </View>

              <View style={addContactModalStyles.field}>
                <Text
                  style={[
                    addContactModalStyles.fieldLabel,
                    fieldTextStyles.label,
                  ]}
                >
                  Phone
                </Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={colors.textDisabled}
                  style={[
                    addContactModalStyles.fieldInput,
                    fieldTextStyles.input,
                  ]}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                />
              </View>
            </View>

            <Text style={[addContactModalStyles.hint, fieldTextStyles.muted]}>
              The contact will be saved locally on your device.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
