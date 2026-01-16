import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface HorizontalScrollHintProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showHint?: boolean;
  hintPosition?: "right" | "both";
  fadeWidth?: string;
}

export function HorizontalScrollHint({
  children,
  className,
  showHint = true,
  hintPosition = "right",
  fadeWidth = "w-8",
  ...props
}: HorizontalScrollHintProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showRightHint, setShowRightHint] = React.useState(true);
  const [showLeftHint, setShowLeftHint] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isAtStart = scrollLeft <= 5;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
    
    setShowLeftHint(!isAtStart && hintPosition === "both");
    setShowRightHint(!isAtEnd);
  }, [hintPosition]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // 初始检查
    checkScroll();

    // 监听滚动
    el.addEventListener("scroll", checkScroll, { passive: true });
    
    // 监听窗口大小变化
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  if (!showHint) {
    return (
      <div
        ref={scrollRef}
        className={cn("overflow-x-auto scrollbar-hide", className)}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="relative" {...props}>
      {/* 滚动容器 */}
      <div
        ref={scrollRef}
        className={cn("overflow-x-auto scrollbar-hide", className)}
      >
        {children}
      </div>

      {/* 左侧渐变遮罩 */}
      {hintPosition === "both" && showLeftHint && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 bg-gradient-to-r from-background to-transparent pointer-events-none z-10",
            fadeWidth
          )}
        />
      )}

      {/* 右侧渐变遮罩 + 箭头提示 */}
      {showRightHint && (
        <div
          className={cn(
            "absolute right-0 top-0 bottom-0 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10 flex items-center justify-end pr-1",
            fadeWidth
          )}
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground animate-pulse" />
        </div>
      )}
    </div>
  );
}
