import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Heart, Sparkles, Loader2, Filter, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { GratitudeThemeSelector, GratitudeThemeBadge, THEME_DEFINITIONS } from "@/components/gratitude/GratitudeThemeBadge";
import { GratitudeTagCloud } from "@/components/gratitude/GratitudeTagCloud";
import { GratitudeStreakTracker } from "@/components/gratitude/GratitudeStreakTracker";

interface GratitudeEntry {
  id: string;
  content: string;
  category: string;
  themes?: string[];
  created_at: string;
}

export const GratitudeJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [allEntries, setAllEntries] = useState<GratitudeEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    loadEntries();
    loadAllEntries();
  }, [user, selectedDate]);

  const loadEntries = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte("created_at", startOfDay.toISOString())
          .lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading gratitude entries:", error);
    }
  };

  const loadAllEntries = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllEntries(data || []);
    } catch (error) {
      console.error("Error loading all entries:", error);
    }
  };

  const analyzeAndTagEntry = async (entryId: string, entryContent: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-gratitude-entry", {
        body: { entryId, content: entryContent },
      });

      if (error) {
        console.error("AI analysis error:", error);
        return;
      }

      console.log("AI analyzed themes:", data?.themes);
    } catch (error) {
      console.error("Error analyzing entry:", error);
    }
  };

  const handleSave = async () => {
    if (!user || !content.trim()) {
      toast({
        title: "请输入感恩内容",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const category = selectedThemes.length > 0 
        ? selectedThemes[0].toLowerCase() 
        : "other";

      const { data: insertedData, error } = await supabase
        .from("gratitude_entries")
        .insert({
          user_id: user.id,
          content: content.trim(),
          category,
          themes: selectedThemes,
          date: selectedDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "记录成功",
        description: "感恩的心，让生活更美好 ❤️"
      });

      if (selectedThemes.length === 0 && insertedData) {
        setAnalyzing(true);
        await analyzeAndTagEntry(insertedData.id, content.trim());
        setAnalyzing(false);
      }

      setContent("");
      setSelectedThemes([]);
      setShowAddForm(false);
      loadEntries();
      loadAllEntries();
    } catch (error) {
      console.error("Error saving gratitude entry:", error);
      toast({
        title: "保存失败",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTheme = (themeId: string) => {
    setSelectedThemes(prev => 
      prev.includes(themeId) 
        ? prev.filter(t => t !== themeId)
        : [...prev, themeId]
    );
  };

  const handleTagCloudClick = (themeId: string) => {
    setFilterTag(prev => prev === themeId ? null : themeId);
  };

  const getTodayEntries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  };

  const todayCount = getTodayEntries().length;

  // Calculate theme stats from all entries
  const themeStats: Record<string, number> = useMemo(() => {
    const stats: Record<string, number> = {};
    allEntries.forEach(entry => {
      const themes = entry.themes || [];
      themes.forEach(theme => {
        stats[theme] = (stats[theme] || 0) + 1;
      });
    });
    return stats;
  }, [allEntries]);

  // Filter entries by selected tag
  const filteredEntries = useMemo(() => {
    if (!filterTag) return entries;
    return entries.filter(entry => entry.themes?.includes(filterTag));
  }, [entries, filterTag]);

  const selectedTagDef = filterTag ? THEME_DEFINITIONS.find(t => t.id === filterTag) : null;

  return (
    <div className="space-y-4">
      {/* Top Section: Streak + Tag Cloud */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GratitudeStreakTracker compact />
        <GratitudeTagCloud 
          themeStats={themeStats} 
          onTagClick={handleTagCloudClick}
          selectedTag={filterTag}
          showCounts
        />
      </div>

      {/* Add Entry Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="w-5 h-5 text-red-500" />
            今日感恩记录
          </CardTitle>
          <CardDescription>
            今天已记录 {todayCount} 件感恩的事
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加今日感恩
            </Button>
          )}

          {showAddForm && (
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">我感恩...</label>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    placeholder="写下让你感恩的事情... (Ctrl+Enter 保存)"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">主题标签（可选，不选AI会自动分析）</label>
                  <GratitudeThemeSelector
                    selectedThemes={selectedThemes}
                    onToggle={handleToggleTheme}
                    maxSelection={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setContent("");
                      setSelectedThemes([]);
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : "保存"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">选择日期</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={zhCN}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedDate ? format(selectedDate, "MM月dd日", { locale: zhCN }) : "所有"}的感恩
                </CardTitle>
                <CardDescription className="text-xs">
                  共 {filteredEntries.length} 条
                  {filterTag && ` · ${selectedTagDef?.emoji} ${selectedTagDef?.name}`}
                </CardDescription>
              </div>
              {filterTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterTag(null)}
                  className="text-muted-foreground h-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredEntries.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{filterTag ? "没有符合筛选条件的记录" : "这一天还没有感恩记录"}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {filteredEntries.map((entry) => {
                  const themes = entry.themes || [];
                  const primaryTheme = themes[0] ? THEME_DEFINITIONS.find(t => t.id === themes[0]) : null;
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md animate-fade-in"
                      style={{
                        borderLeftColor: primaryTheme?.color || "hsl(var(--muted))",
                        backgroundColor: primaryTheme ? `${primaryTheme.color}10` : "hsl(var(--muted)/0.1)"
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex flex-wrap gap-1">
                          {themes.length > 0 ? (
                            <>
                              <GratitudeThemeBadge
                                themeId={themes[0]}
                                size="sm"
                              />
                              {themes.slice(1).map(themeId => (
                                <GratitudeThemeBadge
                                  key={themeId}
                                  themeId={themeId}
                                  size="sm"
                                  showLabel={false}
                                />
                              ))}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {analyzing ? (
                                <>
                                  <Sparkles className="w-3 h-3 animate-pulse text-amber-500" />
                                  <span className="animate-pulse">AI分析中...</span>
                                </>
                              ) : (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  待分析
                                </>
                              )}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">{entry.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
