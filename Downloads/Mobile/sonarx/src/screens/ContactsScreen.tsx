import React, {
  Component,
  useCallback,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'
import { HEADER_HEIGHT, TAB_BAR_HEIGHT } from '@/src/constants/layout'
import { getOrCreateConversation } from '@/db/queries'
import type { Contact } from '@/src/db/schema'
import { useContacts } from '@/src/hooks/useContacts'
import { usePresenceStore } from '@/src/store/presenceStore'
import Avatar from '@/src/components/ui/Avatar'
import AnimatedPressable from '@/src/components/ui/Pressable'

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ContactsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ContactsScreen]', error, info)
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ListItem =
  | { kind: 'header'; letter: string; key: string }
  | { kind: 'contact'; contact: Contact; key: string }

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ letter }: { letter: string }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text
        style={[
          styles.sectionLetter,
          { color: colors.accent, fontFamily: typography.fontFamily.semiBold },
        ]}
      >
        {letter}
      </Text>
    </View>
  )
}

interface ContactListItemProps {
  contact: Contact
  onPress: (contact: Contact) => void
}

function ContactListItem({ contact, onPress }: ContactListItemProps) {
  const { colors } = useTheme()
  const isOnline = usePresenceStore(
    (state) => state.onlineStatus[contact.id]?.isOnline ?? false,
  )

  return (
    <AnimatedPressable
      onPress={() => onPress(contact)}
      haptic
      hapticType="light"
      style={[styles.contactRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderMuted }]}
      accessibilityLabel={`Open chat with ${contact.displayName}`}
    >
      <Avatar
        uri={contact.avatarUri}
        name={contact.displayName}
        size="md"
        showOnlineBadge
        isOnline={isOnline}
      />
      <View style={styles.contactInfo}>
        <Text
          style={[
            styles.contactName,
            { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
          ]}
          numberOfLines={1}
        >
          {contact.displayName}
        </Text>
        <Text
          style={[
            styles.contactPhone,
            { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
          ]}
          numberOfLines={1}
        >
          {contact.phoneNumber}
        </Text>
      </View>
    </AnimatedPressable>
  )
}

function EmptyState() {
  const { colors } = useTheme()
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accentMuted }]}>
        <Ionicons name="people-outline" size={48} color={colors.accent} />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.textPrimary, fontFamily: typography.fontFamily.semiBold },
        ]}
      >
        {Strings.contacts.emptyTitle}
      </Text>
      <Text
        style={[
          styles.emptySub,
          { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
        ]}
      >
        {Strings.contacts.emptySub}
      </Text>
    </View>
  )
}

// ─── Build Section Data ───────────────────────────────────────────────────────

function buildSectionData(contacts: Contact[]): {
  items: ListItem[]
  stickyIndices: number[]
} {
  const sorted = [...contacts].sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  )

  const items: ListItem[] = []
  const stickyIndices: number[] = []
  let currentLetter = ''

  sorted.forEach((contact) => {
    const letter = contact.displayName.charAt(0).toUpperCase() || '#'
    if (letter !== currentLetter) {
      currentLetter = letter
      stickyIndices.push(items.length)
      items.push({ kind: 'header', letter, key: `header-${letter}` })
    }
    items.push({ kind: 'contact', contact, key: contact.id })
  })

  return { items, stickyIndices }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

function ContactsScreenInner() {
  const { colors } = useTheme()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)

  const { contacts } = useContacts()

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts
    const lower = searchQuery.toLowerCase()
    return contacts.filter(
      (c) =>
        c.displayName.toLowerCase().includes(lower) ||
        c.phoneNumber.toLowerCase().includes(lower),
    )
  }, [contacts, searchQuery])

  const { items, stickyIndices } = useMemo(
    () => buildSectionData(filteredContacts),
    [filteredContacts],
  )

  const handleContactPress = useCallback(
    async (contact: Contact) => {
      if (isNavigating) return
      setIsNavigating(true)
      try {
        await getOrCreateConversation(contact.id)
        router.push(`/chat/${contact.id}`)
      } catch (err) {
        console.error('[ContactsScreen] Failed to open conversation', err)
      } finally {
        setIsNavigating(false)
      }
    },
    [router, isNavigating],
  )

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.kind === 'header') {
        return <SectionHeader letter={item.letter} />
      }
      return (
        <ContactListItem contact={item.contact} onPress={handleContactPress} />
      )
    },
    [handleContactPress],
  )

  const keyExtractor = useCallback((item: ListItem) => item.key, [])

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
            backgroundColor: colors.headerBackground,
            borderBottomColor: colors.borderMuted,
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
          {Strings.contacts.title}
        </Text>
        <View style={styles.headerRight}>
          <AnimatedPressable
            onPress={() => router.push('/modal' as Parameters<typeof router.push>[0])}
            haptic
            hapticType="medium"
            hitSlop={8}
            accessibilityLabel="Add contact"
            style={[styles.headerIconBtn, { backgroundColor: colors.surfaceMuted }]}
          >
            <Ionicons name="person-add-outline" size={17} color={colors.accent} />
          </AnimatedPressable>
        </View>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchWrapper,
          { backgroundColor: colors.headerBackground, borderBottomColor: colors.borderMuted },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="search" size={15} color={colors.textSecondary} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.textPrimary, fontFamily: typography.fontFamily.regular },
            ]}
            placeholder={Strings.contacts.searchPlaceholder}
            placeholderTextColor={colors.textDisabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* List */}
      {filteredContacts.length === 0 ? (
        searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {Strings.contacts.noResults}
            </Text>
          </View>
        ) : (
          <EmptyState />
        )
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          stickyHeaderIndices={stickyIndices}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + spacing.xxl }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
    </View>
  )
}

export default function ContactsScreen() {
  return (
    <ContactsErrorBoundary>
      <ContactsScreenInner />
    </ContactsErrorBoundary>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrapper: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xxs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : spacing.xxs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: 'transparent',
  },
  sectionLetter: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactInfo: {
    flex: 1,
    gap: 2,
  },
  contactName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
    letterSpacing: -0.1,
  },
  contactPhone: {
    fontSize: typography.fontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semiBold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  emptySub: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.sm * 1.5,
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
