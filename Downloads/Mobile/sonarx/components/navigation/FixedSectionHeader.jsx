import { View } from "react-native";
import { Text } from "@/components/ui/text";
function FixedSectionHeader({ label, title, subtitle, accessory, }) {
    return (<View className="px-4 py-2 border-b border-border/60 bg-background/95">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center">
          <View className="mr-3 h-7 w-1 rounded-full bg-primary/70"/>
          <View className="flex-1">
          {label ? (<Text className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {label}
            </Text>) : null}
            <Text className="mt-0.5 text-lg font-semibold text-foreground">
              {title}
            </Text>
          </View>
        </View>
        {accessory ? <View className="ml-2">{accessory}</View> : null}
      </View>
      {subtitle ? (<Text className="mt-1.5 text-xs leading-4 text-muted-foreground">
          {subtitle}
        </Text>) : null}
    </View>);
}
export { FixedSectionHeader };
