import React, { useRef } from 'react';
import { Share2 } from 'lucide-react';
import { ShareDialogBase } from '@/components/ui/share-dialog-base';
import AliveCheckShareCard from './AliveCheckShareCard';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { useState } from 'react';

interface AliveCheckShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerCode?: string;
}

const AliveCheckShareDialog: React.FC<AliveCheckShareDialogProps> = ({
  open,
  onOpenChange,
  partnerCode,
}) => {
  const [cardReady, setCardReady] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const shareUrl = partnerCode
    ? `${getPromotionDomain()}/energy-studio?tool=alive-check&ref=${partnerCode}`
    : `${getPromotionDomain()}/energy-studio?tool=alive-check`;

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="生成分享卡片"
      titleIcon={<Share2 className="w-5 h-5 text-rose-600" />}
      shareUrl={shareUrl}
      fileName="死了吗-分享卡片.png"
      buttonGradient="bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 text-white"
      exportCardRef={exportRef}
      cardReady={cardReady}
      skeleton={<ShareCardSkeleton variant="wide" />}
      maxWidthClass="max-w-lg"
      previewScale={0.55}
      footerHint="点击分享按钮，或复制链接后发送"
      previewCard={
        <AliveCheckShareCard
          partnerCode={partnerCode}
          onReady={() => setCardReady(true)}
        />
      }
      exportCard={
        <AliveCheckShareCard ref={exportRef} partnerCode={partnerCode} />
      }
    />
  );
};

export default AliveCheckShareDialog;
