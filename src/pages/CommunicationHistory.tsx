import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, MessageSquare, TrendingUp, Brain, GitCompare, FileText } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CommunicationBriefingTagSelector } from "@/components/communication/CommunicationBriefingTagSelector";
import { CommunicationHeatmap } from "@/components/communication/CommunicationHeatmap";
import { CommunicationPatternInsights } from "@/components/communication/CommunicationPatternInsights";
import { CommunicationTrendAnalysis } from "@/components/communication/CommunicationTrendAnalysis";

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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">沟通日记</h1>
          <Button onClick={() => navigate("/communication-coach")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            开始新对话
          </Button>
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterTag === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterTag(null)}
            >
              全部
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag.id}
                variant={filterTag === tag.name ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterTag(tag.name)}
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

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="list">
            <MessageSquare className="h-4 w-4 mr-2" />
            简报列表
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            沟通趋势
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Brain className="h-4 w-4 mr-2" />
            模式洞察
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <GitCompare className="h-4 w-4 mr-2" />
            对比分析
          </TabsTrigger>
          <TabsTrigger value="review">
            <FileText className="h-4 w-4 mr-2" />
            沟通复盘
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
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
            <div className="grid gap-4">
              {briefings.map((briefing) => (
                <Card
                  key={briefing.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleBriefingClick(briefing)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {briefing.communication_theme}
                        </CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                          {briefing.scenario_type && (
                            <Badge variant="secondary">
                              {getScenarioLabel(briefing.scenario_type)}
                            </Badge>
                          )}
                          {briefing.communication_difficulty && (
                            <Badge className={getDifficultyColor(briefing.communication_difficulty)}>
                              难度 {briefing.communication_difficulty}/10
                            </Badge>
                          )}
                          {briefing.difficulty_keywords?.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
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
          <Card>
            <CardContent className="py-12 text-center">
              <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">对比分析功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">沟通复盘功能开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}