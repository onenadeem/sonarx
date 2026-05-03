import React, { Component, useCallback, useMemo, useRef, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Button from '@/src/components/ui/Button';
import Header from '@/src/components/ui/Header';
import ListItem from '@/src/components/ui/ListItem';
import TextInput from '@/src/components/ui/TextInput';
import ToggleSwitch from '@/src/components/ui/ToggleSwitch';
import AnimatedPressable from '@/src/components/ui/Pressable';
import Avatar from '@/src/components/ui/Avatar';
import AvatarPickerSheet from '@/components/AvatarPickerSheet';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useTheme } from '@/src/theme/ThemeProvider';
import { borderRadius, spacing, typography } from '@/src/theme/tokens';
import { useIdentityStore } from '@/stores/identity.store';
import { Strings } from '@/src/constants/strings';
import { SETTINGS_SCREEN_MAX_WIDTH } from '@/src/constants/layout';

const THEME_OPTIONS = [
    { mode: 'light', icon: 'sunny-outline', label: 'Light' },
    { mode: 'dark', icon: 'moon-outline', label: 'Dark' },
    { mode: 'system', icon: 'phone-portrait-outline', label: 'System' },
];

const PROFILE_DARK_IMAGE = require('../../assets/images/profile-dark.png');
const PROFILE_LIGHT_IMAGE = require('../../assets/images/profile-light.png');

class SettingsErrorBoundary extends Component {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('[SettingsScreen]', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (<View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>);
        }
        return this.props.children;
    }
}

function Section({ title, subtitle, children, style }) {
    const { colors } = useTheme();
    const titleStyle = useMemo(() => ([
        styles.sectionTitle,
        {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
        },
    ]), [colors.textPrimary]);
    const subtitleStyle = useMemo(() => ([
        styles.sectionSubtitle,
        {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
            marginBottom: spacing.lg,
            marginTop: -spacing.xs,
        },
    ]), [colors.textSecondary]);
    const bodyStyle = useMemo(() => ([
        styles.sectionBody,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
        },
    ]), [colors.border, colors.surface]);
    return (<View style={[
        styles.section,
        style,
    ]}>
      <Text style={titleStyle}>
        {title.toUpperCase()}
      </Text>
      {subtitle ? (<Text style={subtitleStyle}>
        {subtitle}
      </Text>) : null}
      <View style={bodyStyle}>
        {children}
      </View>
    </View>);
}

function ThemePicker({ currentMode, onSelect }) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const bottomSheetModalRef = useRef(null);
    const currentLabel = THEME_OPTIONS.find((o) => o.mode === currentMode)?.label ?? 'System';

    const handleOpen = useCallback(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    const handleSelect = useCallback((mode) => {
        onSelect(mode);
        bottomSheetModalRef.current?.dismiss();
    }, [onSelect]);

    return (<>
        <ListItem title="Appearance" subtitle={`${currentLabel} mode`} trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} onPress={handleOpen} dividerInset={0}/>
        <BottomSheetModal
            ref={bottomSheetModalRef}
            snapPoints={['42%']}
            enablePanDownToClose
            backgroundStyle={{ backgroundColor: colors.surface }}
            handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
            backdropComponent={(props) => (
                <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
            )}
        >
            <BottomSheetView style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.md }}>
                <Text style={{
                    fontFamily: typography.fontFamily.bold,
                    fontSize: typography.fontSize.lg,
                    color: colors.textPrimary,
                    marginBottom: spacing.xs,
                }}>
                    Appearance
                </Text>
                <Text style={{
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.fontSize.sm,
                    color: colors.textSecondary,
                    marginBottom: spacing.lg,
                }}>
                    Choose how resonar looks to you
                </Text>
                <View style={{ gap: spacing.sm }}>
                    {THEME_OPTIONS.map(({ mode, icon, label }) => {
                        const active = mode === currentMode;
                        const bg = active ? colors.primary : colors.surface;
                        const border = active ? colors.primary : colors.border;
                        const fg = active ? colors.primaryForeground : colors.textPrimary;
                        return (<AnimatedPressable key={mode} onPress={() => handleSelect(mode)} accessibilityLabel={`Set ${mode} theme`} style={[
                                styles.themeOption,
                                { backgroundColor: bg, borderColor: border },
                            ]}>
                            <View style={{                                     backgroundColor: active ? bg : 'transparent',
flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, padding: spacing.md, borderRadius: borderRadius.md }}>
                                <Ionicons name={icon} size={18} color={fg} />
                                <Text style={{
                                    marginLeft: spacing.sm,
                                    color: fg,
                                    fontFamily: typography.fontFamily.semiBold,
                                    fontSize: typography.fontSize.md,
                                }}>
                                    {label}
                                </Text>
                            </View>
                        </AnimatedPressable>);
                    })}
                </View>
            </BottomSheetView>
        </BottomSheetModal>
    </>);
}

