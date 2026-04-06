import { useRef } from "react";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import AssessmentPromoShareCard, { ASSESSMENT_PROMO_CONFIGS, type AssessmentPromoConfig } from "./AssessmentPromoShareCard";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import { getPromotionDomain } from "@/utils/partnerQRUtils";

interface AssessmentPromoShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 测评 key，如 'midlife_awakening' | 'emotion_health' | 'women_competitiveness' */
  assessmentKey: string;
  /** 可选覆盖配置 */
  config?: Partial<AssessmentPromoConfig>;
}

export function AssessmentPromoShareDialog({ open, onOpenChange, assessmentKey, config: overrides }: AssessmentPromoShareDialogProps) {
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const exportCardRef = useRef<HTMLDivElement>(null);

  const baseConfig = ASSESSMENT_PROMO_CONFIGS[assessmentKey];
  if (!baseConfig) return null;

  const config = { ...baseConfig, ...overrides };

  const userName = profile?.display_name || user?.user_metadata?.name || '用户';
  const avatarUrl = getProxiedAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url);
  const shareUrl = `${getPromotionDomain()}${config.sharePath}`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="分享测评"
      description={`生成${config.title}推广海报或复制分享链接`}
      shareUrl={shareUrl}
      fileName={`${config.title}推广.png`}
      buttonGradient="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
      exportCardRef={exportCardRef}
      previewScale={0.75}
      useDataUrl
      previewCard={
        <AssessmentPromoShareCard config={config} displayName={userName} avatarUrl={avatarUrl} />
      }
      exportCard={
        <AssessmentPromoShareCard ref={exportCardRef} config={config} displayName={userName} avatarUrl={avatarUrl} />
      }
    />
  );
}

export default AssessmentPromoShareDialog;
