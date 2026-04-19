import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/src/theme/ThemeProvider'
import { typography, spacing, borderRadius } from '@/src/theme/tokens'
import { db } from '@/db/client'
import { peers } from '@/db/schema'

export default function AddContactModal() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, isDark } = useTheme()
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const canSave = phone.trim().length > 5 && name.trim().length > 0

  const handleSave = async () => {
    if (!canSave || saving) return
    setSaving(true)
    try {
      const existing = await db.query.peers.findFirst({
        where: (p, { eq }) => eq(p.id, phone.trim()),
      })
      if (existing) {
        Alert.alert('Contact exists', 'A contact with this number already exists.')
        return
      }
      await db.insert(peers).values({
        id: phone.trim(),
        displayName: name.trim(),
        publicKey: '',
        signingPublicKey: '',
        avatarUri: null,
        lastSeen: null,
        addedAt: new Date(),
      }).onConflictDoNothing()
      router.back()
    } catch (e) {
      console.error('[AddContact]', e)
      Alert.alert('Error', 'Could not save contact.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.cancelBtn} hitSlop={8}>
          <Text style={[styles.cancelText, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
            Cancel
          </Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold }]}>
          New Contact
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={styles.saveBtn}
          hitSlop={8}
        >
          <Text style={[
            styles.saveText,
            { fontFamily: typography.fontFamily.semiBold },
            canSave ? { color: colors.accent } : { color: colors.textDisabled },
          ]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.form, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="person" size={40} color={colors.textDisabled} />
        </View>

        <View style={[styles.fieldGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textDisabled}
              style={[styles.fieldInput, { color: colors.textPrimary, fontFamily: typography.fontFamily.regular }]}
              autoFocus
              returnKeyType="next"
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: typography.fontFamily.regular }]}>
              Phone
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              placeholderTextColor={colors.textDisabled}
              style={[styles.fieldInput, { color: colors.textPrimary, fontFamily: typography.fontFamily.regular }]}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: { minWidth: 60 },
  saveBtn: { minWidth: 60, alignItems: 'flex-end' },
  cancelText: { fontSize: 16 },
  title: { fontSize: 17 },
  saveText: { fontSize: 16 },
  form: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    gap: spacing.xl,
    alignItems: 'stretch',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
    minHeight: 48,
  },
  fieldLabel: {
    width: 60,
    fontSize: 15,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
})
