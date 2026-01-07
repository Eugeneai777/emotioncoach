import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 容器最大宽度 - 默认适中 */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** 是否添加水平内边距 */
  padded?: boolean;
  /** 是否居中 */
  centered?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm sm:max-w-md",
  md: "max-w-sm sm:max-w-xl md:max-w-2xl",
  lg: "max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-4xl",
  xl: "max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl",
  full: "max-w-full",
};

const ResponsiveContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveContainerProps
>(({ className, size = "md", padded = true, centered = true, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        sizeClasses[size],
        padded && "px-3 sm:px-4 md:px-6",
        centered && "mx-auto",
        className
      )}
      {...props}
    />
  );
});

ResponsiveContainer.displayName = "ResponsiveContainer";

export { ResponsiveContainer };
