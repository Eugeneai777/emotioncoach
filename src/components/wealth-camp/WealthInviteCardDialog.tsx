import React, { useState, useRef, useEffect } from 'react';
import { Image, Copy, Check, ImageIcon, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ShareImagePreview from '@/components/ui/share-image-preview';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WealthCampShareCard from './WealthCampShareCard';
import AchievementShareCard from './AchievementShareCard';
import AssessmentValueShareCard from '@/components/wealth-block/AssessmentValueShareCard';
import FearAwakeningShareCard from '@/components/wealth-block/FearAwakeningShareCard';
import BlockRevealShareCard from '@/components/wealth-block/BlockRevealShareCard';
import TransformationValueShareCard from '@/components/wealth-block/TransformationValueShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';
import useWechatShare from '@/hooks/useWechatShare';

interface UserInfo {
  avatarUrl?: string;
  displayName?: string;
  currentDay?: number;
  totalDays?: number;
}

interface AwakeningData {
  dayNumber: number;
  behaviorAwakening?: string;
  emotionAwakening?: string;
  beliefAwakening?: string;
  newBelief?: string;
}

type CardTab = 'camp' | 'value' | 'achievement' | 'fear' | 'blindspot' | 'transform';

interface WealthInviteCardDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: CardTab;
  onGenerate?: () => void;
  /** Callback when user has viewed the dialog for 3+ seconds (for task completion) */
  onViewComplete?: () => void;
  campId?: string;
  currentDay?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Helper: Normalize avatar URL (proxy third-party domains)
const getProxiedAvatarUrl = (avatarUrl?: string): string | undefined => {
  if (!avatarUrl) return undefined;
  
  try {
    const url = new URL(avatarUrl);
    // Check if it's a third-party domain that needs proxying
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

// Helper: Wait for all images in element to load with timeout
const waitForImages = async (element: HTMLElement, timeout = 3000): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete && img.naturalHeight > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), timeout);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(); // Resolve even on error to not block
      };
    });
  });
  await Promise.all(promises);
};

// Helper: Copy computed styles to cloned element
const copyComputedStyles = (source: HTMLElement, target: HTMLElement): void => {
  const computedStyle = window.getComputedStyle(source);
  const importantProps = [
    'font-family', 'font-size', 'font-weight', 'line-height', 'color',
    'background', 'background-color', 'background-image', 'background-size',
    'border-radius', 'padding', 'margin', 'width', 'height',
    'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
    'box-shadow', 'text-align', 'opacity', 'overflow'
  ];
  
  importantProps.forEach(prop => {
    const value = computedStyle.getPropertyValue(prop);
    if (value) {
      target.style.setProperty(prop, value);
    }
  });
};

// Helper: Generate canvas from card element with enhanced stability for WeChat
const generateCanvas = async (cardRef: React.RefObject<HTMLDivElement>): Promise<HTMLCanvasElement | null> => {
  if (!cardRef.current) {
    console.error('[generateCanvas] cardRef.current is null');
    return null;
  }
  
  const originalElement = cardRef.current;
  console.log('[generateCanvas] Starting canvas generation, element size:', 
    originalElement.offsetWidth, 'x', originalElement.offsetHeight);
  
  // Create a wrapper for proper rendering with reliable hiding
  const wrapper = document.createElement('div');
  wrapper.id = 'html2canvas-clone-wrapper';
  wrapper.style.cssText = `
    position: fixed !important;
    left: -99999px !important;
    top: -99999px !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    z-index: -99999 !important;
  `;
  
  // Clone the element
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  
  // Reset transform and ensure proper sizing for WeChat
  clonedElement.style.transform = 'none';
  clonedElement.style.transformOrigin = 'top left';
  clonedElement.style.margin = '0';
  clonedElement.style.position = 'relative';
  clonedElement.style.width = originalElement.offsetWidth + 'px';
  clonedElement.style.minWidth = originalElement.offsetWidth + 'px';
  clonedElement.style.visibility = 'visible';
  clonedElement.style.opacity = '1';
  
  wrapper.appendChild(clonedElement);
  document.body.appendChild(wrapper);
  
  try {
    // Wait for images with extended timeout for WeChat
    console.log('[generateCanvas] Waiting for images...');
    await waitForImages(clonedElement, 8000);
    
    // Longer delay for WeChat browser rendering
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('[generateCanvas] Starting html2canvas...');
    
    // Add 15-second timeout protection
    const canvas = await Promise.race([
      html2canvas(clonedElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 8000,
        removeContainer: false,
        foreignObjectRendering: false,
        onclone: (_doc, element) => {
          element.style.transform = 'none';
          element.style.visibility = 'visible';
          element.style.opacity = '1';
        },
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('图片生成超时，请重试')), 15000)
      )
    ]) as HTMLCanvasElement;
    
    console.log('[generateCanvas] Canvas generated successfully:', canvas.width, 'x', canvas.height);
    return canvas;
  } catch (error) {
    console.error('[generateCanvas] html2canvas error:', error);
    throw error;
  } finally {
    // Clean up wrapper
    if (wrapper.parentNode) {
      document.body.removeChild(wrapper);
    }
  }
};

