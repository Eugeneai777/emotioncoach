import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BookOpen, Sparkles, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import PostDetailSheet from "@/components/community/PostDetailSheet";
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

interface Story {
  id: string;
  title: string | null;
  content: string | null;
  image_urls: string[] | null;
  created_at: string;
  emotion_theme: string | null;
  emotion_intensity: number | null;
  insight: string | null;
  action: string | null;
}

export default function MyStories() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadStories();
  }, []);

  const checkAuthAndLoadStories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadStories(user.id);
  };

  const loadStories = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("user_id", userId)
        .eq("post_type", "story")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading stories:", error);
        toast({
          title: "加载失败",
          description: "无法加载故事列表",
          variant: "destructive",
        });
        return;
      }

      setStories(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;

    try {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", storyToDelete);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "故事已删除",
      });

      // 重新加载列表
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await loadStories(user.id);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setStoryToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy年M月d日 HH:mm", { locale: zhCN });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>我的故事广场 - 有劲AI</title>
        <meta name="description" content="记录你的成长故事" />
        <meta property="og:title" content="有劲AI • 我的故事" />
        <meta property="og:description" content="用故事记录成长，用分享传递力量" />
        <meta property="og:image" content="https://wechat.eugenewe.net/og-youjin-ai.png" />
        <meta property="og:url" content="https://wechat.eugenewe.net/my-stories" />
        <meta property="og:site_name" content="有劲AI" />
      </Helmet>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              我的故事广场
            </h1>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => navigate("/story-coach")}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                创作故事
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/story-coach")}>
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">返回</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-xl mx-auto px-3 md:px-4 py-4 md:py-6">
        {stories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium text-foreground mb-2">还没有创作故事</p>
              <p className="text-sm text-muted-foreground mb-6">
                用故事教练把你的经历变成动人的成长故事
              </p>
              <Button
                onClick={() => navigate("/story-coach")}
                className="bg-gradient-to-r from-orange-500 to-amber-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                开始创作
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedStory(story)}
              >
                <CardContent className="p-4 md:p-6">
                  {/* 标题 */}
                  {story.title && (
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {story.title}
                    </h3>
                  )}

                  {/* 内容预览 */}
                  {story.content && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {story.content}
                    </p>
                  )}

                  {/* 图片预览 */}
                  {story.image_urls && story.image_urls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {story.image_urls.slice(0, 3).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`图片 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* 标签信息 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {story.emotion_theme && (
                        <Badge variant="outline" className="text-xs">
                          {story.emotion_theme}
                          {story.emotion_intensity && ` · ${story.emotion_intensity}/10`}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(story.created_at)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStoryToDelete(story.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="h-8 px-2 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 故事详情弹窗 */}
      {selectedStory && (
        <PostDetailSheet
          post={selectedStory}
          open={!!selectedStory}
          onOpenChange={(open) => !open && setSelectedStory(null)}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个故事吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
