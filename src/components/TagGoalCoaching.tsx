import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, ChevronDown, ChevronUp, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TagGoalProgress } from "@/utils/tagGoalCalculator";

interface CoachingAdvice {
  status_message: string;
  encouragement: string;
  strategies: Array<{
    title: string;
    description: string;
    expected_benefit: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'awareness' | 'action' | 'prevention' | 'substitute';
  }>;
  pattern_insights: string;
  next_milestone: string;
  co_occurring_tags?: Array<{ name: string; count: number }>;
}

interface TagGoalCoachingProps {
  goalId: string;
  tagName: string;
  progress: TagGoalProgress;
}

const TagGoalCoaching = ({ goalId, tagName, progress }: TagGoalCoachingProps) => {
  const [advice, setAdvice] = useState<CoachingAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const difficultyConfig = {
    easy: { label: '简单', color: 'bg-green-100 text-green-800', icon: '✓' },
    medium: { label: '中等', color: 'bg-yellow-100 text-yellow-800', icon: '△' },
    hard: { label: '挑战', color: 'bg-red-100 text-red-800', icon: '★' },
  };

  const categoryConfig = {
    awareness: { label: '觉察', icon: '👁️' },
    action: { label: '行动', icon: '🎯' },
    prevention: { label: '预防', icon: '🛡️' },
    substitute: { label: '替代', icon: '🔄' },
  };

  const loadCoachingAdvice = async () => {
    try {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('未登录');

      const { data, error } = await supabase.functions.invoke('tag-goal-coach', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          goalId,
          currentProgress: progress,
        }
      });

      if (error) throw error;

      setAdvice(data);
      setIsExpanded(true);

      toast.success('AI教练建议已生成', {
        description: '查看个性化策略来改善你的情绪管理',
      });
    } catch (error: any) {
      console.error('Error loading coaching advice:', error);
      toast.error('获取建议失败', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <div className="space-y-4">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              AI教练指导
            </h3>
          </div>
          {!advice && (
            <Button
              size="sm"
              onClick={loadCoachingAdvice}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  获取建议
                </>
              )}
            </Button>
          )}
          {advice && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* 建议内容 */}
        {advice && isExpanded && (
          <div className="space-y-4">
            {/* 状态评价 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {advice.status_message}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {advice.encouragement}
              </p>
            </div>

            {/* 关联标签 */}
            {advice.co_occurring_tags && advice.co_occurring_tags.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  🔗 "{tagName}"经常与以下标签一起出现：
                </p>
                <div className="flex flex-wrap gap-2">
                  {advice.co_occurring_tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag.name} ({tag.count}次)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 策略列表 */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">💡 个性化策略：</p>
              {advice.strategies.map((strategy, index) => {
                const difficulty = difficultyConfig[strategy.difficulty];
                const category = categoryConfig[strategy.category];

                return (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{category.icon}</span>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-foreground">
                            {strategy.title}
                          </h4>
                          <Badge variant="secondary" className={`text-xs ${difficulty.color}`}>
                            {difficulty.icon} {difficulty.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {category.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {strategy.description}
                        </p>
                        <div className="flex items-start gap-1 text-xs text-green-700 dark:text-green-400">
                          <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{strategy.expected_benefit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 模式洞察 */}
            {advice.pattern_insights && (
              <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                  🔍 模式洞察
                </p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {advice.pattern_insights}
                </p>
              </div>
            )}

            {/* 下一步里程碑 */}
            {advice.next_milestone && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                  🎯 下一步目标
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {advice.next_milestone}
                </p>
              </div>
            )}

            {/* 刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={loadCoachingAdvice}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '重新分析中...' : '刷新建议'}
            </Button>
          </div>
        )}

        {/* 初始提示 */}
        {!advice && !isLoading && (
          <p className="text-xs text-muted-foreground text-center py-2">
            点击"获取建议"让AI教练根据你的进度提供个性化策略 🎯
          </p>
        )}
      </div>
    </Card>
  );
};

export default TagGoalCoaching;
