import { useRef } from "react";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { EmotionHealthShareCard } from "./EmotionHealthShareCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import type { EmotionHealthResult } from "./emotionHealthData";

interface EmotionHealthShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: EmotionHealthResult;
}

export function EmotionHealthShareDialog({ open, onOpenChange, result }: EmotionHealthShareDialogProps) {
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const exportCardRef = useRef<HTMLDivElement>(null);

  const userName = profile?.display_name || user?.user_metadata?.name || '用户';
  const avatarUrl = getProxiedAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url);
  const shareUrl = `${getPromotionDomain()}/emotion-health`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="分享测评结果"
      description="生成情绪健康测评分享图片或复制分享链接"
      shareUrl={shareUrl}
      fileName="情绪健康测评.png"
      buttonGradient="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
      exportCardRef={exportCardRef}
      previewScale={0.75}
      useDataUrl
      previewCard={
        <EmotionHealthShareCard
          result={result}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      }
      exportCard={
        <EmotionHealthShareCard
          ref={exportCardRef}
          result={result}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      }
    />
  );
}
