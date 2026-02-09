import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "./ImageUploader";
import { ImageStyleSelector } from "./ImageStyleSelector";
import VisibilitySelector, { type PostVisibility } from "./VisibilitySelector";

interface PostEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    user_id: string;
    title: string | null;
    content: string | null;
    image_urls: string[] | null;
    emotion_theme: string | null;
    emotion_intensity: number | null;
    camp_day: number | null;
    badges: any;
    visibility?: string;
  };
  onUpdate: () => void;
}

const PostEditDialog = ({
  open,
  onOpenChange,
  post,
  onUpdate,
}: PostEditDialogProps) => {
  const [title, setTitle] = useState<string>(post.title || '');
  const [content, setContent] = useState<string>(post.content || '');
  const [imageUrls, setImageUrls] = useState<string[]>(post.image_urls || []);
  const [saving, setSaving] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>((post.visibility as PostVisibility) || "public");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [beautifying, setBeautifying] = useState(false);
  const [imageStyle, setImageStyle] = useState("warm");
  const { session } = useAuth();
  const { toast } = useToast();

  // 当 dialog 打开或 post 变化时，重新同步状态
  useEffect(() => {
    if (open) {
      setTitle(post.title || '');
      setContent(post.content || '');
      setImageUrls(post.image_urls || []);
      setVisibility((post.visibility as PostVisibility) || "public");
      setImageStyle("warm");
      setSaving(false);
      setGeneratingImage(false);
    }
  }, [open, post.id, post.title, post.content, post.image_urls]);

  const handleGenerateImage = async () => {
    if (!post.title && !post.content) {
      toast({
        title: "需要标题或内容",
        description: "请确保帖子有标题或内容才能生成图片",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-checkin-image",
        {
          body: {
            title: post.title || post.content?.substring(0, 50),
            emotionTheme: post.emotion_theme,
            campName: post.badges?.campName,
            day: post.camp_day,
            style: imageStyle,
          },
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrls([...imageUrls, data.imageUrl]);
        toast({
          title: "头图生成成功！",
          description: "AI 已为您生成精美头图",
        });
      }
    } catch (error) {
      console.error("生成图片失败:", error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleBeautify = async () => {
    if (!content.trim()) return;
    setBeautifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("beautify-post", {
        body: { content: content.trim() },
      });
      if (error) throw error;
      if (data?.beautified) {
        setContent(data.beautified);
        toast({ title: "排版优化完成 ✨", description: "内容已自动美化，你可以继续编辑" });
      }
    } catch (error: any) {
      console.error("美化失败:", error);
      toast({ title: "美化失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setBeautifying(false);
    }
  };

  const handleSave = async () => {
    if (!session?.user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({
          title: title.trim() || null,
          content: content.trim() || null,
          image_urls: imageUrls.length > 0 ? imageUrls : null,
          visibility,
        })
        .eq("id", post.id)
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "保存成功",
        description: "帖子配图已更新",
      });
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const campSubtitle = post.badges?.campInfo || 
    (post.badges?.campName && post.camp_day !== undefined 
      ? `${post.badges.campName} - 第${post.camp_day}天打卡` 
      : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑打卡</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 训练营信息显示 */}
          {campSubtitle && (
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">{campSubtitle}</p>
              {post.emotion_theme && (
                <Badge variant="outline" className="text-xs mt-2">
                  情绪: {post.emotion_theme}
                  {post.emotion_intensity && ` · 强度 ${post.emotion_intensity}/10`}
                </Badge>
              )}
            </div>
          )}

          {/* 标题编辑 */}
          <div className="space-y-2">
            <Label htmlFor="post-title">标题</Label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入标题..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* 内容编辑 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-content">内容</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBeautify}
                disabled={beautifying || !content.trim()}
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                {beautifying ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    美化中...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3 w-3" />
                    一键美化
                  </>
                )}
              </Button>
            </div>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入内容..."
              rows={4}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* 图片上传区域 */}
          <div className="space-y-2">
            <Label>打卡配图</Label>
            <ImageUploader
              imageUrls={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={9}
            />
            
            {/* 风格选择器 */}
            <ImageStyleSelector value={imageStyle} onChange={setImageStyle} />
            
            {/* AI 生成头图按钮 */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGenerateImage}
              disabled={generatingImage}
            >
              {generatingImage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI 生成头图
                </>
              )}
            </Button>
          </div>

          {/* 可见范围 */}
          <VisibilitySelector value={visibility} onChange={setVisibility} />

          {/* 底部按钮 */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostEditDialog;
