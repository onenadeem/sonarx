import { View, TouchableOpacity } from "react-native";
import { cn } from "@/lib/utils";
import Ionicons from "@expo/vector-icons/Ionicons";

const mutedControlStyle = { backgroundColor: "rgba(255,255,255,0.2)" };
const controlButtonClass = "w-14 h-14 rounded-full items-center justify-center";
function CallControls({ isMuted, isCameraOff, isSpeakerOn, onToggleMute, onToggleCamera, onToggleSpeaker, onFlipCamera, onEndCall, }) {
    return (<View className="flex-row items-center justify-center gap-3 py-4">
      <TouchableOpacity onPress={onToggleMute} className={cn(controlButtonClass, isMuted ? "bg-destructive" : undefined)} style={!isMuted ? mutedControlStyle : undefined}>
        <Ionicons name={isMuted ? "mic-off-outline" : "mic-outline"} size={22} color="#fff"/>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleCamera} className={cn(controlButtonClass, isCameraOff ? "bg-destructive" : undefined)} style={!isCameraOff ? mutedControlStyle : undefined}>
        <Ionicons name={isCameraOff ? "videocam-off-outline" : "videocam-outline"} size={22} color="#fff"/>
      </TouchableOpacity>

      <TouchableOpacity onPress={onFlipCamera} className={controlButtonClass} style={mutedControlStyle}>
        <Ionicons name="camera-reverse-outline" size={22} color="#fff"/>
      </TouchableOpacity>

      <TouchableOpacity onPress={onToggleSpeaker} className={cn(controlButtonClass, isSpeakerOn ? "bg-primary" : undefined)} style={!isSpeakerOn ? mutedControlStyle : undefined}>
        <Ionicons name={isSpeakerOn ? "volume-high-outline" : "volume-mute-outline"} size={22} color="#fff"/>
      </TouchableOpacity>

      <TouchableOpacity onPress={onEndCall} className="w-16 h-16 rounded-full bg-red-500 items-center justify-center">
        <Ionicons name="call-outline" size={26} color="#fff"/>
      </TouchableOpacity>
    </View>);
}
export { CallControls };
