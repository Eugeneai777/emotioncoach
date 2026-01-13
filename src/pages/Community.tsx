import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import WaterfallPostCard from "@/components/community/WaterfallPostCard";
import PostDetailSheet from "@/components/community/PostDetailSheet";
import PostComposer from "@/components/community/PostComposer";
import { Plus, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { Helmet } from "react-helmet";

interface CommunityPost {
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
  camp_id: string | null;
  badges: any;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_display_name?: string | null;
  author_avatar_url?: string | null;
}

const categories = [
  { value: 'following', label: '关注' },
  { value: 'discover', label: '发现' },
  { value: 'resonance', label: '同频' },
  { value: 'story', label: '故事' },
];

const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("discover");
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [selectedEmotionTag, setSelectedEmotionTag] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { showTour, completeTour } = usePageTour('community');

  // Load emotion tags for story filter
  const loadEmotionTags = async () => {
    try {
      const { data } = await supabase
        .from("community_posts")
        .select("emotion_theme")
        .eq("post_type", "story")
        .not("emotion_theme", "is", null);

      if (data) {
        const uniqueTags = [...new Set(data.map(p => p.emotion_theme).filter(Boolean))] as string[];
        setEmotionTags(uniqueTags);
      }
    } catch (error) {
      console.error("加载情绪标签失败:", error);
    }
  };

  // Load user's liked posts
  const loadLikedPosts = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", session.user.id);
      
      if (data) {
        setLikedPostIds(new Set(data.map(like => like.post_id)));
      }
    } catch (error) {
      console.error("加载点赞状态失败:", error);
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("community_posts")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50);

      if (activeFilter === "following") {
        if (!session) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        const { data: followingData } = await supabase
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", session.user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        
        if (followingIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        
        query = query.in("user_id", followingIds);
      } else if (activeFilter === "resonance") {
        if (!session) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const { data: userEmotions } = await supabase
          .from("community_posts")
          .select("emotion_theme")
          .eq("user_id", session.user.id)
          .not("emotion_theme", "is", null)
          .order("created_at", { ascending: false })
          .limit(10);

        const userThemes = [...new Set(userEmotions?.map(e => e.emotion_theme).filter(Boolean))];
        
        if (userThemes.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        query = query
          .in("emotion_theme", userThemes)
          .neq("user_id", session.user.id);
      } else if (activeFilter === "story") {
        query = query.eq("post_type", "story");
        
        if (selectedEmotionTag) {
          query = query.eq("emotion_theme", selectedEmotionTag);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // 批量获取作者资料
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);
        
        const postsWithProfiles = data.map(post => ({
          ...post,
          author_display_name: profiles?.find(p => p.id === post.user_id)?.display_name,
          author_avatar_url: profiles?.find(p => p.id === post.user_id)?.avatar_url,
        }));
        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("加载帖子失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载社区内容",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    if (activeFilter === "story") {
      loadEmotionTags();
    }
  }, [activeFilter, selectedEmotionTag]);

  useEffect(() => {
    loadLikedPosts();
  }, [session?.user?.id]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("community-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_posts",
          filter: "visibility=eq.public",
        },
        (payload) => {
          const newPost = payload.new as CommunityPost;
          if (activeFilter === "discover") {
            setPosts((current) => [newPost, ...current]);
            toast({
              title: "有新内容",
              description: "社区有新的分享啦 ✨",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter]);

  const handlePostCreated = () => {
    setShowComposer(false);
    loadPosts();
  };

  const handleCardClick = (post: CommunityPost) => {
    setSelectedPost(post);
  };

  const handleLikeChange = (postId: string, liked: boolean) => {
    setLikedPostIds(prev => {
      const next = new Set(prev);
      if (liked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  };

  // Split posts into two columns for waterfall layout
  const { leftPosts, rightPosts } = useMemo(() => {
    const left: CommunityPost[] = [];
    const right: CommunityPost[] = [];
    posts.forEach((post, index) => {
      if (index % 2 === 0) {
        left.push(post);
      } else {
        right.push(post);
      }
    });
    return { leftPosts: left, rightPosts: right };
  }, [posts]);

  const likedMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    posts.forEach(post => {
      map[post.id] = likedPostIds.has(post.id);
    });
    return map;
  }, [posts, likedPostIds]);

  // Skeleton loading component
  const SkeletonCards = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-3 shadow-sm animate-pulse">
            <div className="h-32 bg-muted rounded-lg mb-3" />
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-xl p-3 shadow-sm animate-pulse">
            <div className="h-24 bg-muted rounded-lg mb-3" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>有劲社区 - 有劲AI</title>
        <meta name="description" content="分享成长故事，见证彼此蜕变" />
        <meta property="og:title" content="有劲AI • 有劲社区" />
        <meta property="og:description" content="分享成长故事，见证彼此蜕变" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/community" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-foreground hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              🌈 有劲社区
            </h1>
            <p className="text-xs text-muted-foreground">分享成长 · 见证蜕变</p>
            </div>
          </div>
          {session ? (
            <Button 
              variant="outline" 
              size="sm"
              className="bg-card border-border hover:bg-accent hover:border-primary text-foreground font-medium shadow-sm"
              onClick={() => navigate("/my-posts")}
            >
              <User className="w-4 h-4 mr-1" />
              我的
            </Button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Category Filter - 4 Column Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant="outline"
              onClick={() => {
                setActiveFilter(category.value);
                setSelectedEmotionTag(null);
              }}
              className={cn(
                "min-h-[44px] active:scale-95 transition-all duration-150 touch-manipulation font-medium",
                activeFilter === category.value 
                  ? "bg-card border-primary border-2 text-primary shadow-md" 
                  : "bg-card border-border hover:bg-accent hover:border-primary/50 text-foreground"
              )}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Emotion Tag Filter for Story */}
        {activeFilter === "story" && emotionTags.length > 0 && (
          <ScrollArea className="w-full mb-4">
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedEmotionTag === null ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedEmotionTag(null)}
                className={cn(
                  "whitespace-nowrap shrink-0 text-xs rounded-full px-4 border",
                  selectedEmotionTag === null 
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm" 
                    : "bg-card border-border hover:bg-accent text-foreground"
                )}
              >
                全部
              </Button>
              {emotionTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedEmotionTag === tag ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedEmotionTag(tag)}
                  className={cn(
                    "whitespace-nowrap shrink-0 text-xs rounded-full px-4 border",
                    selectedEmotionTag === tag 
                      ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-sm" 
                      : "bg-card border-border hover:bg-accent text-foreground"
                  )}
                >
                  {tag}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Post Button */}
        {session && (
          <Button
            onClick={() => setShowComposer(true)}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 mb-4"
          >
            <Plus className="mr-2 h-5 w-5" />
            分享我的动态
          </Button>
        )}

        {/* Posts Waterfall */}
        {loading ? (
          <SkeletonCards />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-accent rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">暂无分享内容</p>
            <p className="text-sm text-muted-foreground mb-6">成为第一个分享故事的人吧！</p>
            {session && (
              <Button 
                onClick={() => setShowComposer(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" /> 发布第一个动态
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              {leftPosts.map((post) => (
                <WaterfallPostCard
                  key={post.id}
                  post={post}
                  onCardClick={() => handleCardClick(post)}
                  onLikeChange={handleLikeChange}
                  isLiked={likedMap[post.id]}
                />
              ))}
            </div>
            <div className="space-y-3">
              {rightPosts.map((post) => (
                <WaterfallPostCard
                  key={post.id}
                  post={post}
                  onCardClick={() => handleCardClick(post)}
                  onLikeChange={handleLikeChange}
                  isLiked={likedMap[post.id]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Post Detail Sheet */}
        <PostDetailSheet
          post={selectedPost}
          open={!!selectedPost}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedPost(null);
              loadPosts();
            }
          }}
        />

        {/* Post Composer Dialog */}
        <PostComposer
          open={showComposer}
          onOpenChange={setShowComposer}
          onSuccess={handlePostCreated}
        />
        <PageTour open={showTour} onComplete={completeTour} steps={pageTourConfig.community} pageTitle="有劲社区" />
      </div>
    </div>
  );
};

export default Community;
