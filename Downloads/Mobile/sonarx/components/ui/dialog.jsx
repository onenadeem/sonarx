import * as React from "react";
import { View, Modal, } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";
function Dialog({ isOpen, onClose, title, description, children, className, }) {
    return (<Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className={cn("w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-lg", className)}>
          {title && (<Text className="text-lg font-semibold text-foreground">
              {title}
            </Text>)}
          {description && (<Text className="mt-2 text-sm text-muted-foreground">
              {description}
            </Text>)}
          {children && <View className="mt-4">{children}</View>}
        </View>
      </View>
    </Modal>);
}
const DialogContent = React.forwardRef(({ className, ...props }, ref) => (<View ref={ref} className={cn("", className)} {...props}/>));
DialogContent.displayName = "DialogContent";
export { Dialog, DialogContent };
