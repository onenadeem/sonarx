import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { FIXED_SECTION_HEADER_CLASSES } from "@/components/ui/styleTokens";
function FixedSectionHeader({ label, title, subtitle, accessory, }) {
    return (<View className={FIXED_SECTION_HEADER_CLASSES.root}>
      <View className={FIXED_SECTION_HEADER_CLASSES.row}>
        <View className="flex-1 flex-row items-center">
          <View className={FIXED_SECTION_HEADER_CLASSES.icon}/>
          <View className="flex-1">
          {label ? (<Text className={FIXED_SECTION_HEADER_CLASSES.label}>
              {label}
            </Text>) : null}
            <Text className={FIXED_SECTION_HEADER_CLASSES.title}>
              {title}
            </Text>
          </View>
        </View>
        {accessory ? <View className={FIXED_SECTION_HEADER_CLASSES.accessory}>{accessory}</View> : null}
      </View>
      {subtitle ? (<Text className={FIXED_SECTION_HEADER_CLASSES.subtitle}>
          {subtitle}
        </Text>) : null}
    </View>);
}
export { FixedSectionHeader };