// Helper: Clean up any lingering clone elements
const cleanupCloneElements = () => {
  document.querySelectorAll('#html2canvas-clone-wrapper').forEach(el => el.remove());
};

// Helper: Canvas to Blob
const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
  });
};

// Import share utilities
import { getShareEnvironment } from '@/utils/shareUtils';

// Get best awakening content with priority: belief > emotion > behavior
const getBestAwakening = (data: AwakeningData): { type: 'behavior' | 'emotion' | 'belief'; content: string } | null => {
  if (data.beliefAwakening) return { type: 'belief', content: data.beliefAwakening };
  if (data.newBelief) return { type: 'belief', content: data.newBelief };
  if (data.emotionAwakening) return { type: 'emotion', content: data.emotionAwakening };
  if (data.behaviorAwakening) return { type: 'behavior', content: data.behaviorAwakening };
  return null;
};

const CARD_TABS = [
  { id: 'value' as const, label: '测评价值', emoji: '🎁' },
  { id: 'fear' as const, label: '情绪锁', emoji: '🔓' },
  { id: 'blindspot' as const, label: '盲区', emoji: '👁️' },
  { id: 'transform' as const, label: '转变', emoji: '✨' },
  { id: 'camp' as const, label: '训练营', emoji: '🏕️' },
  { id: 'achievement' as const, label: '成就墙', emoji: '🏅' },
];

