import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { VideoLearningProfile } from "@/components/VideoLearningProfile";

interface UserPost {
  id: string;
  post_type: string;
  title: string | null;
  content: string | null;
  image_urls: string[] | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface UserLike {
  post_id: string;
  created_at: string;
  community_posts: {
    id: string;
    title: string | null;
    content: string | null;
    post_type: string;
  };
}

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  community_posts: {
    id: string;
    title: string | null;
    post_type: string;
  };
}

interface UserAchievement {
  id: string;
  achievement_name: string;
  achievement_type: string;
  achievement_description: string | null;
  icon: string | null;
  earned_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);

  const isOwnProfile = session?.user?.id === userId;
  const displayUserId = userId || session?.user?.id;

  useEffect(() => {
    if (!displayUserId) {
      navigate("/auth");
      return;
    }
    loadUserData();
  }, [displayUserId]);

  const loadUserData = async () => {
    if (!displayUserId) return;

    try {
      setLoading(true);

      // 加载用户帖子
      const { data: postsData } = await supabase
        .from("community_posts")
        .select("id, post_type, title, content, image_urls, likes_count, comments_count, created_at")
        .eq("user_id", displayUserId)
        .order("created_at", { ascending: false })
        .limit(20);

      setPosts(postsData || []);
      setTotalLikes(postsData?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0);

      // 加载点赞历史
      const { data: likesData } = await supabase
        .from("post_likes")
        .select(`
          post_id,
          created_at,
          community_posts (
            id,
            title,
            content,
            post_type
          )
        `)
        .eq("user_id", displayUserId)
        .order("created_at", { ascending: false })
        .limit(20);

      setLikes(likesData || []);

      // 加载评论历史
      const { data: commentsData } = await supabase
        .from("post_comments")
        .select(`
          id,
          content,
          created_at,
          post_id,
          community_posts (
            id,
            title,
            post_type
          )
        `)
        .eq("user_id", displayUserId)
        .order("created_at", { ascending: false })
        .limit(20);

      setComments(commentsData || []);

      // 加载成就徽章
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", displayUserId)
        .order("earned_at", { ascending: false });

      setAchievements(achievementsData || []);

    } catch (error) {
      console.error("加载用户数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        {/* 用户信息卡片 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-2xl bg-primary/10">
                  {displayUserId?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">
                  {isOwnProfile ? "我的主页" : `用户 ${displayUserId?.slice(0, 8)}`}
                </h1>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">{posts.length}</span> 篇帖子
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{totalLikes}</span> 获赞
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{achievements.length}</span> 个成就
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 内容标签页 */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts">帖子</TabsTrigger>
            <TabsTrigger value="likes">点赞</TabsTrigger>
            <TabsTrigger value="comments">评论</TabsTrigger>
            <TabsTrigger value="achievements">成就</TabsTrigger>
            <TabsTrigger value="learning">学习档案</TabsTrigger>
          </TabsList>

          {/* 帖子列表 */}
          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无帖子
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card
                  key={post.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate("/community")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {post.image_urls && post.image_urls.length > 0 && (
                        <img
                          src={post.image_urls[0]}
                          alt=""
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <Badge variant="outline" className="mb-2">
                          {post.post_type}
                        </Badge>
                        {post.title && (
                          <h3 className="font-medium mb-1 line-clamp-1">{post.title}</h3>
                        )}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments_count || 0}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 点赞列表 */}
          <TabsContent value="likes" className="space-y-4">
            {likes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无点赞
                </CardContent>
              </Card>
            ) : (
              likes.map((like) => (
                <Card
                  key={like.post_id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate("/community")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(like.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <Badge variant="outline" className="mb-2">
                      {like.community_posts.post_type}
                    </Badge>
                    {like.community_posts.title && (
                      <h3 className="font-medium mb-1">{like.community_posts.title}</h3>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {like.community_posts.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 评论列表 */}
          <TabsContent value="comments" className="space-y-4">
            {comments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无评论
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate("/community")}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    <div className="text-xs text-muted-foreground">
                      回复帖子：{comment.community_posts.title || "无标题"}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* 成就列表 */}
          <TabsContent value="achievements" className="space-y-4">
            {achievements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  暂无成就
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{achievement.icon || "🏆"}</div>
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{achievement.achievement_name}</h3>
                          {achievement.achievement_description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {achievement.achievement_description}
                            </p>
                          )}
                          <Badge variant="secondary">{achievement.achievement_type}</Badge>
                          <div className="text-xs text-muted-foreground mt-2">
                            获得于 {formatDistanceToNow(new Date(achievement.earned_at), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 学习档案 */}
          <TabsContent value="learning">
            <VideoLearningProfile />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
