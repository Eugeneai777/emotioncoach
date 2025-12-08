import { useState, useRef, useCallback } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // 触发滑动的距离阈值
  maxSwipe?: number; // 最大滑动距离
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  maxSwipe = 100
}: UseSwipeGestureOptions) => {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsSwiping(true);
    isHorizontalSwipe.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;
    
    // 判断是否为水平滑动
    if (!isHorizontalSwipe.current && Math.abs(diffX) > 10) {
      isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
    }
    
    if (isHorizontalSwipe.current) {
      // 限制滑动范围
      const clampedSwipe = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
      setSwipeDistance(clampedSwipe);
    }
  }, [isSwiping, maxSwipe]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    
    setIsSwiping(false);
    
    if (Math.abs(swipeDistance) >= threshold) {
      if (swipeDistance < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeDistance > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    
    setSwipeDistance(0);
  }, [isSwiping, swipeDistance, threshold, onSwipeLeft, onSwipeRight]);

  const swipeProgress = swipeDistance / maxSwipe;
  const isSwipingLeft = swipeDistance < 0;
  const isSwipingRight = swipeDistance > 0;

  return {
    swipeDistance,
    swipeProgress,
    isSwiping,
    isSwipingLeft,
    isSwipingRight,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    // 用于元素的 style
    swipeStyle: {
      transform: `translateX(${swipeDistance}px)`,
      transition: isSwiping ? 'none' : 'transform 0.3s ease-out'
    }
  };
};
