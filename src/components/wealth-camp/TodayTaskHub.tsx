import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TaskItem {
  id: string;
  title: string;
  icon: string;
  points: number;
  completed: boolean;
  locked?: boolean;
  action?: () => void;
  description?: string;
}

interface TodayTaskHubProps {
  tasks: TaskItem[];
  totalEarnedPoints: number;
  totalPossiblePoints: number;
}

export const TodayTaskHub = ({ tasks, totalEarnedPoints, totalPossiblePoints }: TodayTaskHubProps) => {
  const completedCount = tasks.filter(t => t.completed).length;
  const allCompleted = completedCount === tasks.length && tasks.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span>今日任务</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white dark:bg-slate-800 text-xs">
              {completedCount}/{tasks.length}
            </Badge>
            <Badge className="bg-amber-500 text-xs">
              <Zap className="h-3 w-3 mr-0.5" />
              {totalEarnedPoints}/{totalPossiblePoints}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3 space-y-2">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer",
              task.completed 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800" 
                : task.locked
                  ? "bg-muted/30 opacity-50 cursor-not-allowed"
                  : "bg-muted/50 hover:bg-muted border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
            )}
            onClick={task.locked ? undefined : task.action}
          >
            {/* 状态图标 */}
            <div className="shrink-0">
              {task.completed ? (
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              ) : task.locked ? (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-sm">
                  {task.icon}
                </div>
              )}
            </div>

            {/* 任务名称 */}
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-medium text-sm",
                task.completed && "text-emerald-700 dark:text-emerald-300"
              )}>
                {task.title}
              </div>
              {task.description && !task.completed && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {task.description}
                </div>
              )}
            </div>

            {/* 积分 + 操作 */}
            <div className="flex items-center gap-2 shrink-0">
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  task.completed && "border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                )}
              >
                +{task.points}
              </Badge>
              {!task.completed && !task.locked && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </motion.div>
        ))}

        {/* 全部完成提示 */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800"
          >
            <div className="text-xl mb-1">🎉</div>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">今日任务全部完成！</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">获得 {totalEarnedPoints} 积分</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
