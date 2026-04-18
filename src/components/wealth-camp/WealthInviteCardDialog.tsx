import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WealthCampShareCard from './WealthCampShareCard';
import AchievementShareCard from './AchievementShareCard';
import AssessmentValueShareCard from '@/components/wealth-block/AssessmentValueShareCard';
import WealthBlockPromoShareCard from '@/components/wealth-block/WealthBlockPromoShareCard';
import { getPromotionDomain } from '@/utils/partnerQRUtils';
import { supabase } from '@/integrations/supabase/client';
import useWechatShare from '@/hooks/useWechatShare';
import { ShareCardSkeleton } from '@/components/ui/ShareCardSkeleton';
import { getProxiedAvatarUrl } from '@/utils/avatarUtils';
import { ShareDialogBase } from '@/components/ui/share-dialog-base';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateServerShareCard, generateServerShareCardDataUrl } from '@/utils/serverShareCard';
import ShareImagePreview from '@/components/ui/share-image-preview';

// ── Types ──────────────────────────────────────────────────────

interface UserInfo {
  avatarUrl?: string;
  displayName?: string;
  currentDay?: number;
  totalDays?: number;
}

type CardTab = 'value' | 'camp' | 'achievement' | 'promo';

const ALL_CARD_OPTIONS: { id: CardTab; label: string; emoji: string }[] = [
  { id: 'value', label: '我的测评', emoji: '🎯' },
  { id: 'promo', label: '财富测评',   emoji: '💰' },
  { id: 'camp',  label: '训练营邀请', emoji: '🏕️' },
];

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
  /** Pre-calculated awakening index (0-100). When provided, skips DB fetch for score. */
  assessmentScore?: number;
  /** Pre-determined reaction pattern (e.g. "chase"). When provided, skips DB fetch for pattern. */
  reactionPattern?: string;
}

// ── Component ──────────────────────────────────────────────────

