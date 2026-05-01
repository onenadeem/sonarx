import * as React from "react";
import { Text as RNText } from "react-native";
import { cn } from "@/lib/utils";
import { TEXT_CLASS } from "./styleTokens";
const Text = React.forwardRef(({ className, style, ...props }, ref) => {
    return (<RNText ref={ref} className={cn(TEXT_CLASS, className)} style={style} {...props}/>);
});
Text.displayName = "Text";
export { Text };
