import React, {
  Component,
  useCallback,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import {
  SectionList,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { getOrCreateConversation } from '@/db/queries'
import type { Contact } from '@/src/db/schema'
import Header from '@/src/components/ui/Header'
import ListItem from '@/src/components/ui/ListItem'
import TextInput from '@/src/components/ui/TextInput'
import Avatar from '@/src/components/ui/Avatar'
import { useContacts } from '@/src/hooks/useContacts'
import { useResponsive } from '@/src/hooks/useResponsive'
import { usePresenceStore } from '@/src/store/presenceStore'
import { useTheme } from '@/src/theme/ThemeProvider'
import { borderRadius, spacing, typography } from '@/src/theme/tokens'
import { Strings } from '@/src/constants/strings'

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

interface ContactSection {
  title: string
  data: Contact[]
}

function SearchBar({
  value,
  onChangeText,
  onClear,
}: {
  value: string
  onChangeText: (value: string) => void
  onClear: () => void
}) {
  const { colors } = useTheme()

  return (
    <View style={styles.searchContainer}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        leftIcon="search-outline"
        rightIcon={value ? 'close-outline' : undefined}
        onRightIconPress={onClear}
        placeholder="Search contacts..."
        containerStyle={styles.searchInputContainer}
        inputWrapperStyle={[
          styles.searchInputWrapper,
          {
            backgroundColor: colors.surface,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        inputStyle={styles.searchInput}
      />
    </View>
  )
}

function maskPhoneNumber(phoneNumber: string) {
  const lastFour = phoneNumber.slice(-4)
  return `•••• ${lastFour}`
}

function HighlightedText({
  text,
  query,
  baseStyle,
  highlightStyle,
}: {
  text: string
  query: string
  baseStyle: StyleProp<TextStyle>
  highlightStyle: StyleProp<TextStyle>
}) {
  if (!query.trim()) {
    return <Text style={baseStyle}>{text}</Text>
  }

  const normalizedText = text.toLowerCase()
  const normalizedQuery = query.toLowerCase()
  const matchIndex = normalizedText.indexOf(normalizedQuery)

  if (matchIndex === -1) {
    return <Text style={baseStyle}>{text}</Text>
  }

  const start = text.slice(0, matchIndex)
  const match = text.slice(matchIndex, matchIndex + query.length)
  const end = text.slice(matchIndex + query.length)

  return (
    <Text style={baseStyle} numberOfLines={1}>
      {start}
      <Text style={highlightStyle}>{match}</Text>
      {end}
    </Text>
  )
}

function ContactRow({
  contact,
  query,
  onPress,
}: {
  contact: Contact
  query: string
  onPress: (contact: Contact) => void
}) {
  const { colors } = useTheme()
  const isOnline = usePresenceStore(
    (state) => state.onlineStatus[contact.id]?.isOnline ?? false,
  )

  return (
    <ListItem
      title={
        <HighlightedText
          text={contact.displayName}
          query={query}
          baseStyle={[
            styles.contactName,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.semiBold,
            },
          ]}
          highlightStyle={{ color: colors.accent }}
        />
      }
      subtitle={
        <View style={styles.subtitleRow}>
          <HighlightedText
            text={maskPhoneNumber(contact.phoneNumber)}
            query={query.slice(-4)}
            baseStyle={[
              styles.contactPhone,
              {
                color: colors.textSecondary,
                fontFamily: typography.fontFamily.regular,
              },
            ]}
            highlightStyle={{ color: colors.accent }}
          />
        </View>
      }
      onPress={() => onPress(contact)}
      height={64}
      divider
      dividerInset={80}
      accessibilityLabel={`Open chat with ${contact.displayName}`}
      leading={
        <Avatar
          uri={contact.avatarUri}
          name={contact.displayName}
          size="sm"
          showOnlineBadge
          isOnline={isOnline}
        />
      }
      trailing={
        <View style={styles.trailingRow}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? colors.online : colors.textDisabled },
            ]}
          />
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textDisabled}
          />
        </View>
      }
    />
  )
}

function EmptyState() {
  const { colors } = useTheme()

  return (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: colors.surfaceMuted,
          },
        ]}
      >
        <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
      </View>
      <Text
        style={[
          styles.emptyTitle,
          {
            color: colors.textPrimary,
            fontFamily: typography.fontFamily.semiBold,
          },
        ]}
      >
        No contacts
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          {
            color: colors.textSecondary,
            fontFamily: typography.fontFamily.regular,
          },
        ]}
      >
        Add contacts with a phone number to start chatting.
      </Text>
    </View>
  )
}

function ContactsScreenInner() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { isDesktop, isTablet } = useResponsive()
  const [searchQuery, setSearchQuery] = useState('')
  const [isNavigating, setIsNavigating] = useState(false)
  const { contacts } = useContacts()

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts
    }

    const normalizedQuery = searchQuery.toLowerCase()
    return contacts.filter(
      (contact) =>
        contact.displayName.toLowerCase().includes(normalizedQuery) ||
        contact.phoneNumber.toLowerCase().includes(normalizedQuery),
    )
  }, [contacts, searchQuery])

  const sections = useMemo<ContactSection[]>(() => {
    const grouped = new Map<string, Contact[]>()

    filteredContacts
      .slice()
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .forEach((contact) => {
        const letter = contact.displayName.charAt(0).toUpperCase() || '#'
        const bucket = grouped.get(letter) ?? []
        bucket.push(contact)
        grouped.set(letter, bucket)
      })

    return Array.from(grouped.entries()).map(([title, data]) => ({ title, data }))
  }, [filteredContacts])

  const contentMaxWidth = isDesktop ? 960 : isTablet ? 700 : undefined

  const handleContactPress = useCallback(
    async (contact: Contact) => {
      if (isNavigating) {
        return
      }

      setIsNavigating(true)
      try {
        await getOrCreateConversation(contact.id)
        router.push(`/chat/${contact.id}`)
      } catch (error) {
        console.error('[ContactsScreen] Failed to open conversation', error)
      } finally {
        setIsNavigating(false)
      }
    },
    [isNavigating, router],
  )

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
        <Header
          title="Contacts"
          rightActions={[
            {
              icon: 'person-add-outline',
              onPress: () => router.push('/modal' as Parameters<typeof router.push>[0]),
              accessibilityLabel: 'Add contact',
            },
          ]}
        />

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />

        {sections.length === 0 ? (
          <EmptyState />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled
            renderSectionHeader={({ section }) => (
              <View
                style={[
                  styles.sectionHeader,
                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionHeaderText,
                    {
                      color: colors.textSecondary,
                      fontFamily: typography.fontFamily.semiBold,
                    },
                  ]}
                >
                  {section.title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => (
              <ContactRow
                contact={item}
                query={searchQuery}
                onPress={handleContactPress}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: insets.bottom + spacing.xl,
            }}
          />
        )}
      </View>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  searchInputContainer: {
    marginBottom: 0,
  },
  searchInputWrapper: {
    minHeight: 44,
  },
  searchInput: {
    fontSize: 14,
  },
  sectionHeader: {
    minHeight: 28,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sectionHeaderText: {
    ...typography.label,
    textTransform: 'uppercase',
  },
  contactName: {
    fontSize: 15,
    lineHeight: 20,
  },
  contactPhone: {
    ...typography.caption,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h3,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
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
