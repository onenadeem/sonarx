import * as React from "react";
import { View, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "../ui/text";

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

function LoadingScreen({ message, className }: LoadingScreenProps) {
  return (
    <View
      className={cn(
        "flex-1 items-center justify-center bg-background",
        className,
      )}
    >
      <ActivityIndicator size="large" color="hsl(var(--primary))" />
      {message && <Text className="mt-4 text-muted-foreground">{message}</Text>}
    </View>
  );
}

export { LoadingScreen };
export type { LoadingScreenProps };
