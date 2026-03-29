import { cn } from "@/lib/utils";
import * as React from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";
import { useColorScheme } from "react-native";
import { Text } from "./text";

const buttonVariants = {
  default: "bg-primary text-primary-foreground",
  destructive: "bg-destructive",
  outline: "border border-input bg-transparent",
  secondary: "bg-secondary",
  ghost: "bg-transparent",
  link: "bg-transparent underline text-primary",
};

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3",
  lg: "h-12 px-6",
  icon: "h-10 w-10",
};

const textVariants = {
  default: "text-primary-foreground",
  destructive: "text-destructive-foreground",
  outline: "text-foreground",
  secondary: "text-secondary-foreground",
  ghost: "text-foreground",
  link: "text-primary underline",
};

interface ButtonProps extends TouchableOpacityProps {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
}

const Button = React.forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      disabled,
      children,
      textClassName,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const colorScheme = useColorScheme();

    return (
      <TouchableOpacity
        ref={ref}
        className={cn(
          "flex-row items-center justify-center rounded-xl",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        style={{ opacity: isDisabled ? 0.6 : 1 }}
        disabled={isDisabled}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={
              variant === "default" || variant === "secondary"
                ? "#111827"
                : colorScheme === "dark"
                  ? "#f5f7fa"
                  : "#1f2937"
            }
          />
        ) : typeof children === "string" ? (
          <Text
            className={cn("font-medium", textVariants[variant], textClassName)}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonSizes, buttonVariants };
export type { ButtonProps };

