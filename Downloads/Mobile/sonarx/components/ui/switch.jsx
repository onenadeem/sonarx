import { cn } from "@/lib/utils";
import * as React from "react";
import { TouchableOpacity } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, } from "react-native-reanimated";
import { SWITCH_THUMB_CLASS, SWITCH_TRACK_CLASS } from "./styleTokens";
function Switch({ checked, onCheckedChange, disabled = false, className, }) {
    const translateX = useSharedValue(checked ? 20 : 0);
    const trackOpacity = useSharedValue(checked ? 1 : 0);
    React.useEffect(() => {
        translateX.value = withSpring(checked ? 20 : 0, {
            damping: 20,
            stiffness: 200,
        });
        trackOpacity.value = withTiming(checked ? 1 : 0, { duration: 200 });
    }, [checked]);
    const thumbStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));
    return (<TouchableOpacity activeOpacity={disabled ? 1 : 0.8} onPress={() => !disabled && onCheckedChange?.(!checked)} style={{ opacity: disabled ? 0.5 : 1 }} className={cn(SWITCH_TRACK_CLASS, checked ? "bg-primary" : "bg-input", className)}>
      <Animated.View style={[thumbStyle]} className={SWITCH_THUMB_CLASS}/>
    </TouchableOpacity>);
}
export { Switch };
