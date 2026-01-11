import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Loader2, ArrowLeft, MessageSquare, Share2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CommunicationBriefingTagSelector } from "@/components/communication/CommunicationBriefingTagSelector";
import { CommunicationHeatmap } from "@/components/communication/CommunicationHeatmap";
import { CommunicationPatternInsights } from "@/components/communication/CommunicationPatternInsights";
import { CommunicationTrendAnalysis } from "@/components/communication/CommunicationTrendAnalysis";
import { CommunicationComparison } from "@/components/communication/CommunicationComparison";
import { CommunicationReview } from "@/components/communication/CommunicationReview";
import BriefingShareDialog from "@/components/briefing/BriefingShareDialog";
import { FrequencyMusicPlayer } from "@/components/FrequencyMusicPlayer";
import { Helmet } from "react-helmet";

interface CommunicationTag {
  id: string;
  name: string;
  color: string;
}

interface CommunicationBriefing {
  id: string;
  communication_theme: string;
  scenario_analysis: string | null;
  see_content: string | null;
  understand_content: string | null;
  influence_content: string | null;
  act_content: string | null;
  recommended_script: string | null;
  avoid_script: string | null;
  strategy: string | null;
  micro_action: string | null;
  growth_insight: string | null;
  perspective_shift: string | null;
  created_at: string;
  communication_difficulty?: number | null;
  scenario_type?: string | null;
  target_type?: string | null;
  difficulty_keywords?: string[] | null;
}