const WealthInviteCardDialog: React.FC<WealthInviteCardDialogProps> = ({
  trigger,
  defaultTab = 'camp',
  onGenerate,
  onViewComplete,
  campId,
  currentDay: propCurrentDay,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [viewCompleted, setViewCompleted] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  
  const [activeTab, setActiveTab] = useState<CardTab>(defaultTab);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Image preview state for WeChat/mobile environments
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [partnerInfo, setPartnerInfo] = useState<{ partnerId: string; partnerCode: string } | null>(null);
  
  // Achievement share card settings
  const [achievementPath, setAchievementPath] = useState<string | null>(null);
  const [achievementStyle, setAchievementStyle] = useState<'dark' | 'gradient' | 'minimal' | 'neon'>('dark');
  
  const campCardRef = useRef<HTMLDivElement>(null);
  const valueCardRef = useRef<HTMLDivElement>(null);
  const achievementCardRef = useRef<HTMLDivElement>(null);
  const fearCardRef = useRef<HTMLDivElement>(null);
  const blindspotCardRef = useRef<HTMLDivElement>(null);
  const transformCardRef = useRef<HTMLDivElement>(null);

  // Generate share URLs with partner tracking if available
  const getAssessmentUrl = (): string => {
    const baseUrl = `${getPromotionDomain()}/wealth-block`;
    if (partnerInfo?.partnerCode) {
      return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
    }
    return baseUrl;
  };
  
  const getCampUrl = (): string => {
    const baseUrl = `${getPromotionDomain()}/wealth-camp-intro`;
    if (partnerInfo?.partnerCode) {
      return `${baseUrl}?ref=${partnerInfo.partnerCode}`;
    }
    return baseUrl;
  };

  const assessmentUrl = getAssessmentUrl();
  const campUrl = getCampUrl();
  
  // Get share environment
  const env = getShareEnvironment();

  // Configure WeChat JS-SDK share content (use static title for hook stability)
  useWechatShare({
    title: '财富觉醒训练营 - 邀请你一起突破',
    desc: '每天15分钟，7天突破财富卡点',
    link: campUrl,
    imgUrl: `${getPromotionDomain()}/og-youjin-ai.png`,
  });

  // Cleanup clone elements on unmount
  useEffect(() => {
    return () => {
      cleanupCloneElements();
    };
  }, []);

  // Cleanup clone elements when dialog closes
  useEffect(() => {
    if (!open) {
      cleanupCloneElements();
    }
  }, [open]);

  // 3-second view completion timer for task tracking
  useEffect(() => {
    if (!open || viewCompleted) return;
    
    const timer = setTimeout(() => {
      setViewCompleted(true);
      onViewComplete?.();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [open, viewCompleted, onViewComplete]);

  // Reset viewCompleted when dialog closes
  useEffect(() => {
    if (!open) {
      setViewCompleted(false);
    }
  }, [open]);

  // Fetch user profile and camp progress
  useEffect(() => {
    if (!open) return;
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url, display_name')
        .eq('id', user.id)
        .single();

      // Get camp progress if campId provided
      let currentDay = propCurrentDay;
      let totalDays = 7;

      if (campId && !propCurrentDay) {
        const { data: camp } = await supabase
          .from('training_camps')
          .select('start_date, duration_days')
          .eq('id', campId)
          .single();

        if (camp?.start_date) {
          const startDate = new Date(camp.start_date);
          const today = new Date();
          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          currentDay = Math.min(Math.max(1, diffDays), camp.duration_days || 7);
          totalDays = camp.duration_days || 7;
        }
      }

      // Proxy third-party avatar URLs
      const proxiedAvatarUrl = getProxiedAvatarUrl(profile?.avatar_url);

      // Fetch partner info for referral tracking
      const { data: partner } = await supabase
        .from('partners')
        .select('id, partner_code')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (partner) {
        setPartnerInfo({
          partnerId: partner.id,
          partnerCode: partner.partner_code,
        });
      }

      setUserInfo({
        avatarUrl: proxiedAvatarUrl,
        displayName: profile?.display_name || '财富觉醒者',
        currentDay: currentDay || undefined,
        totalDays,
      });
    };

    fetchUserInfo();
  }, [open, campId, propCurrentDay]);

  const getActiveCardRef = () => {
    switch (activeTab) {
      case 'camp': return campCardRef;
      case 'value': return valueCardRef;
      case 'achievement': return achievementCardRef;
      case 'fear': return fearCardRef;
      case 'blindspot': return blindspotCardRef;
      case 'transform': return transformCardRef;
      default: return campCardRef;
    }
  };

  const getCardName = () => {
    switch (activeTab) {
      case 'camp': return '7天财富训练营邀请卡';
      case 'value': return '财富测评价值卡';
      case 'achievement': return '财富觉醒成就墙';
      case 'fear': return '财富情绪锁诊断卡';
      case 'blindspot': return '财富盲区测评卡';
      case 'transform': return '财富觉醒之旅卡';
      default: return '邀请卡片';
    }
  };

  const handleDownload = async () => {
    const cardRef = getActiveCardRef();
    const cardName = getCardName();
    const env = getShareEnvironment();
    
    console.log('[handleDownload] Starting, env:', env, 'activeTab:', activeTab);
    
    if (!cardRef.current) {
      console.error('[handleDownload] Card ref not found for tab:', activeTab);
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    
    try {
      // Show loading toast for better UX
      const toastId = toast.loading('正在生成图片...');
      
      console.log('[handleDownload] Generating canvas...');
      const canvas = await generateCanvas(cardRef);
      if (!canvas) {
        toast.dismiss(toastId);
        console.error('[handleDownload] Canvas generation failed');
        toast.error('图片生成失败，请重试或截图分享');
        return;
      }

      console.log('[handleDownload] Converting to blob...');
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        toast.dismiss(toastId);
        console.error('[handleDownload] Blob conversion failed');
        toast.error('图片转换失败，请重试或截图分享');
        return;
      }

      toast.dismiss(toastId);
      console.log('[handleDownload] Blob created, size:', blob.size);

      // Create blob URL for preview/download
      const blobUrl = URL.createObjectURL(blob);
      
      // WeChat/iOS: Always show image preview for long-press save
      if (env.isWeChat || env.isIOS || env.isMiniProgram) {
        console.log('[handleDownload] WeChat/iOS detected, showing preview');
        setPreviewImageUrl(blobUrl);
        setShowImagePreview(true);
        // Don't show toast here - preview component will guide user
      } else {
        // Desktop/Android: Try download
        try {
          const link = document.createElement('a');
          link.download = `${cardName}.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('卡片已保存');
        } catch (downloadError) {
          console.error('[handleDownload] Download failed:', downloadError);
          // Fallback to preview
          setPreviewImageUrl(blobUrl);
          setShowImagePreview(true);
        }
        
        // Revoke blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
      
      onGenerate?.();
    } catch (error) {
      console.error('[handleDownload] Error:', error);
      toast.error('生成失败，请截图分享');
    } finally {
      setGenerating(false);
    }
  };

  // Handle native share (non-WeChat environments)
  const handleNativeShare = async () => {
    const cardRef = getActiveCardRef();
    const cardName = getCardName();
    
    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    
    try {
      const toastId = toast.loading('正在生成图片...');
      
      const canvas = await generateCanvas(cardRef);
      if (!canvas) {
        toast.dismiss(toastId);
        toast.error('生成失败，请重试或截图分享');
        return;
      }

      const blob = await canvasToBlob(canvas);
      if (!blob) {
        toast.dismiss(toastId);
        toast.error('转换失败，请重试或截图分享');
        return;
      }

      toast.dismiss(toastId);

      // Try Web Share API
      const file = new File([blob], `${cardName}.png`, { type: 'image/png' });
      
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: cardName,
            text: '邀请你一起突破财富卡点',
          });
          toast.success('分享成功');
          onGenerate?.();
          return;
        } catch (shareError) {
          if ((shareError as Error).name === 'AbortError') {
            return; // User cancelled
          }
          console.error('[handleNativeShare] Web Share failed:', shareError);
        }
      }

      // Fallback: Download the image
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${cardName}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      toast.success('卡片已保存');
      onGenerate?.();
    } catch (error) {
      console.error('Failed to share card:', error);
      const errorMessage = error instanceof Error ? error.message : '分享失败，请重试';
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Handle link share prompt for WeChat
  const handleLinkSharePrompt = () => {
    setOpen(false);
    toast.info('请点击微信右上角「...」→「发送给朋友」', { duration: 4000 });
  };

  // Handle closing image preview
  const handleCloseImagePreview = () => {
    setShowImagePreview(false);
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
      setPreviewImageUrl(null);
    }
  };

  // Regenerate image for preview
  const handleRegeneratePreview = async () => {
    if (previewImageUrl) {
      URL.revokeObjectURL(previewImageUrl);
    }
    await handleDownload();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campUrl);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
      onGenerate?.();
    } catch (error) {
      toast.error('复制失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Image className="h-4 w-4" />
            生成邀请卡片
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生成分享卡片</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CardTab)}>
          <TabsList className="grid w-full grid-cols-6 gap-0.5 h-auto p-1">
            {CARD_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-[10px] px-0.5 py-1.5">
                {tab.emoji}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="value" className="mt-3">
            <div className="flex justify-center overflow-hidden">
              <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
                <AssessmentValueShareCard 
                  ref={valueCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fear" className="mt-3">
            <div className="flex justify-center overflow-hidden">
              <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
                <FearAwakeningShareCard 
                  ref={fearCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="blindspot" className="mt-3">
            <div className="flex justify-center overflow-hidden">
              <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
                <BlockRevealShareCard 
                  ref={blindspotCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transform" className="mt-3">
            <div className="flex justify-center overflow-hidden">
              <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
                <TransformationValueShareCard 
                  ref={transformCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camp" className="mt-3">
            <div className="flex justify-center overflow-hidden">
              <div className="transform scale-[0.55] sm:scale-[0.62] origin-top" style={{ marginBottom: '-42%' }}>
                <WealthCampShareCard 
                  ref={campCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  currentDay={userInfo.currentDay}
                  totalDays={userInfo.totalDays}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="achievement" className="mt-3 space-y-2">
            {/* Style & Path Selectors (outside card for cleaner screenshot) */}
            <div className="flex flex-wrap gap-1.5 px-1">
              {(['dark', 'gradient', 'minimal', 'neon'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setAchievementStyle(style)}
                  className={`px-2 py-1 rounded-md text-[10px] transition-all ${
                    achievementStyle === style 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {style === 'dark' ? '深邃' : style === 'gradient' ? '渐变' : style === 'minimal' ? '简约' : '霓虹'}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 px-1">
              <button
                onClick={() => setAchievementPath(null)}
                className={`px-2 py-1 rounded-md text-[10px] transition-all ${
                  !achievementPath 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                全部
              </button>
              {[
                { key: 'milestone', icon: '🎯', name: '里程碑' },
                { key: 'streak', icon: '🔥', name: '坚持' },
                { key: 'growth', icon: '🌟', name: '成长' },
                { key: 'social', icon: '💫', name: '社交' },
              ].map((path) => (
                <button
                  key={path.key}
                  onClick={() => setAchievementPath(path.key)}
                  className={`px-2 py-1 rounded-md text-[10px] transition-all flex items-center gap-0.5 ${
                    achievementPath === path.key 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {path.icon} {path.name}
                </button>
              ))}
            </div>
            
            {/* Card Preview */}
            <div className="flex justify-center">
              <div className="origin-top scale-[0.55] sm:scale-[0.62]" style={{ marginBottom: '-42%' }}>
                <AchievementShareCard 
                  ref={achievementCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  selectedPath={achievementPath}
                  onPathChange={setAchievementPath}
                  showPathSelector={false}
                  stylePreset={achievementStyle}
                  onStyleChange={setAchievementStyle}
                  showStyleSelector={false}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons - Dual-track for WeChat vs Other */}
        <div className="flex flex-col gap-3 mt-4">
          {/* WeChat/MiniProgram: Show dual-track options */}
          {(env.isWeChat || env.isMiniProgram) ? (
            <div className="flex flex-col gap-3">
              {/* Option 1: Link Share (Recommended) */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🔗</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-300">
                    方式1：链接分享（推荐）
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  点击右上角「<strong>...</strong>」→「<strong>发送给朋友</strong>」，好友可直接点击进入
                </p>
                <Button 
                  onClick={handleLinkSharePrompt} 
                  variant="outline" 
                  className="w-full h-11 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  去右上角分享链接
                </Button>
              </div>
              
              {/* Option 2: Image Share */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🖼️</span>
                  <span className="font-medium">方式2：图片分享</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  生成精美邀请卡片，<strong>长按保存</strong>后发送给好友
                </p>
                <Button 
                  onClick={handleDownload} 
                  disabled={generating} 
                  className="w-full h-11 bg-gradient-to-r from-primary to-primary/80"
                >
                  {generating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                      </motion.div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      生成邀请卡片
                    </>
                  )}
                </Button>
              </div>
              
              {/* Fallback: Copy Link */}
              <Button 
                onClick={handleCopyLink} 
                variant="ghost" 
                className="gap-2 text-muted-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? '已复制' : '复制邀请链接'}
              </Button>
            </div>
          ) : (
            /* Non-WeChat: Standard buttons */
            <>
              <div className="flex gap-2">
                <Button
                  onClick={handleNativeShare}
                  disabled={generating}
                  className="flex-1 gap-2 h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/80"
                >
                  {generating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Share2 className="h-5 w-5" />
                      </motion.div>
                      生成中...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-5 w-5" />
                      分享
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="h-12 px-4"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                点击分享按钮，或复制链接后发送
              </p>
            </>
          )}
        </div>
      </DialogContent>
      
      {/* Full-screen image preview for WeChat/iOS */}
      <ShareImagePreview
        open={showImagePreview}
        onClose={handleCloseImagePreview}
        imageUrl={previewImageUrl}
        onRegenerate={handleRegeneratePreview}
        isRegenerating={generating}
      />
    </Dialog>
  );
};

export default WealthInviteCardDialog;
