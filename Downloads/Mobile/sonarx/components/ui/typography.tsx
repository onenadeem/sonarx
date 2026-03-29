import * as React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/utils";

interface TypographyProps extends RNTextProps {
  className?: string;
}

const H1 = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(
        "scroll-m-20 text-3xl font-semibold tracking-tight text-foreground font-sans",
        className,
      )}
      {...props}
    />
  ),
);
H1.displayName = "H1";

const H2 = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground first:mt-0 font-sans",
        className,
      )}
      {...props}
    />
  ),
);
H2.displayName = "H2";

const H3 = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(
        "scroll-m-20 text-2xl font-semibold tracking-tight text-foreground font-sans",
        className,
      )}
      {...props}
    />
  ),
);
H3.displayName = "H3";

const H4 = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight text-foreground font-sans",
        className,
      )}
      {...props}
    />
  ),
);
H4.displayName = "H4";

const P = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("leading-7 text-foreground font-sans", className)}
      {...props}
    />
  ),
);
P.displayName = "P";

const Lead = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-xl text-muted-foreground font-sans", className)}
      {...props}
    />
  ),
);
Lead.displayName = "Lead";

const Muted = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-sm text-muted-foreground font-sans", className)}
      {...props}
    />
  ),
);
Muted.displayName = "Muted";

const Small = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn("text-sm font-medium leading-none font-sans", className)}
      {...props}
    />
  ),
);
Small.displayName = "Small";

const Code = React.forwardRef<RNText, TypographyProps>(
  ({ className, ...props }, ref) => (
    <RNText
      ref={ref}
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className,
      )}
      {...props}
    />
  ),
);
Code.displayName = "Code";

export { H1, H2, H3, H4, P, Lead, Muted, Small, Code };
export type { TypographyProps };
