import { lazy, ComponentType } from 'react';

/**
 * Wrapper around React.lazy that retries chunk loading on failure.
 * In WeChat Mini Program WebViews, network issues can cause chunk loads to fail.
 * This adds automatic retry with exponential backoff.
 */
export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => retryImport(factory, retries, interval));
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number,
  interval: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }

    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, interval));

    console.warn(
      `[lazyRetry] Chunk load failed, retrying... (${retries} attempts left)`,
      error
    );

    return retryImport(factory, retries - 1, interval * 1.5);
  }
}

export default lazyRetry;
