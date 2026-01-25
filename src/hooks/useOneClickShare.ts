/**
 * One-Click Share Hook
 * 
 * Provides a simple interface for triggering instant share with pre-rendered cards.
 * Manages loading state and integrates with ShareImagePreview component.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { executeOneClickShare, CardType } from '@/utils/oneClickShare';
import { supabase } from '@/integrations/supabase/client';

interface PartnerInfo {
  partnerId: string;
  partnerCode: string;
}

interface UserInfo {
  avatarUrl?: string;
  displayName?: string;
  currentDay?: number;
  totalDays?: number;
}

interface UseOneClickShareOptions {
  cardType?: CardType;
  campId?: string;
  currentDay?: number;
  onSuccess?: () => void;
}

interface UseOneClickShareReturn {
  // State
  isSharing: boolean;
  isPreloading: boolean;
  previewImageUrl: string | null;
  showImagePreview: boolean;
  userInfo: UserInfo;
  partnerInfo: PartnerInfo | null;
  
  // Card ref - pass this to your card component
  cardRef: React.RefObject<HTMLDivElement>;
  
  // Actions
  triggerShare: () => Promise<void>;
  closePreview: () => void;
  preloadUserData: () => Promise<void>;
}

// Helper: Proxy third-party avatar URLs
const getProxiedAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  
  try {
    const url = new URL(avatarUrl);
    const thirdPartyDomains = ['thirdwx.qlogo.cn', 'wx.qlogo.cn', 'qlogo.cn'];
    const needsProxy = thirdPartyDomains.some(domain => url.hostname.includes(domain));
    
    if (needsProxy) {
      return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
    }
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
};

// Separate data fetching to avoid deep type instantiation
async function fetchShareUserData(campId?: string): Promise<{
  profile: { avatar_url?: string; display_name?: string } | null;
  partner: { id: string; partner_code: string } | null;
  campCurrentDay: number | null;
  userMeta: { avatar_url?: string; full_name?: string } | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { profile: null, partner: null, campCurrentDay: null, userMeta: null };
  }

  // Use explicit any to avoid deep type instantiation in supabase client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  
  const profileRes = await sb.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single();
  const partnerRes = await sb.from('partners').select('id, partner_code').eq('user_id', user.id).eq('status', 'active').maybeSingle();
  
  const profile = profileRes?.data as { avatar_url?: string; display_name?: string } | null;
  const partner = partnerRes?.data as { id: string; partner_code: string } | null;
    
  // Fetch camp info if campId provided
  let campCurrentDay: number | null = null;
  if (campId) {
    const campRes = await sb.from('training_camps').select('current_day').eq('id', campId).single();
    campCurrentDay = campRes?.data?.current_day ?? null;
  }

  return {
    profile,
    partner,
    campCurrentDay,
    userMeta: user.user_metadata as { avatar_url?: string; full_name?: string } | null,
  };
}

export function useOneClickShare(options: UseOneClickShareOptions = {}): UseOneClickShareReturn {
  const { cardType = 'camp', campId, currentDay, onSuccess } = options;
  
  const [isSharing, setIsSharing] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Preload user data
  const preloadUserData = useCallback(async () => {
    setIsPreloading(true);
    
    try {
      const { profile, partner, campCurrentDay, userMeta } = await fetchShareUserData(campId);

      setUserInfo({
        avatarUrl: getProxiedAvatarUrl(profile?.avatar_url || userMeta?.avatar_url),
        displayName: profile?.display_name || userMeta?.full_name || '财富觉醒者',
        currentDay: currentDay || campCurrentDay || 1,
        totalDays: 7,
      });

      if (partner) {
        setPartnerInfo({
          partnerId: partner.id,
          partnerCode: partner.partner_code,
        });
      }
    } catch (error) {
      console.error('[useOneClickShare] Failed to preload user data:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [campId, currentDay]);

  // Trigger share action
  const triggerShare = useCallback(async () => {
    if (isSharing) return;
    
    // Ensure user data is loaded
    if (!userInfo.displayName) {
      await preloadUserData();
      // Give DOM time to render with new data
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setIsSharing(true);
    const toastId = toast.loading('正在生成卡片...');

    const cardNames: Record<CardType, string> = {
      camp: '训练营邀请卡',
      value: '测评价值卡',
      achievement: '成就墙',
      fear: '情绪锁诊断卡',
      blindspot: '盲区测评卡',
      transform: '觉醒之旅卡',
    };

    await executeOneClickShare({
      cardRef,
      cardName: cardNames[cardType],
      onProgress: (status) => {
        if (status === 'generating') {
          // Already showing loading toast
        } else if (status === 'sharing') {
          toast.dismiss(toastId);
          toast.loading('正在分享...');
        } else if (status === 'done') {
          toast.dismiss(toastId);
          toast.success('分享成功');
        } else if (status === 'error') {
          toast.dismiss(toastId);
        }
      },
      onShowPreview: (blobUrl) => {
        toast.dismiss(toastId);
        setPreviewImageUrl(blobUrl);
        setShowImagePreview(true);
      },
      onSuccess,
      onError: (error) => {
        toast.dismiss(toastId);
        toast.error(error);
      },
    });

    setIsSharing(false);
  }, [isSharing, userInfo, cardType, preloadUserData, onSuccess]);

  // Close preview and cleanup
  const closePreview = useCallback(() => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  }, [previewImageUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
    };
  }, [previewImageUrl]);

  return {
    isSharing,
    isPreloading,
    previewImageUrl,
    showImagePreview,
    userInfo,
    partnerInfo,
    cardRef,
    triggerShare,
    closePreview,
    preloadUserData,
  };
}
