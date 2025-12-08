import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  pullProgress: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  pullProgress,
  isRefreshing,
  threshold = 80
}: PullToRefreshIndicatorProps) => {
  if (pullDistance <= 0 && !isRefreshing) return null;

  const isReady = pullDistance >= threshold;

  return (
    <div 
      className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
      style={{ 
        height: `${Math.max(pullDistance, isRefreshing ? threshold : 0)}px`,
        transition: isRefreshing ? 'height 0.3s ease-out' : 'none'
      }}
    >
      <div 
        className={`flex items-center justify-center w-10 h-10 rounded-full bg-card border border-border shadow-lg transition-all duration-200 ${
          isReady ? 'scale-110 bg-primary/10 border-primary/30' : ''
        }`}
        style={{
          opacity: Math.min(pullProgress * 1.5, 1),
          transform: `rotate(${pullProgress * 180}deg)`
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <ArrowDown 
            className={`w-5 h-5 transition-colors ${
              isReady ? 'text-primary' : 'text-muted-foreground'
            }`} 
          />
        )}
      </div>
    </div>
  );
};
