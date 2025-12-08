import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: React.ReactNode;
  aspectRatio?: "square" | "video" | "auto";
  onLoad?: () => void;
  onError?: () => void;
}

const ProgressiveImage = memo(({
  src,
  alt,
  className,
  containerClassName,
  fallbackIcon,
  aspectRatio = "auto",
  onLoad,
  onError,
}: ProgressiveImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    setLoaded(true);
    onError?.();
  }, [onError]);

  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    auto: "",
  };

  if (error) {
    return (
      <div
        className={cn(
          "relative w-full bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30 flex flex-col items-center justify-center gap-2",
          aspectRatio === "auto" ? "h-40" : aspectClasses[aspectRatio],
          containerClassName
        )}
      >
        {fallbackIcon || <ImageOff className="w-8 h-8 text-muted-foreground/40" />}
        <span className="text-xs text-muted-foreground/60">图片加载失败</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        aspectRatio !== "auto" && aspectClasses[aspectRatio],
        containerClassName
      )}
    >
      {/* 模糊占位符背景 */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-accent/5",
          "transition-opacity duration-500",
          loaded ? "opacity-0" : "opacity-100"
        )}
      >
        {/* 动画脉冲效果 - 使用已有的 shimmer 动画 */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>

      {/* 低分辨率模糊预览 - 使用渐变作为占位 */}
      {!loaded && (
        <div
          className={cn(
            "absolute inset-0",
            "bg-gradient-to-br from-muted/40 via-muted/60 to-muted/40",
            "backdrop-blur-sm",
            aspectRatio === "auto" && "min-h-[160px]"
          )}
        />
      )}

      {/* 实际图片 */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-auto object-cover",
          "transition-all duration-500 ease-out",
          loaded 
            ? "opacity-100 blur-0 scale-100" 
            : "opacity-0 blur-sm scale-105",
          className
        )}
      />
    </div>
  );
});

ProgressiveImage.displayName = "ProgressiveImage";

export default ProgressiveImage;