function SettingsScreenInner() {
    const { colors, isDark, mode, setMode } = useTheme();
    const { isDesktop } = useResponsive();
    const identity = useIdentityStore((state) => state.identity);
    const updateProfile = useIdentityStore((state) => state.updateProfile);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [vibrationEnabled, setVibrationEnabled] = useState(true);
    const [messagePreview, setMessagePreview] = useState(true);
    const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(identity?.displayName ?? '');
    const avatarSheetRef = useRef(null);
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    const contentMaxWidth = isDesktop ? SETTINGS_SCREEN_MAX_WIDTH : undefined;
    const profileImageSource = useMemo(() => (isDark ? PROFILE_LIGHT_IMAGE : PROFILE_DARK_IMAGE), [isDark]);

    const handleSaveName = useCallback(() => {
        const trimmed = displayName.trim();
        if (trimmed.length > 0) {
            updateProfile({ displayName: trimmed });
        }
        setEditingName(false);
    }, [displayName, updateProfile]);

    const handleStartEditName = useCallback(() => {
        setDisplayName(identity?.displayName ?? '');
        setEditingName(true);
    }, [identity?.displayName]);

    const handleClearCache = useCallback(() => {
        Alert.alert(Strings.settings.clearCache, Strings.settings.clearCacheConfirm, [
            { text: Strings.settings.cancel, style: 'cancel' },
            { text: Strings.settings.clearCacheConfirmBtn, style: 'destructive' },
        ]);
    }, []);

    const handleAvatarPicked = useCallback((uri) => {
        updateProfile({ avatarUri: uri });
    }, [updateProfile]);

    const handleOpenAvatarSheet = useCallback(() => {
        avatarSheetRef.current?.present();
    }, []);

    const storageValue = 'Encrypted cache';
    const screenStyle = useMemo(() => ({
        backgroundColor: colors.background,
    }), [colors.background]);

    const contentShellStyle = useMemo(() => (contentMaxWidth
        ? [styles.contentShell, { maxWidth: contentMaxWidth }]
        : [styles.contentShell]), [contentMaxWidth]);

    const scrollContentStyle = useMemo(() => ({
        paddingBottom: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    }), []);

    const accountSectionBodyStyle = useMemo(() => ([
        styles.sectionBody,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
        },
    ]), [colors.border, colors.surface]);

    const accountLabelStyle = useMemo(() => ([
        styles.sectionTitle,
        {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
            marginBottom: spacing.md,
        },
    ]), [colors.textPrimary]);

    const accountProfileName = identity?.displayName?.trim() || 'Your profile';
    const accountPhoneNumber = identity?.phoneNumber || 'No phone linked';

    const accountBubbleStyle = useMemo(() => ([
        styles.accountBubble,
        {
            backgroundColor: colors.surface,
            borderColor: colors.border,
        },
    ]), [colors.surface, colors.border]);

    const accountBubbleNameStyle = useMemo(() => ([
        styles.accountBubbleText,
        {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
        },
    ]), [colors.textPrimary]);

    const accountBubbleLabelStyle = useMemo(() => ([
        styles.accountBubbleLabel,
        {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
        },
    ]), [colors.textSecondary]);

    const accountBubblePhoneStyle = useMemo(() => ([
        styles.accountBubbleText,
        {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
        },
    ]), [colors.textPrimary]);

    const editNameSectionStyle = useMemo(() => ([
        styles.editNameSection,
        {
            borderColor: colors.border,
        },
    ]), [colors.border]);

    const deleteAccountTitleStyle = useMemo(() => ({
        color: colors.danger,
    }), [colors.danger]);

    return (<SafeAreaView edges={['top', 'left', 'right']} style={[
            styles.screen,
            screenStyle,
        ]}>
      <View style={contentShellStyle}>
        <Header title="Settings" subtitle="Manage your account and preferences" titleAlign="start" titlePaddingHorizontal={spacing.lg} style={{ paddingHorizontal: 3 }}/>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={scrollContentStyle}>
          <View style={styles.accountHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={accountLabelStyle}>ACCOUNT DETAILS</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Profile image, display name, and phone details</Text>
            </View>
            <Pressable onPress={handleOpenAvatarSheet} style={styles.avatarPressable}>
              <Avatar uri={identity?.avatarUri} name={accountProfileName} size={44} />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileImageColumn}>
              <Image source={profileImageSource} style={styles.profileImage} resizeMode="contain"/>
            </View>
            <View style={styles.accountBubblesColumn}>
              <View style={accountBubbleStyle}>
                <Text style={accountBubbleLabelStyle}>
                  Name
                </Text>
                <Text style={accountBubbleNameStyle}>
                  {accountProfileName}
                </Text>
              </View>
              <View style={accountBubbleStyle}>
                <Text style={accountBubbleLabelStyle}>
                  Mobile
                </Text>
                <Text style={accountBubblePhoneStyle}>
                  {accountPhoneNumber}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={accountSectionBodyStyle}>
              {editingName ? (<View style={editNameSectionStyle}>
                  <TextInput value={displayName} onChangeText={setDisplayName} onSubmitEditing={handleSaveName} onBlur={handleSaveName} autoFocus placeholder="Display name" containerStyle={styles.nameInputContainer}/>
                  <Button text="Save name" size="sm" variant="secondary" onPress={handleSaveName}/>
                </View>) : (<ListItem title="Edit name" subtitle={accountProfileName} trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} onPress={handleStartEditName} dividerInset={0}/>)}

              <ListItem title="Change phone number" subtitle={accountPhoneNumber} trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} dividerInset={0}/>
            <ListItem title="Verify phone" subtitle="Confirm your number is reachable" trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} dividerInset={0}/>
            <ListItem title="Delete account" subtitle="Permanently remove all your data" titleStyle={deleteAccountTitleStyle} divider={false} dividerInset={0}/>
            </View>
          </View>

          <Section title="Notifications" subtitle="Manage alerts for messages and updates">
            <ListItem title="Message notifications" subtitle="Get alerted when new messages arrive" trailing={<ToggleSwitch value={notificationsEnabled} onValueChange={setNotificationsEnabled}/>} dividerInset={0}/>
            <ListItem title="Sound" subtitle="Play a sound for new messages" trailing={<ToggleSwitch value={soundEnabled} onValueChange={setSoundEnabled}/>} dividerInset={0}/>
            <ListItem title="Vibration" subtitle="Vibrate on incoming messages" trailing={<ToggleSwitch value={vibrationEnabled} onValueChange={setVibrationEnabled}/>} dividerInset={0}/>
            <ListItem title="Show previews" subtitle="Display message content in notifications" trailing={<ToggleSwitch value={messagePreview} onValueChange={setMessagePreview}/>} divider={false} dividerInset={0}/>
          </Section>

          <Section title="Privacy & Security" subtitle="Control how your account and messages stay secure">
            <ListItem title="Encryption" subtitle="All messages are end-to-end encrypted" trailing={<Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary}/>} dividerInset={0}/>
            <ListItem title="Blocked contacts" subtitle="Manage people you've blocked" trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} dividerInset={0}/>
            <ListItem title="Data deletion" subtitle="Request removal of your stored data" trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} divider={false} dividerInset={0}/>
          </Section>

          <Section title="App" subtitle="Customize app preferences and storage">
            <ThemePicker currentMode={mode} onSelect={setMode}/>
            <ListItem title="Storage" subtitle={storageValue} trailing={<Button text="Clear cache" size="sm" variant="secondary" onPress={handleClearCache}/>} dividerInset={0}/>
            <ListItem title="Auto-backup" subtitle="Automatically back up your chats" trailing={<ToggleSwitch value={autoBackupEnabled} onValueChange={setAutoBackupEnabled}/>} divider={false} dividerInset={0}/>
          </Section>

            <Section title="About" subtitle="Version details, legal terms, and policies" style={{ marginBottom: 0 }}>
            <ListItem title="Version" subtitle={appVersion} dividerInset={0}/>
            <ListItem title="Terms of service" subtitle="Read our usage terms" trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} dividerInset={0}/>
            <ListItem title="Privacy policy" subtitle="How we handle your data" trailing={<Ionicons name="chevron-forward" size={18} color={colors.textDisabled}/>} divider={false} dividerInset={0}/>
          </Section>
        </ScrollView>
      </View>
      <AvatarPickerSheet ref={avatarSheetRef} onImagePicked={handleAvatarPicked} />
    </SafeAreaView>);
}

