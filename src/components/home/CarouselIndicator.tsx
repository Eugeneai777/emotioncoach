import { cn } from "@/lib/utils";

interface CarouselIndicatorProps {
  total: number;
  current: number;
  hasUpdate?: boolean[];
  onSelect: (index: number) => void;
}

export default function CarouselIndicator({
  total,
  current,
  hasUpdate = [],
  onSelect,
}: CarouselIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onSelect(index)}
          className={cn(
            "relative h-2 rounded-full transition-all duration-300",
            index === current
              ? "w-8 bg-healing-lightGreen"
              : "w-2 bg-healing-sage/30 hover:bg-healing-sage/50"
          )}
          aria-label={`转到第 ${index + 1} 个模块`}
        >
          {hasUpdate[index] && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
