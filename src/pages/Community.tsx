import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import { Loader2, Plus, Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  badges: any;
  is_anonymous: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

const Community = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [showComposer, setShowComposer] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();
  const navigate = useNavigate();

  const loadPosts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("community_posts")
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20);

      if (activeFilter !== "all") {
        query = query.eq("post_type", activeFilter);
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
  }, [activeFilter]);

  // 实时监听新帖子
  useEffect(() => {
    console.log("[Community] Setting up realtime for new posts");

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
          console.log("[Community] New post received:", payload);
          const newPost = payload.new as CommunityPost;
          
          // 只在"全部"或匹配的类型筛选器下添加新帖子
          if (activeFilter === "all" || activeFilter === newPost.post_type) {
            setPosts((current) => [newPost, ...current]);
            toast({
              title: "有新内容",
              description: "社区有新的分享啦 ✨",
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[Community] Subscription status:", status);
      });

    return () => {
      console.log("[Community] Cleaning up realtime");
      supabase.removeChannel(channel);
    };
  }, [activeFilter]);

  const handlePostCreated = () => {
    setShowComposer(false);
    loadPosts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 头部 */}
        <div className="flex items-start gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="mt-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
              💪 有劲社区
            </h1>
            <p className="text-muted-foreground">分享成长 · 见证蜕变</p>
          </div>
          <div className="w-10" />
        </div>

        {/* 筛选器 */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="story">故事🌸</TabsTrigger>
            <TabsTrigger value="checkin">打卡📅</TabsTrigger>
            <TabsTrigger value="achievement">成就🏆</TabsTrigger>
            <TabsTrigger value="reflection">反思💭</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 操作按钮 */}
        {session && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Button
              onClick={() => setShowComposer(true)}
              className="h-12 text-base"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              分享故事
            </Button>
            <Button
              onClick={() => navigate("/community/discover")}
              variant="outline"
              className="h-12 text-base"
              size="lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              发现精彩
            </Button>
          </div>
        )}

        {/* 帖子列表 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">暂无分享内容</p>
            <p className="text-sm">成为第一个分享故事的人吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={loadPosts} />
            ))}
          </div>
        )}

        {/* 发布对话框 */}
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
