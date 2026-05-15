/**
 * Cross-browser idle scheduler.
 * Falls back to setTimeout on Safari / iOS WeChat WebView where requestIdleCallback is missing.
 */
export function runWhenIdle(cb: () => void, timeout = 800): () => void {
  if (typeof window === 'undefined') {
    const id = setTimeout(cb, 1) as unknown as number;
    return () => clearTimeout(id);
  }
  const ric = (window as any).requestIdleCallback as
    | ((cb: () => void, opts?: { timeout?: number }) => number)
    | undefined;
  const cic = (window as any).cancelIdleCallback as ((id: number) => void) | undefined;
  if (ric) {
    const id = ric(cb, { timeout });
    return () => cic?.(id);
  }
  const id = window.setTimeout(cb, 1);
  return () => window.clearTimeout(id);
}
