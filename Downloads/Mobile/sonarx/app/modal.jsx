import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView, } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography, spacing, borderRadius } from '@/src/theme/tokens';
import { db } from '@/db/client';
import { peers } from '@/db/schema';
export default function AddContactModal() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors, isDark } = useTheme();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const canSave = phone.trim().length > 5 && name.trim().length > 0;
    const handleSave = async () => {
        if (!canSave || saving)
            return;
        setSaving(true);
        try {
            const existing = await db.query.peers.findFirst({
                where: (p, { eq }) => eq(p.id, phone.trim()),
            });
            if (existing) {
                Alert.alert('Contact exists', 'A contact with this number already exists.');
                return;
            }
            await db.insert(peers).values({
                id: phone.trim(),
                displayName: name.trim(),
                publicKey: '',
                signingPublicKey: '',
                avatarUri: null,
                lastSeen: null,
                addedAt: new Date(),
            }).onConflictDoNothing();
            router.back();
        }
        catch (e) {
            console.error('[AddContact]', e);
            Alert.alert('Error', 'Could not save contact.');
        }
        finally {
            setSaving(false);
        }
    };
    return (<View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'}/>

      {/* Backdrop — tap to dismiss */}
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={() => router.back()}/>

      {/* Sheet */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <View style={[
            styles.sheet,
            {
                backgroundColor: colors.background,
                paddingBottom: Math.max(insets.bottom, spacing.xl),
            },
        ]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]}/>

          {/* Sheet header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => router.back()} style={styles.headerBtn} hitSlop={10} accessibilityLabel="Cancel">
              <Text style={[
            styles.headerBtnText,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}>
                Cancel
              </Text>
            </Pressable>

            <Text style={[
            styles.sheetTitle,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
        ]}>
              New Contact
            </Text>

            <Pressable onPress={handleSave} disabled={!canSave || saving} style={styles.headerBtn} hitSlop={10} accessibilityLabel="Save contact">
              <Text style={[
            styles.headerBtnText,
            {
                fontFamily: typography.fontFamily.semiBold,
                color: canSave ? colors.accent : colors.textDisabled,
            },
        ]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Avatar placeholder */}
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
              <Ionicons name="person" size={36} color={colors.textDisabled}/>
            </View>

            {/* Form fields */}
            <View style={[
            styles.fieldGroup,
            { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
              <View style={[styles.field, { borderBottomColor: colors.border }]}>
                <Text style={[
            styles.fieldLabel,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}>
                  Name
                </Text>
                <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={colors.textDisabled} style={[
            styles.fieldInput,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
        ]} autoFocus returnKeyType="next"/>
              </View>

              <View style={styles.field}>
                <Text style={[
            styles.fieldLabel,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}>
                  Phone
                </Text>
                <TextInput value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" placeholderTextColor={colors.textDisabled} style={[
            styles.fieldInput,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
        ]} keyboardType="phone-pad" returnKeyType="done" onSubmitEditing={handleSave}/>
              </View>
            </View>

            <Text style={[
            styles.hint,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}>
              The contact will be saved locally on your device.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>);
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    keyboardView: {
    // Sits above the backdrop
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerBtn: {
        minWidth: 64,
    },
    headerBtnText: {
        fontSize: 16,
    },
    sheetTitle: {
        fontSize: 17,
        textAlign: 'center',
        flex: 1,
    },
    body: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.lg,
        gap: spacing.xl,
        alignItems: 'stretch',
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fieldGroup: {
        borderRadius: borderRadius.md,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: spacing.sm,
        minHeight: 50,
    },
    fieldLabel: {
        width: 56,
        fontSize: 15,
    },
    fieldInput: {
        flex: 1,
        fontSize: 15,
        paddingVertical: 0,
    },
    hint: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});
