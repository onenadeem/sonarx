import * as React from "react";
import { TextInput, View, Text } from "react-native";
import { cn } from "@/lib/utils";
const Input = React.forwardRef(({ label, error, containerClassName, inputClassName, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    return (<View className={cn("w-full", containerClassName)}>
        {label && (<Text className="mb-1.5 text-sm font-medium text-foreground">
            {label}
          </Text>)}
        <TextInput ref={ref} className={cn("h-11 rounded-xl border border-input bg-card px-3.5 py-2 text-foreground", isFocused && "border-ring ring-1 ring-ring", error && "border-input", inputClassName)} onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
        }} onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
        }} placeholderTextColor="hsl(var(--muted-foreground))" {...props}/>
        {error && (<Text className="mt-1 text-sm text-destructive">{error}</Text>)}
      </View>);
});
Input.displayName = "Input";
export { Input };
