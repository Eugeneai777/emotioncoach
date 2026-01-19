import React, { useState, useRef, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import WealthJournalShareCard from './WealthJournalShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';

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

// Helper: Normalize avatar URL (proxy third-party domains)
const getProxiedAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  
  try {
    const url = new URL(avatarUrl);
    const thirdPartyDomains = ['thirdwx.qlogo.cn', 'wx.qlogo.cn', 'qlogo.cn'];
    const needsProxy = thirdPartyDomains.some(domain => url.hostname.includes(domain));
    
    if (needsProxy) {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(avatarUrl)}`;
      return proxyUrl;
    }
    return avatarUrl;
  } catch {
    return avatarUrl;
  }
};

// Helper: Wait for all images in element to load
const waitForImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  });
  await Promise.all(promises);
};

// Helper: Generate canvas from card element
const generateCanvas = async (cardRef: React.RefObject<HTMLDivElement>): Promise<HTMLCanvasElement | null> => {
  if (!cardRef.current) return null;
  
  const originalElement = cardRef.current;
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  
  clonedElement.style.position = 'fixed';
  clonedElement.style.left = '-9999px';
  clonedElement.style.top = '0';
  clonedElement.style.transform = 'none';
  clonedElement.style.zIndex = '-9999';
  
  document.body.appendChild(clonedElement);
  await waitForImages(clonedElement);
  
  const canvas = await html2canvas(clonedElement, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });
  
  document.body.removeChild(clonedElement);
  return canvas;
};

// Helper: Canvas to Blob
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
};

// Helper: Detect if running in WeChat or iOS environment
const isWeChatOrIOS = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  const isWeChat = ua.includes('micromessenger');
  const isIOS = /iphone|ipad|ipod/.test(ua);
  return isWeChat || isIOS;
};

const WealthJournalShareDialog: React.FC<WealthJournalShareDialogProps> = ({
  open,
  onOpenChange,
  entry,
  shareUrl,
}) => {
  const [generating, setGenerating] = useState(false);
  const [userInfo, setUserInfo] = useState<{ avatarUrl?: string; displayName?: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Reset loading state when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open]);

  // Fetch user profile
  useEffect(() => {
    if (!open) return;
    
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();

      const proxiedAvatarUrl = getProxiedAvatarUrl(profile?.avatar_url);

      setUserInfo({
        avatarUrl: proxiedAvatarUrl,
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

  const handleDownload = async () => {
    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    try {
      const canvas = await generateCanvas(cardRef);
      if (!canvas) throw new Error('Failed to generate canvas');

      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Failed to convert canvas to blob');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `财富日记-Day${entry.day_number}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (isWeChatOrIOS()) {
        toast.success('图片已生成，长按图片可保存到相册', { duration: 4000 });
        window.open(blobUrl, '_blank');
      } else {
        toast.success('卡片已保存');
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (error) {
      console.error('Failed to generate card:', error);
      toast.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    try {
      const canvas = await generateCanvas(cardRef);
      if (!canvas) throw new Error('Failed to generate canvas');

      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('Failed to convert canvas to blob');

      const file = new File([blob], `财富日记-Day${entry.day_number}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `财富日记 · Day ${entry.day_number}`,
        });
        toast.success('分享成功');
      } else {
        const blobUrl = URL.createObjectURL(blob);
        
        if (isWeChatOrIOS()) {
          toast.info('请长按图片保存后分享', { duration: 4000 });
          window.open(blobUrl, '_blank');
        } else {
          const link = document.createElement('a');
          link.download = `财富日记-Day${entry.day_number}.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('图片已下载，请手动分享');
        }
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share card:', error);
        toast.error('分享失败，请重试');
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>分享日记卡片</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center overflow-hidden">
          <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
            {isLoading ? (
              <ShareCardSkeleton />
            ) : (
              <WealthJournalShareCard
                ref={cardRef}
                dayNumber={entry.day_number}
                meditationReflection={entry.meditation_reflection}
                behaviorBlock={entry.behavior_block}
                emotionNeed={entry.emotion_need}
                newBelief={entry.new_belief}
                behaviorAwakening={behaviorAwakening}
                emotionAwakening={emotionAwakening}
                beliefAwakening={beliefAwakening}
                shareUrl={shareUrl}
                avatarUrl={userInfo.avatarUrl}
                displayName={userInfo.displayName}
              />
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleShare}
            disabled={generating}
            className="flex-1 h-12 gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white"
          >
            <Share2 className="h-4 w-4" />
            {generating ? '生成中...' : '分享'}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={generating}
            variant="outline"
            className="h-12 px-4"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          点击分享按钮，或保存图片后发送
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WealthJournalShareDialog;
