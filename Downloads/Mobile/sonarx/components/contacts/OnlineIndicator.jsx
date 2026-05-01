import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatLastSeen } from "@/components/common/chatUtils";
function OnlineIndicator({ isOnline, lastSeen, size = "md", showLabel = false, }) {
    const dotSize = size === "sm" ? 8 : 12;
    const lastSeenText = formatLastSeen(lastSeen);
    return (<View className="flex-row items-center">
      <View className={`rounded-full ${isOnline ? "bg-emerald-400" : "bg-zinc-500"}`} style={{ width: dotSize, height: dotSize }}/>
      {showLabel && (<Text className="ml-1.5 text-xs text-muted-foreground">
          {isOnline
                ? "Online"
                : lastSeen
                    ? lastSeenText
                    : "Offline"}
        </Text>)}
    </View>);
}
export { OnlineIndicator };
