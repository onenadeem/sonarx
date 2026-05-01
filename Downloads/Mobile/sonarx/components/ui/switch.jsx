import { cn } from "@/lib/utils";
import * as React from "react";
import { TouchableOpacity } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, } from "react-native-reanimated";
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
    return (<TouchableOpacity activeOpacity={disabled ? 1 : 0.8} onPress={() => !disabled && onCheckedChange(!checked)} style={{ opacity: disabled ? 0.5 : 1 }} className={cn("h-7 w-12 rounded-full p-1", checked ? "bg-primary" : "bg-input", className)}>
      <Animated.View style={[thumbStyle]} className="h-5 w-5 rounded-full bg-background shadow-sm"/>
    </TouchableOpacity>);
}
export { Switch };
