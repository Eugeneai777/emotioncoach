import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Target, Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsight {
  id: string;
  type: 'belief' | 'focus' | 'reminder' | 'suggestion';
  icon: string;
  title: string;
  content: string;
  action?: () => void;
}

interface AIInsightZoneProps {
  insights: AIInsight[];
  weeklyFocus?: {
    weekNumber: number;
    focusAreas: string[];
    adjustmentReason?: string;
  };
  beliefReminder?: {
    content: string;
    source?: string;
  };
}

export const AIInsightZone = ({ insights, weeklyFocus, beliefReminder }: AIInsightZoneProps) => {
  // 合并所有洞察
  const allInsights: AIInsight[] = [];

  // 添加每周训练重点
  if (weeklyFocus && weeklyFocus.focusAreas.length > 0) {
    allInsights.push({
      id: 'weekly-focus',
      type: 'focus',
      icon: '🎯',
      title: `第${weeklyFocus.weekNumber}周训练重点`,
      content: weeklyFocus.adjustmentReason || weeklyFocus.focusAreas.join('、'),
    });
  }

  // 添加信念提醒
  if (beliefReminder?.content) {
    allInsights.push({
      id: 'belief-reminder',
      type: 'belief',
      icon: '💡',
      title: '今日觉察提醒',
      content: beliefReminder.content,
    });
  }

  // 添加其他洞察
  allInsights.push(...insights);

  if (allInsights.length === 0) {
    return null;
  }

  const getTypeStyle = (type: AIInsight['type']) => {
    switch (type) {
      case 'focus':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900/50',
          textColor: 'text-blue-700 dark:text-blue-300',
        };
      case 'belief':
        return {
          bg: 'bg-violet-50 dark:bg-violet-950/30',
          border: 'border-violet-200 dark:border-violet-800',
          iconBg: 'bg-violet-100 dark:bg-violet-900/50',
          textColor: 'text-violet-700 dark:text-violet-300',
        };
      case 'reminder':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          iconBg: 'bg-amber-100 dark:bg-amber-900/50',
          textColor: 'text-amber-700 dark:text-amber-300',
        };
      case 'suggestion':
      default:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
          textColor: 'text-emerald-700 dark:text-emerald-300',
        };
    }
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
      <CardContent className="p-3 space-y-2">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-100 to-blue-100 dark:from-violet-900/50 dark:to-blue-900/50">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">AI 今日建议</span>
        </div>

        {/* 洞察列表 */}
        <AnimatePresence>
          {allInsights.slice(0, 3).map((insight, index) => {
            const style = getTypeStyle(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  style.bg,
                  style.border,
                  insight.action && "cursor-pointer hover:shadow-sm"
                )}
                onClick={insight.action}
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn("p-1.5 rounded-lg shrink-0", style.iconBg)}>
                    <span className="text-sm">{insight.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-xs font-medium mb-0.5", style.textColor)}>
                      {insight.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {insight.content}
                    </p>
                  </div>
                  {insight.action && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                  )}
                </div>

                {/* 每周重点的标签 */}
                {insight.type === 'focus' && weeklyFocus && weeklyFocus.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pl-8">
                    {weeklyFocus.focusAreas.map((area) => (
                      <Badge 
                        key={area} 
                        variant="secondary" 
                        className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
