import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Heart, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { GratitudeThemeSelector, GratitudeThemeBadge, THEME_DEFINITIONS } from "@/components/gratitude/GratitudeThemeBadge";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadEntries();
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
      // Determine category from first selected theme, or default
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

      // If no themes selected, let AI analyze and tag
      if (selectedThemes.length === 0 && insertedData) {
        setAnalyzing(true);
        await analyzeAndTagEntry(insertedData.id, content.trim());
        setAnalyzing(false);
      }

      setContent("");
      setSelectedThemes([]);
      setShowAddForm(false);
      loadEntries();
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

  // Calculate theme stats for display
  const themeStats: Record<string, number> = {};
  entries.forEach(entry => {
    const themes = entry.themes || [];
    themes.forEach(theme => {
      themeStats[theme] = (themeStats[theme] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                    placeholder="写下让你感恩的事情..."
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>选择日期</CardTitle>
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
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: zhCN }) : "所有"}的感恩日记
            </CardTitle>
            <CardDescription>共 {entries.length} 条</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>这一天还没有感恩记录</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {entries.map((entry) => {
                  const themes = entry.themes || [];
                  const primaryTheme = themes[0] ? THEME_DEFINITIONS.find(t => t.id === themes[0]) : null;
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: primaryTheme?.color || "hsl(var(--muted))",
                        backgroundColor: primaryTheme ? `${primaryTheme.color}10` : "hsl(var(--muted)/0.1)"
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex flex-wrap gap-1">
                          {themes.map(themeId => (
                            <GratitudeThemeBadge
                              key={themeId}
                              themeId={themeId}
                              size="sm"
                            />
                          ))}
                          {themes.length === 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {analyzing ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  AI分析中...
                                </>
                              ) : (
                                "待分析"
                              )}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm">{entry.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Theme Statistics */}
      {Object.keys(themeStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              七维度感恩分布
            </CardTitle>
            <CardDescription>
              看看你最常感恩什么
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {THEME_DEFINITIONS.map((theme) => {
                const count = themeStats[theme.id] || 0;
                const total = Object.values(themeStats).reduce((sum, v) => sum + v, 0);
                const percentage = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
                
                return (
                  <div
                    key={theme.id}
                    className="p-3 rounded-lg text-center transition-all hover:scale-105"
                    style={{ 
                      backgroundColor: count > 0 ? `${theme.color}20` : "hsl(var(--muted)/0.3)",
                      opacity: count > 0 ? 1 : 0.5
                    }}
                  >
                    <div className="text-2xl mb-1">{theme.emoji}</div>
                    <div className="text-lg font-bold" style={{ color: count > 0 ? theme.color : "hsl(var(--muted-foreground))" }}>
                      {count}
                    </div>
                    <div className="text-xs text-muted-foreground">{theme.name}</div>
                    {count > 0 && (
                      <div className="text-xs mt-1" style={{ color: theme.color }}>
                        {percentage}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
