import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievementProgress } from '@/hooks/useAchievementProgress';
import { Skeleton } from '@/components/ui/skeleton';

interface NextGoalsRowProps {
  className?: string;
}

export function NextGoalsRow({ className }: NextGoalsRowProps) {
  const { paths, isLoading } = useAchievementProgress();

  if (isLoading) {
    return (
      <Card className={cn("shadow-sm", className)}>
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <Target className="w-4 h-4 text-amber-500" />
            目标
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2.5">
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <CardHeader className="py-2 px-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border/30">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Target className="w-4 h-4 text-amber-500" />
          目标
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2.5">
        <div className="grid grid-cols-4 gap-1.5">
          {paths.map((path, index) => (
            <motion.div
              key={path.key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-1.5 rounded-lg border text-center",
                path.nextAchievement 
                  ? [path.theme.bgActive, path.theme.border]
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
              )}
            >
              {path.nextAchievement ? (
                <>
                  {/* 成就图标 */}
                  <motion.span 
                    className="text-base block"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  >
                    {path.nextAchievement.icon}
                  </motion.span>
                  
                  {/* 成就名称 */}
                  <p className="text-[9px] font-medium truncate mt-0.5 leading-tight">
                    {path.nextAchievement.name}
                  </p>
                  
                  {/* 进度条 */}
                  <div className="mt-1">
                    <div className="h-1 bg-white/50 dark:bg-slate-900/50 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full bg-gradient-to-r", path.theme.gradient)}
                        initial={{ width: 0 }}
                        animate={{ width: `${path.nextAchievement.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <p className={cn("text-[8px] font-semibold mt-0.5", path.theme.text)}>
                      {path.nextAchievement.remainingText}
                    </p>
                  </div>
                </>
              ) : (
                /* 已完成状态 */
                <div className="py-1">
                  <motion.span 
                    className="text-base block"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  >
                    🎉
                  </motion.span>
                  <span className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400">
                    已完成
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
