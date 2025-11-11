import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, Loader2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EmotionTrendChart from "@/components/EmotionTrendChart";
import EmotionTagCloud from "@/components/EmotionTagCloud";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagManager } from "@/components/TagManager";
import { BriefingTagSelector } from "@/components/BriefingTagSelector";
import { Badge } from "@/components/ui/badge";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Briefing {
  id: string;
  emotion_theme: string;
  stage_1_content: string | null;
  stage_2_content: string | null;
  stage_3_content: string | null;
  stage_4_content: string | null;
  insight: string | null;
  action: string | null;
  growth_story: string | null;
  created_at: string;
  tags?: TagType[];
}

const History = () => {
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<TagType[]>([]);
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
      const { data, error } = await supabase
        .from("briefings")
        .select(`
          *,
          conversations!inner(user_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

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
          return { ...briefing, tags };
        })
      );

      setBriefings(briefingsWithTags);
      
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedBriefing) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container max-w-2xl mx-auto px-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedBriefing(null)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回列表
            </Button>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto px-4 py-8">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground pb-4 border-b border-border/50">
              <Calendar className="w-4 h-4" />
              {formatDate(selectedBriefing.created_at)}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  🌸 今日主题情绪
                </h3>
                <p className="text-foreground/80">{selectedBriefing.emotion_theme}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  🌿 情绪四部曲旅程
                </h3>
                <div className="space-y-3 pl-4">
                  {selectedBriefing.stage_1_content && (
                    <div>
                      <p className="font-medium text-foreground">1️⃣ 觉察（Feel it）</p>
                      <p className="text-foreground/70 text-sm mt-1">{selectedBriefing.stage_1_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_2_content && (
                    <div>
                      <p className="font-medium text-foreground">2️⃣ 理解（Name it）</p>
                      <p className="text-foreground/70 text-sm mt-1">{selectedBriefing.stage_2_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_3_content && (
                    <div>
                      <p className="font-medium text-foreground">3️⃣ 看见反应（Recognize）</p>
                      <p className="text-foreground/70 text-sm mt-1">{selectedBriefing.stage_3_content}</p>
                    </div>
                  )}
                  {selectedBriefing.stage_4_content && (
                    <div>
                      <p className="font-medium text-foreground">4️⃣ 转化（Transform it）</p>
                      <p className="text-foreground/70 text-sm mt-1">{selectedBriefing.stage_4_content}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedBriefing.insight && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    💡 今日洞察
                  </h3>
                  <p className="text-foreground/80">{selectedBriefing.insight}</p>
                </div>
              )}

              {selectedBriefing.action && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    ✅ 今日行动
                  </h3>
                  <p className="text-foreground/80">{selectedBriefing.action}</p>
                </div>
              )}

              {selectedBriefing.growth_story && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    🌸 今日成长故事
                  </h3>
                  <p className="text-foreground/80 italic">💫「{selectedBriefing.growth_story}」</p>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium text-foreground mb-2">标签</h3>
                <BriefingTagSelector
                  briefingId={selectedBriefing.id}
                  selectedTags={selectedBriefing.tags || []}
                  onTagsChange={loadBriefings}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-foreground">历史简报</h1>
            <div className="flex items-center gap-2">
              <TagManager onTagsChange={loadBriefings} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回主页
              </Button>
            </div>
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">筛选:</span>
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

      <main className="container max-w-2xl mx-auto px-4 py-8">
        {briefings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有简报记录</p>
            <p className="text-sm text-muted-foreground mt-2">完成一次情绪梳理后会生成简报 🌿</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tag-stats")}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                标签统计
              </Button>
            </div>
            
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="list">简报列表</TabsTrigger>
                <TabsTrigger value="trends">情绪趋势</TabsTrigger>
                <TabsTrigger value="cloud">标签云</TabsTrigger>
              </TabsList>
            
            <TabsContent value="list">
              <ScrollArea className="h-[calc(100vh-340px)]">
                <div className="space-y-4">
                  {briefings
                    .filter((briefing) => {
                      if (!selectedTagFilter) return true;
                      return briefing.tags?.some((tag) => tag.id === selectedTagFilter);
                    })
                    .map((briefing) => (
                      <button
                        key={briefing.id}
                        onClick={() => setSelectedBriefing(briefing)}
                        className="w-full bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-all duration-200 text-left"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <h3 className="font-semibold text-foreground">{briefing.emotion_theme}</h3>
                              {briefing.insight && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{briefing.insight}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
                              <Calendar className="w-3 h-3" />
                              {formatDate(briefing.created_at)}
                            </div>
                          </div>
                          {briefing.tags && briefing.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {briefing.tags.map((tag) => (
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
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="trends">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <EmotionTrendChart briefings={briefings} />
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="cloud">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <EmotionTagCloud briefings={briefings} />
              </ScrollArea>
            </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
