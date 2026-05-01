import * as React from "react";
import { View, Modal, } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";
import { DIALOG_CLASSES } from "./styleTokens";
function Dialog({ isOpen, onClose, title, description, children, className, }) {
    return (<Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View className={DIALOG_CLASSES.overlay} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View className={cn(DIALOG_CLASSES.panel, className)}>
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