export default function SettingsScreen() {
    return (<SettingsErrorBoundary>
      <SettingsScreenInner />
    </SettingsErrorBoundary>);
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
    accountHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    avatarPressable: {
        marginLeft: spacing.sm,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        marginBottom: 0,
    },
    profileImageColumn: {
        width: '60%',
    },
    profileImage: {
        width: '100%',
        height: 200,
    },
    accountBubblesColumn: {
        width: '40%',
        flexDirection: 'column',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    accountBubble: {
        paddingHorizontal: spacing.sm + 8,
        paddingVertical: spacing.xs + 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: borderRadius.lg,
        width: '100%',
        alignSelf: 'stretch',
    },
    accountBubbleText: {
        ...typography.caption,
        lineHeight: 16,
    },
    accountBubbleLabel: {
        ...typography.caption,
        lineHeight: 14,
        marginBottom: 2,
    },
    nameInputContainer: {
        width: '100%',
        marginBottom: spacing.sm,
    },
    editNameSection: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        backgroundColor: 'transparent',
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        ...typography.label,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    sectionSubtitle: {
        ...typography.caption,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
        marginTop: -spacing.sm
    },
    sectionBody: {
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    themeOptionLabel: {
        fontSize: typography.fontSize.md,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        ...typography.body,
    },
});
