import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, Loader2, BarChart3, Share2, ChevronDown, ChevronUp, Filter, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmotionTagCloud from "@/components/EmotionTagCloud";
import EmotionCycleAnalysis from "@/components/EmotionCycleAnalysis";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { TagManager } from "@/components/TagManager";
import { EmotionPatternInsights } from "@/components/EmotionPatternInsights";
import { MeditationZone } from "@/components/MeditationZone";
import { EmotionReview } from "@/components/EmotionReview";
import { BriefingTagSelector } from "@/components/BriefingTagSelector";
import { Badge } from "@/components/ui/badge";
import { MusicRecommendation } from "@/components/MusicRecommendation";
import { FrequencyMusicPlayer } from "@/components/FrequencyMusicPlayer";
import { EmotionIntensityCard } from "@/components/EmotionIntensityMeter";
import { Separator } from "@/components/ui/separator";
import UnifiedEmotionIntensityChart from "@/components/UnifiedEmotionIntensityChart";
import UnifiedEmotionHeatmap from "@/components/UnifiedEmotionHeatmap";
import BriefingShareDialog from "@/components/briefing/BriefingShareDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EmotionAnalyticsDashboard } from "@/components/emotion/EmotionAnalyticsDashboard";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface QuickLog {
  id: string;
  emotion_intensity: number;
  created_at: string;
  note: string | null;
}

export interface Briefing {
  id: string;
  emotion_theme: string;
  stage_1_content: string | null;
  stage_2_content: string | null;
  stage_3_content: string | null;
  stage_4_content: string | null;
  insight: string | null;
  action: string | null;
  growth_story: string | null;
  emotion_intensity: number | null;
  intensity_reasoning: string | null;
  intensity_keywords: string[] | null;
  created_at: string;
  tags?: TagType[];
  camp_source?: string | null;
  mama_source?: boolean;
  mama_type?: 'emotion' | 'gratitude' | null;
}

