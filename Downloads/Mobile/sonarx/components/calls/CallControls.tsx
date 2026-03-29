import { View, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleSpeaker: () => void;
  onFlipCamera: () => void;
  onEndCall: () => void;
}

function CallControls({
  isMuted,
  isCameraOff,
  isSpeakerOn,
  onToggleMute,
  onToggleCamera,
  onToggleSpeaker,
  onFlipCamera,
  onEndCall,
}: CallControlsProps) {
  return (
    <View className="flex-row items-center justify-center gap-3 py-4">
      <TouchableOpacity
        onPress={onToggleMute}
        className={cn(
          "w-14 h-14 rounded-full items-center justify-center",
          isMuted ? "bg-destructive" : undefined,
        )}
        style={!isMuted ? { backgroundColor: "rgba(255,255,255,0.2)" } : undefined}
      >
        <Ionicons
          name={isMuted ? "mic-off-outline" : "mic-outline"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleCamera}
        className={cn(
          "w-14 h-14 rounded-full items-center justify-center",
          isCameraOff ? "bg-destructive" : undefined,
        )}
        style={
          !isCameraOff ? { backgroundColor: "rgba(255,255,255,0.2)" } : undefined
        }
      >
        <Ionicons
          name={isCameraOff ? "videocam-off-outline" : "videocam-outline"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onFlipCamera}
        className="w-14 h-14 rounded-full items-center justify-center"
        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <Ionicons
          name="camera-reverse-outline"
          size={22}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onToggleSpeaker}
        className={cn(
          "w-14 h-14 rounded-full items-center justify-center",
          isSpeakerOn ? "bg-primary" : undefined,
        )}
        style={!isSpeakerOn ? { backgroundColor: "rgba(255,255,255,0.2)" } : undefined}
      >
        <Ionicons
          name={isSpeakerOn ? "volume-high-outline" : "volume-mute-outline"}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onEndCall}
        className="w-16 h-16 rounded-full bg-red-500 items-center justify-center"
      >
        <Ionicons name="call-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export { CallControls };
export type { CallControlsProps };
