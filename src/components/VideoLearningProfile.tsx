import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Heart, 
  Clock, 
  TrendingUp, 
  ExternalLink,
  Trash2,
  Loader2 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface VideoCourse {
  id: string;
  title: string;
  video_url: string;
  description?: string;
  category?: string;
  tags?: string[];
}

interface WatchHistory {
  id: string;
  video_id: string;
  watched_at: string;
  watch_duration?: number;
  completed: boolean;
  video_courses: VideoCourse;
}

interface Favorite {
  id: string;
  video_id: string;
  created_at: string;
  notes?: string;
  video_courses: VideoCourse;
}

interface LearningStats {
  totalWatched: number;
  totalCompleted: number;
  totalFavorites: number;
  topCategories: { category: string; count: number }[];
}

export const VideoLearningProfile = () => {
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [stats, setStats] = useState<LearningStats>({
    totalWatched: 0,
    totalCompleted: 0,
    totalFavorites: 0,
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load watch history
      const { data: historyData, error: historyError } = await supabase
        .from("video_watch_history")
        .select(`
          *,
          video_courses (*)
        `)
        .eq("user_id", user.id)
        .order("watched_at", { ascending: false })
        .limit(20);

      if (historyError) throw historyError;

      // Load favorites
      const { data: favoritesData, error: favoritesError } = await supabase
        .from("video_favorites")
        .select(`
          *,
          video_courses (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (favoritesError) throw favoritesError;

      setWatchHistory(historyData || []);
      setFavorites(favoritesData || []);

      // Calculate stats
      const uniqueVideos = new Set(historyData?.map(h => h.video_id) || []);
      const completedCount = historyData?.filter(h => h.completed).length || 0;
      
      const categoryCount: Record<string, number> = {};
      historyData?.forEach(h => {
        const category = h.video_courses?.category;
        if (category) {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });

      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      setStats({
        totalWatched: uniqueVideos.size,
        totalCompleted: completedCount,
        totalFavorites: favoritesData?.length || 0,
        topCategories
      });

    } catch (error) {
      console.error("Error loading learning data:", error);
      toast({
        title: "加载失败",
        description: "无法加载学习档案",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("video_favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      toast({
        title: "已取消收藏",
      });
      loadLearningData();
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const completionRate = stats.totalWatched > 0 
    ? Math.round((stats.totalCompleted / stats.totalWatched) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalWatched}</p>
              <p className="text-sm text-muted-foreground">已观看课程</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalCompleted}</p>
              <p className="text-sm text-muted-foreground">完成课程</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/20">
              <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.totalFavorites}</p>
              <p className="text-sm text-muted-foreground">收藏课程</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">完成率</span>
              <span className="text-sm font-medium text-foreground">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </Card>
      </div>

      {/* Top Categories */}
      {stats.topCategories.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">学习偏好</h3>
          <div className="flex flex-wrap gap-3">
            {stats.topCategories.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-2 px-4">
                {item.category} ({item.count}次)
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs for History and Favorites */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">观看历史</TabsTrigger>
          <TabsTrigger value="favorites">我的收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-3 mt-4">
          {watchHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">还没有观看记录</p>
            </Card>
          ) : (
            watchHistory.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground">
                        {item.video_courses?.title}
                      </h4>
                      {item.completed && (
                        <Badge variant="secondary" className="text-xs">
                          已完成
                        </Badge>
                      )}
                    </div>
                    {item.video_courses?.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.video_courses.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.watched_at), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </span>
                      {item.video_courses?.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.video_courses.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(item.video_courses?.video_url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-3 mt-4">
          {favorites.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">还没有收藏的课程</p>
            </Card>
          ) : (
            favorites.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground mb-2">
                      {item.video_courses?.title}
                    </h4>
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-2 italic">
                        "{item.notes}"
                      </p>
                    )}
                    {item.video_courses?.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.video_courses.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      {item.video_courses?.category && (
                        <Badge variant="outline" className="text-xs">
                          {item.video_courses.category}
                        </Badge>
                      )}
                      {item.video_courses?.tags?.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(item.video_courses?.video_url, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFavorite(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};