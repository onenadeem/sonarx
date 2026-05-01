import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";
import { hexToEmoji } from "@/lib/crypto/fingerprint";
function FingerprintDisplay({ fingerprint, showLabel = true, className, }) {
    const emojiGroups = hexToEmoji(fingerprint);
    return (<View className={cn("items-center", className)}>
      {showLabel && (<Text className="text-sm text-muted-foreground mb-3">
          Security Verification
        </Text>)}
      <View className="bg-muted rounded-lg p-4">
        <View className="flex-row flex-wrap justify-center gap-2">
          {emojiGroups.map((group, groupIndex) => (<View key={groupIndex} className="flex-row gap-1">
              {group.map((emoji, emojiIndex) => (<Text key={`${groupIndex}-${emojiIndex}`} className="text-2xl">
                  {emoji}
                </Text>))}
            </View>))}
        </View>
      </View>
      <Text className="text-xs text-muted-foreground mt-2 text-center">
        Verify this matches on both devices
      </Text>
    </View>);
}
export { FingerprintDisplay };
