import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
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
import { Share2, Loader2, Sparkles, Download, RefreshCw, BookOpen } from "lucide-react";
import ImageUploader from "@/components/community/ImageUploader";
import { ImageStyleSelector } from "@/components/community/ImageStyleSelector";
import StoryCoachDialog from "./StoryCoachDialog";
import { getTodayInBeijing } from "@/utils/dateUtils";

interface CampShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campId: string;
  campName: string;
  campDay: number;
  briefingId?: string;
  emotionTheme?: string;
  emotionIntensity?: number;
  insight?: string;
  action?: string;
  onShared?: () => void;
}

const CampShareDialog = ({
  open,
  onOpenChange,
  campId,
  campName,
  campDay,
  briefingId,
  emotionTheme,
  emotionIntensity,
  insight,
  action,
  onShared,
}: CampShareDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isComplete, loading: profileLoading } = useProfileCompletion();
  const [sharing, setSharing] = useState(false);
  const [customTitle, setCustomTitle] = useState(insight || "");
  const [shareContent, setShareContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageStyle, setImageStyle] = useState("warm");
  const [storyCoachOpen, setStoryCoachOpen] = useState(false);
  const [hasStoryContent, setHasStoryContent] = useState(false);
  const [extractedEmotionTag, setExtractedEmotionTag] = useState<string | undefined>(undefined);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  // 检查资料完整度
  useEffect(() => {
    if (open && !profileLoading && !isComplete) {
      setShowProfilePrompt(true);
    }
  }, [open, isComplete, profileLoading]);

  const handleGenerateImage = async () => {
    if (!customTitle && !insight) {
      toast({
        title: "请先输入打卡标题",
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
            title: customTitle || insight,
            emotionTheme: emotionTheme,
            campName: campName,
            day: campDay,
            style: imageStyle,
          },
        }
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setImageUrls([data.imageUrl]);
        toast({
          title: "头图生成成功！",
          description: "已为您生成专属打卡头图",
        });
      }
    } catch (error) {
      console.error("生成头图失败:", error);
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
      
      // 获取图片数据
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], "打卡头图.png", { type: "image/png" });
      
      // 尝试使用系统分享（移动端）
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: customTitle || insight || `第${campDay}天打卡`,
          text: `${campName} - 第${campDay}天情绪打卡`,
        });
      } else {
        // 降级：下载图片（桌面端）
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `打卡头图-第${campDay}天.png`;
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

      const postType = hasStoryContent ? "story" : "camp_checkin";
      const badgeInfo = hasStoryContent ? "故事" : "打卡";
      
      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        post_type: postType,
        camp_id: campId,
        camp_day: campDay,
        briefing_id: briefingId,
        title: customTitle || insight || `第${campDay}天${badgeInfo}`,
        content: shareContent || undefined,
        emotion_theme: extractedEmotionTag || emotionTheme,
        emotion_intensity: emotionIntensity,
        insight: insight,
        action: action,
        is_anonymous: isAnonymous,
        visibility: "public",
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        badges: {
          type: postType,
          day: campDay,
          campName: campName,
          campInfo: `${campName} - 第${campDay}天${badgeInfo}`,
        },
      });

      if (error) throw error;

      // 更新分享状态 - 根据训练营类型更新不同的表
      const today = getTodayInBeijing();
      
      if (campName.includes('财富')) {
        // 财富训练营使用 wealth_journal_entries 表
        // 先尝试更新，加上 user_id 条件确保只更新自己的记录
        const { data: updateData, error: updateError } = await supabase
          .from("wealth_journal_entries")
          .update({
            share_completed: true,
            shared_at: new Date().toISOString(),
          })
          .eq("camp_id", campId)
          .eq("day_number", campDay)
          .eq("user_id", user.id)
          .select('id');

        if (updateError) {
          console.error("更新分享状态失败:", updateError);
          throw new Error("分享已发布，但更新打卡状态失败");
        }

        // 如果没有更新到任何行，说明记录不存在，需要先创建
        if (!updateData || updateData.length === 0) {
          console.log("未找到现有记录，尝试创建新记录");
          const { error: upsertError } = await supabase
            .from("wealth_journal_entries")
            .upsert({
              user_id: user.id,
              camp_id: campId,
              day_number: campDay,
              share_completed: true,
              shared_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,camp_id,day_number',
            });

          if (upsertError) {
            console.error("创建分享记录失败:", upsertError);
            throw new Error("分享已发布，但创建打卡记录失败");
          }
        }
      } else {
        // 其他训练营使用 camp_daily_progress 表
        const { error: updateError } = await supabase
          .from("camp_daily_progress")
          .update({
            has_shared_to_community: true,
            shared_at: new Date().toISOString(),
          })
          .eq("camp_id", campId)
          .eq("progress_date", today)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("更新分享状态失败:", updateError);
        }
      }

      // 调用回调通知父组件刷新数据
      onShared?.();

      toast({
        title: "分享成功",
        description: "你的每日反思已分享到社区 🎉",
      });

      onOpenChange(false);
      
      // 可选：跳转到社区页面
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
    <>
      {/* 资料完善引导弹窗 */}
      <ProfileCompletionPrompt
        open={showProfilePrompt}
        onOpenChange={setShowProfilePrompt}
        onComplete={() => {
          setShowProfilePrompt(false);
        }}
        onSkip={() => {
          setIsAnonymous(true);
          setShowProfilePrompt(false);
        }}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            分享到社区
          </DialogTitle>
          <DialogDescription>
            分享你的打卡内容和成长心得，激励更多伙伴
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 打卡信息预览 */}
          <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{campName}</Badge>
              <Badge>第 {campDay} 天</Badge>
            </div>
            {emotionTheme && (
              <div className="text-sm">
                <span className="text-muted-foreground">情绪主题：</span>
                <span className="font-medium">{emotionTheme}</span>
                {emotionIntensity && (
                  <span className="text-muted-foreground ml-2">
                    强度 {emotionIntensity}/10
                  </span>
                )}
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

          {/* 打卡标题 */}
          <div className="space-y-2">
            <Label htmlFor="custom-title">打卡标题</Label>
            <Input
              id="custom-title"
              placeholder="输入你的打卡标题..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 说好故事教练入口 */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/10 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">说好故事教练</span>
              </div>
              <Badge variant="outline" className="text-xs">新功能</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              通过简单对话，把你的情绪体验变成打动人心的故事
            </p>
            <Button
              variant="outline"
              onClick={() => setStoryCoachOpen(true)}
              className="w-full"
              size="sm"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              开始创作我的故事
            </Button>
          </div>

          {/* 打卡配图 */}
          <div className="space-y-2">
            <Label>打卡配图</Label>
            <ImageUploader
              imageUrls={imageUrls}
              onImagesChange={setImageUrls}
              maxImages={3}
            />
            
            {/* 风格选择器 - 仅在没有图片时显示 */}
            {imageUrls.length === 0 && (
              <ImageStyleSelector value={imageStyle} onChange={setImageStyle} />
            )}
            
            {/* 图片操作按钮 */}
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
                    AI 生成头图
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
              点击上方按钮将打卡内容发布到社区
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

      {/* Story Coach Dialog */}
      <StoryCoachDialog
        open={storyCoachOpen}
        onOpenChange={setStoryCoachOpen}
        emotionTheme={emotionTheme}
        insight={insight}
        action={action}
        campName={campName}
        campDay={campDay}
        onComplete={({ title, story, emotionTag }) => {
          setCustomTitle(title);
          setShareContent(story);
          setExtractedEmotionTag(emotionTag);
          setHasStoryContent(true);
          setStoryCoachOpen(false);
          toast({
            title: "故事创作完成",
            description: "标题和内容已填入，可继续编辑或直接分享",
          });
        }}
      />
    </Dialog>
    </>
  );
};

export default CampShareDialog;