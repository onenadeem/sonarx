
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
const badgeVariants = {
    default: "bg-primary",
    secondary: "bg-secondary",
    destructive: "bg-destructive",
    outline: "border border-input bg-transparent",
};
const badgeTextVariants = {
    default: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    destructive: "text-destructive-foreground",
    outline: "text-foreground",
};
function Badge({ variant = "default", children, className }) {
    return (<View className={cn("items-center justify-center rounded-full px-2 py-0.5", badgeVariants[variant], className)}>
      {typeof children === "string" || typeof children === "number" ? (<Text className={cn("text-xs font-medium", badgeTextVariants[variant])}>
          {children}
        </Text>) : (children)}
    </View>);
}
export { Badge, badgeVariants, badgeTextVariants };
