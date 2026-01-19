import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUploader } from "./AvatarUploader";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, UserCircle } from "lucide-react";

interface ProfileCompletionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export function ProfileCompletionPrompt({
  open,
  onOpenChange,
  onComplete,
  onSkip,
}: ProfileCompletionPromptProps) {
  const { profile, updateProfile, refetch } = useProfileCompletion();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (open && profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || null);
      setBio(profile.bio || "");
    }
  }, [open, profile]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: "请输入昵称",
        variant: "destructive",
      });
      return;
    }

    if (!avatarUrl) {
      toast({
        title: "请上传头像",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const success = await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim() || null,
      });

      if (success) {
        toast({
          title: "资料保存成功",
          description: "你的个人资料已更新 🌟",
        });
        await refetch();
        onComplete();
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      console.error("保存资料失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  const isFormValid = displayName.trim() && avatarUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            完善你的个人资料
          </DialogTitle>
          <DialogDescription>
            让更多小伙伴认识你，一起分享成长
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* 智能消息价值说明 */}
          <div className="bg-emerald-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-emerald-800 mb-2">✨ 完善资料后你将获得：</p>
            <ul className="space-y-1 text-emerald-700">
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                AI会用你的昵称亲切地称呼你
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                分享卡片显示你的专属头像
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                开启智能消息，关键时刻收到温暖问候
              </li>
            </ul>
          </div>

          {/* 头像上传 */}
          <div className="flex flex-col items-center">
            <AvatarUploader
              currentUrl={avatarUrl}
              onUpload={(url) => setAvatarUrl(url)}
              size="lg"
            />
          </div>

          {/* 昵称 */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium">
              用户昵称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="请输入你的昵称"
              maxLength={20}
              className="h-10"
            />
          </div>

          {/* 个性签名 */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              个性签名（可选）
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="一句话介绍自己..."
              maxLength={100}
              rows={2}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/100
            </p>
          </div>

          {/* 按钮区域 */}
          <div className="space-y-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saving || !isFormValid}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <UserCircle className="mr-2 h-4 w-4" />
                  保存并继续分享
                </>
              )}
            </Button>

            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              暂时跳过，匿名分享
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
