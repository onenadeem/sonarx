import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Constants from "expo-constants";
import { deleteDatabaseAsync } from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { usePreventRemove } from "@react-navigation/native";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { eq } from "drizzle-orm";
import { usePeersStore } from "@/src/store/peersStore";
import { useCallStore } from "@/src/store/callStore";
import { useMessagesStore } from "@/src/store/messagesStore";
import { useContactsStore } from "@/src/store/contactsStore";
import { usePresenceStore } from "@/src/store/presenceStore";
import { db, closeDatabase } from "@/db/client";
import { conversations, messages, attachments, peers } from "@/db/schema";
import Button from "@/src/components/ui/Button";
import Header from "@/src/components/ui/Header";
import ListItem from "@/src/components/ui/ListItem";
import TextInput from "@/src/components/ui/TextInput";
import ToggleSwitch from "@/src/components/ui/ToggleSwitch";
import AnimatedPressable from "@/src/components/ui/Pressable";
import Avatar from "@/src/components/ui/Avatar";
import AvatarPickerSheet from "@/components/AvatarPickerSheet";
import { useResponsive } from "@/src/hooks/useResponsive";
import { useScrollToTop } from "@/src/hooks/useScrollToTop";
import { useTheme } from "@/src/theme/ThemeProvider";
import { borderRadius, spacing, typography } from "@/src/theme/tokens";
import { useIdentityStore } from "@/src/store/identityStore";
import { Strings } from "@/src/constants/strings";
import { SETTINGS_SCREEN_MAX_WIDTH } from "@/src/constants/layout";

const THEME_OPTIONS = [
  { mode: "light", icon: "sunny-outline", label: "Light" },
  { mode: "dark", icon: "moon-outline", label: "Dark" },
  { mode: "system", icon: "phone-portrait-outline", label: "System" },
];

const PROFILE_DARK_IMAGE = require("../../assets/images/profile-dark.png");
const PROFILE_LIGHT_IMAGE = require("../../assets/images/profile-light.png");

class SettingsErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("[SettingsScreen]", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{Strings.common.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function Section({ title, subtitle, children, style }) {
  const { colors } = useTheme();
  const titleStyle = useMemo(
    () => [
      styles.sectionTitle,
      {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
      },
    ],
    [colors.textPrimary],
  );
  const subtitleStyle = useMemo(
    () => [
      styles.sectionSubtitle,
      {
        color: colors.textSecondary,
        fontFamily: typography.fontFamily.regular,
        marginBottom: spacing.lg,
      },
    ],
    [colors.textSecondary],
  );
  const bodyStyle = useMemo(
    () => [
      styles.sectionBody,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
      },
    ],
    [colors.border, colors.surface],
  );
  return (
    <View style={[styles.section, style]}>
      <Text style={titleStyle}>{title}</Text>
      {subtitle ? <Text style={subtitleStyle}>{subtitle}</Text> : null}
      <View style={bodyStyle}>{children}</View>
    </View>
  );
}

function PolicySection({ title, children }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.fontSize.md,
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function BulletPoint({ text }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", marginBottom: spacing.xs }}>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSize.sm,
          marginRight: spacing.sm,
        }}
      >
        •
      </Text>
      <Text
        style={{
          flex: 1,
          color: colors.textSecondary,
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.fontSize.sm,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

function Paragraph({ children, bold }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        color: colors.textSecondary,
        fontFamily: bold
          ? typography.fontFamily.semiBold
          : typography.fontFamily.regular,
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.md,
      }}
    >
      {children}
    </Text>
  );
}

