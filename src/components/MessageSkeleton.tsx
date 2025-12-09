import { Skeleton } from "@/components/ui/skeleton";

interface MessageSkeletonProps {
  count?: number;
}

export const MessageSkeleton = ({ count = 3 }: MessageSkeletonProps) => {
  return (
    <div className="space-y-4 py-4">
      {/* AI 消息骨架 */}
      <div className="flex items-start gap-2">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
          <Skeleton className="h-4 w-40 rounded-lg" />
        </div>
      </div>

      {/* 用户消息骨架 */}
      <div className="flex items-start gap-2 justify-end">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-lg ml-auto" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      </div>

      {/* AI 消息骨架 */}
      <div className="flex items-start gap-2">
        <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      {count > 3 && (
        <>
          {/* 用户消息骨架 */}
          <div className="flex items-start gap-2 justify-end">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-lg ml-auto" />
              <Skeleton className="h-4 w-24 rounded-lg ml-auto" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          </div>

          {/* AI 消息骨架 */}
          <div className="flex items-start gap-2">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-64 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-lg" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
