import React, {
  Component,
  useCallback,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'
import { HEADER_HEIGHT } from '@/src/constants/layout'
import { useIdentityStore } from '@/stores/identity.store'
import { useLocalNotification } from '@/src/hooks/useLocalNotification'
import AnimatedPressable from '@/src/components/ui/Pressable'
import Avatar from '@/src/components/ui/Avatar'
import Divider from '@/src/components/ui/Divider'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class SettingsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SettingsScreen]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>
      )
    }
    return this.props.children
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: string
  iconColor?: string
  label: string
  value?: string
  onPress?: () => void
  rightElement?: ReactNode
  showChevron?: boolean
}

function SettingRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  rightElement,
  showChevron = true,
}: SettingRowProps) {
  const { colors } = useTheme()

  const inner = (
    <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.accentMuted }]}>
        <Ionicons
          name={icon as never}
          size={18}
          color={iconColor ?? colors.accent}
        />
      </View>
      <Text
        style={[
          styles.settingLabel,
          { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value !== undefined && (
          <Text
            style={[
              styles.settingValue,
              { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
            ]}
          >
            {value}
          </Text>
        )}
        {rightElement}
        {showChevron && onPress !== undefined && (
          <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
        )}
      </View>
    </View>
  )

  if (!onPress) return inner

  return (
    <AnimatedPressable onPress={onPress} haptic hapticType="light">
      {inner}
    </AnimatedPressable>
  )
}

interface SectionGroupProps {
  title: string
  children: ReactNode
}

function SectionGroup({ title, children }: SectionGroupProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.textSecondary, fontFamily: typography.fontFamily.semiBold },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.borderMuted },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

type ThemeMode = 'light' | 'dark' | 'system'

// ─── Main Screen ──────────────────────────────────────────────────────────────

function SettingsScreenInner() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const identity = useIdentityStore((state) => state.identity)
  const updateProfile = useIdentityStore((state) => state.updateProfile)
  const { isPermissionGranted } = useLocalNotification()

  const [notificationsEnabled, setNotificationsEnabled] = useState(isPermissionGranted)
  const [messagePreview, setMessagePreview] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState(identity?.displayName ?? '')

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'

  const handleAvatarPress = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      updateProfile({ avatarUri: result.assets[0].uri })
    }
  }, [updateProfile])

  const handleSaveName = useCallback(() => {
    const trimmed = nameValue.trim()
    if (trimmed.length > 0) {
      updateProfile({ displayName: trimmed })
    }
    setEditingName(false)
  }, [nameValue, updateProfile])

  const handleClearCache = useCallback(() => {
    Alert.alert(
      Strings.settings.clearCache,
      Strings.settings.clearCacheConfirm,
      [
        { text: Strings.settings.cancel, style: 'cancel' },
        {
          text: Strings.settings.clearCacheConfirmBtn,
          style: 'destructive',
          onPress: () => {
            // Clear message cache action
          },
        },
      ],
    )
  }, [])

  const themeOptions = undefined // unused — theme follows system setting

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: 'transparent',
            height: HEADER_HEIGHT,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.bold },
          ]}
        >
          {Strings.settings.title}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Section */}
        <SectionGroup title={Strings.settings.profile}>
          {/* Avatar */}
          <View style={[styles.profileAvatarRow, { backgroundColor: colors.surface }]}>
            <AnimatedPressable
              onPress={handleAvatarPress}
              haptic
              hapticType="medium"
              accessibilityLabel="Change profile photo"
            >
              <View>
                <Avatar
                  uri={identity?.avatarUri}
                  name={identity?.displayName ?? 'Me'}
                  size="lg"
                />
                <View
                  style={[
                    styles.avatarEditBadge,
                    { backgroundColor: colors.accent, borderColor: colors.surface },
                  ]}
                >
                  <Ionicons name="camera" size={10} color={colors.accentForeground} />
                </View>
              </View>
            </AnimatedPressable>
            <View style={styles.profileInfo}>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[
                      styles.nameInput,
                      {
                        color: colors.textPrimary,
                        borderColor: colors.accent,
                        fontFamily: typography.fontFamily.semiBold,
                        backgroundColor: colors.surfaceMuted,
                      },
                    ]}
                    value={nameValue}
                    onChangeText={setNameValue}
                    onBlur={handleSaveName}
                    onSubmitEditing={handleSaveName}
                    autoFocus
                    returnKeyType="done"
                    maxLength={40}
                  />
                </View>
              ) : (
                <AnimatedPressable onPress={() => setEditingName(true)} haptic>
                  <View style={styles.nameRow}>
                    <Text
                      style={[
                        styles.profileName,
                        {
                          color: colors.textPrimary,
                          fontFamily: typography.fontFamily.semiBold,
                        },
                      ]}
                    >
                      {identity?.displayName ?? 'Your Name'}
                    </Text>
                    <Ionicons name="pencil" size={14} color={colors.textDisabled} />
                  </View>
                </AnimatedPressable>
              )}
              <Text
                style={[
                  styles.profilePhone,
                  { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
                ]}
              >
                {identity?.phoneNumber ?? '—'}
              </Text>
            </View>
          </View>
        </SectionGroup>

        {/* Notifications Section */}
        <SectionGroup title={Strings.settings.notifications}>
          <SettingRow
            icon="notifications-outline"
            label={Strings.settings.enableNotifications}
            showChevron={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.accentForeground}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="eye-outline"
            label={Strings.settings.messagePreview}
            showChevron={false}
            rightElement={
              <Switch
                value={messagePreview}
                onValueChange={setMessagePreview}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.accentForeground}
              />
            }
          />
        </SectionGroup>

        {/* Storage Section */}
        <SectionGroup title={Strings.settings.storage}>
          <SettingRow
            icon="trash-outline"
            iconColor={colors.danger}
            label={Strings.settings.clearCache}
            onPress={handleClearCache}
          />
        </SectionGroup>

        {/* About Section */}
        <SectionGroup title={Strings.settings.about}>
          <SettingRow
            icon="information-circle-outline"
            label={Strings.settings.version}
            value={appVersion}
            showChevron={false}
          />
          <Divider />
          <SettingRow
            icon="document-text-outline"
            label={Strings.settings.licenses}
            onPress={() => {}}
          />
        </SectionGroup>
      </ScrollView>
    </View>
  )
}

export default function SettingsScreen() {
  return (
    <SettingsErrorBoundary>
      <SettingsScreenInner />
    </SettingsErrorBoundary>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    gap: spacing.xxs,
  },
  section: {
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
  },
  sectionCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  profileAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  profileName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: -0.2,
  },
  profilePhone: {
    fontSize: typography.fontSize.sm,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  nameInput: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 50,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    flex: 1,
    fontSize: typography.fontSize.md,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingValue: {
    fontSize: typography.fontSize.sm,
  },
  segmentedRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm - 1,
  },
  segmentBtnActive: {},
  segmentLabel: {
    fontSize: typography.fontSize.sm,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.md,
  },
})
