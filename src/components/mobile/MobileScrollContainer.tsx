import React, { forwardRef, ReactNode } from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { LoadMoreIndicator } from './LoadMoreIndicator';
import { cn } from '@/lib/utils';

interface MobileScrollContainerProps {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
  enablePullToRefresh?: boolean;
  enableInfiniteScroll?: boolean;
  emptyMoreText?: string;
}

export const MobileScrollContainer = forwardRef<HTMLDivElement, MobileScrollContainerProps>(({
  children,
  className,
  onRefresh,
  onLoadMore,
  hasMore = false,
  enablePullToRefresh = true,
  enableInfiniteScroll = true,
  emptyMoreText = "没有更多了"
}, ref) => {
  const {
    containerRef,
    pullDistance,
    pullProgress,
    isRefreshing,
    pullStyle
  } = usePullToRefresh({
    onRefresh: onRefresh || (async () => {}),
    threshold: 80,
    maxPull: 120
  });

  const { sentinelRef, isLoadingMore } = useInfiniteScroll({
    onLoadMore: onLoadMore || (async () => {}),
    hasMore,
    threshold: 200,
    debounceMs: 300
  });

  const showPullToRefresh = enablePullToRefresh && onRefresh;
  const showInfiniteScroll = enableInfiniteScroll && onLoadMore;

  return (
    <div 
      ref={(node) => {
        // 合并refs
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={cn(
        "relative overflow-y-auto overscroll-contain",
        className
      )}
    >
      {/* Pull to Refresh Indicator */}
      {showPullToRefresh && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          pullProgress={pullProgress}
          isRefreshing={isRefreshing}
          threshold={80}
        />
      )}

      {/* Content with pull transform */}
      <div 
        style={showPullToRefresh ? pullStyle : undefined}
        className="min-h-full"
      >
        {children}

        {/* Load More Sentinel & Indicator */}
        {showInfiniteScroll && (
          <>
            <div ref={sentinelRef} className="h-1" />
            <LoadMoreIndicator
              isLoading={isLoadingMore}
              hasMore={hasMore}
              emptyText={emptyMoreText}
            />
          </>
        )}
      </div>
    </div>
  );
});

MobileScrollContainer.displayName = 'MobileScrollContainer';
