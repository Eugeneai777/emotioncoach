import { lazy, ComponentType } from 'react';

// Unified session key — shared with main.tsx
export const CHUNK_RELOAD_KEY = 'chunk_reload_attempted';

/**
 * Wrapper around React.lazy that retries chunk loading on failure.
 * In WeChat Mini Program WebViews, network issues can cause chunk loads to fail.
 * This adds automatic retry with exponential backoff.
 * On final failure, attempts a page reload with cache-bust to fetch fresh chunk URLs.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 1500
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(factory, retries, interval));
}

function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('loading chunk') ||
      msg.includes('loading css chunk') ||
      msg.includes('dynamically imported module') ||
      msg.includes('failed to fetch') ||
      msg.includes('importing a module script failed') ||
      msg.includes('unexpected token') ||
      msg.includes('syntax error') ||
      msg.includes('network error') ||
      msg.includes('load failed') ||           // Safari
      msg.includes('error loading') ||          // Safari
      msg.includes('typeerror: failed') ||      // WeChat WebView
      msg.includes('mime type')                 // MIME mismatch on stale chunks
    );
  }
  return false;
}

/** Safely read the reload-attempted map from sessionStorage */
function getReloadedPaths(): Record<string, number> {
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, number>;
    }
    // Legacy or corrupted value — reset
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return {};
  } catch {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return {};
  }
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number,
  interval: number
): Promise<{ default: T }> {
  try {
    const module = await factory();

    // Success — clear any reload mark for this path so future deploys can self-heal
    try {
      const reloadedPaths = getReloadedPaths();
      const currentPath = window.location.pathname;
      if (reloadedPaths[currentPath]) {
        delete reloadedPaths[currentPath];
        if (Object.keys(reloadedPaths).length === 0) {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        } else {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));
        }
      }
    } catch {
      // sessionStorage write failure is non-critical
    }

    return module;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, interval));
      console.warn(
        `[lazyRetry] Chunk load failed, retrying... (${retries} attempts left)`,
        error
      );
      return retryImport(factory, retries - 1, interval * 1.5);
    }

    // All retries exhausted — if it's a chunk error, try a full page reload
    if (isChunkLoadError(error)) {
      const reloadedPaths = getReloadedPaths();
      const currentPath = window.location.pathname;

      if (!reloadedPaths[currentPath]) {
        console.warn('[lazyRetry] Chunk error after retries, reloading page with cache-bust...');
        reloadedPaths[currentPath] = Date.now();
        sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));

        // Cache-bust reload to bypass aggressive CDN / WebView caches
        const url = new URL(window.location.href);
        url.searchParams.set('_cb', Date.now().toString());
        window.location.replace(url.toString());

        // Return a never-resolving promise while the page reloads
        return new Promise(() => {});
      }

      // Already reloaded for this path — clear flag and let error boundary handle it
      delete reloadedPaths[currentPath];
      if (Object.keys(reloadedPaths).length === 0) {
        sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      } else {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));
      }
    }

    throw error;
  }
}

export default lazyRetry;
