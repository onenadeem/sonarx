import { cn } from "@/lib/utils";
import * as React from "react";
import { ActivityIndicator, TouchableOpacity, } from "react-native";
import { useColorScheme } from "react-native";
import { Text } from "./text";
import {
  BUTTON_SIZES,
  BUTTON_TEXT_VARIANTS,
  BUTTON_VARIANTS,
  getButtonSpinnerColor,
} from "./styleTokens";
const Button = React.forwardRef(({ className, variant = "default", size = "default", isLoading = false, disabled, children, textClassName, style, ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    const colorScheme = useColorScheme();
    const resolvedVariant = BUTTON_VARIANTS[variant] ? variant : "default";
    const resolvedSize = BUTTON_SIZES[size] ? size : "default";
    return (<TouchableOpacity ref={ref} className={cn("flex-row items-center justify-center rounded-xl", BUTTON_VARIANTS[resolvedVariant], BUTTON_SIZES[resolvedSize], className)} style={[{ opacity: isDisabled ? 0.55 : 1 }, style]} disabled={isDisabled} {...props}>
        {isLoading ? (<ActivityIndicator size="small" color={getButtonSpinnerColor({
                variant: resolvedVariant,
                colorScheme,
            })}/>) : typeof children === "string" ? (<Text className={cn("font-medium", BUTTON_TEXT_VARIANTS[resolvedVariant], textClassName)}>
            {children}
          </Text>) : (children)}
      </TouchableOpacity>);
});
Button.displayName = "Button";
export {
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  BUTTON_SIZES as buttonSizes,
  BUTTON_VARIANTS as buttonVariants,
};
