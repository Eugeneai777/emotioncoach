import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ParentEmotionReview = () => {
  const [loading, setLoading] = useState(false);
  const [reviewPeriod, setReviewPeriod] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const { toast } = useToast();

  const generateReview = async () => {
    if (!reviewPeriod.trim()) {
      toast({
        title: "提示",
        description: "请输入复盘周期（如：最近一周、本月等）",
        variant: "default",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("未登录");

      // 获取用户的亲子教练会话
      const { data: sessions, error } = await supabase
        .from("parent_coaching_sessions")
        .select(`
          *,
          briefings:briefing_id (
            emotion_theme,
            emotion_intensity,
            insight,
            action,
            growth_story
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // 调用 AI 生成复盘
      const { data: reviewData, error: reviewError } = await supabase.functions.invoke('generate-emotion-review', {
        body: {
          period: reviewPeriod,
          sessions: sessions || [],
          review_type: "parent_coaching"
        }
      });

      if (reviewError) throw reviewError;

      if (reviewData.error) {
        toast({
          title: "生成失败",
          description: reviewData.error,
          variant: "destructive",
        });
        return;
      }

      setReviewContent(reviewData.review || "");
      
      toast({
        title: "生成成功 ✨",
        description: "已为你生成亲子情绪复盘",
      });
    } catch (error: any) {
      console.error('生成复盘失败:', error);
      toast({
        title: "生成失败",
        description: error.message || "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔍 亲子情绪复盘
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">复盘周期</label>
            <input
              type="text"
              placeholder="例如：最近一周、本月、最近三次对话"
              value={reviewPeriod}
              onChange={(e) => setReviewPeriod(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <Button
            onClick={generateReview}
            disabled={loading || !reviewPeriod.trim()}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成复盘报告
              </>
            )}
          </Button>

          {reviewContent && (
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
              <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                劲老师的复盘洞察
              </h4>
              <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {reviewContent}
              </div>
            </div>
          )}

          {!reviewContent && (
            <div className="mt-6 text-center text-muted-foreground text-sm">
              <p>💡 输入复盘周期，AI 将帮你分析这段时间的亲子互动模式</p>
              <p className="mt-2">为你提供成长建议和改善方向</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};