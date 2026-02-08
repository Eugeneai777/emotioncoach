import { lazy, ComponentType } from 'react';

// Session key to prevent infinite reload loops
const RELOAD_KEY = 'chunk_reload_attempted';

/**
 * Wrapper around React.lazy that retries chunk loading on failure.
 * In WeChat Mini Program WebViews, network issues can cause chunk loads to fail.
 * This adds automatic retry with exponential backoff.
 * On final failure, attempts a page reload to fetch fresh chunk URLs (handles Vite re-deploys).
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
      msg.includes('unexpected token')
    );
  }
  return false;
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number,
  interval: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error) {
    if (retries > 0) {
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, interval));
      console.warn(
        `[lazyRetry] Chunk load failed, retrying... (${retries} attempts left)`,
        error
      );
      return retryImport(factory, retries - 1, interval * 1.5);
    }

    // All retries exhausted — if it's a chunk error, try a full page reload
    // (handles Vite re-deploys where old chunk hashes are gone)
    if (isChunkLoadError(error)) {
      const reloadedPaths = JSON.parse(sessionStorage.getItem(RELOAD_KEY) || '{}');
      const currentPath = window.location.pathname;

      if (!reloadedPaths[currentPath]) {
        console.warn('[lazyRetry] Chunk error after retries, reloading page for fresh chunks...');
        reloadedPaths[currentPath] = Date.now();
        sessionStorage.setItem(RELOAD_KEY, JSON.stringify(reloadedPaths));
        window.location.reload();
        // Return a never-resolving promise while the page reloads
        return new Promise(() => {});
      }
      // Already reloaded for this path — clear flag and let error boundary handle it
      delete reloadedPaths[currentPath];
      sessionStorage.setItem(RELOAD_KEY, JSON.stringify(reloadedPaths));
    }

    throw error;
  }
}

export default lazyRetry;
