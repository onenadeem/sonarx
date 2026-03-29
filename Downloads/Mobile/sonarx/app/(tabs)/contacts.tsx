import { AddContactSheet } from "@/components/contacts/AddContactSheet";
import { PeerCard } from "@/components/contacts/PeerCard";
import { Text } from "@/components/ui/text";
import { db } from "@/db/client";
import { upsertPeer } from "@/db/queries";
import { type Peer } from "@/db/schema";
import { useMultipleOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import type { PeerPresence } from "@/lib/p2p/discovery";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function ContactsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const resolvedColors = Colors[colorScheme];
  const [contacts, setContacts] = useState<Peer[]>([]);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadContacts() {
      const allPeers = await db.query.peers.findMany({
        orderBy: (peers, { desc }) => [desc(peers.addedAt)],
      });
      setContacts(allPeers);
    }
    loadContacts();
  }, []);

  const peerIds = contacts.map((c) => c.id);
  const onlineStatuses = useMultipleOnlineStatus(peerIds);

  const sortedContacts = useMemo(
    () =>
      [...contacts].sort((a, b) => {
        const aOnline = onlineStatuses[a.id]?.isOnline || false;
        const bOnline = onlineStatuses[b.id]?.isOnline || false;

        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        return a.displayName.localeCompare(b.displayName);
      }),
    [contacts, onlineStatuses],
  );

  const { onlineContacts, offlineContacts, hasMatches } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const visibleContacts = query
      ? sortedContacts.filter((peer) =>
          `${peer.displayName} ${peer.id}`.toLowerCase().includes(query),
        )
      : sortedContacts;

    return {
      onlineContacts: visibleContacts.filter((peer) => onlineStatuses[peer.id]?.isOnline),
      offlineContacts: visibleContacts.filter((peer) => !onlineStatuses[peer.id]?.isOnline),
      hasMatches: visibleContacts.length > 0,
    };
  }, [sortedContacts, searchQuery, onlineStatuses]);

  const renderSection = (title: string, items: Peer[], isOnlineSection: boolean) => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2 px-1">
        <View className="flex-row items-center gap-2">
          <View
            className={`h-2 w-2 rounded-full ${isOnlineSection ? "bg-emerald-500" : "bg-zinc-500"}`}
          />
          <Text style={{ color: resolvedColors.text }} className="text-sm font-semibold">
            {title}
          </Text>
        </View>
        <Text style={{ color: resolvedColors.mutedForeground }} className="text-xs">
          {items.length}
        </Text>
      </View>

      <View className="space-y-2">
        {items.map((peer) => (
          <PeerCard
            key={peer.id}
            peer={peer}
            isOnline={isOnlineSection}
            lastSeen={onlineStatuses[peer.id]?.lastSeen}
            onChat={() => handleChat(peer)}
            onCall={(video) => handleCall(peer, video)}
            onViewProfile={() => handleViewProfile(peer)}
          />
        ))}
      </View>
    </View>
  );

  const handleClearSearch = () => setSearchQuery("");

  const handleAddContact = async (peerId: string, presence: PeerPresence) => {
    await upsertPeer({
      id: peerId,
      displayName: presence.displayName,
      publicKey: presence.publicKey,
      signingPublicKey: presence.signingPublicKey,
    });

    const allPeers = await db.query.peers.findMany({
      orderBy: (peers, { desc }) => [desc(peers.addedAt)],
    });
    setContacts(allPeers);
  };

  const handleChat = (peer: Peer) => {
    router.push(`/chat/${peer.id}` as any);
  };

  const handleCall = (peer: Peer, withVideo: boolean) => {
    router.push({
      pathname: `/call/${peer.id}` as any,
      params: { video: withVideo.toString() },
    });
  };

  const handleViewProfile = (peer: Peer) => {
    router.push(`/profile/${peer.id}` as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pt-4">
        <View
          className="rounded-3xl border border-border/60 px-5 py-4"
          style={{
            backgroundColor: colorScheme === "dark" ? "rgba(22, 27, 34, 0.9)" : "#f8fafc",
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-3xl font-black tracking-tight" style={{ color: resolvedColors.text }}>
                Contacts
              </Text>
              <Text className="text-sm mt-1" style={{ color: resolvedColors.mutedForeground }}>
                Stay close to your people
              </Text>
            </View>
            <Text
              className="px-2.5 py-1 rounded-full text-[10px] font-medium"
              style={{
                backgroundColor: colorScheme === "dark" ? "rgba(56, 64, 74, 0.55)" : "#e5e7eb",
                color: resolvedColors.text,
              }}
            >
              {contacts.length} total
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => setIsAddSheetOpen(true)}
              className="h-9 flex-1 rounded-xl border border-border/60 bg-background items-center justify-center flex-row gap-1"
            >
              <Ionicons name="person-add-outline" size={16} color={resolvedColors.text} />
              <Text className="text-sm font-medium" style={{ color: resolvedColors.text }}>
                Add Contact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsAddSheetOpen(true)}
              className="h-9 w-11 rounded-xl border border-border/60 bg-background items-center justify-center"
            >
              <Ionicons name="qr-code-outline" size={18} color={resolvedColors.text} />
            </TouchableOpacity>
          </View>

          <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2">
            <Ionicons name="search-outline" size={17} color={resolvedColors.mutedForeground} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search contacts"
              placeholderTextColor={resolvedColors.mutedForeground}
              className="ml-2 flex-1 text-sm h-8"
              style={{ color: resolvedColors.text }}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle-outline" size={18} color={resolvedColors.mutedForeground} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-3" showsVerticalScrollIndicator={false}>
        {contacts.length === 0 ? (
          <View className="rounded-3xl border border-border/70 bg-card/80 mt-3 px-6 py-10 items-center">
            <Text className="text-xl font-semibold text-foreground mb-2">No contacts yet</Text>
            <Text className="text-sm text-center leading-5" style={{ color: resolvedColors.mutedForeground }}>
              Add people using phone numbers to start conversations and calls.
            </Text>
            <TouchableOpacity
              onPress={() => setIsAddSheetOpen(true)}
              className="mt-5 px-5 py-2.5 rounded-full border border-border/70 bg-background"
            >
              <Text className="text-sm font-medium" style={{ color: resolvedColors.text }}>
                Add your first contact
              </Text>
            </TouchableOpacity>
          </View>
        ) : hasMatches ? (
          <View className="pt-3">
            {onlineContacts.length > 0 ? renderSection("Online now", onlineContacts, true) : null}
            {offlineContacts.length > 0 ? renderSection("Offline", offlineContacts, false) : null}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-lg font-semibold text-foreground">No matches</Text>
            <Text className="text-sm mt-2 text-center" style={{ color: resolvedColors.mutedForeground }}>
              Try searching by name or phone number.
            </Text>
            <TouchableOpacity onPress={handleClearSearch} className="mt-4">
              <Text className="text-sm font-medium text-foreground underline">Clear search</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AddContactSheet
        isOpen={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onAddContact={handleAddContact}
      />
    </SafeAreaView>
  );
}
