import { useRef } from "react";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { MidlifeAwakeningShareCard } from "./MidlifeAwakeningShareCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import type { MidlifeResult } from "./midlifeAwakeningData";

interface MidlifeAwakeningShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: MidlifeResult;
}

export function MidlifeAwakeningShareDialog({ open, onOpenChange, result }: MidlifeAwakeningShareDialogProps) {
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const exportCardRef = useRef<HTMLDivElement>(null);

  const userName = profile?.display_name || user?.user_metadata?.name || '用户';
  const avatarUrl = getProxiedAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url);
  const shareUrl = `${getPromotionDomain()}/midlife-awakening`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="分享测评结果"
      description="生成中场觉醒力测评分享图片或复制分享链接"
      shareUrl={shareUrl}
      fileName="中场觉醒力测评.png"
      buttonGradient="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      exportCardRef={exportCardRef}
      previewScale={0.75}
      useDataUrl
      previewCard={<MidlifeAwakeningShareCard result={result} userName={userName} avatarUrl={avatarUrl} />}
      exportCard={<MidlifeAwakeningShareCard ref={exportCardRef} result={result} userName={userName} avatarUrl={avatarUrl} />}
    />
  );
}
