import { useState, useRef, useCallback, useEffect } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  threshold?: number; // 距离底部多少px时触发加载
  debounceMs?: number; // 防抖时间
}

export const useInfiniteScroll = ({
  onLoadMore,
  hasMore,
  threshold = 200,
  debounceMs = 300
}: UseInfiniteScrollOptions) => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // IntersectionObserver for sentinel element
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      sentinelRef.current = node;
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
            // 防抖
            if (loadMoreTimeoutRef.current) {
              clearTimeout(loadMoreTimeoutRef.current);
            }
            loadMoreTimeoutRef.current = setTimeout(() => {
              loadMore();
            }, debounceMs);
          }
        },
        {
          rootMargin: `${threshold}px`,
          threshold: 0.1
        }
      );
      observerRef.current.observe(node);
    }
  }, [hasMore, isLoadingMore, loadMore, threshold, debounceMs]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, []);

  return {
    sentinelRef: setSentinelRef,
    isLoadingMore
  };
};
