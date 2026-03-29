import * as React from "react";
import { View, TouchableOpacity, Modal, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { cn } from "@/lib/utils";
import { Text } from "./text";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  title?: string;
  className?: string;
}

function Sheet({
  isOpen,
  onClose,
  children,
  snapPoints = [0.5, 0.9],
  title,
  className,
}: SheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const activeSnapPoint = useSharedValue(snapPoints[0]);
  const context = useSharedValue({ y: 0 });

  React.useEffect(() => {
    if (isOpen) {
      translateY.value = withSpring(
        SCREEN_HEIGHT * (1 - activeSnapPoint.value),
        { damping: 25, stiffness: 200 },
      );
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, {
        damping: 25,
        stiffness: 200,
      });
    }
  }, [isOpen, activeSnapPoint]);

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
        translateY.value = withSpring(
          SCREEN_HEIGHT,
          { damping: 25, stiffness: 200 },
          () => {
            runOnJS(onClose)();
          },
        );
      } else {
        translateY.value = withSpring(
          SCREEN_HEIGHT * (1 - activeSnapPoint.value),
          { damping: 25, stiffness: 200 },
        );
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

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[{ flex: 1, backgroundColor: "#000000" }, backdropStyle]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: SCREEN_HEIGHT,
            },
            rBottomSheetStyle,
          ]}
          className={cn(
            "rounded-t-3xl bg-background border-t border-x border-border",
            className,
          )}
        >
          <View className="w-full items-center pt-2 pb-4">
            <View className="w-12 h-1 rounded-full bg-muted" />
          </View>
          {title && (
            <View className="px-4 pb-4">
              <Text className="text-lg font-semibold">{title}</Text>
            </View>
          )}
          {children}
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}

export { Sheet };
export type { SheetProps };
