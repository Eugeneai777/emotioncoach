import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Calendar, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import TagTrendChart from "@/components/TagTrendChart";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Briefing {
  id: string;
  emotion_theme: string;
  insight: string | null;
  created_at: string;
  tags?: TagType[];
}

interface TagStats {
  tag: TagType;
  count: number;
  percentage: number;
  briefings: Briefing[];
}

const TagStats = () => {
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndLoadStats();
  }, []);

  useEffect(() => {
    const tagId = searchParams.get('tag');
    if (tagId) {
      setSelectedTag(tagId);
    }
  }, [searchParams]);

  const checkAuthAndLoadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    await loadTagStats();
  };

  const loadTagStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 加载所有标签
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (tagsError) throw tagsError;

      // 加载当前用户的简报及其标签
      const { data: briefingsData, error: briefingsError } = await supabase
        .from("briefings")
        .select(`
          *,
          conversations!inner(user_id)
        `)
        .eq('conversations.user_id', user.id)
        .order("created_at", { ascending: false });

      if (briefingsError) throw briefingsError;

      const briefingsWithTags = await Promise.all(
        (briefingsData || []).map(async (briefing) => {
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

      const totalBriefings = briefingsWithTags.length;

      // 计算每个标签的统计信息
      const stats: TagStats[] = (tagsData || []).map((tag) => {
        const tagBriefings = briefingsWithTags.filter((briefing) =>
          briefing.tags?.some((t) => t.id === tag.id)
        );
        return {
          tag,
          count: tagBriefings.length,
          percentage: totalBriefings > 0 ? (tagBriefings.length / totalBriefings) * 100 : 0,
          briefings: tagBriefings,
        };
      }).sort((a, b) => b.count - a.count);

      setTagStats(stats);
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
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedTagData = selectedTag ? tagStats.find((s) => s.tag.id === selectedTag) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/history")}
                className="gap-1.5 md:gap-2 text-xs md:text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">返回历史</span>
                <span className="sm:hidden">返回</span>
              </Button>
              <h1 className="text-base md:text-xl font-bold text-foreground">标签统计</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {tagStats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">还没有标签统计数据</p>
            <p className="text-sm text-muted-foreground mt-2">完成情绪梳理后会自动生成标签 🌿</p>
          </div>
        ) : selectedTagData ? (
          <div className="space-y-4 md:space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTag(null)}
              className="gap-1.5 md:gap-2 text-xs md:text-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              返回概览
            </Button>

            <Card className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge
                    variant="secondary"
                    className="text-sm md:text-lg px-3 md:px-4 py-0.5 md:py-1"
                    style={{
                      backgroundColor: `${selectedTagData.tag.color}20`,
                      color: selectedTagData.tag.color,
                      borderColor: selectedTagData.tag.color,
                    }}
                  >
                    {selectedTagData.tag.name}
                  </Badge>
                  <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      {selectedTagData.count} 次
                    </span>
                    <span>{selectedTagData.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </Card>

            <TagTrendChart
              briefings={selectedTagData.briefings}
              tagColor={selectedTagData.tag.color}
              tagName={selectedTagData.tag.name}
            />

            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-foreground">相关简报 ({selectedTagData.briefings.length})</h3>
              <ScrollArea className="h-[calc(100vh-600px)] md:h-[calc(100vh-680px)]">
                <div className="space-y-2 md:space-y-3">
                  {selectedTagData.briefings.map((briefing) => (
                    <Card
                      key={briefing.id}
                      className="p-3 md:p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/history`)}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <h4 className="font-medium text-sm md:text-base text-foreground flex-1">{briefing.emotion_theme}</h4>
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
                            <Calendar className="w-3 h-3" />
                            {formatDate(briefing.created_at)}
                          </div>
                        </div>
                        {briefing.insight && (
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{briefing.insight}</p>
                        )}
                        {briefing.tags && briefing.tags.length > 1 && (
                          <div className="flex flex-wrap gap-1 md:gap-1.5 pt-1 md:pt-2">
                            {briefing.tags
                              .filter((t) => t.id !== selectedTagData.tag.id)
                              .map((tag) => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-[10px] md:text-xs"
                                  style={{
                                    backgroundColor: `${tag.color}10`,
                                    color: tag.color,
                                    borderColor: `${tag.color}40`,
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
            </div>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            <Card className="p-4 md:p-6 space-y-3 md:space-y-4 bg-gradient-to-br from-card to-card/50">
              <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                📊 标签使用概览
              </h2>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">总标签数</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{tagStats.length}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">已使用</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">
                    {tagStats.filter((s) => s.count > 0).length}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">最常用</p>
                  <p className="text-lg md:text-2xl font-bold text-foreground truncate" style={{ color: tagStats[0]?.tag.color }}>
                    {tagStats[0]?.tag.name || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">使用次数</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{tagStats[0]?.count || 0}</p>
                </div>
              </div>
            </Card>

            <ScrollArea className="h-[calc(100vh-280px)] md:h-[calc(100vh-340px)]">
              <div className="space-y-2 md:space-y-3">
                {tagStats.map((stat) => (
                  <Card
                    key={stat.tag.id}
                    className="p-4 md:p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => setSelectedTag(stat.tag.id)}
                  >
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-start justify-between gap-3 md:gap-4">
                        <div className="flex-1 space-y-1.5 md:space-y-2">
                          <Badge
                            variant="secondary"
                            className="text-xs md:text-sm"
                            style={{
                              backgroundColor: `${stat.tag.color}20`,
                              color: stat.tag.color,
                              borderColor: stat.tag.color,
                            }}
                          >
                            {stat.tag.name}
                          </Badge>
                          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-muted-foreground">
                            <span>{stat.count} 次</span>
                            <span>•</span>
                            <span>{stat.percentage.toFixed(1)}%</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                          查看
                        </Button>
                      </div>
                      <Progress
                        value={stat.percentage}
                        className="h-1.5 md:h-2"
                        style={{
                          backgroundColor: `${stat.tag.color}20`,
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </main>
    </div>
  );
};

export default TagStats;
