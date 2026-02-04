import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface CoachCardSkeletonProps {
  count?: number;
}

export const CoachCardSkeleton = ({ count = 4 }: CoachCardSkeletonProps) => {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-border/30"
        >
          <div className="flex items-start gap-3">
            {/* 头像骨架 */}
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            
            <div className="flex-1 space-y-2">
              {/* 标题骨架 */}
              <Skeleton className="h-5 w-24" />
              
              {/* 描述骨架 */}
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            {/* 箭头骨架 */}
            <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
          </div>
          
          {/* 标签骨架 */}
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// 友好加载提示组件
export const LoadingMessage = ({ message = "正在为您加载专属内容..." }: { message?: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="relative mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full"
        />
        <span className="absolute inset-0 flex items-center justify-center text-lg">✨</span>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </motion.div>
  );
};
