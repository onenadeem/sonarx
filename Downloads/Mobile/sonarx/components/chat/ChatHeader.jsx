import { useCallback } from "react";
import { useRouter } from "expo-router";
import { View, TouchableOpacity } from "react-native";
import { Avatar } from "@/components/ui/avatar";
import { Text } from "@/components/ui/text";
import { IconCircleButton } from "@/components/common/IconCircleButton";
import { OnlineIndicator } from "@/components/contacts/OnlineIndicator";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
const ACTION_BUTTON_CLASS = "h-9 w-9 rounded-full bg-muted/40 border border-border/30";
function ChatHeader({ peer, onVideoCall }) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const { isOnline, lastSeen } = useOnlineStatus(peer.id);
    const iconColor = Colors[colorScheme].text;
    const handleBackPress = useCallback(() => {
        router.back();
    }, [router]);
    const handleProfilePress = useCallback(() => {
        router.push(`/profile/${peer.id}`);
    }, [router, peer.id]);
    const handleVideoCall = useCallback(() => {
        onVideoCall?.();
    }, [onVideoCall]);
    return (<View className="flex-row items-center px-4 py-2 border-b border-border/60 bg-background/95">
      <IconCircleButton iconName="chevron-back-outline" iconSize={18} iconColor={iconColor} onPress={handleBackPress} className={`${ACTION_BUTTON_CLASS} mr-2`}/>

      {/* Avatar and Info */}
      <TouchableOpacity className="flex-1 flex-row items-center rounded-xl px-2 py-1.5" onPress={handleProfilePress}>
        <Avatar uri={peer.avatarUri} name={peer.displayName} size="md" isOnline={isOnline}/>
        <View className="ml-3">
          <Text className="font-semibold text-foreground">
            {peer.displayName}
          </Text>
          <OnlineIndicator isOnline={isOnline} lastSeen={lastSeen} size="sm" showLabel/>
        </View>
      </TouchableOpacity>

      {/* Video Call Button */}
      <IconCircleButton iconName="videocam-outline" iconSize={18} iconColor={iconColor} onPress={handleVideoCall} className="h-9 w-9 rounded-full bg-muted/40 border border-border/20"/>
    </View>);
}
export { ChatHeader };