const History = () => {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [quickLogs, setQuickLogs] = useState<QuickLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isTagFilterExpanded, setIsTagFilterExpanded] = useState(false);
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

      // Load briefings - 只查询当前用户的数据
      const { data, error } = await supabase
        .from("briefings")
        .select(`
          *,
          conversations!inner(user_id, title)
        `)
        .eq('conversations.user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Load quick logs
      const { data: quickLogsData } = await supabase
        .from("emotion_quick_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setQuickLogs(quickLogsData || []);

      // Load tags for each briefing
      const briefingsWithTags = await Promise.all(
        (data || []).map(async (briefing) => {
          const { data: tagData } = await supabase
            .from("briefing_tags")
            .select(`
              tag_id,
              tags (id, name, color)
            `)
            .eq("briefing_id", briefing.id);

          const tags = tagData?.map((t: any) => t.tags).filter(Boolean) || [];
          return { 
            ...briefing, 
            intensity_reasoning: (briefing as any).intensity_reasoning || null,
            intensity_keywords: (briefing as any).intensity_keywords || null,
            tags 
          } as Briefing;
        })
      );

      // Backfill: ensure every briefing has at least one tag
      const untagged = briefingsWithTags.filter(b => !b.tags || b.tags.length === 0);
      let didBackfill = false;
      if (untagged.length > 0) {
        try {
          if (user) {
            // Get or create default tag
            const defaultTagName = "情绪梳理";
            let { data: defaultTag } = await supabase
              .from("tags")
              .select("id, name, color")
              .eq("user_id", user.id)
              .eq("name", defaultTagName)
              .maybeSingle();

            if (!defaultTag) {
              const { data: created, error: createErr } = await supabase
                .from("tags")
                .insert({ user_id: user.id, name: defaultTagName, color: "#10b981" })
                .select("id, name, color")
                .single();
              if (!createErr) defaultTag = created as any;
            }

            if (defaultTag) {
              for (const b of untagged) {
                const { error: insertError } = await supabase
                  .from("briefing_tags")
                  .insert({ briefing_id: b.id, tag_id: (defaultTag as any).id });
                // 只有成功时才设置 didBackfill，避免 RLS 失败导致无限循环
                if (!insertError) {
                  didBackfill = true;
                }
              }
            }
          }
        } catch (e) {
          console.error("Backfill tags error:", e);
        }
      }

      if (didBackfill) {
        // Reload once to reflect new tags
        return await loadBriefings();
      }

      // 过滤掉家长教练的简报，确保只显示情绪日记的简报
      const { data: parentBriefingLinks } = await supabase
        .from('parent_coaching_sessions')
        .select('briefing_id')
        .not('briefing_id', 'is', null);

      const parentBriefingIds = new Set(
        parentBriefingLinks?.map(p => p.briefing_id).filter(Boolean) || []
      );

      const emotionDiaryBriefings = briefingsWithTags.filter(
        b => !parentBriefingIds.has(b.id)
      );

      // 查询简报对应的训练营来源
      const briefingIds = emotionDiaryBriefings.map(b => b.id);
      const { data: campLinks } = await supabase
        .from('camp_daily_progress')
        .select('reflection_briefing_id, camp_id, training_camps!camp_daily_progress_camp_id_fkey(camp_name)')
        .in('reflection_briefing_id', briefingIds.length > 0 ? briefingIds : ['__none__']);

      const campSourceMap = new Map<string, string>();
      campLinks?.forEach((link: any) => {
        if (link.reflection_briefing_id && link.training_camps?.camp_name) {
          campSourceMap.set(link.reflection_briefing_id, link.training_camps.camp_name);
        }
      });

      const briefingsWithCampSource = emotionDiaryBriefings.map(b => {
        const convTitle = (b as any).conversations?.title || '';
        const isMamaEmotion = convTitle.startsWith('[宝妈AI]') && !convTitle.startsWith('[宝妈AI-');
        const isMamaGratitude = convTitle.startsWith('[宝妈AI-感恩]');
        return {
          ...b,
          camp_source: campSourceMap.get(b.id) || null,
          mama_source: isMamaEmotion || isMamaGratitude,
          mama_type: isMamaGratitude ? 'gratitude' : (isMamaEmotion ? 'emotion' : null),
        };
      });

      setBriefings(briefingsWithCampSource);
      
      // Load all available tags for filtering
      const { data: tagsData } = await supabase
        .from("tags")
        .select("*")
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

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedBriefing) {
    return (
      <div 
        className="h-screen overflow-y-auto overscroll-contain bg-background pb-[env(safe-area-inset-bottom)]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PageHeader title="情绪简报" showBack />

        <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                {formatDate(selectedBriefing.created_at)}
              </div>
              {selectedBriefing.camp_source && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  🏕️ {selectedBriefing.camp_source}
                </Badge>
              )}
              {selectedBriefing.mama_source && !selectedBriefing.camp_source && (
                <Badge variant="secondary" className="text-xs" style={{ backgroundColor: '#FFF3EB', color: '#F4845F', borderColor: '#F4845F33' }}>
                  {selectedBriefing.mama_type === 'gratitude' ? '💛 宝妈AI·感恩' : '💛 宝妈AI·情绪'}
                </Badge>
              )}
            </div>

            <div className="space-y-4 md:space-y-6">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  🌸 今日主题情绪
                </h3>
                <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.emotion_theme}</p>
              </div>

              {selectedBriefing.emotion_intensity && (
                <div className="space-y-3">
                  <div>
                    <EmotionIntensityCard intensity={selectedBriefing.emotion_intensity} />
                  </div>
                  
                  {/* 情绪强度分析 */}
                  {(selectedBriefing.intensity_reasoning || selectedBriefing.intensity_keywords) && (
                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 md:p-4 space-y-2.5">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        📊 情绪强度分析
                      </h4>
                      
                      {selectedBriefing.intensity_reasoning && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">判断依据</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{selectedBriefing.intensity_reasoning}</p>
                        </div>
                      )}
                      
                      {selectedBriefing.intensity_keywords && selectedBriefing.intensity_keywords.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">关键词</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedBriefing.intensity_keywords.map((keyword, index) => (
                              <span 
                                key={index}
                                className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 md:mb-3 flex items-center gap-2">
                  🌿 情绪四部曲旅程
                </h3>
                <div className="space-y-3 pl-2 md:pl-4">
                  {selectedBriefing.stage_1_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">1️⃣ 觉察（Feel it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.stage_1_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_2_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">2️⃣ 理解（Name it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.stage_2_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_3_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">3️⃣ 看见反应（Recognize）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.stage_3_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_4_content && (
                    <div>
                      <p className="font-medium text-foreground text-sm md:text-base">4️⃣ 转化（Transform it）</p>
                      <p className="text-foreground/70 text-xs md:text-sm mt-1">{selectedBriefing.stage_4_content}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedBriefing.insight && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    💡 今日洞察
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.insight}</p>
                </div>
              )}

              {selectedBriefing.action && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ✅ 今日行动
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80">{selectedBriefing.action}</p>
                </div>
              )}

              {selectedBriefing.growth_story && (
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🌸 今日成长故事
                  </h3>
                  <p className="text-sm md:text-base text-foreground/80 italic">💫「{selectedBriefing.growth_story}」</p>
                </div>
              )}

              <div className="pt-3 md:pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-2">标签</h3>
                <BriefingTagSelector
                  briefingId={selectedBriefing.id}
                  selectedTags={selectedBriefing.tags || []}
                  onTagsChange={loadBriefings}
                />
              </div>

              {/* 频率疗愈推荐 */}
              <div className="pt-3 md:pt-4 border-t border-border/50">
                <FrequencyMusicPlayer emotionTheme={selectedBriefing.emotion_theme} />
              </div>

              <div className="pt-3 md:pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-3">情绪音乐推荐</h3>
                <MusicRecommendation
                  emotionTheme={selectedBriefing.emotion_theme}
                  insight={selectedBriefing.insight || undefined}
                  briefingContent={`${selectedBriefing.stage_1_content} ${selectedBriefing.stage_2_content}`}
                />
              </div>

              {/* 分享按钮 */}
              <div className="pt-3 md:pt-4 border-t border-border/50">
                <Button
                  onClick={() => setShareDialogOpen(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Share2 className="h-4 w-4" />
                  分享到社区
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* 分享对话框 */}
        <BriefingShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          coachType="emotion"
          briefingId={selectedBriefing.id}
          emotionTheme={selectedBriefing.emotion_theme}
          emotionIntensity={selectedBriefing.emotion_intensity || undefined}
          insight={selectedBriefing.insight || undefined}
          action={selectedBriefing.action || undefined}
          growthStory={selectedBriefing.growth_story || undefined}
        />
      </div>
    );
  }

  return (
    <div 
      className="h-screen overflow-y-auto overscroll-contain bg-background pb-[env(safe-area-inset-bottom)]"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <DynamicOGMeta pageKey="emotionHistory" />
      <PageHeader title="我的情绪日记" showBack rightActions={
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/tag-stats")} className="gap-1 md:gap-2 px-2 md:px-3">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">标签统计</span>
          </Button>
          <TagManager onTagsChange={loadBriefings} />
        </div>
      } />
          {allTags.length > 0 && (
            <Collapsible open={isTagFilterExpanded} onOpenChange={setIsTagFilterExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-xs">
                  <Filter className="w-3.5 h-3.5" />
                  <span>筛选</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {allTags.length}
                  </Badge>
                  {selectedTagFilter && (
                    <Badge 
                      variant="outline" 
                      className="h-5 px-1.5 text-xs"
                      style={{
                        backgroundColor: `${allTags.find(t => t.id === selectedTagFilter)?.color}20`,
                        color: allTags.find(t => t.id === selectedTagFilter)?.color,
                        borderColor: allTags.find(t => t.id === selectedTagFilter)?.color,
                      }}
                    >
                      {allTags.find(t => t.id === selectedTagFilter)?.name}
                    </Badge>
                  )}
                  {isTagFilterExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
                  <Button
                    variant={selectedTagFilter === null ? "secondary" : "outline"}
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setSelectedTagFilter(null);
                      setIsTagFilterExpanded(false);
                    }}
                  >
                    全部
                  </Button>
                  {allTags.map((tag) => (
                    <Button
                      key={tag.id}
                      variant={selectedTagFilter === tag.id ? "secondary" : "outline"}
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => {
                        setSelectedTagFilter(tag.id);
                        setIsTagFilterExpanded(false);
                      }}
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
              </CollapsibleContent>
            </Collapsible>
          )}

      <main className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {briefings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有简报记录</p>
            <p className="text-sm text-muted-foreground mt-2">完成一次情绪梳理后会生成简报 🌿</p>
          </div>
        ) : (
          <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-6 mb-4 md:mb-6 h-auto">
                <ResponsiveTabsTrigger value="list" label="简报列表" shortLabel="列表" />
                <ResponsiveTabsTrigger value="analytics" label="数据分析" shortLabel="分析" />
                <ResponsiveTabsTrigger value="trends" label="情绪趋势" shortLabel="趋势" />
                <ResponsiveTabsTrigger value="patterns" label="模式洞察" shortLabel="模式" />
                <ResponsiveTabsTrigger value="meditation" label="冥想专区" shortLabel="冥想" />
                <ResponsiveTabsTrigger value="review" label="情绪复盘" shortLabel="复盘" />
              </TabsList>
            
            <TabsContent value="list">
              <div className="space-y-4 md:space-y-6">
              {/* 情绪日历概览 */}
                <UnifiedEmotionHeatmap 
                  briefings={briefings.map(b => ({
                    id: b.id,
                    emotion_theme: b.emotion_theme,
                    emotion_intensity: b.emotion_intensity,
                    created_at: b.created_at,
                    camp_source: b.camp_source,
                    briefing_tags: b.tags?.map(t => ({ tags: { name: t.name, sentiment: null } })) || []
                  }))}
                  quickLogs={quickLogs}
                />

                <Separator className="my-4 md:my-6" />

                {/* 简报列表 */}
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">📝 简报列表</h3>
                  <ScrollArea className="h-[calc(100vh-480px)]">
                    <div className="space-y-3 md:space-y-4">
                      {briefings
                        .filter((briefing) => {
                      if (!selectedTagFilter) return true;
                      return briefing.tags?.some((tag) => tag.id === selectedTagFilter);
                    })
                    .map((briefing) => (
                       <button
                        key={briefing.id}
                        onClick={() => setSelectedBriefing(briefing)}
                        className="w-full bg-card border border-border rounded-2xl p-4 md:p-6 hover:shadow-md transition-all duration-200 text-left"
                      >
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-wrap">
                                <h3 className="font-semibold text-foreground text-sm md:text-base">{briefing.emotion_theme}</h3>
                                {briefing.camp_source && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    🏕️ {briefing.camp_source}
                                  </Badge>
                                )}
                                {briefing.mama_source && !briefing.camp_source && (
                                  <Badge variant="secondary" className="text-xs" style={{ backgroundColor: '#FFF3EB', color: '#F4845F', borderColor: '#F4845F33' }}>
                                    {briefing.mama_type === 'gratitude' ? '💛 宝妈AI·感恩' : '💛 宝妈AI·情绪'}
                                  </Badge>
                                )}
                                {briefing.emotion_intensity && (
                                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
                                    briefing.emotion_intensity <= 3 ? 'bg-green-500/10' :
                                    briefing.emotion_intensity <= 6 ? 'bg-orange-500/10' :
                                    'bg-red-500/10'
                                  }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                      briefing.emotion_intensity <= 3 ? 'bg-green-500' :
                                      briefing.emotion_intensity <= 6 ? 'bg-orange-500' :
                                      'bg-red-500'
                                    }`} />
                                    <span className="text-muted-foreground">强度</span>
                                    <span className={`font-semibold ${
                                      briefing.emotion_intensity <= 3 ? 'text-green-600' :
                                      briefing.emotion_intensity <= 6 ? 'text-orange-600' :
                                      'text-red-600'
                                    }`}>
                                      {briefing.emotion_intensity}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                              {briefing.insight && (
                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{briefing.insight}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span className="whitespace-nowrap">{formatDate(briefing.created_at)}</span>
                            </div>
                          </div>
                          {briefing.tags && briefing.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {briefing.tags.map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5"
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
                          )}
                        </div>
                      </button>
                     ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <EmotionAnalyticsDashboard />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="trends">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 md:space-y-6">
                  {/* 宏观视角 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">📊 宏观视角</h3>
                    <EmotionTagCloud briefings={briefings} />
                  </div>

                  {/* 深度分析 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground px-1">🔍 深度分析</h3>
                    <EmotionCycleAnalysis briefings={briefings} quickLogs={quickLogs} />
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="patterns">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <EmotionPatternInsights />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="meditation">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <MeditationZone />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="review">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <EmotionReview />
              </ScrollArea>
            </TabsContent>
            </Tabs>
        )}
      </main>
    </div>
  );
};

export default History;
