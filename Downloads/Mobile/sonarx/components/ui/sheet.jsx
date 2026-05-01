import * as React from "react";
import { View, TouchableOpacity, Modal, Dimensions } from "react-native";
import Animated, { useAnimatedStyle, withSpring, useSharedValue, interpolate, runOnJS, } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { cn } from "@/lib/utils";
import { Text } from "./text";
import { SHEET_STYLES } from "./styleTokens";
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DEFAULT_SNAP_POINT = 0.5;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function Sheet({ isOpen, onClose, children, snapPoints = [0.5, 0.9], title, className, }) {
    const resolvedSnapPoint = React.useMemo(() => {
        const firstSnapPoint = snapPoints?.[0];
        const parsedSnapPoint = Number(firstSnapPoint);
        const normalized = Number.isFinite(parsedSnapPoint) ? parsedSnapPoint : DEFAULT_SNAP_POINT;
        return clamp(normalized, 0.05, 1);
    }, [snapPoints]);
    const openTranslateY = React.useMemo(() => SCREEN_HEIGHT * (1 - resolvedSnapPoint), [resolvedSnapPoint]);
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const context = useSharedValue({ y: 0 });
    React.useEffect(() => {
        if (isOpen) {
            translateY.value = withSpring(openTranslateY, SHEET_STYLES.animationConfig);
        }
        else {
            translateY.value = withSpring(SCREEN_HEIGHT, SHEET_STYLES.animationConfig);
        }
    }, [isOpen, openTranslateY]);
    const gesture = Gesture.Pan()
        .onStart(() => {
        context.value = { y: translateY.value };
    })
        .onUpdate((event) => {
        const newY = context.value.y + event.translationY;
        if (newY > 0) {
            translateY.value = newY;
        }
    })
        .onEnd((event) => {
        if (event.translationY > 100 || event.velocityY > 500) {
            translateY.value = withSpring(SCREEN_HEIGHT, SHEET_STYLES.animationConfig, () => {
                if (onClose) {
                    runOnJS(onClose)();
                }
            });
        }
        else {
            translateY.value = withSpring(openTranslateY, SHEET_STYLES.animationConfig);
        }
    });
    const rBottomSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });
    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(translateY.value, [0, SCREEN_HEIGHT], [0.5, 0]),
        };
    });
    return (<Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1, backgroundColor: SHEET_STYLES.backdropColor }, backdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1}/>
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[
            {
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: SCREEN_HEIGHT,
            },
            rBottomSheetStyle,
        ]} className={cn(SHEET_STYLES.panel, className)}>
          <View className="w-full items-center pt-2 pb-4">
            <View className={SHEET_STYLES.handle}/>
          </View>
          {title && (<View className="px-4 pb-4">
              <Text className={SHEET_STYLES.title}>{title}</Text>
            </View>)}
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>);
}
export { Sheet };
