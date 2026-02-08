import React, { useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareDialogBase } from '@/components/ui/share-dialog-base';
import EmotionButtonShareCard from './EmotionButtonShareCard';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { getPromotionDomain } from '@/utils/partnerQRUtils';

interface EmotionButtonShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerCode?: string;
}

const EmotionButtonShareDialog: React.FC<EmotionButtonShareDialogProps> = ({
  open,
  onOpenChange,
  partnerCode,
}) => {
  const [cardReady, setCardReady] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const shareUrl = partnerCode
    ? `${getPromotionDomain()}/energy-studio?tool=emotion-button&ref=${partnerCode}`
    : `${getPromotionDomain()}/energy-studio?tool=emotion-button`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="生成分享卡片"
      titleIcon={<Share2 className="w-5 h-5 text-teal-600" />}
      shareUrl={shareUrl}
      fileName="情绪按钮-分享卡片.png"
      buttonGradient="bg-gradient-to-r from-teal-500 to-cyan-500 hover:opacity-90 text-white"
      exportCardRef={exportRef}
      cardReady={cardReady}
      skeleton={<ShareCardSkeleton variant="wide" />}
      maxWidthClass="max-w-lg"
      previewScale={0.55}
      footerHint="点击分享按钮，或复制链接后发送"
      previewCard={
        <EmotionButtonShareCard
          partnerCode={partnerCode}
          onReady={() => setCardReady(true)}
        />
      }
      exportCard={
        <EmotionButtonShareCard ref={exportRef} partnerCode={partnerCode} />
      }
    />
  );
};

export default EmotionButtonShareDialog;
