import React, {
  Component,
  useCallback,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import Constants from 'expo-constants'
import Avatar from '@/src/components/ui/Avatar'
import Button from '@/src/components/ui/Button'
import Header from '@/src/components/ui/Header'
import ListItem from '@/src/components/ui/ListItem'
import TextInput from '@/src/components/ui/TextInput'
import ToggleSwitch from '@/src/components/ui/ToggleSwitch'
import AnimatedPressable from '@/src/components/ui/Pressable'
import { useLocalNotification } from '@/src/hooks/useLocalNotification'
import { useResponsive } from '@/src/hooks/useResponsive'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, spacing, typography } from '@/src/theme/tokens'
import { useIdentityStore } from '@/stores/identity.store'
import { Strings } from '@/src/constants/strings'

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

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const { colors } = useTheme()

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.semiBold,
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.sectionBody,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

function ThemeSegment({
  mode,
  currentMode,
  onPress,
}: {
  mode: 'light' | 'dark' | 'system'
  currentMode: 'light' | 'dark' | 'system'
  onPress: () => void
}) {
  const { colors } = useTheme()
  const active = mode === currentMode
  const iconName =
    mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait-outline'
  const label = mode[0].toUpperCase() + mode.slice(1)

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityLabel={`Set ${mode} theme`}
      style={[
        styles.themeTab,
        active && { backgroundColor: colors.primary },
      ]}
    >
      <Ionicons
        name={iconName as never}
        size={16}
        color={active ? colors.background : colors.textSecondary}
      />
      <Text
        style={[
          styles.themeTabLabel,
          {
            color: active ? colors.background : colors.textSecondary,
            fontFamily: active
              ? typography.fontFamily.semiBold
              : typography.fontFamily.regular,
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

function SettingsScreenInner() {
  const { colors, mode, setMode } = useTheme()
  const insets = useSafeAreaInsets()
  const { isDesktop } = useResponsive()
  const identity = useIdentityStore((state) => state.identity)
  const clearIdentity = useIdentityStore((state) => state.clearIdentity)
  const updateProfile = useIdentityStore((state) => state.updateProfile)
  const { isPermissionGranted } = useLocalNotification()

  const [notificationsEnabled, setNotificationsEnabled] = useState(isPermissionGranted)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [messagePreview, setMessagePreview] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState(identity?.displayName ?? '')

  const appVersion = Constants.expoConfig?.version ?? '1.0.0'
  const buildNumber = String(Constants.nativeBuildVersion ?? '42')
  const contentMaxWidth = isDesktop ? 500 : undefined

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
    const trimmed = displayName.trim()
    if (trimmed.length > 0) {
      updateProfile({ displayName: trimmed })
    }
    setEditingName(false)
  }, [displayName, updateProfile])

  const handleClearCache = useCallback(() => {
    Alert.alert(
      Strings.settings.clearCache,
      Strings.settings.clearCacheConfirm,
      [
        { text: Strings.settings.cancel, style: 'cancel' },
        { text: Strings.settings.clearCacheConfirmBtn, style: 'destructive' },
      ],
    )
  }, [])

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: Strings.common.cancel, style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => clearIdentity(),
      },
    ])
  }, [clearIdentity])

  const storageValue = useMemo(() => 'Encrypted cache', [])

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      <View
        style={[
          styles.contentShell,
          contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
        ]}
      >
        <Header title="Settings" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: insets.bottom + spacing.xxl,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
          }}
        >
          <View style={styles.profileCard}>
            <AnimatedPressable
              onPress={handleAvatarPress}
              style={styles.avatarButton}
              accessibilityLabel="Change profile picture"
            >
              <Avatar
                uri={identity?.avatarUri}
                name={identity?.displayName ?? 'Shaik'}
                size="xl"
              />
            </AnimatedPressable>

            {editingName ? (
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                onSubmitEditing={handleSaveName}
                onBlur={handleSaveName}
                autoFocus
                placeholder="Display name"
                containerStyle={styles.nameInputContainer}
              />
            ) : (
              <Text
                style={[
                  styles.profileName,
                  {
                    color: colors.textPrimary,
                    fontFamily: typography.fontFamily.semiBold,
                  },
                ]}
              >
                {identity?.displayName ?? 'Your profile'}
              </Text>
            )}

            <Text
              style={[
                styles.profilePhone,
                {
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
            >
              {identity?.phoneNumber ?? 'No phone linked'}
            </Text>

            <Button
              text={editingName ? 'Save profile' : 'Edit profile'}
              variant="secondary"
              onPress={editingName ? handleSaveName : () => setEditingName(true)}
              style={styles.editProfileButton}
            />
          </View>

          <Section title="Account">
            <ListItem
              title="Change phone"
              subtitle="Update your linked phone number"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Verify phone"
              subtitle="Confirm your number is reachable"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Delete account"
              subtitle="Permanently remove all your data"
              titleStyle={{ color: colors.danger }}
              divider={false}
            />
          </Section>

          <Section title="Notifications">
            <ListItem
              title="Message notifications"
              subtitle="Get alerted when new messages arrive"
              trailing={
                <ToggleSwitch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              }
            />
            <ListItem
              title="Sound"
              subtitle="Play a sound for new messages"
              trailing={<ToggleSwitch value={soundEnabled} onValueChange={setSoundEnabled} />}
            />
            <ListItem
              title="Vibration"
              subtitle="Vibrate on incoming messages"
              trailing={
                <ToggleSwitch
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                />
              }
            />
            <ListItem
              title="Show previews"
              subtitle="Display message content in notifications"
              trailing={
                <ToggleSwitch
                  value={messagePreview}
                  onValueChange={setMessagePreview}
                />
              }
              divider={false}
            />
          </Section>

          <Section title="Privacy & Security">
            <ListItem
              title="Encryption"
              subtitle="All messages are end-to-end encrypted"
              trailing={<Ionicons name="lock-closed-outline" size={18} color={colors.accent} />}
            />
            <ListItem
              title="Blocked contacts"
              subtitle="Manage people you've blocked"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Data deletion"
              subtitle="Request removal of your stored data"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Two-factor authentication"
              subtitle="Add an extra layer of login security"
              trailing={
                <ToggleSwitch
                  value={twoFactorEnabled}
                  onValueChange={setTwoFactorEnabled}
                />
              }
              divider={false}
            />
          </Section>

          <Section title="App">
            <View style={[styles.themeTabContainer, { backgroundColor: colors.surfaceMuted }]}>
              <ThemeSegment mode="light" currentMode={mode} onPress={() => setMode('light')} />
              <ThemeSegment mode="dark" currentMode={mode} onPress={() => setMode('dark')} />
              <ThemeSegment mode="system" currentMode={mode} onPress={() => setMode('system')} />
            </View>
            <ListItem
              title="Language"
              subtitle="English — tap to change"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Storage"
              subtitle={storageValue}
              trailing={
                <Button
                  text="Clear cache"
                  size="sm"
                  variant="secondary"
                  onPress={handleClearCache}
                />
              }
            />
            <ListItem
              title="Auto-backup"
              subtitle="Automatically back up your chats"
              trailing={
                <ToggleSwitch
                  value={autoBackupEnabled}
                  onValueChange={setAutoBackupEnabled}
                />
              }
              divider={false}
            />
          </Section>

          <Section title="About">
            <ListItem title="Version" subtitle={appVersion} />
            <ListItem title="Build" subtitle={buildNumber} />
            <ListItem
              title="Terms of service"
              subtitle="Read our usage terms"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="Privacy policy"
              subtitle="How we handle your data"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
            />
            <ListItem
              title="License"
              subtitle="Open-source licenses used in this app"
              trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled} />}
              divider={false}
            />
          </Section>

          <Button
            text="Logout"
            variant="danger"
            size="lg"
            fullWidth
            onPress={handleLogout}
            style={styles.logoutButton}
          />
        </ScrollView>
      </View>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatarButton: {
    marginBottom: spacing.lg,
    paddingHorizontal: 0,
  },
  nameInputContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  profileName: {
    ...typography.h3,
    textAlign: 'center',
  },
  profilePhone: {
    ...typography.caption,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  editProfileButton: {
    width: 140,
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  sectionBody: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeTabContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 3,
    margin: spacing.md,
  },
  themeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  themeTabLabel: {
    fontSize: typography.fontSize.sm,
  },
  logoutButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
  },
})
