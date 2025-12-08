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

  // Skeleton loading component
  const SkeletonCards = () => (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-3 shadow-sm animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg mb-3" />
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-teal-700 hover:bg-teal-100/50"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold text-teal-800 flex items-center gap-2">
              🌈 有劲社区
            </h1>
            <p className="text-xs text-teal-600">分享成长 · 见证蜕变</p>
            </div>
          </div>
          {session ? (
            <Button 
              variant="outline" 
              size="sm"
              className="bg-white border-teal-400 hover:bg-teal-50 hover:border-teal-500 text-teal-700 font-medium shadow-sm"
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
                  ? "bg-white border-teal-600 border-2 text-teal-800 shadow-md" 
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-teal-300 text-gray-600"
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
                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm" 
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
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
                      ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm" 
                      : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
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
            className="w-full h-12 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-medium shadow-lg shadow-teal-300/40 mb-4"
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
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">✨</span>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">暂无分享内容</p>
            <p className="text-sm text-gray-500 mb-6">成为第一个分享故事的人吧！</p>
            {session && (
              <Button 
                onClick={() => setShowComposer(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg"
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
      </div>
    </div>
  );
};

export default Community;
