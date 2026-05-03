import * as React from "react";
import { TextInput, View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { INPUT_CLASSES } from "./styleTokens";
const Input = React.forwardRef(({ label, error, containerClassName, inputClassName, ...props }, ref) => {
    return (<View className={cn(INPUT_CLASSES.container, containerClassName)}>
        {label && (<Text className="mb-1.5 text-sm font-medium text-foreground">
            {label}
          </Text>)}
        <TextInput ref={ref} className={cn(INPUT_CLASSES.field, error && INPUT_CLASSES.errorState, inputClassName)} onFocus={props.onFocus} onBlur={props.onBlur} placeholderTextColor="hsl(var(--muted-foreground))" {...props}/>
        {error && (<Text className={INPUT_CLASSES.errorText}>{error}</Text>)}
      </View>);
});
Input.displayName = "Input";
export { Input };
