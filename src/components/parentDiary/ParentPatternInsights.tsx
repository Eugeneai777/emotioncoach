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

export const ParentPatternInsights = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const { toast } = useToast();

  const analyzePatterns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-parent-emotion-patterns');
      if (error) throw error;
      if (data.error) {
        toast({ title: "提示", description: data.error, variant: "default" });
        return;
      }
      setAnalysis(data.analysis);
      setSessionCount(data.session_count);
      toast({ title: "分析完成 ✨", description: "已为你识别出亲子互动中的情绪模式" });
    } catch (error) {
      toast({ title: "分析失败", description: "请稍后再试", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2"><Brain className="w-6 h-6 text-primary" />亲子互动模式洞察</h2>
          <p className="text-sm text-muted-foreground mt-1">AI 智能分析你在亲子互动中的情绪规律与成长轨迹</p>
        </div>
        <Button onClick={analyzePatterns} disabled={loading} className="gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />分析中...</> : <><Brain className="w-4 h-4" />开始分析</>}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4 animate-in fade-in-50">
          <div className="text-sm text-muted-foreground">基于最近 {sessionCount} 次亲子教练对话记录</div>
          <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-background border-orange-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
              <div className="flex-1"><h3 className="font-semibold mb-2">常见触发场景</h3><div className="space-y-2">{analysis.common_triggers.map((t, i) => <div key={i} className="flex items-start gap-2"><span className="text-orange-600 mt-1">•</span><span className="text-sm text-muted-foreground">{t}</span></div>)}</div></div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-purple-50/50 to-background border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0"><Heart className="w-5 h-5 text-purple-600" /></div>
              <div className="flex-1"><h3 className="font-semibold mb-2">常见情绪类型</h3><div className="flex flex-wrap gap-2">{analysis.common_emotions.map((e, i) => <span key={i} className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm">{e}</span>)}</div></div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0"><Brain className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1"><h3 className="font-semibold mb-2">反应模式</h3><div className="space-y-2">{analysis.reaction_patterns.map((p, i) => <div key={i} className="flex items-start gap-2"><span className="text-blue-600 mt-1">→</span><span className="text-sm text-muted-foreground">{p}</span></div>)}</div></div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-green-50/50 to-background border-green-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0"><Lightbulb className="w-5 h-5 text-green-600" /></div>
              <div className="flex-1"><h3 className="font-semibold mb-2">你的应对方式</h3><div className="space-y-2">{analysis.coping_strategies.map((s, i) => <div key={i} className="flex items-start gap-2"><span className="text-green-600 mt-1">✓</span><span className="text-sm text-muted-foreground">{s}</span></div>)}</div></div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-lg">🌿</span></div><h3 className="font-semibold">成长洞察</h3></div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-10">{analysis.growth_insights}</p>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-amber-50/50 to-background border-amber-100">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><span className="text-lg">💫</span>劲老师的温柔建议</h3>
            <div className="space-y-2 pl-8">{analysis.recommendations.map((r, i) => <div key={i} className="flex items-start gap-2"><span className="text-amber-600 font-bold">{i + 1}.</span><span className="text-sm text-muted-foreground">{r}</span></div>)}</div>
          </Card>
        </div>
      )}

      {!analysis && !loading && (
        <Card className="p-12 text-center">
          <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">点击「开始分析」，让劲老师帮你识别亲子互动中的情绪模式 🌿</p>
          <p className="text-sm text-muted-foreground">需要至少3次亲子教练对话记录才能进行分析</p>
        </Card>
      )}
    </div>
  );
};
