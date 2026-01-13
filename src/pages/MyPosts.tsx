import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, Heart, MessageCircle, FileText, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import PostDetailSheet from "@/components/community/PostDetailSheet";
import PostComposer from "@/components/community/PostComposer";
import PostEditDialog from "@/components/community/PostEditDialog";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
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
  is_anonymous: boolean | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string;
  camp_day?: number | null;
  badges?: any;
  shares_count?: number | null;
}

export default function MyPosts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadPosts();
    setIsRefreshing(false);
  }, []);

  // Pull to refresh
  const {
    containerRef,
    pullDistance,
    pullProgress,
    isRefreshing: isPullRefreshing,
    pullStyle
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    maxPull: 120
  });

  useEffect(() => {
    checkAuthAndLoadPosts();

    // 监听帖子删除事件
    const handlePostDeleted = () => {
      loadPosts();
    };
    window.addEventListener('post-deleted', handlePostDeleted);
    return () => window.removeEventListener('post-deleted', handlePostDeleted);
  }, []);

  const checkAuthAndLoadPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadPosts();
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading posts:", error);
        toast({
          title: "加载失败",
          description: "无法加载动态列表",
          variant: "destructive",
        });
        return;
      }

      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;
    setDeleting(true);

    try {
      // 删除关联的点赞和评论
      await supabase.from("post_likes").delete().eq("post_id", postToDelete);
      await supabase.from("post_comments").delete().eq("post_id", postToDelete);
      
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postToDelete);

      if (error) throw error;

      toast({ title: "删除成功" });
      await loadPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      story: "故事",
      checkin: "打卡",
      achievement: "成就",
      reflection: "反思",
      briefing_share: "简报",
      general: "动态",
    };
    return labels[type] || "动态";
  };

  const getTypeEmoji = (type: string) => {
    const emojis: Record<string, string> = {
      story: "📖",
      checkin: "✅",
      achievement: "🏆",
      reflection: "💭",
      briefing_share: "📋",
      general: "💬",
    };
    return emojis[type] || "💬";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-cyan-50 to-blue-50 relative">
      <DynamicOGMeta pageKey="myPosts" />
      {/* Pull to Refresh Indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isPullRefreshing}
        threshold={80}
      />
      
      {/* Header */}
      <header className="border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-500" />
                我的动态
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                disabled={isRefreshing || isPullRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing || isPullRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                onClick={() => setComposerOpen(true)}
                className="bg-gradient-to-r from-teal-400 to-cyan-500"
              >
                <Plus className="w-4 h-4 mr-1" />
                发布
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div 
        ref={containerRef}
        className="h-[calc(100vh-60px)] overflow-y-auto overscroll-contain"
        style={pullStyle}
      >
        {/* Stats */}
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3">
          <div className="text-sm text-muted-foreground">
            共 {posts.length} 条动态
          </div>
        </div>

      {/* Main Content */}
      <main className="container max-w-xl mx-auto px-3 md:px-4 pb-6">
        {posts.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground mb-2">还没有发布动态</p>
              <p className="text-sm text-muted-foreground mb-6">
                分享你的心情、故事和成长
              </p>
              <Button
                onClick={() => setComposerOpen(true)}
                className="bg-gradient-to-r from-teal-400 to-cyan-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                发布第一条动态
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  {/* 图片预览 */}
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {post.image_urls.slice(0, 3).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* 标题 */}
                  {post.title && (
                    <h3 className="text-base font-semibold mb-1 text-foreground line-clamp-1">
                      {post.title}
                    </h3>
                  )}

                  {/* 内容预览 */}
                  {post.content && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {post.content}
                    </p>
                  )}

                  {/* 底部信息 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getTypeEmoji(post.post_type)} {getTypeLabel(post.post_type)}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments_count || 0}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), { 
                          addSuffix: true, 
                          locale: zhCN 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPost(post);
                        }}
                        className="h-8 px-2"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostToDelete(post.id);
                          setDeleteDialogOpen(true);
                        }}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      </div>

      {/* 发布动态对话框 */}
      <PostComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onSuccess={() => {
          setComposerOpen(false);
          loadPosts();
        }}
      />

      {/* 帖子详情弹窗 */}
      {selectedPost && (
        <PostDetailSheet
          post={selectedPost as any}
          open={!!selectedPost}
          onOpenChange={(open) => !open && setSelectedPost(null)}
        />
      )}

      {/* 编辑帖子对话框 */}
      {editingPost && (
        <PostEditDialog
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          post={editingPost as any}
          onUpdate={() => {
            setEditingPost(null);
            loadPosts();
          }}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，该动态及所有评论、点赞将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
