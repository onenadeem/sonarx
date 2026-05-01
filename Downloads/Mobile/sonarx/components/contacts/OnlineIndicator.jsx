import { View } from "react-native";
import { Text } from "@/components/ui/text";
function OnlineIndicator({ isOnline, lastSeen, size = "md", showLabel = false, }) {
    const dotSize = size === "sm" ? 8 : 12;
    const formatLastSeen = (date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1)
            return "just now";
        if (diffMins < 60)
            return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24)
            return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };
    return (<View className="flex-row items-center">
      <View className={`rounded-full ${isOnline ? "bg-emerald-400" : "bg-zinc-500"}`} style={{ width: dotSize, height: dotSize }}/>
      {showLabel && (<Text className="ml-1.5 text-xs text-muted-foreground">
          {isOnline
                ? "Online"
                : lastSeen
                    ? formatLastSeen(lastSeen)
                    : "Offline"}
        </Text>)}
    </View>);
}
export { OnlineIndicator };
