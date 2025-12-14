import { Loader2 } from "lucide-react";

interface LoadMoreIndicatorProps {
  isLoading: boolean;
  hasMore: boolean;
  emptyText?: string;
}

export const LoadMoreIndicator = ({
  isLoading,
  hasMore,
  emptyText = "没有更多了"
}: LoadMoreIndicatorProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-xs text-muted-foreground">{emptyText}</span>
      </div>
    );
  }

  return null;
};
