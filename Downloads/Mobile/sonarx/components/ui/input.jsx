import * as React from "react";
import { TextInput, View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { INPUT_CLASSES } from "./styleTokens";
const Input = React.forwardRef(({ label, error, containerClassName, inputClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (<View className={cn(INPUT_CLASSES.container, containerClassName)}>
        {label && (<Text className="mb-1.5 text-sm font-medium text-foreground">
            {label}
          </Text>)}
        <TextInput ref={ref} className={cn(INPUT_CLASSES.field, isFocused && INPUT_CLASSES.focus, error && INPUT_CLASSES.errorState, inputClassName)} onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
        }} onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
        }} placeholderTextColor="hsl(var(--muted-foreground))" {...props}/>
        {error && (<Text className={INPUT_CLASSES.errorText}>{error}</Text>)}
      </View>);
});
Input.displayName = "Input";
export { Input };
