import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Badge } from "@/components/ui/badge";
import { ParentPatternInsights } from "@/components/parentDiary/ParentPatternInsights";
import { ParentTagManager } from "@/components/parentDiary/ParentTagManager";
import { ParentEmotionTagCloud } from "@/components/parentDiary/ParentEmotionTagCloud";
import { ParentCycleAnalysis } from "@/components/parentDiary/ParentCycleAnalysis";
import { ParentEmotionReview } from "@/components/parentDiary/ParentEmotionReview";
import { ParentSessionDetail } from "@/components/parentDiary/ParentSessionDetail";
import UnifiedEmotionHeatmap from "@/components/UnifiedEmotionHeatmap";
import { XiaojinMoodReport } from "@/components/parent-coach/XiaojinMoodReport";

interface ParentTag {
  id: string;
  name: string;
  color: string;
}

interface ParentSession {
  id: string;
  event_description: string | null;
  feel_it: any;
  see_it: any;
  sense_it: any;
  transform_it: any;
  micro_action: string | null;
  summary: string | null;
  created_at: string;
  tags?: ParentTag[];
  briefing?: {
    emotion_theme: string;
    emotion_intensity: number | null;
    insight: string | null;
    action: string | null;
    growth_story: string | null;
    intensity_reasoning: string | null;
    intensity_keywords: string[] | null;
  };
}

const ParentChildDiary = () => {
  const [sessions, setSessions] = useState<ParentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ParentSession | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<ParentTag[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadSessions();
  }, []);

  const checkAuthAndLoadSessions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    await loadSessions();
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("parent_coaching_sessions")
        .select(`
          *,
          briefings:briefing_id (
            emotion_theme,
            emotion_intensity,
            insight,
            action,
            growth_story,
            intensity_reasoning,
            intensity_keywords
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const sessionsWithTags = await Promise.all(
        (data || []).map(async (session) => {
          const { data: tagData } = await supabase
            .from("parent_session_tags")
            .select(`tag_id, parent_tags (id, name, color)`)
            .eq("session_id", session.id);

          const tags = tagData?.map((t: any) => t.parent_tags).filter(Boolean) || [];
          return { ...session, tags, briefing: session.briefings } as ParentSession;
        })
      );

      setSessions(sessionsWithTags);

      const { data: tagsData } = await supabase
        .from("parent_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setAllTags(tagsData || []);
    } catch (error: any) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = selectedTagFilter
    ? sessions.filter(session => session.tags?.some(tag => tag.id === selectedTagFilter))
    : sessions;

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedSession) {
    return (
      <ParentSessionDetail
        session={selectedSession}
        onBack={() => setSelectedSession(null)}
        onTagsChange={loadSessions}
      />
    );
  }

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-purple-50 via-pink-50 to-white pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="parentChildDiary" />
      <PageHeader
        title="亲子日记"
        backTo="/parent-coach"
        rightActions={<ParentTagManager onTagsChange={loadSessions} />}
      />
      {allTags.length > 0 && (
        <div className="container max-w-2xl mx-auto px-3 md:px-4 pt-2 pb-1">
          <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
            <span className="text-xs text-muted-foreground whitespace-nowrap">筛选:</span>
            <Button
              variant={selectedTagFilter === null ? "secondary" : "outline"}
              size="sm"
              className="h-6 text-xs"
              onClick={() => setSelectedTagFilter(null)}
            >
              全部
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag.id}
                variant={selectedTagFilter === tag.id ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-xs"
                onClick={() => setSelectedTagFilter(tag.id)}
                style={{
                  backgroundColor: selectedTagFilter === tag.id ? `${tag.color}20` : undefined,
                  color: selectedTagFilter === tag.id ? tag.color : undefined,
                  borderColor: selectedTagFilter === tag.id ? tag.color : undefined,
                }}
              >
                {tag.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有亲子教练记录</p>
            <p className="text-sm text-muted-foreground mt-2">完成亲子教练对话后会生成记录 💜</p>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">
              <ResponsiveTabsTrigger value="list" label="亲子简报" shortLabel="简报" />
              <ResponsiveTabsTrigger value="trends" label="情绪趋势" shortLabel="趋势" />
              <ResponsiveTabsTrigger value="insights" label="模式洞察" shortLabel="洞察" />
            </TabsList>

            {/* Tab 1: 简报列表 */}
            <TabsContent value="list">
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-4">
                  {filteredSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌿</span>
                            <span className="font-semibold text-sm text-foreground">
                              {session.briefing?.emotion_theme || "亲子觉察"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(session.created_at).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        {session.briefing?.insight && (
                          <div className="flex gap-2 items-start">
                            <span className="text-amber-500 mt-0.5">💡</span>
                            <p className="text-sm text-foreground/80 line-clamp-2">{session.briefing.insight}</p>
                          </div>
                        )}

                        {session.briefing?.action && (
                          <div className="flex gap-2 items-start">
                            <span className="text-orange-500 mt-0.5">⚡</span>
                            <p className="text-sm text-foreground/70 line-clamp-1">{session.briefing.action}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {session.briefing?.emotion_intensity != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                              强度 {session.briefing.emotion_intensity}/10
                            </span>
                          )}
                          {session.tags?.map(tag => (
                            <Badge
                              key={tag.id}
                              variant="secondary"
                              className="text-xs"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                borderColor: tag.color,
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab 2: 趋势 = 热力图 + 标签云 + 周期分析 */}
            <TabsContent value="trends">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 md:space-y-6">
                  <UnifiedEmotionHeatmap
                    briefings={sessions.map(s => ({
                      id: s.id,
                      emotion_theme: s.briefing?.emotion_theme || "亲子对话",
                      emotion_intensity: s.briefing?.emotion_intensity || 5,
                      created_at: s.created_at,
                      stage_1_content: null,
                      stage_2_content: null,
                      stage_3_content: null,
                      stage_4_content: null,
                      insight: s.briefing?.insight || null,
                      action: s.briefing?.action || null,
                      growth_story: s.briefing?.growth_story || null,
                      intensity_reasoning: s.briefing?.intensity_reasoning || null,
                      intensity_keywords: s.briefing?.intensity_keywords || null,
                      tags: s.tags,
                    }))}
                    quickLogs={[]}
                  />
                  <ParentEmotionTagCloud sessions={sessions} />
                  <ParentCycleAnalysis sessions={sessions} />
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Tab 3: 洞察 = PatternInsights + EmotionReview */}
            <TabsContent value="insights">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 md:space-y-6">
                  <ParentPatternInsights />
                  <ParentEmotionReview />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ParentChildDiary;
