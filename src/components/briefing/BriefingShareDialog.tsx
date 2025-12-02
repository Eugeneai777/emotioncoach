import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import ImageUploader from "@/components/community/ImageUploader";
import { ImageStyleSelector } from "@/components/community/ImageStyleSelector";

export type CoachType = 'emotion' | 'communication' | 'parent' | 'vibrant_life';

interface BriefingShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coachType: CoachType;
  briefingId: string;
  emotionTheme?: string;
  emotionIntensity?: number;
  insight?: string;
  action?: string;
  growthStory?: string;
}

const coachConfig: Record<CoachType, { label: string; emoji: string; color: string; gradient: string }> = {
  emotion: {
    label: '情绪教练',
    emoji: '💚',
    color: 'hsl(var(--primary))',
    gradient: 'from-primary/20 to-emerald-500/20',
  },
  communication: {
    label: '沟通教练',
    emoji: '💬',
    color: 'hsl(210, 70%, 50%)',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  parent: {
    label: '亲子教练',
    emoji: '👪',
    color: 'hsl(280, 60%, 60%)',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  vibrant_life: {
    label: '有劲生活教练',
    emoji: '❤️',
    color: 'hsl(350, 70%, 60%)',
    gradient: 'from-rose-500/20 to-orange-500/20',
  },
};

const BriefingShareDialog = ({
  open,
  onOpenChange,
  coachType,
  briefingId,
  emotionTheme,
  emotionIntensity,
  insight,
  action,
  growthStory,
}: BriefingShareDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [customTitle, setCustomTitle] = useState(insight || emotionTheme || "");
  const [shareContent, setShareContent] = useState(growthStory || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageStyle, setImageStyle] = useState("warm");

  const config = coachConfig[coachType];

  const handleGenerateImage = async () => {
    if (!customTitle && !insight && !emotionTheme) {
      toast({
        title: "请先输入分享标题",
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
            title: customTitle || insight || emotionTheme,
            emotionTheme: emotionTheme,
            campName: config.label,
            day: 1,
            style: imageStyle,
          },
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrls([data.imageUrl]);
        toast({
          title: "配图生成成功！",
          description: "已为您生成专属配图",
        });
      }
    } catch (error) {
      console.error("生成配图失败:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSaveOrShareImage = async () => {
    if (imageUrls.length === 0) return;
    
    try {
      const imageUrl = imageUrls[0];
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "简报配图.png", { type: "image/png" });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: customTitle || insight || `${config.label}简报`,
          text: `${config.label}简报分享`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `简报配图-${config.label}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "图片已保存",
          description: "请打开微信手动分享",
        });
      }
    } catch (error) {
      console.error("保存图片失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!user) return;

    try {
      setSharing(true);

      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        post_type: "briefing_share",
        briefing_id: briefingId,
        title: customTitle || insight || emotionTheme || `${config.label}简报`,
        content: shareContent || undefined,
        emotion_theme: emotionTheme,
        emotion_intensity: emotionIntensity,
        insight: insight,
        action: action,
        is_anonymous: isAnonymous,
        visibility: "public",
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        badges: {
          type: "briefing_share",
          coachType: coachType,
          coachLabel: config.label,
          coachEmoji: config.emoji,
        },
      });

      if (error) throw error;

      toast({
        title: "分享成功",
        description: "你的简报已分享到社区 🎉",
      });

      onOpenChange(false);
      
      setTimeout(() => {
        navigate("/community");
      }, 1000);
    } catch (error) {
      console.error("分享失败:", error);
      toast({
        title: "分享失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享到社区
          </DialogTitle>
          <DialogDescription>
            分享你的简报内容和成长心得，激励更多伙伴
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 简报信息预览 */}
          <div className={`p-4 bg-gradient-to-br ${config.gradient} rounded-lg space-y-2`}>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                {config.emoji} {config.label}
              </Badge>
              {emotionIntensity && (
                <Badge variant="outline">
                  强度 {emotionIntensity}/10
                </Badge>
              )}
            </div>
            {emotionTheme && (
              <div className="text-sm">
                <span className="text-muted-foreground">主题：</span>
                <span className="font-medium">{emotionTheme}</span>
              </div>
            )}
            {insight && (
              <div className="text-sm">
                <span className="text-muted-foreground">洞察：</span>
                <p className="mt-1 text-foreground/80">{insight}</p>
              </div>
            )}
            {action && (
              <div className="text-sm">
                <span className="text-muted-foreground">行动：</span>
                <p className="mt-1 text-foreground/80">{action}</p>
              </div>
            )}
          </div>

          {/* 分享标题 */}
          <div className="space-y-2">
            <Label htmlFor="custom-title">分享标题</Label>
            <Input
              id="custom-title"
              placeholder="输入你的分享标题..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 分享配图 */}
          <div className="space-y-2">
            <Label>分享配图</Label>
            <ImageUploader
              imageUrls={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={3}
            />
            
            {imageUrls.length === 0 && (
              <ImageStyleSelector value={imageStyle} onChange={setImageStyle} />
            )}
            
            {imageUrls.length > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveOrShareImage}
                  className="text-muted-foreground"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  保存图片
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrls([])}
                  className="text-muted-foreground"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  重新生成
                </Button>
              </div>
            )}
            
            {imageUrls.length === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateImage}
                disabled={generatingImage}
                className="w-full"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 生成配图
                  </>
                )}
              </Button>
            )}
          </div>

          {/* 分享内容 */}
          <div className="space-y-2">
            <Label htmlFor="share-content">补充说明（可选）</Label>
            <Textarea
              id="share-content"
              placeholder="分享你今天的感悟、收获或想对大家说的话..."
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* 匿名选项 */}
          <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="anonymous">匿名分享</Label>
              <p className="text-xs text-muted-foreground">
                不显示你的昵称和头像
              </p>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          {/* 操作按钮 */}
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {sharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Share2 className="mr-2 h-4 w-4" />
              {sharing ? "分享中..." : "分享到有劲社区"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              点击上方按钮将简报内容发布到社区
            </p>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full"
              disabled={sharing}
            >
              暂不分享
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BriefingShareDialog;
