import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  interactive?: boolean;
}

const MobileCard = React.forwardRef<HTMLDivElement, MobileCardProps>(
  ({ children, className, noPadding, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-card rounded-xl shadow-sm border border-border/50",
        !noPadding && "p-3 sm:p-4",
        interactive && "active:scale-[0.98] transition-transform cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
MobileCard.displayName = "MobileCard";

interface MobileCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const MobileCardHeader = React.forwardRef<HTMLDivElement, MobileCardHeaderProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 mb-2", className)}
      {...props}
    >
      {children}
    </div>
  )
);
MobileCardHeader.displayName = "MobileCardHeader";

interface MobileCardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const MobileCardTitle = React.forwardRef<HTMLHeadingElement, MobileCardTitleProps>(
  ({ children, className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-sm font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </h3>
  )
);
MobileCardTitle.displayName = "MobileCardTitle";

interface MobileCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const MobileCardContent = React.forwardRef<HTMLDivElement, MobileCardContentProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
);
MobileCardContent.displayName = "MobileCardContent";

export { MobileCard, MobileCardHeader, MobileCardTitle, MobileCardContent };
