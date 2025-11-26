import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PostCard from "@/components/community/PostCard";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Star, Trophy, Loader2 } from "lucide-react";

interface HotPost {
  id: string;
  user_id: string;
  post_type: string;
  title: string | null;
  content: string | null;
  image_urls: string[] | null;
  emotion_theme: string | null;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
  camp_day: number | null;
  badges: any;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  heat_score?: number;
}

interface TopUser {
  user_id: string;
  is_anonymous: boolean;
  post_count: number;
  total_likes: number;
  total_comments: number;
  display_name?: string;
}

const CommunityDiscover = () => {
  const [hotPosts, setHotPosts] = useState<HotPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<HotPost[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("hot");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDiscoverContent();
  }, []);

  const loadDiscoverContent = async () => {
    try {
      setLoading(true);
      await Promise.all([loadHotPosts(), loadFeaturedPosts(), loadTopUsers()]);
    } catch (error) {
      console.error("加载发现内容失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载发现内容",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHotPosts = async () => {
    // 热门帖子：根据点赞数、评论数、分享数和时间计算热度
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("visibility", "public")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("likes_count", { ascending: false })
      .limit(10);

    if (error) throw error;

    // 计算热度分数
    const postsWithScore = (data || []).map((post) => ({
      ...post,
      heat_score:
        post.likes_count * 3 +
        post.comments_count * 5 +
        post.shares_count * 2,
    }));

    postsWithScore.sort((a, b) => b.heat_score! - a.heat_score!);
    setHotPosts(postsWithScore);
  };

  const loadFeaturedPosts = async () => {
    // 精华内容：点赞数 > 10 且评论数 > 5 的帖子
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("visibility", "public")
      .gte("likes_count", 10)
      .gte("comments_count", 5)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    setFeaturedPosts(data || []);
  };

  const loadTopUsers = async () => {
    // 活跃用户排行榜
    const { data, error } = await supabase
      .from("community_posts")
      .select("user_id, is_anonymous, likes_count, comments_count")
      .eq("visibility", "public")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // 聚合统计
    const userStats = new Map<string, TopUser>();

    (data || []).forEach((post) => {
      const existing = userStats.get(post.user_id) || {
        user_id: post.user_id,
        is_anonymous: post.is_anonymous,
        post_count: 0,
        total_likes: 0,
        total_comments: 0,
      };

      existing.post_count += 1;
      existing.total_likes += post.likes_count;
      existing.total_comments += post.comments_count;

      userStats.set(post.user_id, existing);
    });

    const sortedUsers = Array.from(userStats.values())
      .sort((a, b) => b.total_likes - a.total_likes)
      .slice(0, 10);

    setTopUsers(sortedUsers);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/community")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">发现精彩</h1>
            <p className="text-muted-foreground text-sm">
              探索社区热门内容和活跃成员
            </p>
          </div>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="hot">
              <TrendingUp className="h-4 w-4 mr-2" />
              热门
            </TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-2" />
              精华
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <Trophy className="h-4 w-4 mr-2" />
              排行榜
            </TabsTrigger>
          </TabsList>

          {/* 热门内容 */}
          <TabsContent value="hot" className="space-y-4">
            {hotPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无热门内容</p>
              </div>
            ) : (
              hotPosts.map((post) => (
                <div key={post.id} className="relative">
                  {post.heat_score && post.heat_score > 50 && (
                    <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-red-500 to-orange-500">
                      🔥 {post.heat_score} 热度
                    </Badge>
                  )}
                  <PostCard post={post} onUpdate={loadHotPosts} />
                </div>
              ))
            )}
          </TabsContent>

          {/* 精华内容 */}
          <TabsContent value="featured" className="space-y-4">
            {featuredPosts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>暂无精华内容</p>
              </div>
            ) : (
              featuredPosts.map((post) => (
                <div key={post.id} className="relative">
                  <Badge className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-500 to-amber-500">
                    ⭐ 精华
                  </Badge>
                  <PostCard post={post} onUpdate={loadFeaturedPosts} />
                </div>
              ))
            )}
          </TabsContent>

          {/* 排行榜 */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  本月活跃榜单
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无排行数据</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topUsers.map((user, index) => {
                      const displayName = user.is_anonymous
                        ? "匿名用户"
                        : user.display_name || "用户";

                      const getMedalEmoji = (rank: number) => {
                        if (rank === 0) return "🥇";
                        if (rank === 1) return "🥈";
                        if (rank === 2) return "🥉";
                        return `${rank + 1}`;
                      };

                      return (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-xl font-bold">
                            {getMedalEmoji(index)}
                          </div>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {user.is_anonymous ? "匿" : displayName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">
                              {displayName}
                            </p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>📝 {user.post_count} 帖子</span>
                              <span>❤️ {user.total_likes} 获赞</span>
                              <span>💬 {user.total_comments} 评论</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityDiscover;
