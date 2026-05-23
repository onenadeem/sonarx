import React, {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BackHandler,
  Dimensions,
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
import { useIsFocused } from "expo-router";
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
import TermsSheetContent from "./settings/TermsSheetContent";
import PrivacySheetContent from "./settings/PrivacySheetContent";

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

function ThemePicker({ currentMode, onSelect, onSheetChange, sheetRef }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentLabel =
    THEME_OPTIONS.find((o) => o.mode === currentMode)?.label ?? "System";

  const handleOpen = useCallback(() => {
    sheetRef.current?.present();
  }, [sheetRef]);

  const handleSelect = useCallback(
    (mode) => {
      onSelect(mode);
      sheetRef.current?.dismiss();
    },
    [onSelect, sheetRef],
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
        ref={sheetRef}
        enableDynamicSizing
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
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const avatarSheetRef = useRef(null);
  const deleteAccountSheetRef = useRef(null);
  const clearChatsSheetRef = useRef(null);
  const clearCacheSheetRef = useRef(null);
  const termsSheetRef = useRef(null);
  const privacySheetRef = useRef(null);
  const blockedContactsSheetRef = useRef(null);
  const themePickerSheetRef = useRef(null);
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";
  const contentMaxWidth = isDesktop ? SETTINGS_SCREEN_MAX_WIDTH : undefined;
  const maxBlockedSheetHeight = Dimensions.get("window").height * 0.65;
  const scrollRef = useScrollToTop();
  const profileImageSource = useMemo(
    () => (isDark ? PROFILE_LIGHT_IMAGE : PROFILE_DARK_IMAGE),
    [isDark],
  );

  // Track active bottom sheets for back gesture handling
  const [activeSheetCount, setActiveSheetCount] = useState(0);
  const activeSheetCountRef = useRef(activeSheetCount);
  activeSheetCountRef.current = activeSheetCount;
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

  const handleTermsChange = useCallback(
    (index) => {
      makeOnChange("terms")(index);
      setTermsOpen(index >= 0);
    },
    [makeOnChange],
  );

  const handlePrivacyChange = useCallback(
    (index) => {
      makeOnChange("privacy")(index);
      setPrivacyOpen(index >= 0);
    },
    [makeOnChange],
  );

  const dismissOpenSheets = useCallback(() => {
    const allSheets = {
      deleteAccount: deleteAccountSheetRef,
      clearChats: clearChatsSheetRef,
      clearCache: clearCacheSheetRef,
      terms: termsSheetRef,
      privacy: privacySheetRef,
      avatarPicker: avatarSheetRef,
      blockedContacts: blockedContactsSheetRef,
      themePicker: themePickerSheetRef,
    };
    for (const [sheetId, ref] of Object.entries(allSheets)) {
      if (activeSheetIds.current.has(sheetId)) {
        ref.current?.dismiss();
      }
    }
  }, []);

  // Handle hardware back button / back gesture on Android
  const isFocused = useIsFocused();
  useEffect(() => {
    if (!isFocused) return;

    const onBackPress = () => {
      if (activeSheetCountRef.current > 0) {
        dismissOpenSheets();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress,
    );
    return () => subscription.remove();
  }, [isFocused, dismissOpenSheets]);

  // Blocked contacts data
  const blockedPeersQuery = useMemo(
    () => db.query.peers.findMany({ where: eq(peers.isBlocked, true) }),
    [],
  );
  const { data: peerData } = useLiveQuery(blockedPeersQuery);
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
              sheetRef={themePickerSheetRef}
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
        enableDynamicSizing
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
        enableDynamicSizing
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
        enableDynamicSizing
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
        onChange={handleTermsChange}
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
          {termsOpen && <TermsSheetContent />}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Privacy Policy Full-Screen Bottom Sheet */}
      <BottomSheetModal
        ref={privacySheetRef}
        snapPoints={["100%"]}
        topInset={insets.top}
        enablePanDownToClose
        onChange={handlePrivacyChange}
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
          {privacyOpen && <PrivacySheetContent />}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Blocked Contacts Bottom Sheet */}
      <BottomSheetModal
        ref={blockedContactsSheetRef}
        enableDynamicSizing
        maxDynamicContentSize={maxBlockedSheetHeight}
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
        <BottomSheetFlatList
          data={blockedContacts}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          bottomInset={insets.bottom + spacing.md}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Text
                style={{
                  fontFamily: typography.fontFamily.bold,
                  fontSize: typography.fontSize.lg,
                  color: colors.textPrimary,
                  marginBottom: spacing.xs,
                  paddingTop: spacing.sm,
                }}
              >
                Blocked Contacts
              </Text>
              <Text
                style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginBottom: spacing.md,
                }}
              >
                These people won't be able to message you
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.xl,
                minHeight: 160,
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
          }
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
                  numberOfLines={1}
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
    marginTop: -5,
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
