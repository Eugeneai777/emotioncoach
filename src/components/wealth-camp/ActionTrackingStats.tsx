import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, CheckCircle2, Clock, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ActionEntry {
  id: string;
  day_number: number;
  giving_action?: string | null;
  action_completed_at?: string | null;
  action_reflection?: string | null;
  action_difficulty?: number | null;
  created_at: string;
}

interface ActionTrackingStatsProps {
  entries: ActionEntry[];
  showDetails?: boolean;
}

export function ActionTrackingStats({ entries, showDetails = true }: ActionTrackingStatsProps) {
  const stats = useMemo(() => {
    const actionsWithGiving = entries.filter(e => e.giving_action);
    const completedActions = actionsWithGiving.filter(e => e.action_completed_at);
    const pendingActions = actionsWithGiving.filter(e => !e.action_completed_at);
    
    const totalDifficulty = completedActions.reduce((sum, e) => sum + (e.action_difficulty || 0), 0);
    const avgDifficulty = completedActions.length > 0 
      ? (totalDifficulty / completedActions.length).toFixed(1)
      : '0.0';
    
    const completionRate = actionsWithGiving.length > 0 
      ? Math.round((completedActions.length / actionsWithGiving.length) * 100)
      : 0;

    return {
      total: actionsWithGiving.length,
      completed: completedActions.length,
      pending: pendingActions.length,
      avgDifficulty,
      completionRate,
      actions: actionsWithGiving.sort((a, b) => b.day_number - a.day_number),
    };
  }, [entries]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
          <Gift className="w-5 h-5" />
          给予行动追踪
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg">
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.total}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">总行动</p>
          </div>
          <div className="text-center p-2 bg-green-100/70 dark:bg-green-900/30 rounded-lg">
            <p className="text-xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
            <p className="text-xs text-green-600 dark:text-green-400">已完成</p>
          </div>
          <div className="text-center p-2 bg-amber-100/70 dark:bg-amber-900/30 rounded-lg">
            <p className="text-xl font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">待完成</p>
          </div>
          <div className="text-center p-2 bg-teal-100/70 dark:bg-teal-900/30 rounded-lg">
            <p className="text-xl font-bold text-teal-700 dark:text-teal-300">{stats.completionRate}%</p>
            <p className="text-xs text-teal-600 dark:text-teal-400">完成率</p>
          </div>
        </div>

        {/* Average Difficulty */}
        {stats.completed > 0 && (
          <div className="flex items-center justify-between p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">平均难度</span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i <= Math.round(parseFloat(stats.avgDifficulty)) 
                      ? "fill-emerald-500 text-emerald-500" 
                      : "text-emerald-300 dark:text-emerald-700"
                  )}
                />
              ))}
              <span className="ml-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {stats.avgDifficulty}/5
              </span>
            </div>
          </div>
        )}

        {/* Action List */}
        {showDetails && stats.actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">行动记录</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.actions.map((action) => (
                <div 
                  key={action.id}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    action.action_completed_at
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {action.action_completed_at ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          Day {action.day_number}
                        </span>
                        {action.action_completed_at && action.action_difficulty && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            难度 {action.action_difficulty}/5
                          </span>
                        )}
                        {action.action_completed_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(action.action_completed_at), 'M月d日', { locale: zhCN })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm",
                        action.action_completed_at 
                          ? "text-green-800 dark:text-green-200" 
                          : "text-amber-800 dark:text-amber-200"
                      )}>
                        {action.giving_action}
                      </p>
                      {action.action_reflection && (
                        <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">
                          💬 {action.action_reflection}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}