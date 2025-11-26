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
import { Badge } from "@/components/ui/badge";
import { Share2, Loader2 } from "lucide-react";

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
}: CampShareDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareContent, setShareContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleShare = async () => {
    if (!user) return;

    try {
      setSharing(true);

      const { error } = await supabase.from("community_posts").insert({
        user_id: user.id,
        post_type: "camp_checkin",
        camp_id: campId,
        camp_day: campDay,
        briefing_id: briefingId,
        title: `${campName} - 第${campDay}天打卡`,
        content: shareContent || undefined,
        emotion_theme: emotionTheme,
        emotion_intensity: emotionIntensity,
        insight: insight,
        action: action,
        is_anonymous: isAnonymous,
        visibility: "public",
        badges: {
          type: "camp_checkin",
          day: campDay,
          campName: campName,
        },
      });

      if (error) throw error;

      toast({
        title: "分享成功",
        description: "你的打卡内容已分享到社区 🎉",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={sharing}
            >
              取消
            </Button>
            <Button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1"
            >
              {sharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {sharing ? "分享中..." : "立即分享"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CampShareDialog;