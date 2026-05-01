import { View, TouchableOpacity } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { OnlineIndicator } from "./OnlineIndicator";
import { formatPhoneDisplay } from "@/lib/phone/format";
import { IconCircleButton } from "@/components/common/IconCircleButton";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
function PeerCard({ peer, isOnline, lastSeen, onChat, onCall, onViewProfile, }) {
    const colorScheme = useColorScheme();
    const actionButtonClass = "h-9 w-9 rounded-full border border-border bg-background";
    return (<TouchableOpacity onPress={onViewProfile} activeOpacity={0.95} className="flex-row items-center p-4 bg-card rounded-2xl border border-border mb-2">
      <Avatar uri={peer.avatarUri} name={peer.displayName} size="lg" isOnline={isOnline}/>

      <View className="flex-1 ml-3">
        <Text className="font-semibold text-base" style={{ color: Colors[colorScheme].text }}>
          {peer.displayName}
        </Text>
        <Text className="text-sm" style={{ color: Colors[colorScheme].mutedForeground }}>
          {formatPhoneDisplay(peer.id)}
        </Text>
        <View className="mt-1">
          <OnlineIndicator isOnline={isOnline} lastSeen={lastSeen} size="sm" showLabel/>
        </View>
      </View>

      <View className="flex-row gap-1">
        <IconCircleButton iconName="chatbubble-outline" iconColor={Colors[colorScheme].text} iconSize={16} onPress={onChat} className={actionButtonClass}/>
        <IconCircleButton iconName="call-outline" iconColor={Colors[colorScheme].text} iconSize={16} onPress={() => onCall(false)} className={actionButtonClass}/>
        <IconCircleButton iconName="videocam-outline" iconColor={Colors[colorScheme].text} iconSize={16} onPress={() => onCall(true)} className={actionButtonClass}/>
      </View>
    </TouchableOpacity>);
}
export { PeerCard };
