
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { BADGE_VARIANTS, BADGE_TEXT_VARIANTS } from "./styleTokens";
function Badge({ variant = "default", children, className }) {
    const safeVariant = BADGE_VARIANTS[variant] ? variant : "default";
    return (<View className={cn("items-center justify-center rounded-full px-2 py-0.5", BADGE_VARIANTS[safeVariant], className)}>
      {typeof children === "string" || typeof children === "number" ? (<Text className={cn("text-xs font-medium", BADGE_TEXT_VARIANTS[safeVariant])}>
          {children}
        </Text>) : (children)}
    </View>);
}
export {
  Badge,
  BADGE_VARIANTS,
  BADGE_TEXT_VARIANTS,
  BADGE_VARIANTS as badgeVariants,
  BADGE_TEXT_VARIANTS as badgeTextVariants,
};
