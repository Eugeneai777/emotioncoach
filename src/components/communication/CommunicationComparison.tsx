import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, TrendingUp, Brain, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CommunicationBriefing {
  id: string;
  communication_theme: string;
  see_content: string | null;
  understand_content: string | null;
  influence_content: string | null;
  act_content: string | null;
  growth_insight: string | null;
  micro_action: string | null;
  communication_difficulty: number | null;
  created_at: string;
}

interface ComparisonInsight {
  communication_growth: string[];
  strategy_evolution: string[];
  difficulty_change: string;
  key_improvements: string[];
  encouraging_summary: string;
}

interface CommunicationComparisonProps {
  briefings: CommunicationBriefing[];
}

export const CommunicationComparison = ({ briefings }: CommunicationComparisonProps) => {
  const [selectedBriefing1, setSelectedBriefing1] = useState<CommunicationBriefing | null>(null);
  const [selectedBriefing2, setSelectedBriefing2] = useState<CommunicationBriefing | null>(null);
  const [comparisonInsight, setComparisonInsight] = useState<ComparisonInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getComparisonInsight = async () => {
    if (!selectedBriefing1 || !selectedBriefing2) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('compare-communications', {
        body: {
          briefingId1: selectedBriefing1.id,
          briefingId2: selectedBriefing2.id,
        }
      });

      if (error) throw error;

      if (data.comparison) {
        setComparisonInsight(data.comparison);
        toast({
          title: "对比分析完成 ✨",
          description: "已为你生成成长洞察",
        });
      }
    } catch (error) {
      console.error('对比分析失败:', error);
      toast({
        title: "分析失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetComparison = () => {
    setSelectedBriefing1(null);
    setSelectedBriefing2(null);
    setComparisonInsight(null);
  };

  if (briefings.length < 2) {
    return (
      <Card className="p-12 text-center">
        <Brain className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">
          至少需要2个简报才能进行对比分析 🌿
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            沟通对比分析
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            选择两个不同时期的简报，看看你的成长轨迹
          </p>
        </div>
        {(selectedBriefing1 || selectedBriefing2) && (
          <Button variant="outline" size="sm" onClick={resetComparison}>
            重新选择
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 第一个简报选择 */}
        <Card className="p-4 border-2 border-dashed">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
            选择第一个简报（较早期）
          </h3>
          {selectedBriefing1 ? (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{formatDate(selectedBriefing1.created_at)}</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">{selectedBriefing1.communication_theme}</h4>
                {selectedBriefing1.communication_difficulty && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      难度: {selectedBriefing1.communication_difficulty}/10
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {briefings.map((briefing) => (
                <button
                  key={briefing.id}
                  onClick={() => setSelectedBriefing1(briefing)}
                  disabled={selectedBriefing2?.id === briefing.id}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{formatDate(briefing.created_at)}</span>
                    {briefing.communication_difficulty && (
                      <Badge variant="secondary" className="text-xs">
                        {briefing.communication_difficulty}/10
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{briefing.communication_theme}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* 第二个简报选择 */}
        <Card className="p-4 border-2 border-dashed">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
            选择第二个简报（较近期）
          </h3>
          {selectedBriefing2 ? (
            <div className="space-y-3">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{formatDate(selectedBriefing2.created_at)}</span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-foreground text-sm">{selectedBriefing2.communication_theme}</h4>
                {selectedBriefing2.communication_difficulty && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-xs">
                      难度: {selectedBriefing2.communication_difficulty}/10
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {briefings.map((briefing) => (
                <button
                  key={briefing.id}
                  onClick={() => setSelectedBriefing2(briefing)}
                  disabled={selectedBriefing1?.id === briefing.id}
                  className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{formatDate(briefing.created_at)}</span>
                    {briefing.communication_difficulty && (
                      <Badge variant="secondary" className="text-xs">
                        {briefing.communication_difficulty}/10
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">{briefing.communication_theme}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      {selectedBriefing1 && selectedBriefing2 && !comparisonInsight && (
        <div className="flex justify-center">
          <Button 
            onClick={getComparisonInsight}
            disabled={loading}
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                开始对比分析
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {comparisonInsight && (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              沟通成长
            </h3>
            <div className="space-y-2 pl-7">
              {comparisonInsight.communication_growth.map((growth, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">→</span>
                  <span className="text-sm text-muted-foreground">{growth}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-50/50 to-background border-green-100">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-green-600" />
              策略演变
            </h3>
            <div className="space-y-2 pl-7">
              {comparisonInsight.strategy_evolution.map((evolution, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{evolution}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-violet-50/50 to-background border-violet-100">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">📊</span>
              难度变化
            </h3>
            <p className="text-sm text-muted-foreground pl-7">{comparisonInsight.difficulty_change}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-orange-50/50 to-background border-orange-100">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">🌟</span>
              关键提升
            </h3>
            <div className="space-y-2 pl-7">
              {comparisonInsight.key_improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">★</span>
                  <span className="text-sm text-muted-foreground">{improvement}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50/50 to-background border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🌿</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">劲老师的鼓励</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {comparisonInsight.encouraging_summary}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};