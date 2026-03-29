import * as React from "react";
import { View, Image, Text } from "react-native";
import { cn } from "@/lib/utils";

const avatarSizes = {
  sm: 32,
  md: 40,
  lg: 56,
};

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  isOnline?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ uri, name, size = "md", isOnline, className, ...props }, ref) => {
    const dimension = avatarSizes[size];
    const initials = getInitials(name);

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
            className="items-center justify-center rounded-full bg-muted"
            style={{ width: dimension, height: dimension }}
          >
            <Text
              className="font-medium text-muted-foreground"
              style={{ fontSize: dimension * 0.4 }}
            >
              {initials}
            </Text>
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

export { Avatar, avatarSizes, getInitials };
export type { AvatarProps };
