import { View, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { OnlineIndicator } from "./OnlineIndicator";
import { formatPhoneDisplay } from "@/lib/phone/format";
import type { Peer } from "@/db/schema";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

interface PeerCardProps {
  peer: Peer;
  isOnline: boolean;
  lastSeen?: Date | null;
  onChat: () => void;
  onCall: (withVideo: boolean) => void;
  onViewProfile: () => void;
}

function PeerCard({
  peer,
  isOnline,
  lastSeen,
  onChat,
  onCall,
  onViewProfile,
}: PeerCardProps) {
  const colorScheme = useColorScheme();

  return (
    <TouchableOpacity
      onPress={onViewProfile}
      activeOpacity={0.95}
      className="flex-row items-center p-4 bg-card rounded-2xl border border-border mb-2"
    >
      <Avatar
        uri={peer.avatarUri}
        name={peer.displayName}
        size="lg"
        isOnline={isOnline}
      />

      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base" style={{ color: Colors[colorScheme].text }}>
          {peer.displayName}
        </Text>
        <Text className="text-sm" style={{ color: Colors[colorScheme].mutedForeground }}>
          {formatPhoneDisplay(peer.id)}
        </Text>
        <View className="mt-1">
          <OnlineIndicator
            isOnline={isOnline}
            lastSeen={lastSeen}
            size="sm"
            showLabel
          />
        </View>
      </View>

      <View className="flex-row gap-1">
        <TouchableOpacity
          onPress={onChat}
          className="h-9 w-9 rounded-full border border-border bg-background items-center justify-center"
        >
          <Ionicons name="chatbubble-outline" size={16} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onCall(false)}
          className="h-9 w-9 rounded-full border border-border bg-background items-center justify-center"
        >
          <Ionicons name="call-outline" size={16} color={Colors[colorScheme].text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onCall(true)}
          className="h-9 w-9 rounded-full border border-border bg-background items-center justify-center"
        >
          <Ionicons name="videocam-outline" size={16} color={Colors[colorScheme].text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export { PeerCard };
export type { PeerCardProps };
