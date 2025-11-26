import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "./ImageUploader";

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
  };
  onUpdate: () => void;
}

const PostEditDialog = ({
  open,
  onOpenChange,
  post,
  onUpdate,
}: PostEditDialogProps) => {
  const [imageUrls, setImageUrls] = useState<string[]>(post.image_urls || []);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const { session } = useAuth();
  const { toast } = useToast();

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

  const handleSave = async () => {
    if (!session?.user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({
          image_urls: imageUrls.length > 0 ? imageUrls : null,
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
          {/* 帖子信息预览 */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            {campSubtitle && (
              <p className="text-sm text-muted-foreground">{campSubtitle}</p>
            )}
            {post.title && (
              <p className="font-semibold text-foreground">{post.title}</p>
            )}
            {post.emotion_theme && (
              <Badge variant="outline" className="text-xs">
                情绪: {post.emotion_theme}
                {post.emotion_intensity && ` · 强度 ${post.emotion_intensity}/10`}
              </Badge>
            )}
          </div>

          {/* 图片上传区域 */}
          <div className="space-y-2">
            <Label>打卡配图</Label>
            <ImageUploader
              imageUrls={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={9}
            />
            
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
