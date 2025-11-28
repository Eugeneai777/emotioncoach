import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ImageUploader from "./ImageUploader";
import { ImageStyleSelector } from "./ImageStyleSelector";
import { Loader2, Sparkles } from "lucide-react";

interface PostComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PostComposer = ({ open, onOpenChange, onSuccess }: PostComposerProps) => {
  const [postType, setPostType] = useState<string>("share");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageStyle, setImageStyle] = useState("warm");
  const { toast } = useToast();
  const { session } = useAuth();

  const handleSubmit = async () => {
    if (!session?.user) {
      toast({
        title: "请先登录",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "内容不能为空",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("community_posts").insert({
        user_id: session.user.id,
        post_type: postType,
        title: title.trim() || null,
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        is_anonymous: isAnonymous,
        visibility: "public",
      });

      if (error) throw error;

      toast({
        title: "发布成功",
        description: "你的分享已发布到社区",
      });

      // 重置表单
      setTitle("");
      setContent("");
      setImageUrls([]);
      setIsAnonymous(false);

      onSuccess();
    } catch (error) {
      console.error("发布失败:", error);
      toast({
        title: "发布失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "需要标题或内容",
        description: "请先输入标题或内容，AI 将基于内容生成头图",
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
            title: title.trim() || content.substring(0, 50),
            emotionTheme: postType === "story" ? "温暖分享" : "成长记录",
            style: imageStyle,
          },
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrls([...imageUrls, data.imageUrl]);
        toast({ title: "头图生成成功！", description: "AI 已为您生成精美头图" });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>分享到社区</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label>标题（可选）</Label>
            <Input
              placeholder="给你的分享起个标题..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label>内容</Label>
            <Textarea
              placeholder="分享你的故事、感悟或成长..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>

          {/* 图片上传 */}
          <div className="space-y-2">
            <Label>图片（最多9张）</Label>
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
              disabled={generatingImage || imageUrls.length >= 9}
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

          {/* 匿名选项 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="anonymous">匿名分享</Label>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={submitting || !content.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  发布中...
                </>
              ) : (
                "发布"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostComposer;
