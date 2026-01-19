import { Skeleton } from '@/components/ui/skeleton';

interface ShareCardSkeletonProps {
  variant?: 'standard' | 'compact' | 'wide';
}

/**
 * 分享卡片加载骨架屏
 * - standard: 320px 宽度，用于财富测评、训练营卡片
 * - compact: 300px 宽度，用于简洁版介绍卡片
 * - wide: 420px 宽度，用于死了吗、情绪按钮等工具卡片
 */
export function ShareCardSkeleton({ variant = 'standard' }: ShareCardSkeletonProps) {
  const widthClass = {
    standard: 'w-[320px]',
    compact: 'w-[300px]',
    wide: 'w-[420px]',
  }[variant];

  return (
    <div className={`${widthClass} rounded-2xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted animate-pulse`}>
      {/* Header */}
      <div className="p-5 space-y-4">
        {/* Avatar and name */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        
        {/* Title section */}
        <div className="text-center space-y-2 pt-2">
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-3 w-48 mx-auto" />
        </div>
        
        {/* Content area */}
        <div className="space-y-3 py-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
          {variant === 'wide' && (
            <>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </>
          )}
        </div>
        
        {/* QR Code area */}
        <div className="flex items-center gap-4 p-4 bg-background/30 rounded-xl">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="w-20 h-20 rounded-lg" />
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-foreground/5 px-5 py-3">
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}

export default ShareCardSkeleton;
