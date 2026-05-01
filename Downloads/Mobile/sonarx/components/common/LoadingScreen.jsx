
import { View, ActivityIndicator } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
function LoadingScreen({ message, className }) {
    return (<View className={cn("flex-1 items-center justify-center bg-background", className)}>
      <ActivityIndicator size="large" color="hsl(var(--primary))"/>
      {message && <Text className="mt-4 text-muted-foreground">{message}</Text>}
    </View>);
}
export { LoadingScreen };
