import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface CommunicationBriefing {
  id: string;
  communication_theme: string;
  see_content: string | null;
  understand_content: string | null;
  influence_content: string | null;
  act_content: string | null;
  scenario_analysis: string | null;
  perspective_shift: string | null;
  recommended_script: string | null;
  avoid_script: string | null;
  strategy: string | null;
  micro_action: string | null;
  growth_insight: string | null;
  created_at: string;
}

const CommunicationHistory = () => {
  const [briefings, setBriefings] = useState<CommunicationBriefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<CommunicationBriefing | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadBriefings();
  }, []);

  const checkAuthAndLoadBriefings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    await loadBriefings();
  };

  const loadBriefings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("communication_briefings")
        .select(`
          *,
          conversations!inner(user_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBriefings(data || []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (selectedBriefing) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBriefing(null)}
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 shadow-lg">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pb-3 md:pb-4 border-b border-border/50">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              {formatDate(selectedBriefing.created_at)}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  💬 沟通主题
                </h3>
                <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.communication_theme}</p>
              </div>

              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 flex items-center gap-2">
                  🎯 沟通四部曲旅程
                </h3>
                <div className="space-y-3 pl-2 md:pl-4">
                  {selectedBriefing.see_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">1️⃣ 看见（See）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.see_content}</p>
                    </div>
                  )}
                  {selectedBriefing.understand_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">2️⃣ 读懂（Understand）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.understand_content}</p>
                    </div>
                  )}
                  {selectedBriefing.influence_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">3️⃣ 影响（Influence）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.influence_content}</p>
                    </div>
                  )}
                  {selectedBriefing.act_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">4️⃣ 行动（Act）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.act_content}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedBriefing.scenario_analysis && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    📋 场景分析
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.scenario_analysis}</p>
                </div>
              )}

              {selectedBriefing.perspective_shift && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🔄 视角转换
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.perspective_shift}</p>
                </div>
              )}

              {selectedBriefing.recommended_script && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ✅ 推荐话术
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80 italic">"{selectedBriefing.recommended_script}"</p>
                </div>
              )}

              {selectedBriefing.avoid_script && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ❌ 避免说
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80 italic">"{selectedBriefing.avoid_script}"</p>
                </div>
              )}

              {selectedBriefing.strategy && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🎯 最佳策略
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.strategy}</p>
                </div>
              )}

              {selectedBriefing.micro_action && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🚀 今日微行动
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.micro_action}</p>
                </div>
              )}

              {selectedBriefing.growth_insight && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🌱 沟通成长洞察
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.growth_insight}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground">我的沟通日记</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/communication-coach")}
              className="gap-1 md:gap-2 px-2 md:px-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">返回主页</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {briefings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有沟通简报记录</p>
            <p className="text-sm text-muted-foreground mt-2">完成一次沟通梳理后会生成简报 💙</p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {briefings.map((briefing) => (
              <Card
                key={briefing.id}
                className="p-4 md:p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedBriefing(briefing)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm md:text-base">
                      {briefing.communication_theme}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(briefing.created_at).split(' ')[0]}
                    </span>
                  </div>
                  {briefing.scenario_analysis && (
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                      {briefing.scenario_analysis}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunicationHistory;