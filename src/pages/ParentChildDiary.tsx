import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ParentEventAnalysis } from "@/components/parentDiary/ParentEventAnalysis";
import { ParentPatternInsights } from "@/components/parentDiary/ParentPatternInsights";
import { FourStepsProgress } from "@/components/parentDiary/FourStepsProgress";
import { ParentSessionHeatmap } from "@/components/parentDiary/ParentSessionHeatmap";
import { ParentSessionTagSelector } from "@/components/parentDiary/ParentSessionTagSelector";
import { ParentTagManager } from "@/components/parentDiary/ParentTagManager";
import { ParentEmotionTagCloud } from "@/components/parentDiary/ParentEmotionTagCloud";
import { ParentCycleAnalysis } from "@/components/parentDiary/ParentCycleAnalysis";
import { ParentSessionComparison } from "@/components/parentDiary/ParentSessionComparison";
import { ParentEmotionReview } from "@/components/parentDiary/ParentEmotionReview";
import { MusicRecommendation } from "@/components/MusicRecommendation";
import { FrequencyMusicPlayer } from "@/components/FrequencyMusicPlayer";
import { EmotionIntensityCard } from "@/components/EmotionIntensityMeter";
import UnifiedEmotionHeatmap from "@/components/UnifiedEmotionHeatmap";

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

      // Load completed parent coaching sessions with briefings
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

      // Load tags for each session
      const sessionsWithTags = await Promise.all(
        (data || []).map(async (session) => {
          const { data: tagData } = await supabase
            .from("parent_session_tags")
            .select(`
              tag_id,
              parent_tags (id, name, color)
            `)
            .eq("session_id", session.id);

          const tags = tagData?.map((t: any) => t.parent_tags).filter(Boolean) || [];
          return { ...session, tags, briefing: session.briefings } as ParentSession;
        })
      );

      setSessions(sessionsWithTags);
      
      // Load all available tags for filtering
      const { data: tagsData } = await supabase
        .from("parent_tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      setAllTags(tagsData || []);
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

  const filteredSessions = selectedTagFilter
    ? sessions.filter(session => 
        session.tags?.some(tag => tag.id === selectedTagFilter)
      )
    : sessions;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white">
        <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedSession(null)}
              className="gap-1 md:gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="bg-white border border-purple-100 rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 shadow-lg">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pb-3 md:pb-4 border-b border-border/50">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              {formatDate(selectedSession.created_at)}
            </div>

            <div className="space-y-4 md:space-y-6">
              {selectedSession.briefing?.emotion_theme && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    💜 情绪主题
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.briefing.emotion_theme}</p>
                </div>
              )}

              {selectedSession.briefing?.emotion_intensity !== null && selectedSession.briefing?.emotion_intensity !== undefined && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    📊 情绪强度
                  </h3>
                  <EmotionIntensityCard intensity={selectedSession.briefing.emotion_intensity} />
                  {selectedSession.briefing.intensity_reasoning && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-foreground/70 leading-relaxed">
                        <span className="font-medium">分析：</span>{selectedSession.briefing.intensity_reasoning}
                      </p>
                      {selectedSession.briefing.intensity_keywords && selectedSession.briefing.intensity_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedSession.briefing.intensity_keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedSession.event_description && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🌟 触发事件
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.event_description}</p>
                </div>
              )}

              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 flex items-center gap-2">
                  💜 亲子情绪四部曲旅程
                </h3>
                <div className="space-y-3 pl-2 md:pl-4">
                  {selectedSession.feel_it && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">1️⃣ 觉察（Feel it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">
                        {typeof selectedSession.feel_it === 'string' 
                          ? selectedSession.feel_it 
                          : JSON.stringify(selectedSession.feel_it)}
                      </p>
                    </div>
                  )}
                  {selectedSession.see_it && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">2️⃣ 看见（See it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">
                        {typeof selectedSession.see_it === 'string' 
                          ? selectedSession.see_it 
                          : JSON.stringify(selectedSession.see_it)}
                      </p>
                    </div>
                  )}
                  {selectedSession.sense_it && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">3️⃣ 反应（Sense it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">
                        {typeof selectedSession.sense_it === 'string' 
                          ? selectedSession.sense_it 
                          : JSON.stringify(selectedSession.sense_it)}
                      </p>
                    </div>
                  )}
                  {selectedSession.transform_it && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">4️⃣ 转化（Transform it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">
                        {typeof selectedSession.transform_it === 'string' 
                          ? selectedSession.transform_it 
                          : JSON.stringify(selectedSession.transform_it)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedSession.briefing?.insight && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    💡 今日洞察
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.briefing.insight}</p>
                </div>
              )}

              {selectedSession.briefing?.action && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🎯 今日行动
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.briefing.action}</p>
                </div>
              )}

              {selectedSession.briefing?.growth_story && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🌱 今日成长故事
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.briefing.growth_story}</p>
                </div>
              )}

              {selectedSession.micro_action && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ✨ 微行动
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.micro_action}</p>
                </div>
              )}

              {selectedSession.summary && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    📝 总结
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedSession.summary}</p>
                </div>
              )}

              <div className="pt-3 md:pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-2">标签</h3>
                <ParentSessionTagSelector
                  sessionId={selectedSession.id}
                  selectedTags={selectedSession.tags || []}
                  onTagsChange={loadSessions}
                />
              </div>

              {selectedSession.briefing?.emotion_theme && (
                <>
                  <div className="pt-3 md:pt-4 border-t border-border/50">
                    <FrequencyMusicPlayer emotionTheme={selectedSession.briefing.emotion_theme} />
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-border/50">
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                      🎵 音乐推荐
                    </h3>
                    <MusicRecommendation 
                      emotionTheme={selectedSession.briefing.emotion_theme}
                      insight={selectedSession.briefing.insight || undefined}
                      briefingContent={selectedSession.summary || undefined}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      <header className="border-b border-purple-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4 space-y-2 md:space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground">我的亲子日记</h1>
            <div className="flex items-center gap-1 md:gap-2">
              <ParentTagManager onTagsChange={loadSessions} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/parent-coach")}
                className="gap-1 md:gap-2 px-2 md:px-3"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回</span>
              </Button>
            </div>
          </div>
          {allTags.length > 0 && (
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
          )}
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有亲子教练记录</p>
            <p className="text-sm text-muted-foreground mt-2">完成家长情绪教练对话后会生成记录 💜</p>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-6 h-auto">
              <TabsTrigger value="list" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">记录列表</span>
                <span className="sm:hidden">列表</span>
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">情绪趋势</span>
                <span className="sm:hidden">趋势</span>
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">模式洞察</span>
                <span className="sm:hidden">洞察</span>
              </TabsTrigger>
              <TabsTrigger value="compare" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">记录对比</span>
                <span className="sm:hidden">对比</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">情绪复盘</span>
                <span className="sm:hidden">复盘</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-3 md:space-y-4">
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
                  tags: s.tags
                }))}
                quickLogs={[]}
              />
              <Separator className="my-4" />
              <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="space-y-2">
                        {session.briefing?.emotion_theme && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">💜</span>
                            <span className="font-semibold text-foreground">{session.briefing.emotion_theme}</span>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {session.event_description || "亲子教练对话"}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(session.created_at).toLocaleDateString("zh-CN", {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                        {session.briefing?.emotion_intensity !== null && session.briefing?.emotion_intensity !== undefined && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                            强度 {session.briefing.emotion_intensity}/10
                          </div>
                        )}
                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {session.tags.map(tag => (
                              <Badge
                                key={tag.id}
                                variant="secondary"
                                className="text-xs"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                  borderColor: tag.color
                                }}
                              >
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="trends">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 md:space-y-6">
                  {/* 宏观视角 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">📊 宏观视角</h3>
                    <ParentEmotionTagCloud sessions={sessions} />
                  </div>

                  {/* 深度分析 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">🔍 深度分析</h3>
                    <ParentCycleAnalysis sessions={sessions} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="patterns">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <ParentPatternInsights />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="compare">
              <ParentSessionComparison sessions={sessions} />
            </TabsContent>

            <TabsContent value="review">
              <ParentEmotionReview />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ParentChildDiary;
