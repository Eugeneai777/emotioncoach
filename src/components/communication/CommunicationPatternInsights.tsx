import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, Brain, TrendingUp, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface PatternAnalysis {
  common_scenarios: string[];
  difficult_patterns: string[];
  successful_strategies: string[];
  growth_areas: string[];
  relationship_insights: string;
  recommendations: string[];
}

export function CommunicationPatternInsights() {
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const { toast } = useToast();

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-communication-patterns",
        {
          body: { timeRange },
        }
      );

      if (error) throw error;
      setAnalysis(data);
      
      toast({
        title: "分析完成 ✨",
        description: "已为你识别出沟通模式",
      });
    } catch (error) {
      console.error("Error loading analysis:", error);
      toast({
        title: "分析失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [timeRange]);

  if (loading) {
    return (
      <Card className="p-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-12 text-center">
        <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          点击「开始分析」，让劲老师帮你识别沟通模式 🌿
        </p>
        <Button onClick={loadAnalysis} className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
          <Brain className="w-4 h-4" />
          开始分析
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            沟通模式洞察
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI 智能分析你的沟通规律与成长轨迹
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">最近7天</SelectItem>
              <SelectItem value="30d">最近30天</SelectItem>
              <SelectItem value="90d">最近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={loadAnalysis}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                重新分析
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
        <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">常见沟通场景</h3>
              <div className="space-y-2">
                {analysis.common_scenarios.map((scenario, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm text-muted-foreground">{scenario}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-50/50 to-background border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">沟通难点模式</h3>
              <div className="space-y-2">
                {analysis.difficult_patterns.map((pattern, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
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
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">成功的沟通策略</h3>
              <div className="space-y-2">
                {analysis.successful_strategies.map((strategy, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-sm text-muted-foreground">{strategy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-violet-50/50 to-background border-violet-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <span className="text-lg">🤝</span>
              </div>
              <h3 className="font-semibold text-foreground">人际关系洞察</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-10">
              {analysis.relationship_insights}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-50/50 to-background border-amber-100">
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" />
              劲老师的建议
            </h3>
            <div className="space-y-2 pl-7">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">{idx + 1}.</span>
                  <span className="text-sm text-muted-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg">🌱</span>
              </div>
              <h3 className="font-semibold text-foreground">成长领域</h3>
            </div>
            <div className="grid gap-2 pl-10">
              {analysis.growth_areas.map((area, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-blue-200 bg-blue-50/50"
                >
                  {area}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}