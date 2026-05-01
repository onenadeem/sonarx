import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import Ionicons from "@expo/vector-icons/Ionicons";
import { formatFileSize, getFileTransferStatusMeta } from "@/components/common/chatUtils";
function FileTransferProgress({ fileName, fileSize, progress, status, direction, onCancel, onRetry, onOpen, className, }) {
    const isComplete = status === "complete";
    const isFailed = status === "failed";
    const isTransferring = status === "transferring";
    const statusMeta = getFileTransferStatusMeta(status, direction);
    return (<View className={cn("bg-card border border-border rounded-lg p-3", isComplete && "border-border", isFailed && "border-border", className)}>
      {/* File Info */}
      <View className="flex-row items-center">
        <View className={cn("w-10 h-10 rounded-lg items-center justify-center", statusMeta.iconBgClass)}>
          <Ionicons name={statusMeta.iconName} size={16} color={statusMeta.iconColor}/>
        </View>

        <View className="flex-1 ml-3">
          <Text className="font-medium text-foreground" numberOfLines={1}>
            {fileName}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {formatFileSize(fileSize)}
          </Text>
        </View>

        {/* Action Button */}
        {isTransferring && onCancel && (<Button variant="ghost" size="icon" onPress={onCancel}>
            <Ionicons name="close-outline" size={16} color="#ef4444"/>
          </Button>)}
        {isFailed && onRetry && (<Button variant="ghost" size="icon" onPress={onRetry}>
            <Ionicons name="refresh-outline" size={16} color="#4b5563"/>
          </Button>)}
        {isComplete && onOpen && (<Button variant="ghost" size="icon" onPress={onOpen}>
            <Ionicons name="folder-open-outline" size={16} color="#4b5563"/>
          </Button>)}
      </View>

      {/* Progress Bar */}
      {isTransferring && (<View className="mt-3">
          <View className="h-2 bg-muted rounded-full overflow-hidden">
            <View className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}/>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-xs text-muted-foreground">{progress}%</Text>
            <Text className="text-xs text-muted-foreground">
              {formatFileSize((fileSize * progress) / 100)} /{" "}
              {formatFileSize(fileSize)}
            </Text>
          </View>
        </View>)}

      {/* Status Text */}
      {status !== "complete" &&
            status !== "failed" &&
            status !== "cancelled" && (<Text className="text-xs text-muted-foreground mt-1">
            {direction === "upload" ? "Sending..." : "Receiving..."}
          </Text>)}
    </View>);
}
export { FileTransferProgress };
