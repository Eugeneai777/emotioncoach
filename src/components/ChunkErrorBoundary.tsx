import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CHUNK_RELOAD_KEY } from '@/utils/lazyRetry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

function detectChunkError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return (
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('dynamically imported module') ||
    msg.includes('failed to fetch') ||
    msg.includes('importing a module script failed') ||
    msg.includes('load failed') ||
    msg.includes('syntax error') ||
    msg.includes('unexpected token') ||
    msg.includes('mime type')
  );
}

/**
 * Error boundary that catches chunk loading failures
 * and provides smart recovery:
 * - Chunk errors: auto-reload once, then show version-update UI
 * - Runtime errors: show generic error UI
 */
class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isChunkError: detectChunkError(error) };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkErrorBoundary] Caught error:', error.message, errorInfo);

    // For chunk errors, attempt one automatic reload
    if (detectChunkError(error)) {
      try {
        const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
        const reloadedPaths: Record<string, number> = raw ? JSON.parse(raw) : {};
        const currentPath = window.location.pathname;

        if (!reloadedPaths[currentPath]) {
          console.warn('[ChunkErrorBoundary] Auto-reloading for chunk error...');
          reloadedPaths[currentPath] = Date.now();
          sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));
          const url = new URL(window.location.href);
          url.searchParams.set('_cb', Date.now().toString());
          window.location.replace(url.toString());
          return;
        }
        // Already reloaded — clear flag so future deploys work
        delete reloadedPaths[currentPath];
        if (Object.keys(reloadedPaths).length === 0) {
          sessionStorage.removeItem(CHUNK_RELOAD_KEY);
        } else {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));
        }
      } catch {
        // sessionStorage failure — fall through to error UI
      }
    }
  }

  handleReload = () => {
    // Force full reload with cache-bust — React.lazy caches failed promises
    // so setState alone cannot recover
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('_cb', Date.now().toString());
      window.location.replace(url.toString());
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            {this.state.isChunkError ? (
              <>
                <span className="text-4xl">🔄</span>
                <h2 className="text-lg font-semibold text-foreground">检测到版本更新</h2>
                <p className="text-sm text-muted-foreground">
                  页面资源已更新，请刷新以加载最新版本
                </p>
              </>
            ) : (
              <>
                <span className="text-4xl">😕</span>
                <h2 className="text-lg font-semibold text-foreground">页面出现异常</h2>
                <p className="text-sm text-muted-foreground">
                  请刷新页面重试，如反复出现请联系客服
                </p>
              </>
            )}
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
