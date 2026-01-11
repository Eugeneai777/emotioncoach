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
import GraduationShareCard from './GraduationShareCard';
import EnhancedGrowthPosterCard from './EnhancedGrowthPosterCard';
import AchievementShareCard from './AchievementShareCard';
import AIAnalysisShareCard from '@/components/wealth-block/AIAnalysisShareCard';
import AssessmentValueShareCard from '@/components/wealth-block/AssessmentValueShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useUserAchievements } from '@/hooks/useUserAchievements';

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

type CardTab = 'camp' | 'awakening' | 'milestone' | 'assessment' | 'growth' | 'aianalysis' | 'value' | 'achievement';

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
  { id: 'aianalysis' as const, label: 'AI分析', emoji: '🤖' },
  { id: 'value' as const, label: '测评价值', emoji: '🎁' },
  { id: 'camp' as const, label: '训练营', emoji: '🏕️' },
  { id: 'growth' as const, label: '成长海报', emoji: '📊' },
  { id: 'achievement' as const, label: '成就墙', emoji: '🏅' },
  { id: 'awakening' as const, label: '今日觉醒', emoji: '✨' },
  { id: 'milestone' as const, label: '里程碑', emoji: '🏆' },
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
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [awakeningData, setAwakeningData] = useState<AwakeningData | null>(null);
  const [selectedAwakeningType, setSelectedAwakeningType] = useState<'behavior' | 'emotion' | 'belief'>('belief');
  const [partnerInfo, setPartnerInfo] = useState<{ partnerId: string; partnerCode: string } | null>(null);
  
  // Achievement share card settings
  const [achievementPath, setAchievementPath] = useState<string | null>(null);
  const [achievementStyle, setAchievementStyle] = useState<'dark' | 'gradient' | 'minimal' | 'neon'>('dark');
  
  // Get awakening progress for graduation card
  const { progress: awakeningProgress, currentLevel } = useAwakeningProgress();
  const { userAchievements } = useUserAchievements();
  
  const assessmentCardRef = useRef<HTMLDivElement>(null);
  const campCardRef = useRef<HTMLDivElement>(null);
  const awakeningCardRef = useRef<HTMLDivElement>(null);
  const milestoneCardRef = useRef<HTMLDivElement>(null);
  const graduationCardRef = useRef<HTMLDivElement>(null);
  const growthCardRef = useRef<HTMLDivElement>(null);
  const aiAnalysisCardRef = useRef<HTMLDivElement>(null);
  const valueCardRef = useRef<HTMLDivElement>(null);
  const achievementCardRef = useRef<HTMLDivElement>(null);
  
  // Growth poster specific data
  const [growthData, setGrowthData] = useState<{
    awakeningIndex: number;
    awakeningChange: number;
    chartData: { day: number; value: number; hasData: boolean }[];
    coreBreakthrough?: { type: 'behavior' | 'emotion' | 'belief'; title: string; content: string };
    aiMessage?: string;
    consecutiveDays: number;
    peakIndex?: number;
  } | null>(null);
  
  // Camp summary data for graduation card
  const [campSummaryData, setCampSummaryData] = useState<{
    startAwakening?: number;
    endAwakening?: number;
    awakeningGrowth?: number;
    behaviorGrowth?: number;
    emotionGrowth?: number;
    beliefGrowth?: number;
    biggest_breakthrough?: string;
    ai_coach_message?: string;
  } | null>(null);

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

      // Fetch growth data for the poster
      if (campId) {
        const { data: journalEntries } = await supabase
          .from('wealth_journal_entries')
          .select('day_number, behavior_score, emotion_score, belief_score, behavior_block, personal_awakening, new_belief')
          .eq('camp_id', campId)
          .eq('user_id', user.id)
          .order('day_number', { ascending: true });

        if (journalEntries && journalEntries.length > 0) {
          // Calculate awakening index for each day
          const chartData = journalEntries.map(e => {
            const scores = [e.behavior_score, e.emotion_score, e.belief_score].filter(s => s && s > 0) as number[];
            const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const awakeningValue = ((avg - 1) / 4) * 100;
            return {
              day: e.day_number,
              value: Math.max(0, Math.min(100, awakeningValue)),
              hasData: scores.length > 0,
            };
          });

          // Calculate current awakening index
          const validEntries = journalEntries.filter(e => e.behavior_score || e.emotion_score || e.belief_score);
          const avgBehavior = validEntries.reduce((sum, e) => sum + (e.behavior_score || 0), 0) / (validEntries.length || 1);
          const avgEmotion = validEntries.reduce((sum, e) => sum + (e.emotion_score || 0), 0) / (validEntries.length || 1);
          const avgBelief = validEntries.reduce((sum, e) => sum + (e.belief_score || 0), 0) / (validEntries.length || 1);
          const avgScore = (avgBehavior + avgEmotion + avgBelief) / 3;
          const currentAwakeningIndex = ((avgScore - 1) / 4) * 100;

          // Calculate change from first entry
          const firstValidIdx = chartData.findIndex(d => d.hasData);
          const awakeningChange = firstValidIdx >= 0 && chartData.length > firstValidIdx + 1
            ? chartData[chartData.length - 1].value - chartData[firstValidIdx].value
            : 0;

          // Find peak awakening
          const peakIndex = Math.max(...chartData.filter(d => d.hasData).map(d => d.value));

          // Find core breakthrough from personal_awakening JSON
          const latestEntry = journalEntries[journalEntries.length - 1];
          const awakening = latestEntry?.personal_awakening as { behavior_awakening?: string; emotion_awakening?: string; belief_awakening?: string } | null;
          let coreBreakthrough: { type: 'behavior' | 'emotion' | 'belief'; title: string; content: string } | undefined;
          
          if (awakening?.belief_awakening || latestEntry?.new_belief) {
            coreBreakthrough = {
              type: 'belief',
              title: '信念层突破',
              content: (awakening?.belief_awakening || latestEntry?.new_belief) as string,
            };
          } else if (awakening?.emotion_awakening) {
            coreBreakthrough = {
              type: 'emotion',
              title: '情绪层觉察',
              content: awakening.emotion_awakening,
            };
          } else if (awakening?.behavior_awakening) {
            coreBreakthrough = {
              type: 'behavior',
              title: '行为层觉察',
              content: awakening.behavior_awakening,
            };
          }

          // Generate AI message based on progress
          const userName = profile?.display_name || '财富觉醒者';
          let aiMessage: string | undefined;
          if (currentAwakeningIndex >= 70) {
            aiMessage = `${userName}，你的觉醒之旅令人振奋！持续保持这份觉察力，让财富自然流动。`;
          } else if (currentAwakeningIndex >= 50) {
            aiMessage = `${userName}，你正在稳步成长！每一次觉察都是蜕变的种子。`;
          } else if (validEntries.length >= 3) {
            aiMessage = `${userName}，坚持就是胜利！你已经迈出了改变的第一步。`;
          }

          setGrowthData({
            awakeningIndex: Math.max(0, Math.min(100, currentAwakeningIndex)),
            awakeningChange: Math.round(awakeningChange),
            chartData,
            coreBreakthrough,
            aiMessage,
            consecutiveDays: validEntries.length,
            peakIndex: peakIndex > 0 ? peakIndex : undefined,
          });
        }
      }

      // Fetch camp summary for graduation card
      if (campId) {
        const { data: summary } = await supabase
          .from('camp_summaries')
          .select('start_awakening, end_awakening, awakening_growth, behavior_growth, emotion_growth, belief_growth, biggest_breakthrough, ai_coach_message')
          .eq('camp_id', campId)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (summary) {
          setCampSummaryData({
            startAwakening: summary.start_awakening ?? undefined,
            endAwakening: summary.end_awakening ?? undefined,
            awakeningGrowth: summary.awakening_growth ?? undefined,
            behaviorGrowth: summary.behavior_growth ?? undefined,
            emotionGrowth: summary.emotion_growth ?? undefined,
            beliefGrowth: summary.belief_growth ?? undefined,
            biggest_breakthrough: summary.biggest_breakthrough ?? undefined,
            ai_coach_message: summary.ai_coach_message ?? undefined,
          });
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
      case 'assessment': return assessmentCardRef;
      case 'camp': return campCardRef;
      case 'awakening': return awakeningCardRef;
      case 'milestone': 
        // Use graduation card ref for Day 7+ users
        return (userInfo.currentDay || 1) >= 7 ? graduationCardRef : milestoneCardRef;
      case 'growth': return growthCardRef;
      case 'aianalysis': return aiAnalysisCardRef;
      case 'value': return valueCardRef;
      case 'achievement': return achievementCardRef;
      default: return campCardRef;
    }
  };

  const getCardName = () => {
    switch (activeTab) {
      case 'assessment': return '财富卡点测评邀请卡';
      case 'camp': return '7天财富训练营邀请卡';
      case 'awakening': return '财富觉醒分享卡';
      case 'milestone': return (userInfo.currentDay || 1) >= 7 ? '财富觉醒毕业证书' : '财富训练营里程碑';
      case 'growth': return '财富成长海报';
      case 'aianalysis': return 'AI智能分析报告';
      case 'value': return '财富测评价值卡';
      case 'achievement': return '财富觉醒成就墙';
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
          <TabsList className="grid w-full grid-cols-7">
            {CARD_TABS.map(tab => (
              <TabsTrigger key={tab.id} value={tab.id} className="text-[10px] px-1">
                {tab.emoji}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="aianalysis" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
                <AIAnalysisShareCard 
                  ref={aiAnalysisCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="value" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
                <AssessmentValueShareCard 
                  ref={valueCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
                <WealthAssessmentShareCard 
                  ref={assessmentCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  partnerInfo={partnerInfo || undefined}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="camp" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
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

          <TabsContent value="growth" className="mt-4">
            {growthData ? (
              <div className="flex justify-center">
              <div className="transform scale-[0.72] origin-top" style={{ marginBottom: '-28%' }}>
                  <EnhancedGrowthPosterCard
                    ref={growthCardRef}
                    avatarUrl={userInfo.avatarUrl}
                    displayName={userInfo.displayName}
                    currentDay={userInfo.currentDay || 1}
                    totalDays={userInfo.totalDays || 7}
                    awakeningIndex={growthData.awakeningIndex}
                    awakeningChange={growthData.awakeningChange}
                    chartData={growthData.chartData}
                    coreBreakthrough={growthData.coreBreakthrough}
                    aiMessage={growthData.aiMessage}
                    consecutiveDays={growthData.consecutiveDays}
                    peakIndex={growthData.peakIndex}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">暂无成长数据</p>
                <p className="text-xs mt-1">完成教练对话后生成成长海报</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievement" className="mt-4">
            <div className="flex justify-center">
              <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
                <AchievementShareCard 
                  ref={achievementCardRef}
                  avatarUrl={userInfo.avatarUrl}
                  displayName={userInfo.displayName}
                  selectedPath={achievementPath}
                  onPathChange={setAchievementPath}
                  showPathSelector={true}
                  stylePreset={achievementStyle}
                  onStyleChange={setAchievementStyle}
                  showStyleSelector={true}
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
                  <div className="transform scale-[0.85] origin-top" style={{ marginBottom: '-15%' }}>
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
              <div className="transform scale-[0.8] origin-top" style={{ marginBottom: '-20%' }}>
                {/* Show enhanced graduation card for Day 7+ users */}
                {(userInfo.currentDay || 1) >= 7 ? (
                  <GraduationShareCard
                    ref={graduationCardRef}
                    displayName={userInfo.displayName}
                    avatarUrl={userInfo.avatarUrl}
                    shareUrl={campUrl}
                    totalDays={userInfo.totalDays || 7}
                    journalCount={userInfo.currentDay || 7}
                    awakeningGrowth={campSummaryData?.awakeningGrowth ?? (awakeningProgress?.current_awakening ?? 0) - (awakeningProgress?.baseline_awakening ?? 0)}
                    startAwakening={campSummaryData?.startAwakening ?? awakeningProgress?.baseline_awakening ?? 45}
                    endAwakening={campSummaryData?.endAwakening ?? awakeningProgress?.current_awakening ?? 78}
                    consecutiveStreak={awakeningProgress?.consecutive_days ?? 0}
                    behaviorGrowth={campSummaryData?.behaviorGrowth ?? 0}
                    emotionGrowth={campSummaryData?.emotionGrowth ?? 0}
                    beliefGrowth={campSummaryData?.beliefGrowth ?? 0}
                    currentLevel={currentLevel?.level ?? 4}
                    levelName={currentLevel?.name ?? '信念转化者'}
                    levelIcon={currentLevel?.icon ?? '⭐'}
                    totalPoints={awakeningProgress?.total_points ?? 0}
                    earnedAchievements={userAchievements?.map(a => ({ 
                      icon: a.achievement_icon || '🏆', 
                      name: a.achievement_name 
                    })) || []}
                    coreBreakthrough={campSummaryData?.biggest_breakthrough}
                  />
                ) : (
                  <WealthMilestoneShareCard
                    ref={milestoneCardRef}
                    completedDays={userInfo.currentDay || 1}
                    totalDays={userInfo.totalDays || 7}
                    coreInsight={awakeningData?.beliefAwakening || awakeningData?.newBelief}
                    shareUrl={campUrl}
                    avatarUrl={userInfo.avatarUrl}
                    displayName={userInfo.displayName}
                  />
                )}
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
