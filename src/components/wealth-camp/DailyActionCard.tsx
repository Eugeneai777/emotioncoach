import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Gift, RefreshCw, CheckCircle2, Loader2, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DailyActionData {
  action: string;
  reason: string;
  difficulty_level: 'easy' | 'medium' | 'challenge';
  reaction_pattern: string;
  completion_stats: {
    completed_count: number;
    total_count: number;
    avg_difficulty: string;
  };
}

interface PendingAction {
  action: string;
  entryId: string;
  dayNumber: number;
}

interface DailyActionCardProps {
  dayNumber: number;
  campId?: string;
  onActionSelect?: (action: string) => void;
  pendingActions?: PendingAction[];
  onCompletePending?: (action: PendingAction) => void;
  onCompleteToday?: (action: string, difficulty: string) => void;
  todayActionCompleted?: boolean;
  /** 今日日记中已保存的行动（优先展示） */
  todayJournalAction?: string | null;
  /** 今日日记ID */
  todayEntryId?: string | null;
}

export function DailyActionCard({ 
  dayNumber, 
  campId, 
  onActionSelect,
  pendingActions = [],
  onCompletePending,
  onCompleteToday,
  todayActionCompleted = false,
  todayJournalAction,
  todayEntryId
}: DailyActionCardProps) {
  const [data, setData] = useState<DailyActionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPendingPulsing, setIsPendingPulsing] = useState(true);

  // 如果日记中已有行动，则不需要调用 API 生成
  const hasJournalAction = !!todayJournalAction;

  const fetchAction = async () => {
    // 日记中已有行动时跳过 API 调用
    if (hasJournalAction) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: result, error } = await supabase.functions.invoke('generate-daily-action', {
        body: { day_number: dayNumber, camp_id: campId }
      });

      if (error) throw error;
      setData(result);
    } catch (e) {
      console.error('Error fetching daily action:', e);
    } finally {
      setLoading(false);
    }
  };

  const refreshAction = async () => {
    setRefreshing(true);
    await fetchAction();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAction();
  }, [dayNumber, campId, hasJournalAction]);
  
  // 待完成行动的闪烁效果
  useEffect(() => {
    if (pendingActions.length > 0) {
      const interval = setInterval(() => {
        setIsPendingPulsing(prev => !prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [pendingActions.length]);

  const difficultyLabels = {
    easy: { text: '入门', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
    medium: { text: '进阶', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
    challenge: { text: '挑战', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300' },
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* All pending actions - Enhanced visibility */}
      <AnimatePresence>
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className={cn(
              "border-2 transition-all duration-500",
              isPendingPulsing 
                ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 shadow-lg shadow-amber-200/50" 
                : "border-amber-300 bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                    isPendingPulsing 
                      ? "bg-amber-400 dark:bg-amber-600" 
                      : "bg-amber-200 dark:bg-amber-800"
                  )}>
                    <Clock className={cn(
                      "w-4 h-4 transition-all",
                      isPendingPulsing ? "text-white animate-pulse" : "text-amber-700 dark:text-amber-300"
                    )} />
                  </div>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    ⏰ 待完成的给予行动 ({pendingActions.length}个)
                  </span>
                </div>
                
                <div className="space-y-3">
                  {pendingActions.map((pendingAction, index) => (
                    <div 
                      key={pendingAction.entryId}
                      className={cn(
                        "p-3 rounded-lg border",
                        index === 0 
                          ? "bg-amber-100/70 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700" 
                          : "bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-amber-500 dark:text-amber-500 font-medium">
                              Day {pendingAction.dayNumber}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                最近
                              </span>
                            )}
                          </div>
                          <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">
                            {pendingAction.action}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white font-medium shrink-0"
                          onClick={() => onCompletePending?.(pendingAction)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          完成
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
                  完成后记录你的感受，让财富能量流动起来 ✨
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's action - 优先展示日记中的行动 */}
      {todayJournalAction ? (
        <Card className="bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 border-emerald-300 dark:border-emerald-700 border-2">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-300 dark:bg-emerald-700 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 text-emerald-800 dark:text-emerald-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    📌 今日行动
                  </p>
                  <span className="text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                    来自教练梳理
                  </span>
                </div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {todayJournalAction}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {todayActionCompleted ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">已完成</span>
                    </div>
                  ) : (
                    onCompleteToday && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => onCompleteToday(todayJournalAction, 'medium')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        确认完成
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : data ? (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    🎯 今日推荐行动
                  </p>
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded font-medium",
                    difficultyLabels[data.difficulty_level].color
                  )}>
                    {difficultyLabels[data.difficulty_level].text}
                  </span>
                </div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {data.action}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  {data.reason}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {todayActionCompleted ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">已完成</span>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                        onClick={refreshAction}
                        disabled={refreshing}
                      >
                        <RefreshCw className={cn("w-3 h-3 mr-1", refreshing && "animate-spin")} />
                        换一个
                      </Button>
                      {onCompleteToday && (
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                          onClick={() => onCompleteToday(data.action, data.difficulty_level)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          确认完成
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {data.completion_stats.total_count > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  📊 最近7天：完成 {data.completion_stats.completed_count}/{data.completion_stats.total_count} 个行动
                  {data.completion_stats.avg_difficulty && ` · 平均难度 ${data.completion_stats.avg_difficulty}/5`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
