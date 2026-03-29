import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "@/components/ui/text";
import { db } from "@/db/client";
import { getOrCreateConversation } from "@/db/queries";
import { type Peer } from "@/db/schema";
import { useMessages, useSendMessage } from "@/lib/hooks/useMessages";
import { usePeer } from "@/lib/hooks/usePeer";
import { useIdentityStore } from "@/stores/identity.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { peerId } = useLocalSearchParams<{ peerId: string }>();
  const router = useRouter();
  const [peer, setPeer] = useState<Peer | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const identity = useIdentityStore((state) => state.identity);
  const { isConnected, connect } = usePeer(peerId);
  const { messages, isLoading } = useMessages(conversationId);
  const { sendMessage } = useSendMessage(peerId);

  useEffect(() => {
    async function loadPeer() {
      const peerData = await db.query.peers.findFirst({
        where: (peers, { eq }) => eq(peers.id, peerId),
      });
      if (peerData) {
        setPeer(peerData);
      }
    }
    loadPeer();
  }, [peerId]);

  useEffect(() => {
    async function initConversation() {
      const conv = await getOrCreateConversation(peerId);
      setConversationId(conv.id);
    }
    initConversation();
  }, [peerId]);

  useEffect(() => {
    if (!isConnected && peerId) {
      connect();
    }
  }, [peerId, isConnected, connect]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!conversationId) return;
      await sendMessage(text);
    },
    [conversationId, sendMessage],
  );

  const handleAttachment = useCallback(() => {
    console.log("Open attachment picker");
  }, []);

  const handleVideoCall = useCallback(() => {
    router.push(`/call/${peerId}`);
  }, [peerId, router]);

  if (!peer) {
    return <LoadingScreen message="Loading..." />;
  }

  const isFromMe = (msg: (typeof messages)[0]) =>
    msg.peerId === identity?.phoneNumber;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}
      >
        <ChatHeader peer={peer} onVideoCall={handleVideoCall} />

        {!isConnected && (
          <View className="mx-4 mt-2 rounded-xl border border-border/40 bg-background/70 px-4 py-2">
            <View className="flex-row items-center">
              <Ionicons
                name="warning-outline"
                size={18}
                color="#f59e0b"
                style={{ marginRight: 8 }}
              />
              <Text className="text-yellow-900 dark:text-yellow-200 text-sm">
                WebRTC not available in Expo Go. Build a development version
                for messaging.
              </Text>
            </View>
          </View>
        )}

        <FlatList
          className="flex-1 px-4"
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isFromMe={isFromMe(item)} />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />

        <MessageInput
          onSend={handleSend}
          onAttachment={handleAttachment}
          placeholder="Type a message..."
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
