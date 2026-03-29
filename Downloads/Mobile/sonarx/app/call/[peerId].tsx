import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { db } from "@/db/client";
import { type Peer } from "@/db/schema";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CallScreen() {
  const { peerId } = useLocalSearchParams<{ peerId: string }>();
  const router = useRouter();
  const [peer, setPeer] = useState<Peer | null>(null);

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

  if (!peer) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
      <Avatar uri={peer.avatarUri} name={peer.displayName} size="lg" />
      <Text className="text-foreground text-xl mt-4">{peer.displayName}</Text>
      <Text
        className="text-muted-foreground mt-4 text-center"
        style={{ lineHeight: 22 }}
      >
        Video calls require a development build.{"\n"}
        Run: npx expo run:android
      </Text>
      <View className="mt-8">
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    </SafeAreaView>
  );
}
