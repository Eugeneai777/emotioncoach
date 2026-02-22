import { useRef } from "react";
import { ShareDialogBase } from "@/components/ui/share-dialog-base";
import { SCL90ShareCard } from "./SCL90ShareCard";
import { useAuth } from "@/hooks/useAuth";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { SCL90Result as SCL90ResultType } from "./scl90Data";

interface SCL90ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SCL90ResultType;
}

export function SCL90ShareDialog({ 
  open, 
  onOpenChange, 
  result 
}: SCL90ShareDialogProps) {
  const { user } = useAuth();
  const exportCardRef = useRef<HTMLDivElement>(null);

  const userProfile = user?.user_metadata;
  const userName = userProfile?.display_name || userProfile?.name || "用户";
  const avatarUrl = userProfile?.avatar_url;
  const shareUrl = `${getPromotionDomain()}/scl90`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="分享测评结果"
      description="生成精美的测评结果卡片，分享给好友"
      shareUrl={shareUrl}
      fileName={`scl90-result-${Date.now()}.png`}
      shareTitle="我的SCL-90心理健康自评结果"
      shareText="快来测测你的心理健康状态吧！"
      buttonGradient="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
      exportCardRef={exportCardRef}
      previewScale={0.85}
      previewCard={
        <SCL90ShareCard
          result={result}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      }
      exportCard={
        <SCL90ShareCard
          ref={exportCardRef}
          result={result}
          userName={userName}
          avatarUrl={avatarUrl}
        />
      }
    />
  );
}
