import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatChatMessageTime, getMessageStatusIcon } from "@/components/common/chatUtils";
function MessageBubble({ message, isFromMe, }) {
    return (<View className={cn("max-w-[82%] my-1 px-4 py-2.5 rounded-2xl", isFromMe
            ? "bg-primary self-end rounded-br-md"
            : "bg-card self-start rounded-bl-md border border-border")}>
      <Text className={cn("text-base", isFromMe
            ? "text-primary-foreground"
            : "text-foreground")}>
        {message.body}
      </Text>

      <View className="flex-row items-center justify-end mt-1 space-x-1">
        <Text className={cn("text-xs", isFromMe
            ? "text-primary-foreground/80"
            : "text-muted-foreground")}>
          {formatChatMessageTime(message.sentAt)}
        </Text>
        {isFromMe && (<Ionicons name={getMessageStatusIcon(message.status)} size={12} color={message.status === "read"
                ? "#ffd39a"
                : isFromMe
                    ? "#111827"
                    : "#334155"}/>)}
      </View>
    </View>);
}
export { MessageBubble };
