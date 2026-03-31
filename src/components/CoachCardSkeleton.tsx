import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface CoachCardSkeletonProps {
  count?: number;
}

export const CoachCardSkeleton = ({ count = 4 }: CoachCardSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-border/30 flex items-center gap-3.5"
        >
          <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
        </motion.div>
      ))}
    </div>
  );
};

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
