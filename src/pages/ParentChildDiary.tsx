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

      // Load completed parent coaching sessions
      const { data, error } = await supabase
        .from("parent_coaching_sessions")
        .select("*")
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
          return { ...session, tags } as ParentSession;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
          <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-8 space-y-4 md:space-y-6 shadow-lg">
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground pb-3 md:pb-4 border-b border-border/50">
              <Calendar className="w-3 h-3 md:w-4 md:h-4" />
              {formatDate(selectedSession.created_at)}
            </div>

            <div className="space-y-4 md:space-y-6">
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
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
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
                <span className="hidden sm:inline">对话列表</span>
                <span className="sm:hidden">列表</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">事件分析</span>
                <span className="sm:hidden">事件</span>
              </TabsTrigger>
              <TabsTrigger value="patterns" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">成长洞察</span>
                <span className="sm:hidden">洞察</span>
              </TabsTrigger>
              <TabsTrigger value="steps" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">四部曲</span>
                <span className="sm:hidden">进度</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="text-xs md:text-sm py-2">
                <span className="hidden sm:inline">日历</span>
                <span className="sm:hidden">日历</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-3 md:space-y-4">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-3">
                  {filteredSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {session.event_description || "亲子教练对话"}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(session.created_at).toLocaleDateString("zh-CN", {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
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

            <TabsContent value="events">
              <ParentEventAnalysis sessions={sessions} />
            </TabsContent>

            <TabsContent value="patterns">
              <ParentPatternInsights sessions={sessions} />
            </TabsContent>

            <TabsContent value="steps">
              <FourStepsProgress sessions={sessions} />
            </TabsContent>

            <TabsContent value="calendar">
              <ParentSessionHeatmap sessions={sessions} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default ParentChildDiary;
