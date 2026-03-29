import { useMemo, useState } from "react";
import { View, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Image } from "expo-image";
import { useIdentityStore } from "@/stores/identity.store";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/client";
import { conversations as conversationsTable, messages as messagesTable } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Peer, Message as DbMessage } from "@/db/schema";
import type { Conversation } from "@/db/schema";

// Live conversation list item type (DB-backed)
type ConversationListItem = Conversation & {
  peer: Peer | null;
  messages: DbMessage[];
};

// Seed-based color palette for peer avatars
const PEER_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#0ea5e9",
  "#10b981", "#f59e0b", "#ef4444", "#06b6d4",
];
function peerColor(peerId: string): string {
  const hash = peerId.split("").reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  return PEER_COLORS[Math.abs(hash) % PEER_COLORS.length];
}



// Conversation item component
function ConversationItem({
  item,
  onPress,
}: {
  item: ConversationListItem;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const lastMsg = item.messages?.[0];
  const preview = lastMsg?.body ?? "No messages yet";
  const peerName = item.peer?.displayName ?? item.peerId;
  const avatarUri = item.peer?.avatarUri;
  const color = peerColor(item.peerId);
  const time = item.lastMessageAt ? formatMessageTime(item.lastMessageAt) : "";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row px-4 py-3 bg-transparent items-start"
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View className="mr-3">
        {avatarUri ? (
          <Image
            source={{ uri: avatarUri }}
            contentFit="cover"
            style={{
              width: 38,
              height: 38,
              borderRadius: 200,
              borderWidth: 1.5,
              borderColor: Colors[colorScheme].border,
              marginRight: 4,
            }}
          />
        ) : (
          <View
            className="rounded-full items-center justify-center"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: color,
              borderWidth: 1.5,
              borderColor: Colors[colorScheme].border,
            }}
          >
            <Text className="text-sm text-white font-bold">
              {peerName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <Text className="font-bold text-sm text-foreground flex-1 mr-2" numberOfLines={1}>
            {peerName}
          </Text>
          <Text className="text-xs text-muted-foreground">{time}</Text>
        </View>
        <Text className="text-[12px] text-muted-foreground leading-5 mt-0.5" numberOfLines={2}>
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff < oneDay && now.getDate() === date.getDate()) {
    // Same day — show time
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    const period = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${m} ${period}`;
  }

  if (diff < 7 * oneDay) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// Empty state when no conversations exist
function EmptyChats({ onGoToContacts }: { onGoToContacts: () => void }) {
  const colorScheme = useColorScheme();
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-6"
        style={{ backgroundColor: colorScheme === "dark" ? "rgba(99,102,241,0.15)" : "#ede9fe" }}
      >
        <Ionicons name="chatbubbles-outline" size={36} color="#6366f1" />
      </View>
      <Text className="text-xl font-bold text-foreground text-center mb-2">
        No conversations yet
      </Text>
      <Text className="text-sm text-muted-foreground text-center mb-8 leading-5">
        Add a contact and start your first secure, encrypted conversation.
      </Text>
      <TouchableOpacity
        onPress={onGoToContacts}
        className="flex-row items-center px-6 py-3 rounded-full"
        style={{ backgroundColor: "#6366f1" }}
      >
        <Ionicons name="person-add-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text className="text-sm font-semibold text-white">Add a Contact</Text>
      </TouchableOpacity>
    </View>
  );
}

// Section divider
function SectionDivider() {
  return <View className="h-[0.5px] bg-border/60 mx-4" />;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const identity = useIdentityStore((state) => state.identity);
  const inverseColorScheme = colorScheme === "light" ? "dark" : "light";

  // Live conversation list from DB
  const { data: rawConversations } = useLiveQuery(
    db.query.conversations.findMany({
      orderBy: desc(conversationsTable.lastMessageAt),
      with: {
        peer: true,
        messages: {
          orderBy: desc(messagesTable.sentAt),
          limit: 1,
        },
      },
    }),
  );

  const conversations = rawConversations as ConversationListItem[] | undefined;

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations ?? [];
    return (conversations ?? []).filter((conv) =>
      (conv.peer?.displayName ?? conv.peerId).toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleConversationPress = (item: ConversationListItem) => {
    router.push(`/chat/${item.peerId}` as any);
  };

  const handleCompose = () => {
    router.push("/(tabs)/contacts" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 justify-between">
        <View className="flex-row items-center">
          {/* Profile */}
          <View className="flex-row items-center">
            <Image
              source={{
                uri:
                  identity?.avatarUri ??
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: Colors[colorScheme].border,
              }}
            />
            <View className="ml-2">
              <Text className="font-bold text-foreground">{identity?.displayName ?? "Rico"}</Text>
              <Text className="text-xs text-muted-foreground">
                {identity?.phoneNumber ?? "No phone number"}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/contacts")}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons
              name="person-outline"
              size={19}
              color={Colors[colorScheme].text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/settings")}
            className="w-8 h-8 items-center justify-center"
          >
            <Ionicons
              name="settings-outline"
              size={19}
              color={Colors[colorScheme].text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-1.5 my-1">
        <View
          className="flex-row items-center bg-transparent rounded-full px-3 border border-border"
          style={{ height: 38 }}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={Colors[colorScheme].mutedForeground}
          />
          <TextInput
            className="flex-1 ml-2 text-foreground text-sm py-0 h-full"
            placeholder="Search conversations..."
            placeholderTextColor={Colors[colorScheme].mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: Colors[colorScheme].border }} />

      {/* Conversation List */}
      <FlatList
        className="flex-1"
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <>
            <ConversationItem
              item={item}
              onPress={() => handleConversationPress(item)}
            />
            {index < filteredConversations.length - 1 && <SectionDivider />}
          </>
        )}
        contentContainerStyle={
          filteredConversations.length === 0 ? { flex: 1 } : { paddingBottom: 100 }
        }
        ListEmptyComponent={
          searchQuery.trim() ? (
            <View className="px-4 py-10 items-center">
              <Ionicons
                name="search-outline"
                size={32}
                color={Colors[colorScheme].mutedForeground}
                style={{ marginBottom: 12 }}
              />
              <Text className="text-muted-foreground text-center text-sm">
                No conversations matching "{searchQuery}"
              </Text>
            </View>
          ) : (
            <EmptyChats onGoToContacts={() => router.push("/(tabs)/contacts" as any)} />
          )
        }
      />

      {/* Floating Compose Button */}
      <TouchableOpacity
        onPress={handleCompose}
        className="absolute self-center rounded-full px-4 py-3 flex-row items-center"
        style={{
          backgroundColor: Colors[inverseColorScheme].background,
          bottom: insets.bottom + 10,
          shadowColor: "transparent",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          display: filteredConversations.length === 0 ? "none" : "flex",
        }}
      >
        <Ionicons
          name="chatbubble-outline"
          size={14}
          color={Colors[inverseColorScheme].text}
        />
        <Text
          className="text-sm font-semibold ml-2 leading-5"
          style={{ color: Colors[inverseColorScheme].text }}
        >
          New Message
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
