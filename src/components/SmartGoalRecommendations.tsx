import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TagReductionGoalDialog from "./TagReductionGoalDialog";
import TagSentimentBadge from "./TagSentimentBadge";

interface TagRecommendation {
  type: 'tag_reduction' | 'tag_increase';
  target_tag_id: string;
  target_tag_name: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  current_weekly_count: number;
  target_weekly_count: number;
  reasoning: string;
  priority: number;
}

interface SmartGoalRecommendationsProps {
  onRecommendationAccepted?: () => void;
}

const SmartGoalRecommendations = ({ onRecommendationAccepted }: SmartGoalRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<TagRecommendation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);

      // 首先确保所有标签已分类
      await supabase.functions.invoke('classify-tag-sentiment');

      // 获取标签趋势分析
      const { data: trendsData, error: trendsError } = await supabase.functions.invoke(
        'analyze-tag-trends',
        { body: { weeks: 4 } }
      );

      if (trendsError) throw trendsError;

      const trends = trendsData?.trends || [];

      // 生成推荐
      const newRecommendations: TagRecommendation[] = [];

      // 负面标签减少推荐（高频或上升趋势）
      const negativeTags = trends
        .filter((t: any) => t.sentiment === 'negative')
        .sort((a: any, b: any) => b.priority - a.priority)
        .slice(0, 2);

      for (const tag of negativeTags) {
        if (tag.currentWeekCount >= 3) {
          newRecommendations.push({
            type: 'tag_reduction',
            target_tag_id: tag.tagId,
            target_tag_name: tag.tagName,
            sentiment: 'negative',
            current_weekly_count: tag.currentWeekCount,
            target_weekly_count: Math.max(1, Math.ceil(tag.currentWeekCount * 0.7)),
            reasoning: `"${tag.tagName}"标签本周出现了${tag.currentWeekCount}次${
              tag.changeFromPrevious > 0 ? `，比上周增加了${Math.round(tag.changeFromPrevious)}%` : ''
            }。建议设定一个减少目标，帮助你更好地管理相关情绪。`,
            priority: tag.priority,
          });
        }
      }

      // 正面标签增长推荐（低频但有潜力）
      const positiveTags = trends
        .filter((t: any) => t.sentiment === 'positive')
        .filter((t: any) => t.currentWeekCount > 0 && t.currentWeekCount < 3)
        .sort((a: any, b: any) => b.priority - a.priority)
        .slice(0, 1);

      for (const tag of positiveTags) {
        newRecommendations.push({
          type: 'tag_increase',
          target_tag_id: tag.tagId,
          target_tag_name: tag.tagName,
          sentiment: 'positive',
          current_weekly_count: tag.currentWeekCount,
          target_weekly_count: 5,
          reasoning: `你在"${tag.tagName}"方面有不错的开始（本周${tag.currentWeekCount}次）。增加这类积极体验可以帮助提升整体情绪状态。`,
          priority: tag.priority,
        });
      }

      setRecommendations(newRecommendations.filter(r => !dismissedIds.includes(r.target_tag_id)));
    } catch (error: any) {
      console.error('Error loading recommendations:', error);
      toast.error('加载推荐失败', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (tagId: string) => {
    setDismissedIds([...dismissedIds, tagId]);
    setRecommendations(recommendations.filter(r => r.target_tag_id !== tagId));
  };

  const handleAccept = (recommendation: TagRecommendation) => {
    setSelectedRecommendation(recommendation);
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    if (selectedRecommendation) {
      handleDismiss(selectedRecommendation.target_tag_id);
    }
    onRecommendationAccepted?.();
  };

  if (isLoading) {
    return (
      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">正在分析你的情绪模式...</p>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isReduction = rec.type === 'tag_reduction';

          return (
            <Card key={rec.target_tag_id} className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {isReduction ? (
                    <TrendingDown className="w-5 h-5 text-primary" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">智能推荐</span>
                      <Badge variant="secondary" className="text-xs">
                        {isReduction ? '情绪管理' : '积极培养'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(rec.target_tag_id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rec.target_tag_name}</span>
                    <TagSentimentBadge sentiment={rec.sentiment} size="sm" />
                  </div>

                  <p className="text-sm text-muted-foreground">{rec.reasoning}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>当前：{rec.current_weekly_count}次/周</span>
                    <span>→</span>
                    <span className="text-primary font-medium">
                      目标：{isReduction ? '≤' : '≥'}{rec.target_weekly_count}次/周
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(rec)}
                      className="flex-1"
                    >
                      接受推荐
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDismiss(rec.target_tag_id)}
                      className="flex-1"
                    >
                      暂时忽略
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedRecommendation && (
        <TagReductionGoalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          tagId={selectedRecommendation.target_tag_id}
          tagName={selectedRecommendation.target_tag_name}
          sentiment={selectedRecommendation.sentiment}
          currentWeeklyCount={selectedRecommendation.current_weekly_count}
          recommendedTarget={selectedRecommendation.target_weekly_count}
          reasoning={selectedRecommendation.reasoning}
          onSuccess={handleDialogSuccess}
        />
      )}
    </>
  );
};

export default SmartGoalRecommendations;