function ThemePicker({ currentMode, onSelect, onSheetChange }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef(null);
  const currentLabel =
    THEME_OPTIONS.find((o) => o.mode === currentMode)?.label ?? "System";

  const handleOpen = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSelect = useCallback(
    (mode) => {
      onSelect(mode);
      bottomSheetModalRef.current?.dismiss();
    },
    [onSelect],
  );

  return (
    <>
      <ListItem
        title="Appearance"
        subtitle={`${currentLabel} mode`}
        trailing={
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textDisabled}
          />
        }
        onPress={handleOpen}
        dividerInset={0}
      />
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={["42%"]}
        enablePanDownToClose
        onChange={onSheetChange}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Appearance
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            Choose how resonar looks to you
          </Text>
          <View style={{ gap: spacing.sm }}>
            {THEME_OPTIONS.map(({ mode, icon, label }) => {
              const active = mode === currentMode;
              const bg = active ? colors.primary : colors.surface;
              const border = active ? colors.primary : colors.border;
              const fg = active ? colors.primaryForeground : colors.textPrimary;
              return (
                <AnimatedPressable
                  key={mode}
                  onPress={() => handleSelect(mode)}
                  accessibilityLabel={`Set ${mode} theme`}
                  style={[
                    styles.themeOption,
                    { backgroundColor: bg, borderColor: border },
                  ]}
                >
                  <View
                    style={{
                      backgroundColor: active ? bg : "transparent",
                      flexDirection: "row",
                      alignItems: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.border,
                      padding: spacing.md,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Ionicons name={icon} size={18} color={fg} />
                    <Text
                      style={{
                        marginLeft: spacing.sm,
                        color: fg,
                        fontFamily: typography.fontFamily.semiBold,
                        fontSize: typography.fontSize.md,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

function SettingsScreenInner() {
  const { colors, isDark, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();
  const identity = useIdentityStore((state) => state.identity);
  const updateProfile = useIdentityStore((state) => state.updateProfile);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(identity?.displayName ?? "");
  const avatarSheetRef = useRef(null);
  const deleteAccountSheetRef = useRef(null);
  const clearChatsSheetRef = useRef(null);
  const clearCacheSheetRef = useRef(null);
  const termsSheetRef = useRef(null);
  const privacySheetRef = useRef(null);
  const blockedContactsSheetRef = useRef(null);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const contentMaxWidth = isDesktop ? SETTINGS_SCREEN_MAX_WIDTH : undefined;
  const scrollRef = useScrollToTop();
  const profileImageSource = useMemo(
    () => (isDark ? PROFILE_LIGHT_IMAGE : PROFILE_DARK_IMAGE),
    [isDark],
  );

  // Track active bottom sheets for back gesture handling
  const [activeSheetCount, setActiveSheetCount] = useState(0);
  const activeSheetIds = useRef(new Set());

  const makeOnChange = useCallback(
    (sheetId) => (index) => {
      setActiveSheetCount((prev) => {
        const wasOpen = activeSheetIds.current.has(sheetId);
        const isOpen = index >= 0;
        if (wasOpen && !isOpen) {
          activeSheetIds.current.delete(sheetId);
          return prev - 1;
        }
        if (!wasOpen && isOpen) {
          activeSheetIds.current.add(sheetId);
          return prev + 1;
        }
        return prev;
      });
    },
    [],
  );

  usePreventRemove(activeSheetCount > 0, () => {
    const allSheets = [
      deleteAccountSheetRef,
      clearChatsSheetRef,
      clearCacheSheetRef,
      termsSheetRef,
      privacySheetRef,
      avatarSheetRef,
      blockedContactsSheetRef,
    ];
    for (const ref of allSheets) {
      ref.current?.dismiss();
    }
  });

  // Blocked contacts data
  const { data: peerData } = useLiveQuery(
    db.query.peers.findMany({ where: eq(peers.isBlocked, true) }),
  );
  const blockedContacts = useMemo(
    () =>
      (peerData ?? []).map((p) => ({
        id: p.id,
        displayName: p.displayName,
        phoneNumber: p.id,
        avatarUri: p.avatarUri ?? null,
      })),
    [peerData],
  );

  const handleUnblockContact = useCallback(async (peerId) => {
    try {
      await db
        .update(peers)
        .set({ isBlocked: false })
        .where(eq(peers.id, peerId));
    } catch (error) {
      console.error("Failed to unblock contact:", error);
    }
  }, []);

  const handleSaveName = useCallback(() => {
    const trimmed = displayName.trim();
    if (trimmed.length > 0) {
      updateProfile({ displayName: trimmed });
    }
    setEditingName(false);
  }, [displayName, updateProfile]);

  const handleStartEditName = useCallback(() => {
    setDisplayName(identity?.displayName ?? "");
    setEditingName(true);
  }, [identity?.displayName]);

  const handleCancelEditName = useCallback(() => {
    setDisplayName(identity?.displayName ?? "");
    setEditingName(false);
  }, [identity?.displayName]);

  const handleClearCache = useCallback(() => {
    clearCacheSheetRef.current?.present();
  }, []);

  const handleConfirmClearCache = useCallback(async () => {
    try {
      clearCacheSheetRef.current?.dismiss();
      await db.delete(attachments);
      await db.delete(messages);
      useMessagesStore.setState({ messagesByChatId: {} });
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, []);

  const handleAvatarPicked = useCallback(
    (uri) => {
      updateProfile({ avatarUri: uri });
    },
    [updateProfile],
  );

  const handleOpenAvatarSheet = useCallback(() => {
    avatarSheetRef.current?.present();
  }, []);

  const handleOpenDeleteAccountSheet = useCallback(() => {
    deleteAccountSheetRef.current?.present();
  }, []);

  const handleOpenClearChatsSheet = useCallback(() => {
    clearChatsSheetRef.current?.present();
  }, []);

  const handleOpenTermsSheet = useCallback(() => {
    termsSheetRef.current?.present();
  }, []);

  const handleOpenPrivacySheet = useCallback(() => {
    privacySheetRef.current?.present();
  }, []);

  const handleOpenBlockedContactsSheet = useCallback(() => {
    blockedContactsSheetRef.current?.present();
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    try {
      deleteAccountSheetRef.current?.dismiss();

      closeDatabase();
      await deleteDatabaseAsync("resonar.db");
      await SecureStore.deleteItemAsync("identity-storage");
      await SecureStore.deleteItemAsync("resonar-secret-keys");
      await SecureStore.deleteItemAsync("resonar-signing-keys");
      await AsyncStorage.removeItem("resonar-theme-mode");

      usePeersStore.getState().clearAll();
      useCallStore.getState().clearCall();
      useMessagesStore.setState({
        messagesByChatId: {},
        chats: [],
        unreadCounts: {},
      });
      useContactsStore.setState({
        contacts: [],
        isLoading: false,
        error: null,
      });
      usePresenceStore.getState().clearAll();

      setMode("system");
      useIdentityStore.getState().clearIdentity();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  }, [setMode]);

  const handleClearAllChats = useCallback(async () => {
    try {
      clearChatsSheetRef.current?.dismiss();
      await db.delete(attachments);
      await db.delete(messages);
      await db.delete(conversations);
      useMessagesStore.setState({
        messagesByChatId: {},
        chats: [],
        unreadCounts: {},
      });
    } catch (error) {
      console.error("Failed to clear chats:", error);
    }
  }, []);

  const storageValue = "Encrypted cache";
  const screenStyle = useMemo(
    () => ({
      backgroundColor: colors.background,
    }),
    [colors.background],
  );

  const contentShellStyle = useMemo(
    () =>
      contentMaxWidth
        ? [styles.contentShell, { maxWidth: contentMaxWidth }]
        : [styles.contentShell],
    [contentMaxWidth],
  );

  const scrollContentStyle = useMemo(
    () => ({
      paddingBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    }),
    [],
  );

  const accountSectionBodyStyle = useMemo(
    () => [
      styles.sectionBody,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: borderRadius.lg,
      },
    ],
    [colors.border, colors.surface],
  );

  const accountLabelStyle = useMemo(
    () => [
      styles.sectionTitle,
      {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
      },
    ],
    [colors.textPrimary],
  );

  const accountProfileName = identity?.displayName?.trim() || "Your profile";
  const accountPhoneNumber = identity?.phoneNumber || "No phone linked";

  const accountBubbleStyle = useMemo(
    () => [
      styles.accountBubble,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
      },
    ],
    [colors.surface, colors.border],
  );

  const accountBubbleNameStyle = useMemo(
    () => [
      styles.accountBubbleText,
      {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
      },
    ],
    [colors.textPrimary],
  );

  const accountBubbleLabelStyle = useMemo(
    () => [
      styles.accountBubbleLabel,
      {
        color: colors.textSecondary,
        fontFamily: typography.fontFamily.regular,
      },
    ],
    [colors.textSecondary],
  );

  const accountBubblePhoneStyle = useMemo(
    () => [
      styles.accountBubbleText,
      {
        color: colors.textPrimary,
        fontFamily: typography.fontFamily.semiBold,
      },
    ],
    [colors.textPrimary],
  );

  const deleteAccountTitleStyle = useMemo(
    () => ({
      color: colors.danger,
    }),
    [colors.danger],
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.screen, screenStyle]}
    >
      <View style={contentShellStyle}>
        <Header
          title="Settings"
          subtitle="Manage your account and preferences"
          titleAlign="start"
          titlePaddingHorizontal={spacing.sm}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
        >
          <View style={styles.accountHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={accountLabelStyle}>Account Details</Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Profile image, display name, and phone details
              </Text>
            </View>
            <Pressable
              onPress={handleOpenAvatarSheet}
              style={styles.avatarPressable}
            >
              <Avatar
                uri={identity?.avatarUri}
                name={accountProfileName}
                size={36}
              />
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileImageColumn}>
              <Image
                source={profileImageSource}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.accountBubblesColumn}>
              <View style={accountBubbleStyle}>
                <Text style={accountBubbleLabelStyle}>Name</Text>
                <Text style={accountBubbleNameStyle}>{accountProfileName}</Text>
              </View>
              <View style={accountBubbleStyle}>
                <Text style={accountBubbleLabelStyle}>Mobile</Text>
                <Text style={accountBubblePhoneStyle}>
                  {accountPhoneNumber}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={accountSectionBodyStyle}>
              {editingName ? (
                <View
                  style={[
                    styles.editNameSection,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.semiBold,
                      fontSize: typography.fontSize.sm,
                      color: colors.textPrimary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    Display name
                  </Text>
                  <Text
                    style={{
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.fontSize.sm,
                      color: colors.textSecondary,
                      marginBottom: spacing.sm,
                    }}
                  >
                    This will be displayed to the other user
                  </Text>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                    placeholder="Enter your display name"
                    containerStyle={styles.nameInputContainer}
                    inputWrapperStyle={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderRadius: borderRadius.md,
                    }}
                  />
                  <View style={styles.editNameButtonsRow}>
                    <Pressable
                      onPress={handleCancelEditName}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          flex: 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontFamily: typography.fontFamily.semiBold,
                          fontSize: typography.fontSize.md,
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveName}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                          flex: 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.primaryForeground,
                          fontFamily: typography.fontFamily.semiBold,
                          fontSize: typography.fontSize.md,
                        }}
                      >
                        Save
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <ListItem
                  title="Edit name"
                  subtitle={accountProfileName}
                  trailing={
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textDisabled}
                    />
                  }
                  onPress={handleStartEditName}
                  dividerInset={0}
                />
              )}

              <ListItem
                title="Phone number"
                subtitle={accountPhoneNumber}
                dividerInset={0}
              />
              <ListItem
                title="Delete account"
                subtitle="Permanently remove all your data"
                titleStyle={deleteAccountTitleStyle}
                onPress={handleOpenDeleteAccountSheet}
                trailing={
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textDisabled}
                  />
                }
                divider={false}
                dividerInset={0}
              />
            </View>
          </View>

          <Section
            title="Notifications"
            subtitle="Manage alerts for messages and updates"
          >
            <ListItem
              title="Message notifications"
              subtitle="Get alerted when new messages arrive"
              trailing={
                <ToggleSwitch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              }
              dividerInset={0}
            />
            <ListItem
              title="Sound"
              subtitle="Play a sound for new messages"
              trailing={
                <ToggleSwitch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                />
              }
              dividerInset={0}
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
              dividerInset={0}
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
              dividerInset={0}
            />
          </Section>

          <Section
            title="Privacy & Security"
            subtitle="Control how your account and messages stay secure"
          >
            <ListItem
              title="Encryption"
              subtitle="All messages are end-to-end encrypted"
              trailing={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              }
              dividerInset={0}
            />
            <ListItem
              title="Blocked contacts"
              subtitle="Manage people you've blocked"
              onPress={handleOpenBlockedContactsSheet}
              trailing={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textDisabled}
                />
              }
              dividerInset={0}
            />
            <ListItem
              title="Data deletion"
              subtitle="Clear all your chat history and attachments"
              onPress={handleOpenClearChatsSheet}
              trailing={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textDisabled}
                />
              }
              divider={false}
              dividerInset={0}
            />
          </Section>

          <Section
            title="App Details"
            subtitle="Customize app preferences and storage"
          >
            <ThemePicker
              currentMode={mode}
              onSelect={setMode}
              onSheetChange={makeOnChange("themePicker")}
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
              dividerInset={0}
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
              dividerInset={0}
            />
          </Section>

          <Section
            title="About App"
            subtitle="Version details, legal terms, and policies"
            style={{ marginBottom: 0 }}
          >
            <ListItem title="Version" subtitle={appVersion} dividerInset={0} />
            <ListItem
              title="Terms of service"
              subtitle="Read our usage terms"
              onPress={handleOpenTermsSheet}
              trailing={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textDisabled}
                />
              }
              dividerInset={0}
            />
            <ListItem
              title="Privacy policy"
              subtitle="How we handle your data"
              onPress={handleOpenPrivacySheet}
              trailing={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textDisabled}
                />
              }
              divider={false}
              dividerInset={0}
            />
          </Section>
        </ScrollView>
      </View>

      {/* Delete Account Bottom Sheet */}
      <BottomSheetModal
        ref={deleteAccountSheetRef}
        snapPoints={["35%"]}
        enablePanDownToClose
        onChange={makeOnChange("deleteAccount")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Delete Account
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            This will permanently delete your account, all chats, contacts, and
            settings. This action cannot be undone.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Pressable
              onPress={() => deleteAccountSheetRef.current?.dismiss()}
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleDeleteAccount}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.dangerMuted,
                  borderColor: colors.dangerBorder,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.danger,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                Delete my account
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Clear Chats Bottom Sheet */}
      <BottomSheetModal
        ref={clearChatsSheetRef}
        snapPoints={["35%"]}
        enablePanDownToClose
        onChange={makeOnChange("clearChats")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Clear All Chats
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            This will permanently delete all your chat history, messages, and
            attachments. This action cannot be undone and cannot be reversed.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Pressable
              onPress={() => clearChatsSheetRef.current?.dismiss()}
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleClearAllChats}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.dangerMuted,
                  borderColor: colors.dangerBorder,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.danger,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                Clear all chats
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Clear Cache Bottom Sheet */}
      <BottomSheetModal
        ref={clearCacheSheetRef}
        snapPoints={["35%"]}
        enablePanDownToClose
        onChange={makeOnChange("clearCache")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetView
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            {Strings.settings.clearCache}
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            {Strings.settings.clearCacheConfirm}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Pressable
              onPress={() => clearCacheSheetRef.current?.dismiss()}
              style={[
                styles.actionButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                {Strings.settings.cancel}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmClearCache}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.dangerMuted,
                  borderColor: colors.dangerBorder,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.danger,
                  fontFamily: typography.fontFamily.semiBold,
                  fontSize: typography.fontSize.md,
                }}
              >
                {Strings.settings.clearCacheConfirmBtn}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Terms of Service Full-Screen Bottom Sheet */}
      <BottomSheetModal
        ref={termsSheetRef}
        snapPoints={["100%"]}
        topInset={insets.top}
        enablePanDownToClose
        onChange={makeOnChange("terms")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Terms of Service
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            Last updated: May 4, 2026
          </Text>

          <PolicySection title="1. Introduction">
            <Paragraph>
              Welcome to SonarX. These Terms of Service govern your use of our
              encrypted peer-to-peer messaging application. By accessing or
              using SonarX, you agree to be bound by these terms. If you do not
              agree with any part of these terms, you must immediately
              discontinue use of the application and remove it from all your
              devices. SonarX is designed from the ground up with privacy,
              security, and user sovereignty as its foundational principles.
            </Paragraph>
          </PolicySection>

          <PolicySection title="2. Acceptance of Terms">
            <Paragraph>
              By downloading, installing, accessing, or using SonarX in any
              manner, you acknowledge that you have read, understood, and agree
              to comply with these Terms of Service. You also confirm that you
              are of legal age to form a binding contract in your jurisdiction.
              If you are using SonarX on behalf of an organization, you
              represent that you have authority to bind that organization to
              these terms.
            </Paragraph>
          </PolicySection>

          <PolicySection title="3. Description of Service">
            <Paragraph>
              SonarX is a privacy-first, end-to-end encrypted messaging platform
              designed for secure peer-to-peer communication. Unlike traditional
              messaging services, SonarX does not rely on centralized servers to
              store, process, or route your message content. All messages are
              transmitted directly between users through encrypted channels. The
              application operates on a local-first architecture, meaning your
              data is stored primarily and exclusively on your device.
            </Paragraph>
          </PolicySection>

          <PolicySection title="4. User Accounts and Identity">
            <Paragraph>
              To use SonarX, you create a local cryptographic identity within
              the application. You are solely responsible for maintaining the
              confidentiality and security of your cryptographic keys and
              identity information. SonarX does not maintain traditional user
              accounts on centralized servers. Your identity is
              cryptographically secured and stored locally on your device using
              platform-native secure storage mechanisms.
            </Paragraph>
          </PolicySection>

          <PolicySection title="5. Acceptable Use">
            <Paragraph>
              You agree to use SonarX only for lawful purposes and in compliance
              with all applicable local, national, and international laws and
              regulations. You must not use the application to transmit content
              that is illegal, harmful, threatening, abusive, harassing,
              defamatory, vulgar, obscene, invasive of another's privacy,
              hateful, or otherwise objectionable.
            </Paragraph>
          </PolicySection>

          <PolicySection title="6. Prohibited Activities">
            <Paragraph>
              The following activities are strictly prohibited when using
              SonarX:
            </Paragraph>
            <BulletPoint text="Reverse engineering, decompiling, disassembling, or otherwise attempting to discover the source code of the application." />
            <BulletPoint text="Attempting to bypass, disable, or interfere with any encryption or security features of the application." />
            <BulletPoint text="Using SonarX to distribute malware, viruses, or any other harmful software." />
            <BulletPoint text="Engaging in unauthorized access to any systems or networks." />
            <BulletPoint text="Impersonating other users, entities, or falsely stating your affiliation with any person or organization." />
            <BulletPoint text="Collecting or harvesting user information without explicit consent." />
            <BulletPoint text="Using automated scripts, bots, or scrapers to interact with the application." />
          </PolicySection>

          <PolicySection title="7. End-to-End Encryption">
            <Paragraph>
              All messages sent through SonarX are protected by state-of-the-art
              end-to-end encryption. This means that messages are encrypted on
              your device before transmission and can only be decrypted by the
              intended recipient's device. Under no circumstances can SonarX,
              its developers, or any third party decrypt, access, intercept, or
              recover the content of your messages. You acknowledge that if you
              lose access to your device or cryptographic keys, your message
              history cannot be recovered by us.
            </Paragraph>
          </PolicySection>

          <PolicySection title="8. Data Storage and Local-First Architecture">
            <Paragraph>
              SonarX operates on a strict local-first data model. Your messages,
              contacts, media files, and cryptographic keys are stored
              exclusively on your local device using encrypted SQLite databases.
              We do not operate cloud servers to store your chat history,
              message metadata, or contact information. You are solely
              responsible for backing up your data. Because all data is local,
              uninstalling the application without backup will result in
              permanent data loss.
            </Paragraph>
          </PolicySection>

          <PolicySection title="9. Intellectual Property">
            <Paragraph>
              All intellectual property rights in and to SonarX, including but
              not limited to the software, user interface designs, logos,
              trademarks, documentation, and underlying technology, are owned by
              us or our licensors. You are granted a limited, non-exclusive,
              non-transferable, revocable license to use the application for
              personal, non-commercial communication purposes. You may not copy,
              modify, distribute, sell, or lease any part of SonarX without our
              express written permission.
            </Paragraph>
          </PolicySection>

          <PolicySection title="10. Termination">
            <Paragraph>
              We reserve the right to terminate or suspend your access to SonarX
              at any time, without prior notice or liability, for conduct that
              we believe violates these Terms or is harmful to other users, us,
              or third parties. Because SonarX is peer-to-peer and serverless,
              termination primarily involves cryptographic key invalidation and
              exclusion from future application updates. You may also terminate
              your use at any time by deleting the application and your account
              data through the settings.
            </Paragraph>
          </PolicySection>

          <PolicySection title="11. Disclaimer of Warranties">
            <Paragraph>
              SonarX is provided on an "as is" and "as available" basis without
              warranties of any kind, either express or implied, including but
              not limited to implied warranties of merchantability, fitness for
              a particular purpose, or non-infringement. We do not warrant that
              the application will be uninterrupted, timely, secure, error-free,
              or completely free from vulnerabilities. You use SonarX at your
              own risk.
            </Paragraph>
          </PolicySection>

          <PolicySection title="12. Limitation of Liability">
            <Paragraph>
              To the maximum extent permitted by applicable law, in no event
              shall we be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to
              loss of profits, data, use, goodwill, or other intangible losses,
              arising out of or relating to your use of or inability to use
              SonarX, even if we have been advised of the possibility of such
              damages.
            </Paragraph>
          </PolicySection>

          <PolicySection title="13. Changes to Terms">
            <Paragraph>
              We may modify these Terms of Service at any time. When we make
              material changes, we will update the "Last updated" date at the
              top of this document. Your continued use of SonarX after any
              changes constitutes your acceptance of the revised Terms. It is
              your responsibility to review these Terms periodically.
            </Paragraph>
          </PolicySection>

          <PolicySection title="14. Governing Law">
            <Paragraph>
              These Terms shall be governed and construed in accordance with the
              laws of your jurisdiction, without regard to its conflict of law
              provisions. Any dispute arising under these Terms shall be
              resolved exclusively in the courts of your local jurisdiction.
            </Paragraph>
          </PolicySection>

          <PolicySection title="15. Contact Information">
            <Paragraph>
              If you have any questions, concerns, or feedback regarding these
              Terms of Service, please reach out to us through the application's
              support channels. We value your privacy and are committed to
              maintaining transparent policies that put users first.
            </Paragraph>
          </PolicySection>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Privacy Policy Full-Screen Bottom Sheet */}
      <BottomSheetModal
        ref={privacySheetRef}
        snapPoints={["100%"]}
        topInset={insets.top}
        enablePanDownToClose
        onChange={makeOnChange("privacy")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.lg,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.xs,
            }}
          >
            Privacy Policy
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.lg,
            }}
          >
            Last updated: May 4, 2026
          </Text>

          <PolicySection title="1. Introduction and Our Privacy Commitment">
            <Paragraph>
              SonarX is built on the fundamental principle of absolute privacy.
              This Privacy Policy explains how we handle information when you
              use our application. Our commitment is simple and unwavering: we
              collect as little data as possible, we encrypt everything
              end-to-end, and we never sell, rent, trade, or share your personal
              information with any third party for any purpose. Your trust is
              our most valuable asset, and we design every feature with privacy
              as the default setting.
            </Paragraph>
          </PolicySection>

          <PolicySection title="2. No Data Collection Principle">
            <Paragraph>
              SonarX is engineered with a strict "zero data collection"
              architecture. We do not collect, store, or process your personal
              information on our servers. Unlike traditional messaging
              applications, SonarX does not require phone number verification,
              email registration, social media login, or identity verification
              through centralized servers. There are no analytics frameworks, no
              tracking pixels, and no telemetry systems embedded in the
              application.
            </Paragraph>
          </PolicySection>

          <PolicySection title="3. Local-First Architecture">
            <Paragraph>
              All your messages, contacts, media files, cryptographic keys, and
              application preferences are stored exclusively on your local
              device. We do not operate backend databases containing user chat
              histories, contact lists, message metadata, or usage patterns.
              Your device is your data center. This local-first approach ensures
              that even in the unlikely event of a breach of our systems, there
              is no user data to expose because we simply do not possess it.
            </Paragraph>
          </PolicySection>

          <PolicySection title="4. End-to-End Encryption">
            <Paragraph>
              Every message, voice note, image, video, document, and file sent
              through SonarX is secured using advanced, industry-standard
              end-to-end encryption. Messages are encrypted on your device
              before they leave your device and can only be decrypted by the
              intended recipient's device using their private cryptographic key.
              We cannot decrypt, access, intercept, or recover your messages
              under any circumstances. The encryption keys are generated locally
              and never transmitted to our servers.
            </Paragraph>
          </PolicySection>

          <PolicySection title="5. What Data Is Stored">
            <Paragraph>
              The only data stored by SonarX exists locally on your device and
              nowhere else. This includes:
            </Paragraph>
            <BulletPoint text="Your cryptographic identity keys, secured in hardware-backed secure storage where your device's operating system supports it." />
            <BulletPoint text="Your contact list, which consists of peer identifiers and public keys necessary for encryption." />
            <BulletPoint text="Your complete message history and the content of those messages." />
            <BulletPoint text="Media attachments including photos, videos, documents, and audio files." />
            <BulletPoint text="Application preferences such as theme selection, notification settings, and display options." />
            <Paragraph>
              None of this data is ever transmitted to, backed up on, or stored
              on SonarX servers or infrastructure.
            </Paragraph>
          </PolicySection>

          <PolicySection title="6. What Data Is Explicitly NOT Collected">
            <Paragraph>
              We want to be completely transparent about what we do not do. We
              explicitly do NOT collect, process, or store:
            </Paragraph>
            <BulletPoint text="Phone numbers, email addresses, or real names for account creation or verification." />
            <BulletPoint text="Device identifiers, advertising IDs, IMEI numbers, MAC addresses, or tracking cookies." />
            <BulletPoint text="Precise or approximate location data or geolocation information." />
            <BulletPoint text="Analytics data, usage statistics, performance metrics, or behavioral tracking." />
            <BulletPoint text="Crash reports or diagnostic information through third-party services." />
            <BulletPoint text="Message content, message metadata, communication patterns, or frequency of use." />
            <BulletPoint text="Contact information from your device's address book without your explicit, informed permission." />
          </PolicySection>

          <PolicySection title="7. Peer-to-Peer Communication">
            <Paragraph>
              SonarX utilizes peer-to-peer and decentralized technologies for
              message delivery whenever possible. Messages travel directly
              between users' devices. In situations where direct connectivity is
              not possible, encrypted messages may transit through temporary
              relay infrastructure; however, these relays cannot decrypt message
              content and do not log metadata about who is communicating with
              whom. No server maintains a persistent record of your
              conversations.
            </Paragraph>
          </PolicySection>

          <PolicySection title="8. Cryptographic Key Management">
            <Paragraph>
              Your encryption keys are generated locally on your device using
              well-audited, industry-standard cryptographic libraries. Your
              private keys never leave your device under any circumstances. We
              have absolutely no ability to recover, reset, regenerate, or
              escrow your keys. This is a core security feature: if we cannot
              access your keys, neither can attackers who might compromise our
              systems. You are responsible for maintaining the security of your
              device.
            </Paragraph>
          </PolicySection>

          <PolicySection title="9. Attachments and Media">
            <Paragraph>
              All photos, videos, documents, voice messages, and other media
              shared through SonarX are encrypted end-to-end before
              transmission. They are stored in their encrypted form on your
              local device. They are never uploaded to unencrypted cloud
              storage, shared with content delivery networks, or processed by
              third-party machine learning services for facial recognition,
              object detection, or any other purpose.
            </Paragraph>
          </PolicySection>

          <PolicySection title="10. Your Rights and Data Sovereignty">
            <Paragraph>
              Because SonarX stores no personal data on centralized servers,
              traditional data subject access requests (such as those under GDPR
              or CCPA) are managed entirely by you through the application's
              local settings. You retain complete ownership, control, and
              sovereignty over your data at all times. You can export, delete,
              or modify your data directly within the app without needing to
              contact us or wait for a corporate response.
            </Paragraph>
          </PolicySection>

          <PolicySection title="11. Data Retention">
            <Paragraph>
              Messages and media persist on your device until you choose to
              delete them. SonarX does not maintain backup copies, shadow
              copies, or archives on remote servers. When you delete a
              conversation, a message, or your entire account through the
              application's settings, all associated data is permanently and
              irreversibly removed from your device. We cannot recover deleted
              data because we never had access to it in the first place.
            </Paragraph>
          </PolicySection>

          <PolicySection title="12. Security Measures">
            <Paragraph>
              We implement a comprehensive, defense-in-depth security strategy
              including:
            </Paragraph>
            <BulletPoint text="End-to-end encryption for all communications using modern, well-reviewed cryptographic algorithms." />
            <BulletPoint text="Local database encryption at rest using platform-native encryption APIs." />
            <BulletPoint text="Secure key storage using hardware-backed keystores and secure enclaves where available." />
            <BulletPoint text="No plaintext transmission of sensitive data across any network." />
            <BulletPoint text="Regular security audits of cryptographic implementations and dependency updates." />
            <BulletPoint text="Open-source and auditable code where possible to enable community review." />
          </PolicySection>

          <PolicySection title="13. Third-Party Services">
            <Paragraph>
              SonarX does not integrate with analytics providers, advertising
              networks, social media platforms, customer support chat widgets,
              or any other third-party services that might process your personal
              data. The application operates entirely independently. We do not
              use Firebase Analytics, Google Analytics, Facebook SDK, or any
              similar tracking technologies. Your interactions with SonarX
              remain strictly between you and your contacts.
            </Paragraph>
          </PolicySection>

          <PolicySection title="14. Children's Privacy">
            <Paragraph>
              SonarX is not intended for use by individuals under the age of 13,
              or the applicable age of digital consent in your jurisdiction. We
              do not knowingly collect personal information from children.
              Because we collect no data from any users, there is no children's
              data in our systems. If you believe a child has used SonarX
              inappropriately, please contact us through support channels.
            </Paragraph>
          </PolicySection>

          <PolicySection title="15. International Data Transfers">
            <Paragraph>
              Because all data is stored locally on your device and no data is
              transmitted to our servers, there are no international data
              transfers to manage. Your data never crosses borders into foreign
              jurisdictions for storage or processing. This eliminates the legal
              complexity and privacy risks associated with cross-border data
              flows that plague traditional cloud-based messaging services.
            </Paragraph>
          </PolicySection>

          <PolicySection title="16. Changes to This Policy">
            <Paragraph>
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, or legal requirements. When
              we make material changes, we will notify you through the
              application interface. Your continued use of SonarX after the
              updated Privacy Policy has been posted constitutes your acceptance
              of the changes. We encourage you to review this policy
              periodically.
            </Paragraph>
          </PolicySection>

          <PolicySection title="17. Contact Us">
            <Paragraph>
              If you have any questions, concerns, or feedback about this
              Privacy Policy or our privacy practices in general, please contact
              us through the application's support channels. We are committed to
              transparency and will respond to legitimate privacy inquiries to
              the best of our ability. Thank you for trusting SonarX with your
              private communications.
            </Paragraph>
          </PolicySection>
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Blocked Contacts Bottom Sheet */}
      <BottomSheetModal
        ref={blockedContactsSheetRef}
        snapPoints={["65%"]}
        enablePanDownToClose
        onChange={makeOnChange("blockedContacts")}
        backgroundStyle={{ backgroundColor: colors.surface }}
        handleIndicatorStyle={{ backgroundColor: colors.textDisabled }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            opacity={0.5}
          />
        )}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.fontSize.lg,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
            }}
          >
            Blocked Contacts
          </Text>
          {blockedContacts.length === 0 ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: spacing.lg,
              }}
            >
              <Ionicons
                name="people-outline"
                size={44}
                color={colors.textDisabled}
              />
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                  textAlign: "center",
                }}
              >
                No blocked contacts
              </Text>
            </View>
          ) : (
            <BottomSheetFlatList
              data={blockedContacts}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              bottomInset={insets.bottom + spacing.md}
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    gap: spacing.sm,
                  }}
                >
                  <Avatar
                    uri={item.avatarUri}
                    name={item.displayName}
                    size="md"
                    showOnlineBadge={false}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.semiBold,
                        fontSize: typography.fontSize.md,
                        color: colors.textPrimary,
                      }}
                      numberOfLines={1}
                    >
                      {item.displayName}
                    </Text>
                    <Text
                      style={{
                        fontFamily: typography.fontFamily.regular,
                        fontSize: typography.fontSize.sm,
                        color: colors.textSecondary,
                      }}
                    >
                      {`•••• ${item.phoneNumber.slice(-4)}`}
                    </Text>
                  </View>
                  <Button
                    text="Unblock"
                    size="sm"
                    variant="secondary"
                    onPress={() => handleUnblockContact(item.id)}
                  />
                </View>
              )}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>

      <AvatarPickerSheet
        ref={avatarSheetRef}
        onImagePicked={handleAvatarPicked}
        onSheetChange={makeOnChange("avatarPicker")}
      />
    </SafeAreaView>
  );
}

export default function SettingsScreen() {
  return (
    <SettingsErrorBoundary>
      <SettingsScreenInner />
    </SettingsErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentShell: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  accountHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  avatarPressable: {
    marginLeft: spacing.sm,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    marginBottom: 0,
  },
  profileImageColumn: {
    width: "60%",
  },
  profileImage: {
    width: "100%",
    height: 200,
  },
  accountBubblesColumn: {
    width: "40%",
    flexDirection: "column",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  accountBubble: {
    paddingHorizontal: spacing.sm + 8,
    paddingVertical: spacing.xs + 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.lg,
    width: "100%",
    alignSelf: "stretch",
  },
  accountBubbleText: {
    ...typography.caption,
  },
  accountBubbleLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  nameInputContainer: {
    width: "100%",
    marginBottom: spacing.sm,
  },
  editNameSection: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editNameButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    marginTop: -spacing.sm,
    fontFamily: typography.fontFamily.regular,
  },
  sectionBody: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...typography.body,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
});
