import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TagSentimentBadge from "./TagSentimentBadge";

interface TagReductionGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagId: string;
  tagName: string;
  sentiment: 'positive' | 'negative' | 'neutral' | null;
  currentWeeklyCount: number;
  recommendedTarget: number;
  reasoning: string;
  onSuccess?: () => void;
}

const TagReductionGoalDialog = ({
  open,
  onOpenChange,
  tagId,
  tagName,
  sentiment,
  currentWeeklyCount,
  recommendedTarget,
  reasoning,
  onSuccess,
}: TagReductionGoalDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [targetCount, setTargetCount] = useState(recommendedTarget);
  const [description, setDescription] = useState(reasoning);

  const isReduction = sentiment === 'negative';
  const goalType = isReduction ? 'tag_reduction' : 'tag_increase';

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 28); // 4周目标

      const reductionPercent = isReduction
        ? ((currentWeeklyCount - targetCount) / currentWeeklyCount) * 100
        : ((targetCount - currentWeeklyCount) / Math.max(currentWeeklyCount, 1)) * 100;

      const { error } = await supabase.from('emotion_goals').insert({
        user_id: user.id,
        goal_type: isReduction ? '减少负面标签' : '增加正面标签',
        goal_category: goalType,
        target_count: targetCount,
        description: description,
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        target_tag_id: tagId,
        baseline_weekly_count: currentWeeklyCount,
        target_reduction_percent: Math.round(reductionPercent),
        is_active: true,
      });

      if (error) throw error;

      toast.success('目标创建成功！', {
        description: `开始追踪"${tagName}"标签的使用情况`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating tag goal:', error);
      toast.error('创建目标失败', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🎯 设定标签目标
          </DialogTitle>
          <DialogDescription>
            为"{tagName}"标签设定一个可达成的目标
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 标签信息 */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{tagName}</span>
            <TagSentimentBadge sentiment={sentiment} />
          </div>

          {/* 当前状态 */}
          <div className="bg-muted p-3 rounded-lg space-y-1">
            <p className="text-sm text-muted-foreground">当前每周使用次数</p>
            <p className="text-2xl font-bold">{currentWeeklyCount}次</p>
          </div>

          {/* 目标设定 */}
          <div className="space-y-2">
            <Label htmlFor="targetCount">
              目标每周{isReduction ? '不超过' : '至少'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="targetCount"
                type="number"
                min="0"
                max={isReduction ? currentWeeklyCount : 20}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">次</span>
              {isReduction && targetCount < currentWeeklyCount && (
                <Badge variant="secondary" className="ml-auto">
                  减少{Math.round(((currentWeeklyCount - targetCount) / currentWeeklyCount) * 100)}%
                </Badge>
              )}
              {!isReduction && targetCount > currentWeeklyCount && (
                <Badge variant="secondary" className="ml-auto">
                  增加{Math.round(((targetCount - currentWeeklyCount) / Math.max(currentWeeklyCount, 1)) * 100)}%
                </Badge>
              )}
            </div>
          </div>

          {/* 目标描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">目标描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="说明为什么要设定这个目标..."
            />
          </div>

          {/* 打卡要求提示 */}
          <div className="bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                  目标评估要求
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  为了准确评估目标完成情况，需要满足以下条件：
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-4 list-disc">
                  <li><strong>每周至少记录 3 天</strong>情绪日志</li>
                  <li>记录需要<strong>均匀分布</strong>在整周内</li>
                  <li>保持<strong>持续记录</strong>，避免中断</li>
                </ul>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <span>💡</span>
                  <span>数据不足时，目标进度将显示为"数据积累中"</span>
                </p>
              </div>
            </div>
          </div>

          {/* AI建议 */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100 flex items-start gap-2">
              <span className="text-sm">💡</span>
              <span>{reasoning}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            取消
          </Button>
          <Button onClick={handleCreate} disabled={isLoading} className="flex-1">
            {isLoading ? '创建中...' : '创建目标'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TagReductionGoalDialog;
