import { useState, useCallback } from "react";
import { View, TextInput, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

interface MessageInputProps {
  onSend: (text: string) => void;
  onAttachment: () => void;
  onVoiceRecord?: (isRecording: boolean) => void;
  placeholder?: string;
  className?: string;
}

function MessageInput({
  onSend,
  onAttachment,
  onVoiceRecord,
  placeholder = "Type a message...",
  className,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = useCallback(() => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  }, [text, onSend]);

  const handleVoicePress = useCallback(() => {
    if (onVoiceRecord) {
      setIsRecording(!isRecording);
      onVoiceRecord(!isRecording);
    }
  }, [isRecording, onVoiceRecord]);

  const colorScheme = useColorScheme();

  return (
    <View
      className={cn(
        "flex-row items-end px-4 py-3 bg-background border-t border-border",
        className,
      )}
    >
      {/* Attachment Button */}
      <TouchableOpacity
        onPress={onAttachment}
        className="p-2 mr-2 rounded-full bg-muted border border-border"
      >
        <Ionicons
          name="attach-outline"
          size={18}
          color={Colors[colorScheme].text}
        />
      </TouchableOpacity>

      {/* Text Input */}
      <View className="flex-1 bg-card rounded-3xl px-4 py-2.5 max-h-32 border border-border">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="hsl(var(--muted-foreground))"
          multiline
          maxLength={2000}
          className="text-foreground"
          style={{ maxHeight: 100 }}
        />
      </View>

      {/* Voice/Send Button */}
      <TouchableOpacity
        onPress={text.trim() ? handleSend : handleVoicePress}
        className={cn(
          "p-2.5 ml-2 rounded-full",
          text.trim() ? "bg-primary" : "bg-muted",
        )}
      >
        <Ionicons
          name={text.trim() ? "send-outline" : "mic-outline"}
          size={20}
          color={text.trim() ? Colors[colorScheme].background : Colors[colorScheme].text}
        />
      </TouchableOpacity>
    </View>
  );
}

export { MessageInput };
export type { MessageInputProps };
