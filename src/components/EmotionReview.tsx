import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
import { zhCN } from "date-fns/locale";

export const EmotionReview = () => {
  const [reviewType, setReviewType] = useState<'weekly' | 'monthly'>('weekly');
  const [timeRange, setTimeRange] = useState<'current' | 'last'>('current');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewContent, setReviewContent] = useState<string>("");
  const [reviewMeta, setReviewMeta] = useState<{ briefingsCount: number; dateRange: { startDate: string; endDate: string } } | null>(null);
  const { toast } = useToast();

  const getDateRange = () => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (reviewType === 'weekly') {
      if (timeRange === 'current') {
        start = startOfWeek(now, { locale: zhCN });
        end = endOfWeek(now, { locale: zhCN });
      } else {
        const lastWeek = subWeeks(now, 1);
        start = startOfWeek(lastWeek, { locale: zhCN });
        end = endOfWeek(lastWeek, { locale: zhCN });
      }
    } else {
      if (timeRange === 'current') {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else {
        const lastMonth = subMonths(now, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
      }
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      displayText: `${format(start, 'yyyy年MM月dd日', { locale: zhCN })} - ${format(end, 'yyyy年MM月dd日', { locale: zhCN })}`
    };
  };

  const generateReview = async () => {
    setIsGenerating(true);
    setReviewContent("");
    setReviewMeta(null);

    try {
      const dateRange = getDateRange();
      
      const { data, error } = await supabase.functions.invoke('generate-emotion-review', {
        body: {
          reviewType,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error === 'no_data') {
          toast({
            title: "暂无数据 📭",
            description: data.message || "该时间段内没有情绪记录",
          });
          return;
        }
        throw new Error(data.error);
      }

      setReviewContent(data.review);
      setReviewMeta({
        briefingsCount: data.briefingsCount,
        dateRange: data.dateRange
      });

      toast({
        title: "复盘报告已生成 ✨",
        description: `基于 ${data.briefingsCount} 条情绪记录`,
      });

    } catch (error) {
      console.error('Error generating review:', error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const dateRange = getDateRange();

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            情绪复盘
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground">
            让劲老师陪你一起回顾情绪旅程，发现成长亮点 🌿
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm md:text-base font-medium">复盘周期</Label>
            <RadioGroup value={reviewType} onValueChange={(v) => setReviewType(v as 'weekly' | 'monthly')}>
              <div className="grid grid-cols-2 gap-2 md:gap-0 md:grid-cols-1 md:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors border md:border-0 border-border">
                  <RadioGroupItem value="weekly" id="weekly" className="flex-shrink-0" />
                  <Label htmlFor="weekly" className="cursor-pointer flex-1 text-xs md:text-sm leading-tight">
                    周报
                    <span className="hidden md:inline">（每周情绪总结）</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors border md:border-0 border-border">
                  <RadioGroupItem value="monthly" id="monthly" className="flex-shrink-0" />
                  <Label htmlFor="monthly" className="cursor-pointer flex-1 text-xs md:text-sm leading-tight">
                    月报
                    <span className="hidden md:inline">（每月情绪复盘）</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 md:space-y-3">
            <Label className="text-sm md:text-base font-medium">时间范围</Label>
            <RadioGroup value={timeRange} onValueChange={(v) => setTimeRange(v as 'current' | 'last')}>
              <div className="grid grid-cols-2 gap-2 md:gap-0 md:grid-cols-1 md:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors border md:border-0 border-border">
                  <RadioGroupItem value="current" id="current" className="flex-shrink-0" />
                  <Label htmlFor="current" className="cursor-pointer flex-1 text-xs md:text-sm">
                    {reviewType === 'weekly' ? '本周' : '本月'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors border md:border-0 border-border">
                  <RadioGroupItem value="last" id="last" className="flex-shrink-0" />
                  <Label htmlFor="last" className="cursor-pointer flex-1 text-xs md:text-sm">
                    {reviewType === 'weekly' ? '上周' : '上月'}
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs md:text-sm text-muted-foreground bg-accent/30 p-3 rounded-lg">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="break-all">{dateRange.displayText}</span>
          </div>

          <Button
            onClick={generateReview}
            disabled={isGenerating}
            className="w-full text-sm md:text-base"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">正在生成复盘报告...</span>
                <span className="sm:hidden">生成中...</span>
              </>
            ) : (
              "生成复盘报告"
            )}
          </Button>
        </div>
      </Card>

      {reviewContent && (
        <Card className="p-4 md:p-6 space-y-3 md:space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border">
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              {reviewType === 'weekly' ? '📊 周报' : '📊 月报'}
            </h3>
            {reviewMeta && (
              <span className="text-xs text-muted-foreground">
                基于 {reviewMeta.briefingsCount} 条记录
              </span>
            )}
          </div>
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm md:text-base">
            {reviewContent}
          </div>
        </Card>
      )}
    </div>
  );
};
