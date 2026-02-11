import React, { useState, useRef, useEffect } from 'react';
import { ShareDialogBase } from '@/components/ui/share-dialog-base';
import WealthJournalShareCard from './WealthJournalShareCard';
import { supabase } from '@/integrations/supabase/client';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { getProxiedAvatarUrl } from '@/utils/avatarUtils';

interface JournalEntry {
  day_number: number;
  meditation_reflection?: string;
  behavior_block?: string;
  emotion_need?: string;
  new_belief?: string;
  personal_awakening?: {
    behavior_awakening?: string;
    emotion_awakening?: string;
    belief_awakening?: string;
    awakening_moment?: string;
  };
}

interface WealthJournalShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: JournalEntry;
  shareUrl: string;
}

const WealthJournalShareDialog: React.FC<WealthJournalShareDialogProps> = ({
  open,
  onOpenChange,
  entry,
  shareUrl,
}) => {
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; displayName?: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch user profile when dialog opens
  useEffect(() => {
    if (!open) return;
    setIsLoading(true);

    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();

      setUserInfo({
        avatarUrl: getProxiedAvatarUrl(profile?.avatar_url),
        displayName: profile?.display_name || '财富觉醒者',
      });
      setIsLoading(false);
    };

    fetchUserInfo();
  }, [open]);

  const personalAwakening = entry.personal_awakening || {};
  const behaviorAwakening = personalAwakening.behavior_awakening || personalAwakening.awakening_moment;
  const emotionAwakening = personalAwakening.emotion_awakening ||
    (entry.emotion_need ? `原来获得${entry.emotion_need}的方式，不是紧握金钱，而是信任生命的流动` : undefined);
  const beliefAwakening = personalAwakening.belief_awakening ||
    (entry.new_belief ? `原来我可以选择相信：${entry.new_belief}` : undefined);

  const cardProps = {
    dayNumber: entry.day_number,
    meditationReflection: entry.meditation_reflection,
    behaviorBlock: entry.behavior_block,
    emotionNeed: entry.emotion_need,
    newBelief: entry.new_belief,
    behaviorAwakening,
    emotionAwakening,
    beliefAwakening,
    shareUrl,
    avatarUrl: userInfo.avatarUrl,
    displayName: userInfo.displayName,
  };

  return (
    <ShareDialogBase
      open={open}
      onOpenChange={onOpenChange}
      title="分享简报卡片"
      shareUrl={shareUrl}
      fileName={`财富简报-Day${entry.day_number}.png`}
      buttonGradient="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white"
      exportCardRef={cardRef}
      cardReady={!isLoading}
      skeleton={<ShareCardSkeleton />}
      maxWidthClass="max-w-md"
      previewScale={0.55}
      footerHint="点击分享按钮，或复制链接后发送"
      previewCard={<WealthJournalShareCard {...cardProps} />}
      exportCard={<WealthJournalShareCard ref={cardRef} {...cardProps} />}
    />
  );
};

export default WealthJournalShareDialog;
