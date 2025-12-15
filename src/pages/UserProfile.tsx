import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, MessageCircle, Settings, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { VideoLearningProfile } from "@/components/VideoLearningProfile";

interface UserProfileData {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  mood_status: string | null;
}

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
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [likes, setLikes] = useState<UserLike[]>([]);
  const [comments, setComments] = useState<UserComment[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);

  const isOwnProfile = !userId || session?.user?.id === userId;
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

      // 加载用户资料
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, bio, mood_status")
        .eq("id", displayUserId)
        .single();

      setProfile(profileData);

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

  const displayName = profile?.display_name || (isOwnProfile ? "我" : `用户${displayUserId?.slice(0, 6)}`);
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回
          </Button>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/settings")}
              className="text-muted-foreground"
            >
              <Settings className="w-4 h-4 mr-1" />
              编辑资料
            </Button>
          )}
        </div>

        {/* 用户信息卡片 - 增强版 */}
        <Card className="mb-6 bg-white/70 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
          {/* 封面背景 */}
          <div className="h-24 bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400" />
          
          <CardContent className="relative pt-0 pb-6">
            {/* 头像 */}
            <div className="flex flex-col items-center -mt-12 mb-4">
              <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={displayName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* 用户名和签名 */}
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-foreground mb-1">
                {displayName}
              </h1>
              {profile?.bio ? (
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {profile.bio}
                </p>
              ) : isOwnProfile ? (
                <p className="text-sm text-muted-foreground/60 italic">
                  点击"编辑资料"添加个性签名
                </p>
              ) : null}
              {profile?.mood_status && (
                <Badge variant="secondary" className="mt-2">
                  {profile.mood_status}
                </Badge>
              )}
            </div>

            {/* 统计数据 */}
            <div className="flex justify-center gap-8 pt-4 border-t border-border/50">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{posts.length}</div>
                <div className="text-xs text-muted-foreground">帖子</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{totalLikes}</div>
                <div className="text-xs text-muted-foreground">获赞</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{achievements.length}</div>
                <div className="text-xs text-muted-foreground">成就</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 内容标签页 */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm">
            <ResponsiveTabsTrigger value="posts" label="帖子" />
            <ResponsiveTabsTrigger value="likes" label="点赞" />
            <ResponsiveTabsTrigger value="comments" label="评论" />
            <ResponsiveTabsTrigger value="achievements" label="成就" />
            <ResponsiveTabsTrigger value="learning" label="学习档案" shortLabel="学习" />
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
