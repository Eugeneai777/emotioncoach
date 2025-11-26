import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CarouselCardWrapperProps {
  children: ReactNode;
  className?: string;
  background?: string;
  textMode?: "dark" | "light";
}

export default function CarouselCardWrapper({
  children,
  className,
  background = "bg-gradient-to-br from-background via-background/95 to-background/90",
  textMode = "dark",
}: CarouselCardWrapperProps) {
  return (
    <div
      className={cn(
        "h-[280px] rounded-2xl overflow-hidden relative",
        "backdrop-blur-sm border border-border/50",
        "shadow-lg hover:shadow-2xl",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:scale-[1.01]",
        background,
        textMode === "light" && "text-primary-foreground",
        className
      )}
      style={
        background.startsWith("linear-gradient")
          ? { background }
          : undefined
      }
    >
      <div className="h-full w-full p-6 flex flex-col relative z-10">
        {children}
      </div>
    </div>
  );
}
