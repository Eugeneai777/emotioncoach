import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, CheckCircle2, Clock, Star, TrendingUp, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  compact?: boolean;
}

export function ActionTrackingStats({ entries, showDetails = true, compact = false }: ActionTrackingStatsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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

    const pieData = [
      { name: '已完成', value: completedActions.length, color: 'hsl(152, 57.5%, 37.6%)' },
      { name: '待完成', value: pendingActions.length, color: 'hsl(var(--muted))' },
    ];

    return {
      total: actionsWithGiving.length,
      completed: completedActions.length,
      pending: pendingActions.length,
      avgDifficulty,
      completionRate,
      pieData,
      actions: actionsWithGiving.sort((a, b) => b.day_number - a.day_number),
    };
  }, [entries]);

  if (stats.total === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
          <Gift className="w-5 h-5" />
          给予行动追踪
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3.5 h-3.5 text-emerald-600/70 dark:text-emerald-400/70 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[280px] p-3">
                <div className="text-xs space-y-1.5">
                  <p className="font-medium">数据说明</p>
                  <p className="text-muted-foreground">行动追踪记录你的「今日给予」完成情况：</p>
                  <ul className="text-muted-foreground list-disc pl-3 space-y-0.5">
                    <li>数据来源：每日日记中的给予行动字段</li>
                    <li>完成率：已完成行动 / 全部行动 × 100%</li>
                    <li>难度评分：完成时自评的执行难度（1-5分）</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart + Stats Overview */}
        <div className="flex items-center gap-4">
          {/* Mini Pie Chart */}
          <div className="w-20 h-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={24}
                  outerRadius={36}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Stats */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{stats.completionRate}%</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">完成率</p>
            </div>
            <div className="text-center p-2 bg-green-100/70 dark:bg-green-900/30 rounded-lg">
              <p className="text-lg font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
              <p className="text-xs text-green-600 dark:text-green-400">已完成</p>
            </div>
            <div className="text-center p-2 bg-amber-100/70 dark:bg-amber-900/30 rounded-lg">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{stats.pending}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">待完成</p>
            </div>
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

        {/* Motivational Message */}
        {stats.completionRate >= 80 && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-700 dark:text-emerald-300">
              太棒了！你的行动力非常强，继续保持！
            </span>
          </div>
        )}
        {stats.completionRate >= 50 && stats.completionRate < 80 && (
          <div className="flex items-center gap-2 p-2.5 bg-amber-100/70 dark:bg-amber-900/30 rounded-lg">
            <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              你正在稳步前进，每一次行动都是觉醒的体现
            </span>
          </div>
        )}

        {/* Action List - Collapsible */}
        {showDetails && stats.actions.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>行动记录 ({stats.actions.length})</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            
            {isExpanded && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.actions.map((action) => (
                  <div 
                    key={action.id}
                    className={cn(
                      "p-2.5 rounded-lg border transition-colors",
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
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Day {action.day_number}
                          </span>
                          {action.action_completed_at && action.action_difficulty && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              难度 {action.action_difficulty}/5
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs line-clamp-2",
                          action.action_completed_at 
                            ? "text-green-800 dark:text-green-200" 
                            : "text-amber-800 dark:text-amber-200"
                        )}>
                          {action.giving_action}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}