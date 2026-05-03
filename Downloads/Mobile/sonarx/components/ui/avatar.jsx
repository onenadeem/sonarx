import * as React from "react";
import { View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { AVATAR_SIZES } from "./styleTokens";
const Avatar = React.forwardRef(
  ({ uri, size = "md", isOnline, className, color, ...props }, ref) => {
    const dimension =
      typeof size === "number" ? size : (AVATAR_SIZES[size] ?? AVATAR_SIZES.md);
    return (
      <View
        ref={ref}
        className={cn("relative", className)}
        style={{ width: dimension, height: dimension }}
        {...props}
      >
        {uri ? (
          <Image
            source={{ uri }}
            className="rounded-full"
            style={{ width: dimension, height: dimension }}
          />
        ) : (
          <View
            className="items-center justify-center rounded-full"
            style={{ width: dimension, height: dimension, backgroundColor: color?.surface, borderColor: color?.border, borderWidth: 1, borderRadius: "100%", borderColor: color?.border}}
          >
            <Ionicons
              name="person-outline"
              size={dimension * 0.5}
              color={color?.foreground || "#71717a"}
            />
          </View>
        )}
        {isOnline !== undefined && (
          <View
            className={cn(
              "absolute right-0 bottom-0 rounded-full border border-background",
              isOnline ? "bg-emerald-400" : "bg-zinc-500",
            )}
            style={{
              width: dimension * 0.3,
              height: dimension * 0.3,
            }}
          />
        )}
      </View>
    );
  },
);
Avatar.displayName = "Avatar";
export { Avatar, AVATAR_SIZES as avatarSizes };
