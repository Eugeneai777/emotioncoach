import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that catches chunk loading failures
 * and provides a user-friendly retry UI.
 */
class ChunkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ChunkErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <span className="text-4xl">😕</span>
            <h2 className="text-lg font-semibold text-foreground">页面加载失败</h2>
            <p className="text-sm text-muted-foreground">
              网络不稳定导致加载失败，请重试
            </p>
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 rounded-full border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
