import * as React from "react";
import { Text as RNText } from "react-native";
import { cn } from "@/lib/utils";
const Text = React.forwardRef(({ className, style, ...props }, ref) => {
    return (<RNText ref={ref} className={cn("text-foreground font-sans", className)} style={style} {...props}/>);
});
Text.displayName = "Text";
export { Text };
