import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Lightbulb, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatternAnalysis {
  common_triggers: string[];
  common_emotions: string[];
  reaction_patterns: string[];
  coping_strategies: string[];
  growth_insights: string;
  recommendations: string[];
}

export const EmotionPatternInsights = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [briefingCount, setBriefingCount] = useState(0);
  const { toast } = useToast();

  const analyzePatterns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-emotion-patterns');

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: "提示",
          description: data.error,
          variant: "default",
        });
        return;
      }

      setAnalysis(data.analysis);
      setBriefingCount(data.briefing_count);
      
      toast({
        title: "分析完成 ✨",
        description: "已为你识别出情绪模式",
      });
    } catch (error) {
      console.error('分析失败:', error);
      toast({
        title: "分析失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            情绪模式洞察
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI 智能分析你的情绪规律与成长轨迹
          </p>
        </div>
        <Button 
          onClick={analyzePatterns}
          disabled={loading}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              开始分析
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-sm text-muted-foreground">
            基于最近 {briefingCount} 次情绪梳理记录
          </div>

          <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-background border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">常见触发场景</h3>
                <div className="space-y-2">
                  {analysis.common_triggers.map((trigger, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-orange-600 mt-1">•</span>
                      <span className="text-sm text-muted-foreground">{trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50/50 to-background border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">常见情绪类型</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.common_emotions.map((emotion, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">反应模式</h3>
                <div className="space-y-2">
                  {analysis.reaction_patterns.map((pattern, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">→</span>
                      <span className="text-sm text-muted-foreground">{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50/50 to-background border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">你的应对方式</h3>
                <div className="space-y-2">
                  {analysis.coping_strategies.map((strategy, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-sm text-muted-foreground">{strategy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">🌿</span>
                </div>
                <h3 className="font-semibold text-foreground">成长洞察</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-10">
                {analysis.growth_insights}
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-50/50 to-background border-amber-100">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-lg">💫</span>
                劲老师的温柔建议
              </h3>
              <div className="space-y-2 pl-8">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">{idx + 1}.</span>
                    <span className="text-sm text-muted-foreground">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {!analysis && !loading && (
        <Card className="p-12 text-center">
          <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            点击「开始分析」，让劲老师帮你识别情绪模式 🌿
          </p>
          <p className="text-sm text-muted-foreground">
            需要至少3次情绪梳理记录才能进行分析
          </p>
        </Card>
      )}
    </div>
  );
};
