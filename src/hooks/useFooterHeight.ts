import { useState, useEffect, useRef, useCallback, RefObject } from "react";

/**
 * Hook to dynamically calculate footer height and provide appropriate padding
 * for the main content area to prevent content from being hidden behind fixed footers
 */
export function useFooterHeight() {
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [safeAreaBottom, setSafeAreaBottom] = useState(0);

  // Calculate safe area inset on mount
  useEffect(() => {
    const computeSafeArea = () => {
      // Get safe area inset from CSS environment variable
      const testEl = document.createElement("div");
      testEl.style.cssText = "position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);visibility:hidden;";
      document.body.appendChild(testEl);
      const safeArea = testEl.getBoundingClientRect().height;
      document.body.removeChild(testEl);
      setSafeAreaBottom(safeArea);
    };

    computeSafeArea();
    window.addEventListener("resize", computeSafeArea);
    window.addEventListener("orientationchange", computeSafeArea);

    return () => {
      window.removeEventListener("resize", computeSafeArea);
      window.removeEventListener("orientationchange", computeSafeArea);
    };
  }, []);

  // Observe footer height changes
  useEffect(() => {
    if (!footerRef.current) return;

    const updateHeight = () => {
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setFooterHeight(rect.height);
      }
    };

    // Initial measurement
    updateHeight();

    // Use ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(footerRef.current);

    // Also listen for window resize and orientation changes
    window.addEventListener("resize", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);

  // Calculate total padding needed (footer height + some buffer for smooth scrolling)
  const contentPaddingBottom = footerHeight + 16; // 16px extra buffer

  return {
    footerRef,
    footerHeight,
    safeAreaBottom,
    contentPaddingBottom,
    // Inline style to apply to main content
    contentStyle: {
      paddingBottom: `${contentPaddingBottom}px`,
    },
  };
}

/**
 * Simpler hook that just provides a ref and returns the measured height
 */
export function useMeasuredHeight<T extends HTMLElement = HTMLDivElement>(): [
  RefObject<T>,
  number
] {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.getBoundingClientRect().height);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(ref.current);

    return () => resizeObserver.disconnect();
  }, []);

  return [ref, height];
}
