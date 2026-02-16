import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { ShareDialogBase } from '@/components/ui/share-dialog-base';
import XiaohongshuShareCard from './XiaohongshuShareCard';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { getProxiedAvatarUrl } from '@/utils/avatarUtils';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';

interface XiaohongshuShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  healthScore: number;
  reactionPattern: string;
  dominantPoor: string;
  trigger?: ReactNode;
}

export function XiaohongshuShareDialog({
  open,
  onOpenChange,
  healthScore,
  reactionPattern,
  dominantPoor,
}: XiaohongshuShareDialogProps) {
  const exportRef = useRef<HTMLDivElement>(null);
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; displayName?: string }>({});
  const [partnerInfo, setPartnerInfo] = useState<{ partnerId: string; partnerCode: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const sb = supabase as any;
        const [profileRes, partnerRes] = await Promise.all([
          sb.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single(),
          sb.from('partners').select('id, partner_code').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        ]);
        setUserInfo({
          avatarUrl: getProxiedAvatarUrl(profileRes?.data?.avatar_url || user.user_metadata?.avatar_url),
          displayName: profileRes?.data?.display_name || user.user_metadata?.full_name || '财富探索者',
        });
        if (partnerRes?.data) {
          setPartnerInfo({ partnerId: partnerRes.data.id, partnerCode: partnerRes.data.partner_code });
        }
      } catch (e) {
        console.error('Failed to load user data for share card:', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, [open]);

  const shareUrl = partnerInfo?.partnerCode
    ? `${getPromotionDomain()}/wealth-assessment-lite?ref=${partnerInfo.partnerCode}`
    : `${getPromotionDomain()}/wealth-assessment-lite`;

  const cardProps = {
    avatarUrl: userInfo.avatarUrl,
    displayName: userInfo.displayName,
    partnerInfo: partnerInfo || undefined,
    healthScore,
    reactionPattern,
    dominantPoor,
  };

  const card = loaded ? (
    <XiaohongshuShareCard ref={exportRef} {...cardProps} />
  ) : (
    <ShareCardSkeleton />
  );

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="生成小红书分享卡片"
      description="红金马年配色 · 长按保存发小红书"
      shareUrl={shareUrl}
      fileName="xiaohongshu-wealth-card.png"
      shareTitle="我的AI财富觉醒报告"
      shareText="马年第一步：看见你的财富盲区 🐴✨"
      exportCardRef={exportRef}
      previewCard={card}
      exportCard={card}
      cardReady={loaded}
      skeleton={<ShareCardSkeleton />}
      footerHint="长按保存图片 → 打开小红书发布"
      buttonGradient="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600"
    />
  );
}
