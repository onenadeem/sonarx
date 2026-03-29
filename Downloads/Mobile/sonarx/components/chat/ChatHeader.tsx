import { useRouter } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { OnlineIndicator } from "@/components/contacts/OnlineIndicator";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import type { Peer } from "@/db/schema";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

interface ChatHeaderProps {
  peer: Peer;
  onVideoCall: () => void;
}

function ChatHeader({ peer, onVideoCall }: ChatHeaderProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { isOnline, lastSeen } = useOnlineStatus(peer.id);

  return (
    <View className="flex-row items-center px-4 py-2 border-b border-border/60 bg-background/95">
      <Button
        variant="ghost"
        size="icon"
        onPress={() => router.back()}
        className="h-9 w-9 rounded-full bg-muted/40 border border-border/30 mr-2"
      >
        <Ionicons
          name="chevron-back-outline"
          size={18}
          color={Colors[colorScheme].text}
        />
      </Button>

      {/* Avatar and Info */}
      <TouchableOpacity
        className="flex-1 flex-row items-center rounded-xl px-2 py-1.5"
        onPress={() => router.push(`/profile/${peer.id}` as any)}
      >
        <Avatar
          uri={peer.avatarUri}
          name={peer.displayName}
          size="md"
          isOnline={isOnline}
        />
        <View className="ml-3">
          <Text className="font-semibold text-foreground">
            {peer.displayName}
          </Text>
          <OnlineIndicator
            isOnline={isOnline}
            lastSeen={lastSeen}
            size="sm"
            showLabel
          />
        </View>
      </TouchableOpacity>

      {/* Video Call Button */}
      <Button
        variant="ghost"
        size="icon"
        onPress={onVideoCall}
        className="h-9 w-9 rounded-full bg-muted/40 border border-border/20"
      >
        <Ionicons
          name="videocam-outline"
          size={18}
          color={Colors[colorScheme].text}
        />
      </Button>
    </View>
  );
}

export { ChatHeader };
export type { ChatHeaderProps };
