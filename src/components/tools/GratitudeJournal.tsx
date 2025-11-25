import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface GratitudeEntry {
  id: string;
  content: string;
  category: string;
  created_at: string;
}

const categories = [
  { id: "people", name: "人", color: "hsl(340, 75%, 55%)" },
  { id: "experiences", name: "经历", color: "hsl(210, 75%, 55%)" },
  { id: "achievements", name: "成就", color: "hsl(45, 90%, 55%)" },
  { id: "nature", name: "自然", color: "hsl(120, 60%, 50%)" },
  { id: "possessions", name: "拥有", color: "hsl(280, 65%, 60%)" },
  { id: "other", name: "其他", color: "hsl(200, 60%, 55%)" }
];

export const GratitudeJournal = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("people");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);

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
      const { error } = await supabase
        .from("gratitude_entries")
        .insert({
          user_id: user.id,
          content: content.trim(),
          category: selectedCategory
        });

      if (error) throw error;

      toast({
        title: "记录成功",
        description: "感恩的心，让生活更美好 ❤️"
      });

      setContent("");
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
                  <label className="text-sm font-medium mb-2 block">分类</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2"
                        style={{
                          backgroundColor: selectedCategory === cat.id ? cat.color : undefined,
                          borderColor: cat.color
                        }}
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowAddForm(false);
                      setContent("");
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? "保存中..." : "保存"}
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
              {selectedDate ? format(selectedDate, "yyyy年MM月dd日", { locale: zhCN }) : "所有"}的感恩记录
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
                  const category = categories.find(c => c.id === entry.category);
                  return (
                    <div
                      key={entry.id}
                      className="p-4 rounded-lg border-l-4"
                      style={{
                        borderLeftColor: category?.color,
                        backgroundColor: `${category?.color}10`
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: category?.color,
                            color: category?.color
                          }}
                        >
                          {category?.name}
                        </Badge>
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

      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>感恩洞察</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const count = entries.filter(e => e.category === cat.id).length;
                if (count === 0) return null;
                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <div className="text-2xl font-bold" style={{ color: cat.color }}>
                      {count}
                    </div>
                    <div className="text-sm text-muted-foreground">{cat.name}</div>
                  </div>
                );
              })}
            </div>

            <Button className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              生成AI感恩洞察
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