const WealthInviteCardDialog: React.FC<WealthInviteCardDialogProps> = ({
  trigger,
  defaultTab = 'promo',
  onGenerate,
  onViewComplete,
  campId,
  currentDay: propCurrentDay,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  assessmentScore: propAssessmentScore,
  reactionPattern: propReactionPattern,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [viewCompleted, setViewCompleted] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const [activeTab, setActiveTab] = useState<CardTab>(defaultTab);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [partnerInfo, setPartnerInfo] = useState<{ partnerId: string; partnerCode: string } | null>(null);
  const [assessmentData, setAssessmentData] = useState<{
    awakeningScore: number;
    reactionPattern: string;
  } | null>(null);

  // One ref per card type
  const valueCardRef = useRef<HTMLDivElement>(null);
  const campCardRef = useRef<HTMLDivElement>(null);
  const achievementCardRef = useRef<HTMLDivElement>(null);
  const promoCardRef = useRef<HTMLDivElement>(null);

  // Dynamic ref based on active tab
  const activeCardRef = activeTab === 'value' ? valueCardRef
    : activeTab === 'camp' ? campCardRef
    : activeTab === 'promo' ? promoCardRef
    : achievementCardRef;

  // ── URLs ──────────────────────────────────────────────────────

  const getUrlWithRef = (path: string): string => {
    const baseUrl = `${getPromotionDomain()}${path}`;
    return partnerInfo?.partnerCode ? `${baseUrl}?ref=${partnerInfo.partnerCode}` : baseUrl;
  };

  const shareUrl = activeTab === 'value'
    ? getUrlWithRef('/wealth-block')
    : getUrlWithRef('/wealth-camp-intro');

  const campUrl = getUrlWithRef('/wealth-camp-intro');

  // Configure WeChat JS-SDK share content
  useWechatShare({
    title: '财富觉醒训练营 - 邀请你一起突破',
    desc: '每天15分钟，7天突破财富卡点',
    link: campUrl,
    imgUrl: `${getPromotionDomain()}/og-youjin-ai.png`,
  });

  // ── 3-second view completion timer ────────────────────────────

  useEffect(() => {
    if (!open || viewCompleted) return;
    const timer = setTimeout(() => {
      setViewCompleted(true);
      onViewComplete?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [open, viewCompleted, onViewComplete]);

  useEffect(() => {
    if (!open) setViewCompleted(false);
  }, [open]);

  // ── Fetch user data ───────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setIsLoadingUser(true);

    // 超时兜底：最多 5 秒后强制结束 loading
    const timeoutId = setTimeout(() => {
      console.warn('[WealthInviteCardDialog] User info fetch timed out, showing default card.');
      setIsLoadingUser(false);
    }, 5000);

    const fetchUserInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // 未登录也显示卡片，使用默认数据
          setIsLoadingUser(false);
          clearTimeout(timeoutId);
          return;
        }

        // Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', user.id)
          .single();

        // Camp progress
        let currentDay = propCurrentDay;
        let totalDays = 7;
        if (campId && !propCurrentDay) {
          const { data: camp } = await supabase
            .from('training_camps')
            .select('start_date, duration_days')
            .eq('id', campId)
            .single();
          if (camp?.start_date) {
            const diffMs = Date.now() - new Date(camp.start_date).getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
            currentDay = Math.min(Math.max(1, diffDays), camp.duration_days || 7);
            totalDays = camp.duration_days || 7;
          }
        }

        const proxiedAvatarUrl = getProxiedAvatarUrl(profile?.avatar_url);

        // Partner info
        const { data: partner } = await supabase
          .from('partners')
          .select('id, partner_code')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();
        if (partner) {
          setPartnerInfo({ partnerId: partner.id, partnerCode: partner.partner_code });
        }

        // Assessment data
        if (propAssessmentScore !== undefined) {
          setAssessmentData({
            awakeningScore: propAssessmentScore,
            reactionPattern: propReactionPattern || '追逐型',
          });
        } else {
          const { data: assessment } = await supabase
            .from('wealth_block_assessments')
            .select('behavior_score, emotion_score, belief_score, reaction_pattern')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (assessment) {
            const totalScore = (assessment.behavior_score || 0) + (assessment.emotion_score || 0) + (assessment.belief_score || 0);
            const awakeningScore = 100 - Math.round((totalScore / 150) * 100);
            setAssessmentData({
              awakeningScore,
              reactionPattern: (assessment as any).reaction_pattern || '追逐型',
            });
          }
        }

        setUserInfo({
          avatarUrl: proxiedAvatarUrl,
          displayName: profile?.display_name || '财富觉醒者',
          currentDay: currentDay || undefined,
          totalDays,
        });
      } catch (err) {
        console.error('[WealthInviteCardDialog] Failed to fetch user info:', err);
      } finally {
        setIsLoadingUser(false);
        clearTimeout(timeoutId);
      }
    };

    fetchUserInfo();
    return () => clearTimeout(timeoutId);
  }, [open, campId, propCurrentDay]);

  // ── Server-side generate for value tab (bypasses html2canvas) ──

  const [serverPreviewUrl, setServerPreviewUrl] = useState<string | null>(null);
  const [showServerPreview, setShowServerPreview] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);

  const handleServerGenerate = useCallback(async () => {
    // 数据缺失时优雅降级：自动切到 promo Tab，而不是报错退出
    if (!assessmentData) {
      toast.message('完成测评后可生成专属分数海报', { description: '已为你切换到通用推广海报' });
      setActiveTab('promo');
      return;
    }
    setIsGenerating(true);

    try {
      const cardData = {
        healthScore: assessmentData.awakeningScore,
        reactionPattern: assessmentData.reactionPattern,
        displayName: userInfo.displayName,
        avatarUrl: userInfo.avatarUrl,
        partnerCode: partnerInfo?.partnerCode,
      };

      // 全端统一：服务端生成 dataUrl → ShareImagePreview 预览
      // 桌面用户在预览里点「保存图片」可下载/右键另存/拖入 PC 微信
      const dataUrl = await generateServerShareCardDataUrl(cardData);
      if (!dataUrl) {
        toast.error('图片生成失败，请重试');
        return;
      }
      setServerPreviewUrl(dataUrl);
      setOpen(false);
      setShowServerPreview(true);
    } catch (error) {
      console.error('Share card generation failed:', error);
      toast.error('生成分享卡片失败，请重试');
    } finally {
      setIsGenerating(false);
      document.body.removeAttribute('data-scroll-locked');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [assessmentData, userInfo, partnerInfo, setOpen]);

  // ── Card rendering helpers ────────────────────────────────────

  const renderCard = (forExport: boolean) => {
    const ref = forExport
      ? (activeTab === 'value' ? valueCardRef : activeTab === 'camp' ? campCardRef : activeTab === 'promo' ? promoCardRef : achievementCardRef)
      : undefined;

    if (isLoadingUser && !forExport) return <ShareCardSkeleton />;

    switch (activeTab) {
      case 'value':
        return (
          <AssessmentValueShareCard
            ref={ref as any}
            avatarUrl={userInfo.avatarUrl}
            displayName={userInfo.displayName}
            partnerInfo={partnerInfo || undefined}
            healthScore={assessmentData?.awakeningScore}
            reactionPattern={assessmentData?.reactionPattern}
          />
        );
      case 'camp':
        return (
          <WealthCampShareCard
            ref={ref as any}
            avatarUrl={userInfo.avatarUrl}
            displayName={userInfo.displayName}
            currentDay={userInfo.currentDay}
            totalDays={userInfo.totalDays}
            partnerInfo={partnerInfo || undefined}
          />
        );
      case 'achievement':
        return (
          <AchievementShareCard
            ref={ref as any}
            avatarUrl={userInfo.avatarUrl}
            displayName={userInfo.displayName}
            selectedPath={null}
            showPathSelector={false}
            stylePreset="dark"
            showStyleSelector={false}
            partnerInfo={partnerInfo || undefined}
          />
        );
      case 'promo':
        return (
          <WealthBlockPromoShareCard
            ref={ref as any}
            avatarUrl={userInfo.avatarUrl}
            displayName={userInfo.displayName}
            partnerInfo={partnerInfo || undefined}
          />
        );
    }
  };

  // Tab selector UI - 仅在有测评数据时显示 value Tab，避免售前用户点了报错
  const CARD_OPTIONS = ALL_CARD_OPTIONS.filter(opt => opt.id !== 'value' || !!assessmentData);

  // 如果用户当前选中 value Tab 但没有数据，自动 fallback 到 promo
  useEffect(() => {
    if (activeTab === 'value' && !isLoadingUser && !assessmentData) {
      setActiveTab('promo');
    }
  }, [activeTab, assessmentData, isLoadingUser]);

  const tabSelector = CARD_OPTIONS.length > 1 ? (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
      {CARD_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          onClick={() => setActiveTab(opt.id)}
          style={{
            padding: '6px 16px',
            borderRadius: '20px',
            border: 'none',
            fontSize: '13px',
            fontWeight: activeTab === opt.id ? '600' : '400',
            background: activeTab === opt.id ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
            color: activeTab === opt.id ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {opt.emoji} {opt.label}
        </button>
      ))}
    </div>
  ) : undefined;

  // ── Render ────────────────────────────────────────────────────

  // Uncontrolled trigger support
  const dialogTrigger = !isControlled && trigger ? (
    <div onClick={() => setOpen(true)}>
      {trigger}
    </div>
  ) : !isControlled && !trigger ? (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
      <Share2 className="h-4 w-4" />
      生成邀请卡片
    </Button>
  ) : null;

  const handleCloseServerPreview = useCallback(() => {
    setShowServerPreview(false);
    // Only revoke if it's a blob URL (not base64)
    if (serverPreviewUrl && serverPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(serverPreviewUrl);
    }
    setServerPreviewUrl(null);
  }, [serverPreviewUrl]);

  return (
    <>
      {dialogTrigger}
      <ShareDialogBase
        open={open}
        onOpenChange={setOpen}
        title="生成分享卡片"
        shareUrl={shareUrl}
        fileName={`${activeTab === 'value' ? '财富测评价值卡' : activeTab === 'camp' ? '7天财富训练营邀请卡' : activeTab === 'promo' ? '财富测评推广海报' : '财富觉醒成就墙'}.png`}
        shareTitle="财富觉醒训练营"
        shareText="邀请你一起突破财富卡点"
        previewHeight={activeTab === 'achievement' ? 360 : 400}
        previewScale={0.5}
        abovePreview={tabSelector}
        previewCard={renderCard(false)}
        exportCard={renderCard(true)}
        exportCardRef={activeCardRef}
        skeleton={<ShareCardSkeleton />}
        cardReady={!isLoadingUser}
        footerHint="点击分享按钮，或复制链接后发送"
        maxWidthClass="max-w-md"
        onGenerate={activeTab === 'value' ? handleServerGenerate : undefined}
      />
      {/* Server-side preview for value tab */}
      <ShareImagePreview
        open={showServerPreview}
        onClose={handleCloseServerPreview}
        imageUrl={serverPreviewUrl}
      />
    </>
  );
};

export default WealthInviteCardDialog;
