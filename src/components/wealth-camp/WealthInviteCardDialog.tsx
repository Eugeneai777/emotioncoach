import React, { useState, useRef, useEffect } from 'react';
import { Download, Image, Copy, Check, Share2 } from 'lucide-react';
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
import WealthAssessmentShareCard from './WealthAssessmentShareCard';
import WealthCampShareCard from './WealthCampShareCard';
import WealthAwakeningShareCard from './WealthAwakeningShareCard';
import WealthMilestoneShareCard from './WealthMilestoneShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';

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

type CardTab = 'camp' | 'awakening' | 'milestone' | 'assessment';

interface WealthInviteCardDialogProps {
  trigger?: React.ReactNode;
  defaultTab?: CardTab;
  onGenerate?: () => void;
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

// Helper: Wait for all images in element to load
const waitForImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to not block
    });
  });
  await Promise.all(promises);
};

// Helper: Generate canvas from card element
const generateCanvas = async (cardRef: React.RefObject<HTMLDivElement>): Promise<HTMLCanvasElement | null> => {
  if (!cardRef.current) return null;
  
  const originalElement = cardRef.current;
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  
  // Set up the cloned element for rendering
  clonedElement.style.position = 'fixed';
  clonedElement.style.left = '-9999px';
  clonedElement.style.top = '0';
  clonedElement.style.transform = 'none';
  clonedElement.style.zIndex = '-9999';
  
  document.body.appendChild(clonedElement);
  
  // Wait for all images to load
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

// Get best awakening content with priority: belief > emotion > behavior
const getBestAwakening = (data: AwakeningData): { type: 'behavior' | 'emotion' | 'belief'; content: string } | null => {
  if (data.beliefAwakening) return { type: 'belief', content: data.beliefAwakening };
  if (data.newBelief) return { type: 'belief', content: data.newBelief };
  if (data.emotionAwakening) return { type: 'emotion', content: data.emotionAwakening };
  if (data.behaviorAwakening) return { type: 'behavior', content: data.behaviorAwakening };
  return null;
};

const CARD_TABS = [
  { id: 'camp' as const, label: '训练营', emoji: '🏕️' },
  { id: 'awakening' as const, label: '今日觉醒', emoji: '✨' },
  { id: 'milestone' as const, label: '里程碑', emoji: '🏆' },
  { id: 'assessment' as const, label: '财富测评', emoji: '🎯' },
];

const WealthInviteCardDialog: React.FC<WealthInviteCardDialogProps> = ({
  trigger,
  defaultTab = 'camp',
  onGenerate,
  campId,
  currentDay: propCurrentDay,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;
  
  const [activeTab, setActiveTab] = useState<CardTab>(defaultTab);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [awakeningData, setAwakeningData] = useState<AwakeningData | null>(null);
  const [selectedAwakeningType, setSelectedAwakeningType] = useState<'behavior' | 'emotion' | 'belief'>('belief');
  
  const assessmentCardRef = useRef<HTMLDivElement>(null);
  const campCardRef = useRef<HTMLDivElement>(null);
  const awakeningCardRef = useRef<HTMLDivElement>(null);
  const milestoneCardRef = useRef<HTMLDivElement>(null);

  const assessmentUrl = `${getPromotionDomain()}/wealth-block`;
  const campUrl = `${getPromotionDomain()}/wealth-camp-intro`;

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
      let totalDays = 21;

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
          currentDay = Math.min(Math.max(1, diffDays), camp.duration_days || 21);
          totalDays = camp.duration_days || 21;
        }
      }

      // Fetch latest journal entry for awakening data
      if (campId) {
        const { data: latestEntry } = await supabase
          .from('wealth_journal_entries')
          .select('day_number, personal_awakening, new_belief, emotion_need')
          .eq('camp_id', campId)
          .eq('user_id', user.id)
          .order('day_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestEntry) {
          // personal_awakening is a JSON object with behavior_awakening, emotion_awakening, belief_awakening
          const personalAwakening = latestEntry.personal_awakening as {
            behavior_awakening?: string;
            emotion_awakening?: string;
            belief_awakening?: string;
          } | null;
          
          const awakening: AwakeningData = {
            dayNumber: latestEntry.day_number,
            behaviorAwakening: personalAwakening?.behavior_awakening || undefined,
            emotionAwakening: personalAwakening?.emotion_awakening || undefined,
            beliefAwakening: personalAwakening?.belief_awakening || undefined,
            newBelief: latestEntry.new_belief || undefined,
          };
          setAwakeningData(awakening);
          
          // Auto-select best awakening type
          const best = getBestAwakening(awakening);
          if (best) {
            setSelectedAwakeningType(best.type);
          }
        }
      }

      // Proxy third-party avatar URLs
      const proxiedAvatarUrl = getProxiedAvatarUrl(profile?.avatar_url);

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
      case 'assessment': return assessmentCardRef;
      case 'camp': return campCardRef;
      case 'awakening': return awakeningCardRef;
      case 'milestone': return milestoneCardRef;
      default: return campCardRef;
    }
  };

  const getCardName = () => {
    switch (activeTab) {
      case 'assessment': return '财富卡点测评邀请卡';
      case 'camp': return '21天财富训练营邀请卡';
      case 'awakening': return '财富觉醒分享卡';
      case 'milestone': return '财富训练营里程碑';
      default: return '邀请卡片';
    }
  };

  const handleDownload = async () => {
    const cardRef = getActiveCardRef();
    const cardName = getCardName();
    
    if (!cardRef.current) {
      console.error('Card ref not found');
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    try {
      const canvas = await generateCanvas(cardRef);
      if (!canvas) {
        throw new Error('Failed to generate canvas');
      }

      const blob = await canvasToBlob(canvas);
      if (!blob) {
        throw new Error('Failed to convert canvas to blob');
      }

      // Create blob URL for download
      const blobUrl = URL.createObjectURL(blob);
      
      // Try download with <a> element
      const link = document.createElement('a');
      link.download = `${cardName}.png`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // For iOS/WeChat, also open in new tab as fallback
      if (isWeChatOrIOS()) {
        // Give user instruction to long-press save
        toast.success('图片已生成，长按图片可保存到相册', { duration: 4000 });
        window.open(blobUrl, '_blank');
      } else {
        toast.success('卡片已保存');
      }

      // Revoke blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      
      onGenerate?.();
    } catch (error) {
      console.error('Failed to generate card:', error);
      toast.error('生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const handleShare = async () => {
    const cardRef = getActiveCardRef();
    const cardName = getCardName();
    
    if (!cardRef.current) {
      toast.error('卡片未加载完成，请稍后重试');
      return;
    }

    setGenerating(true);
    try {
      const canvas = await generateCanvas(cardRef);
      if (!canvas) {
        throw new Error('Failed to generate canvas');
      }

      const blob = await canvasToBlob(canvas);
      if (!blob) {
        throw new Error('Failed to convert canvas to blob');
      }

      // Check if Web Share API with files is supported
      const file = new File([blob], `${cardName}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: cardName,
        });
        toast.success('分享成功');
      } else {
        // Fallback: download the image
        const blobUrl = URL.createObjectURL(blob);
        
        if (isWeChatOrIOS()) {
          toast.info('请长按图片保存后分享', { duration: 4000 });
          window.open(blobUrl, '_blank');
        } else {
          const link = document.createElement('a');
          link.download = `${cardName}.png`;
          link.href = blobUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('图片已下载，请手动分享');
        }
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
      
      onGenerate?.();
    } catch (error) {
      // User cancelled share or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share card:', error);
        toast.error('分享失败，请重试');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    const url = activeTab === 'assessment' ? assessmentUrl : campUrl;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('链接已复制');
      setTimeout(() => setCopied(false), 2000);
      onGenerate?.();
    } catch (error) {
      toast.error('复制失败');
    }
  };

  // Get awakening content for selected type
  const getSelectedAwakening = (): string | undefined => {
    if (!awakeningData) return undefined;
    switch (selectedAwakeningType) {
      case 'behavior': return awakeningData.behaviorAwakening;
      case 'emotion': return awakeningData.emotionAwakening;
      case 'belief': return awakeningData.beliefAwakening || awakeningData.newBelief;
      default: return undefined;
    }
  };

  // Check which awakening types are available
  const availableTypes = awakeningData ? {
    behavior: !!awakeningData.behaviorAwakening,
    emotion: !!awakeningData.emotionAwakening,
    belief: !!(awakeningData.beliefAwakening || awakeningData.newBelief),
  } : { behavior: false, emotion: false, belief: false };

  const hasAnyAwakening = availableTypes.behavior || availableTypes.emotion || availableTypes.belief;

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
          <TabsList className="grid w-full grid-cols-4">
            {CARD_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs px-2">
                {tab.emoji} {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="assessment" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <WealthAssessmentShareCard 
                  ref={assessmentCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camp" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <WealthCampShareCard 
                  ref={campCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  currentDay={userInfo.currentDay}
                  totalDays={userInfo.totalDays}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="awakening" className="mt-4">
            {hasAnyAwakening && awakeningData ? (
              <>
                {/* Awakening Type Selector */}
                <div className="flex justify-center gap-2 mb-3">
                  {availableTypes.behavior && (
                    <Button
                      variant={selectedAwakeningType === 'behavior' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAwakeningType('behavior')}
                      className="text-xs"
                    >
                      🎯 行为
                    </Button>
                  )}
                  {availableTypes.emotion && (
                    <Button
                      variant={selectedAwakeningType === 'emotion' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAwakeningType('emotion')}
                      className="text-xs"
                    >
                      💛 情绪
                    </Button>
                  )}
                  {availableTypes.belief && (
                    <Button
                      variant={selectedAwakeningType === 'belief' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedAwakeningType('belief')}
                      className="text-xs"
                    >
                      🧠 信念
                    </Button>
                  )}
                </div>
                <div className="flex justify-center">
                  <div className="transform scale-[0.85] origin-top">
                    <WealthAwakeningShareCard
                      ref={awakeningCardRef}
                      dayNumber={awakeningData.dayNumber}
                      awakeningContent={getSelectedAwakening() || ''}
                      awakeningType={selectedAwakeningType}
                      shareUrl={campUrl}
                      avatarUrl={userInfo.avatarUrl}
                      displayName={userInfo.displayName}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">暂无觉醒记录</p>
                <p className="text-xs mt-1">完成今日教练对话后生成觉醒卡片</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestone" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top">
                <WealthMilestoneShareCard
                  ref={milestoneCardRef}
                  completedDays={userInfo.currentDay || 1}
                  totalDays={userInfo.totalDays || 21}
                  coreInsight={awakeningData?.beliefAwakening || awakeningData?.newBelief}
                  shareUrl={campUrl}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleDownload}
            disabled={generating || (activeTab === 'awakening' && !hasAnyAwakening)}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            {generating ? '生成中...' : '下载'}
          </Button>
          <Button
            onClick={handleShare}
            disabled={generating || (activeTab === 'awakening' && !hasAnyAwakening)}
            variant="secondary"
            className="flex-1 gap-2"
          >
            <Share2 className="h-4 w-4" />
            分享
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          下载或分享卡片给朋友，或复制链接直接分享
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WealthInviteCardDialog;
