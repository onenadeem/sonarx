import * as React from "react";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence, } from "react-native-reanimated";
import { cn } from "@/lib/utils";
import { SKELETON_CLASS } from "./styleTokens";
function Skeleton({ className, width, height, circle }) {
    const opacity = useSharedValue(0.7);
    React.useEffect(() => {
        opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 800 }), withTiming(0.7, { duration: 800 })), -1, true);
    }, []);
    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));
    return (<Animated.View style={[
            animatedStyle,
            width !== undefined ? { width } : undefined,
            height !== undefined ? { height } : undefined,
            circle ? { borderRadius: 9999 } : undefined,
        ]} className={cn(SKELETON_CLASS, className)}/>);
}
export { Skeleton };
