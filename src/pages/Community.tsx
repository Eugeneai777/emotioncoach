import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import WaterfallPostCard from "@/components/community/WaterfallPostCard";
import PostDetailSheet from "@/components/community/PostDetailSheet";
import PostComposer from "@/components/community/PostComposer";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
}

const categories = [
  { value: 'following', label: '关注', emoji: '👥' },
  { value: 'discover', label: '发现', emoji: '✨' },
  { value: 'resonance', label: '同频', emoji: '💫' },
  { value: 'story', label: '故事', emoji: '📖' },
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

  // Load emotion tags for story filter
  const loadEmotionTags = async () => {
    try {
      const { data } = await supabase
        .from("community_posts")
        .select("emotion_theme")
        .eq("post_type", "story")
        .not("emotion_theme", "is", null)
        .not("camp_id", "is", null);

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
        query = query
          .eq("post_type", "story")
          .not("camp_id", "is", null);
        
        if (selectedEmotionTag) {
          query = query.eq("emotion_theme", selectedEmotionTag);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold mb-1 flex items-center justify-center gap-2">
              <span className="inline-block">🌈</span>
              <span className="bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent" style={{ backgroundSize: '200% 200%' }}>
                有劲社区
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              ✨ 分享成长 · 见证蜕变 ✨
            </p>
          </div>
          <div className="w-10" />
        </div>

        {/* Category Filter */}
        <ScrollArea className="w-full mb-4">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <Button
                key={category.value}
                variant={activeFilter === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setActiveFilter(category.value);
                  setSelectedEmotionTag(null);
                }}
                className="whitespace-nowrap shrink-0"
              >
                <span className="mr-1">{category.emoji}</span>
                {category.label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Emotion Tag Filter for Story */}
        {activeFilter === "story" && emotionTags.length > 0 && (
          <ScrollArea className="w-full mb-4">
            <div className="flex gap-2 pb-2">
              <Button
                variant={selectedEmotionTag === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedEmotionTag(null)}
                className="whitespace-nowrap shrink-0 text-xs"
              >
                全部
              </Button>
              {emotionTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedEmotionTag === tag ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedEmotionTag(tag)}
                  className="whitespace-nowrap shrink-0 text-xs"
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
            variant="outline"
            className="w-full h-11 text-sm mb-4 bg-card border-border/60 hover:bg-muted hover:border-border transition-all duration-200 text-foreground/90"
          >
            <Plus className="mr-2 h-4 w-4 text-foreground/70" />
            分享动态
          </Button>
        )}

        {/* Posts Waterfall */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无分享内容</p>
            <p className="text-sm">成为第一个分享故事的人吧！</p>
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
      </div>
    </div>
  );
};

export default Community;