export default function CommunicationHistory() {
  const navigate = useNavigate();
  const [briefings, setBriefings] = useState<CommunicationBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<CommunicationBriefing | null>(null);
  const [selectedTags, setSelectedTags] = useState<CommunicationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<CommunicationTag[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    checkAuthAndLoadBriefings();
    loadAllTags();
  }, [filterTag]);

  const checkAuthAndLoadBriefings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadBriefings(user.id);
  };

  const loadAllTags = async () => {
    const { data, error } = await supabase
      .from("communication_tags")
      .select("*")
      .order("name");

    if (!error && data) {
      setAllTags(data);
    }
  };

  const loadBriefings = async (userId: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("communication_briefings")
        .select("*, conversations!inner(user_id)")
        .eq("conversations.user_id", userId)
        .order("created_at", { ascending: false });

      if (filterTag) {
        query = query.contains("difficulty_keywords", [filterTag]);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error loading briefings:", error);
        return;
      }
      setBriefings(data || []);
    } finally {
      setLoading(false);
    }
  };

  const loadBriefingTags = async (briefingId: string) => {
    const { data, error } = await supabase
      .from("communication_briefing_tags")
      .select("tag_id, communication_tags(id, name, color)")
      .eq("communication_briefing_id", briefingId);

    if (error) {
      console.error("Error loading tags:", error);
      return;
    }

    const tags = data
      .map((item: any) => item.communication_tags)
      .filter((tag: any) => tag !== null) as CommunicationTag[];

    setSelectedTags(tags);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy年M月d日 HH:mm", { locale: zhCN });
  };

  const getDifficultyColor = (difficulty?: number | null) => {
    if (!difficulty) return "bg-gray-500";
    if (difficulty >= 8) return "bg-red-500";
    if (difficulty >= 6) return "bg-orange-500";
    if (difficulty >= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getScenarioLabel = (type?: string | null) => {
    const labels: Record<string, string> = {
      family: "家庭",
      work: "职场",
      social: "社交",
      romantic: "恋爱",
      other: "其他",
    };
    return labels[type || "other"] || "未知";
  };

  const handleBriefingClick = async (briefing: CommunicationBriefing) => {
    setSelectedBriefing(briefing);
    await loadBriefingTags(briefing.id);
  };

  const handleDateSelect = async (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("communication_briefings")
      .select("*, conversations!inner(user_id)")
      .eq("conversations.user_id", user.id)
      .gte("created_at", `${dateStr}T00:00:00`)
      .lte("created_at", `${dateStr}T23:59:59`)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setBriefings(data);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedBriefing) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedBriefing(null);
            setSelectedTags([]);
          }}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {selectedBriefing.communication_theme}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedBriefing.scenario_type && (
                    <Badge variant="secondary">
                      {getScenarioLabel(selectedBriefing.scenario_type)}
                    </Badge>
                  )}
                  {selectedBriefing.communication_difficulty && (
                    <Badge className={getDifficultyColor(selectedBriefing.communication_difficulty)}>
                      难度 {selectedBriefing.communication_difficulty}/10
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedBriefing.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {selectedBriefing.scenario_analysis && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  场景分析
                </h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.scenario_analysis}</p>
              </div>
            )}

            {selectedBriefing.see_content && (
              <div>
                <h3 className="font-semibold mb-2">👀 看见（See）</h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.see_content}</p>
              </div>
            )}

            {selectedBriefing.understand_content && (
              <div>
                <h3 className="font-semibold mb-2">🤝 读懂（Understand）</h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.understand_content}</p>
              </div>
            )}

            {selectedBriefing.perspective_shift && (
              <div className="p-4 bg-accent/50 rounded-lg">
                <h3 className="font-semibold mb-2">💡 视角转换</h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.perspective_shift}</p>
              </div>
            )}

            {selectedBriefing.influence_content && (
              <div>
                <h3 className="font-semibold mb-2">🎯 影响（Influence）</h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.influence_content}</p>
              </div>
            )}

            {selectedBriefing.recommended_script && (
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">
                  ✅ 推荐话术
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {selectedBriefing.recommended_script}
                </p>
              </div>
            )}

            {selectedBriefing.avoid_script && (
              <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <h3 className="font-semibold mb-2 text-red-700 dark:text-red-400">
                  ❌ 避免说法
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {selectedBriefing.avoid_script}
                </p>
              </div>
            )}

            {selectedBriefing.strategy && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-semibold mb-2">🎓 沟通策略</h3>
                <p className="text-sm">{selectedBriefing.strategy}</p>
              </div>
            )}

            {selectedBriefing.act_content && (
              <div>
                <h3 className="font-semibold mb-2">🚀 行动（Act）</h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.act_content}</p>
              </div>
            )}

            {selectedBriefing.micro_action && (
              <div className="p-4 bg-accent rounded-lg">
                <h3 className="font-semibold mb-2">⚡ 今日微行动</h3>
                <p className="text-sm">{selectedBriefing.micro_action}</p>
              </div>
            )}

            {selectedBriefing.growth_insight && (
              <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <h3 className="font-semibold mb-2 text-purple-700 dark:text-purple-400">
                  🌱 成长洞察
                </h3>
                <p className="text-sm leading-relaxed">{selectedBriefing.growth_insight}</p>
              </div>
            )}

            {selectedBriefing.difficulty_keywords && selectedBriefing.difficulty_keywords.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">🏷️ 难点关键词</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBriefing.difficulty_keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">🏷️ 标签管理</h3>
              <CommunicationBriefingTagSelector
                briefingId={selectedBriefing.id}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </div>

            {/* 频率疗愈推荐 */}
            <div className="pt-4">
              <FrequencyMusicPlayer 
                emotionTheme={selectedBriefing.communication_theme} 
              />
            </div>

            {/* 分享按钮 */}
            <div className="pt-4">
              <Button
                onClick={() => setShareDialogOpen(true)}
                className="w-full gap-2"
                variant="outline"
              >
                <Share2 className="h-4 w-4" />
                分享到社区
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 分享对话框 */}
        <BriefingShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          coachType="communication"
          briefingId={selectedBriefing.id}
          emotionTheme={selectedBriefing.communication_theme}
          emotionIntensity={selectedBriefing.communication_difficulty || undefined}
          insight={selectedBriefing.growth_insight || undefined}
          action={selectedBriefing.micro_action || undefined}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>沟通日记 - 有劲AI</title>
        <meta name="description" content="记录沟通，提升表达能力" />
        <meta property="og:title" content="有劲AI沟通日记" />
        <meta property="og:description" content="四步沟通法记录，让关系更顺畅" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/communication-history" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4 space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground">沟通日记</h1>
            <div className="flex items-center gap-1 md:gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/communication-coach")}>
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">返回</span>
              </Button>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
              <Button
                variant={filterTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTag(null)}
                className="h-7 text-xs"
              >
                全部
              </Button>
              {allTags.map((tag) => (
                <Button
                  key={tag.id}
                  variant={filterTag === tag.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterTag(tag.name)}
                  className="h-7 text-xs"
                  style={
                    filterTag === tag.name
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { borderColor: tag.color, color: tag.color }
                  }
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-6 h-auto">
            <ResponsiveTabsTrigger value="list" label="记录列表" shortLabel="列表" />
            <ResponsiveTabsTrigger value="trends" label="沟通趋势" shortLabel="趋势" />
            <ResponsiveTabsTrigger value="insights" label="模式洞察" shortLabel="洞察" />
            <ResponsiveTabsTrigger value="comparison" label="记录对比" shortLabel="对比" />
            <ResponsiveTabsTrigger value="review" label="沟通复盘" shortLabel="复盘" />
          </TabsList>

          <TabsContent value="list" className="space-y-4 md:space-y-6">
            <CommunicationHeatmap onDateSelect={handleDateSelect} />

            {briefings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">还没有沟通记录</p>
                  <Button onClick={() => navigate("/communication-coach")}>
                    开始第一次对话
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 md:gap-4">
                {briefings.map((briefing) => (
                  <Card
                    key={briefing.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleBriefingClick(briefing)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base md:text-lg mb-2">
                            {briefing.communication_theme}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                            {briefing.scenario_type && (
                              <Badge variant="secondary" className="text-xs">
                                {getScenarioLabel(briefing.scenario_type)}
                              </Badge>
                            )}
                            {briefing.communication_difficulty && (
                              <Badge className={`${getDifficultyColor(briefing.communication_difficulty)} text-xs`}>
                                难度 {briefing.communication_difficulty}/10
                              </Badge>
                            )}
                            {briefing.difficulty_keywords?.slice(0, 3).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                    {briefing.scenario_analysis && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {briefing.scenario_analysis}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDate(briefing.created_at)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </TabsContent>

          <TabsContent value="trends">
            <CommunicationTrendAnalysis />
          </TabsContent>

          <TabsContent value="insights">
            <CommunicationPatternInsights />
          </TabsContent>

          <TabsContent value="comparison">
            <CommunicationComparison briefings={briefings as any} />
          </TabsContent>

          <TabsContent value="review">
            <CommunicationReview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}