import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GratitudeQuickAdd } from "@/components/gratitude/GratitudeQuickAdd";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface GratitudeEntry {
  id: string;
  content: string;
  category: string;
  themes?: string[];
  created_at: string;
}

const GratitudeCoach = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("gratitude_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEntries();
    setIsRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span>🌸</span> 感恩教练
              </h1>
              <p className="text-sm text-muted-foreground">看见日常微光，点亮内心力量</p>
            </div>
          </div>
          
          <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-8 text-center">
            <span className="text-4xl mb-4 block">🌸</span>
            <h3 className="text-lg font-medium mb-2">请先登录</h3>
            <p className="text-sm text-muted-foreground mb-4">
              登录后开始记录感恩
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
            >
              去登录
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-3 py-3 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <span>🌸</span> 感恩教练
              </h1>
              <p className="text-xs text-muted-foreground">看见日常微光，点亮内心力量</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/gratitude-history')}
              title="查看完整日记"
            >
              <BookOpen className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-4 mb-4">
          <p className="text-center text-muted-foreground">
            今天有什么让你感到感恩的事情吗？<br />
            <span className="text-sm opacity-75">在下方输入框记录下来吧 ✨</span>
          </p>
        </div>

        {/* Recent Entries */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">最近记录</h2>
            <Button
              variant="link"
              size="sm"
              className="text-xs h-auto p-0 text-pink-600"
              onClick={() => navigate('/gratitude-history')}
            >
              查看全部 →
            </Button>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-6 text-center">
              <span className="text-3xl mb-2 block">🌱</span>
              <p className="text-sm text-muted-foreground">
                还没有记录，开始写下第一条感恩吧
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl bg-white/60 dark:bg-gray-800/40 backdrop-blur p-3"
                >
                  <p className="text-sm mb-2">{entry.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {entry.themes?.map((theme) => (
                        <span
                          key={theme}
                          className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.created_at), "M月d日 HH:mm", { locale: zhCN })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Input */}
      <GratitudeQuickAdd userId={user.id} onAdded={loadEntries} />
    </div>
  );
};

export default GratitudeCoach;
