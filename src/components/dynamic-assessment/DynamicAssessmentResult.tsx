import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, RotateCcw, History, Mic, ArrowRight, Share2, Sparkles, TrendingUp, Lightbulb, Target, Lock, Download, Image as ImageIcon, FileText, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { DynamicAssessmentQRCard } from "./DynamicAssessmentQRCard";
import { ClinicalResultSection } from "./ClinicalResultSection";
import { DimensionRadarChart } from "./DimensionRadarChart";
import DynamicAssessmentShareCard from "./DynamicAssessmentShareCard";
import SBTIShareCard from "./SBTIShareCard";
import MaleMidlifeVitalityShareCard from "./MaleMidlifeVitalityShareCard";
import MaleVitalityReportCard from "./MaleVitalityReportCard";
import WomenCompetitivenessShareCard from "./WomenCompetitivenessShareCard";
import WomenCompetitivenessReportCard from "./WomenCompetitivenessReportCard";
import { WeChatPdfGuideSheet } from "./WeChatPdfGuideSheet";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { executeOneClickShare } from "@/utils/oneClickShare";
import { generateCardBlob } from "@/utils/shareCardConfig";
import { exportNodeToPdf } from "@/utils/exportReportToPdf";
import { detectPlatform } from "@/lib/platformDetector";
import { useAuth } from "@/hooks/useAuth";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DimensionScore {
  key?: string;
  score: number;
  maxScore: number;
  label: string;
  emoji: string;
  average?: number;
  severity?: string;
}

interface ResultData {
  totalScore: number;
  maxScore: number;
  percentage: number;
  dimensionScores: DimensionScore[];
  primaryPattern: any;
  meta?: Record<string, any>;
}

interface CampInfo {
  id: string;
  camp_name: string;
  camp_type: string;
  icon: string | null;
  duration_days: number;
  price: number;
}

interface DynamicAssessmentResultProps {
  result: ResultData;
  template: {
    emoji: string;
    title: string;
    qr_image_url?: string | null;
    qr_title?: string | null;
    coach_prompt?: string | null;
    coach_type?: string | null;
    assessment_key: string;
  };
  scoringType?: string;
  aiInsight: string | null;
  loadingInsight: boolean;
  insightError?: boolean;
  onRegenerateInsight?: () => void;
  onRetake: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  recommendedCampTypes?: string[];
  isLiteMode?: boolean;
  onLoginToUnlock?: () => void;
  /** 当前结果在数据库中的 ID（用于跨端复制专属链接） */
  recordId?: string | null;
  /** 落地页自动定位/高亮"保存 PDF"按钮（来自浏览器外跳链接 ?autoSave=pdf） */
  autoSavePdf?: boolean;
}

// SBTI → paid assessment recommendations
const SBTI_PAID_ASSESSMENTS = [
  {
    title: '情绪健康测评',
    price: '¥9.9',
    emoji: '🧠',
    gradient: 'from-teal-400 to-cyan-500',
    bgGradient: 'from-teal-50 to-cyan-50',
    description: '刚测完搞钱人格，再测测你的情绪"负债率"。PHQ-9 + GAD-7 专业双量表，看看焦虑和抑郁有没有在偷偷吃掉你的搞钱能量。',
    tags: ['PHQ-9 抑郁筛查', 'GAD-7 焦虑筛查', '专业报告'],
    route: '/assessment/emotion_health',
  },
  {
    title: 'SCL-90 心理健康测评',
    price: '¥9.9',
    emoji: '🔬',
    gradient: 'from-violet-400 to-indigo-500',
    bgGradient: 'from-violet-50 to-indigo-50',
    description: '90 题全面体检你的心理状态，10 大维度精准扫描，比体检报告还详细的心理 CT。',
    tags: ['10大维度', '90题深度扫描', '临床级量表'],
    route: '/scl90',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const toVitalityStatusScore = (score: number, maxScore: number) => {
  if (maxScore <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(100 - (score / maxScore) * 100)));
};

const getVitalityStatusTone = (score: number) => {
  if (score >= 80) return { label: "稳", text: "text-emerald-600", bar: "bg-emerald-500" };
  if (score >= 60) return { label: "可调整", text: "text-primary", bar: "bg-primary" };
  if (score >= 40) return { label: "需留意", text: "text-amber-600", bar: "bg-amber-500" };
  return { label: "优先恢复", text: "text-orange-600", bar: "bg-orange-500" };
};

const vitalityDimensionTips: Record<string, string> = {
  energy: "先把白天电量稳住，不急着证明自己还能扛。",
  sleep: "睡眠是第一块电池，先从睡前少刷 15 分钟开始。",
  stress: "不是你扛不住，是脑子一直没有真正下班。",
  confidence: "关键时刻先恢复节奏，比急着证明更重要。",
  relationship: "关系温度不用硬聊，先从一个轻松回应开始。",
  recovery: "行动不用大，连续 7 天的小动作更容易把电量找回来。",
};

export function DynamicAssessmentResult({
  result,
  template,
  scoringType,
  aiInsight,
  loadingInsight,
  insightError = false,
  onRegenerateInsight,
  onRetake,
  onShowHistory,
  hasHistory,
  recommendedCampTypes,
  isLiteMode = false,
  onLoginToUnlock,
  recordId,
  autoSavePdf,
}: DynamicAssessmentResultProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedCamps, setRecommendedCamps] = useState<CampInfo[]>([]);
  const [coachRoute, setCoachRoute] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const saveButtonRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<{ displayName?: string; avatarUrl?: string }>({});
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showMoreFormats, setShowMoreFormats] = useState(false);
  const [showWeChatPdfGuide, setShowWeChatPdfGuide] = useState(false);
  const [reportPreview, setReportPreview] = useState<{ url: string; isRemoteReady: boolean; isBlob: boolean } | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [pulseSaveBtn, setPulseSaveBtn] = useState(false);

  // Fetch coach route
  useEffect(() => {
    if (!template.coach_type) return;
    const fetchRoute = async () => {
      const { data } = await supabase
        .from('coach_templates')
        .select('page_route')
        .eq('coach_key', template.coach_type!)
        .eq('is_active', true)
        .single();
      if (data) setCoachRoute(data.page_route);
    };
    fetchRoute();
  }, [template.coach_type]);

  useEffect(() => {
    if (!recommendedCampTypes?.length) return;
    const fetchCamps = async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('id, camp_name, camp_type, icon, duration_days, price')
        .in('camp_type', recommendedCampTypes)
        .eq('is_active', true);
      if (data) setRecommendedCamps(data);
    };
    fetchCamps();
  }, [recommendedCampTypes]);

  // Fetch user profile for share card
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const sb = supabase as any;
      const { data } = await sb.from('profiles').select('avatar_url, display_name').eq('id', user.id).single();
      setProfileData({
        displayName: (() => {
          const rawName = data?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];
          return (rawName && !rawName.startsWith('phone_')) ? rawName : '用户';
        })(),
        avatarUrl: getProxiedAvatarUrl(data?.avatar_url || user.user_metadata?.avatar_url),
      });
    };
    fetchProfile();
  }, [user]);

  const handleAICoach = () => {
    const targetRoute = coachRoute || "/assessment-coach";
    navigate(targetRoute, {
      state: {
        fromAssessment: template.assessment_key,
        assessmentData: {
          title: template.title,
          dimensionScores: result.dimensionScores,
          primaryPattern: result.primaryPattern?.label,
          totalScore: result.totalScore,
          maxScore: result.maxScore,
          aiInsight,
          coachPrompt: template.coach_prompt,
        },
        autoStartVoice: true,
      },
    });
  };

  const handleShare = async () => {
    if (isSharing || !shareCardRef.current) return;
    setIsSharing(true);
    await executeOneClickShare({
      cardRef: shareCardRef,
      cardName: `${template.title}测评报告`,
      onShowPreview: (url) => setSharePreviewUrl(url),
      onSuccess: () => toast.success('分享卡片已生成'),
      onError: (err) => toast.error(err),
    });
    setIsSharing(false);
  };

  // ===== 保存私密报告 =====
  const platform = useMemo(() => detectPlatform(), []);
  const isWeChatLike = platform === 'wechat' || platform === 'mini_program';

  const handleSaveAsImage = async () => {
    if (savingReport || !reportCardRef.current) return;
    setSavingReport(true);
    setShowSaveSheet(false);
    try {
      const blob = await generateCardBlob(reportCardRef, { backgroundColor: '#ffffff' });
      if (!blob) throw new Error('生成失败');
      // 1) 立即用 blob URL 显示预览（PC 端可直接下载；移动端先看到图）
      const blobUrl = URL.createObjectURL(blob);
      setReportPreview({ url: blobUrl, isRemoteReady: false, isBlob: true });

      // 2) 后台异步上传到 storage 拿 https URL（小程序/微信内长按保存到相册必需）
      // 加 8s 超时，超时则保留 blob URL 并提示
      (async () => {
        try {
          const { uploadShareImage } = await import('@/utils/shareImageUploader');
          const uploadPromise = uploadShareImage(blob);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('upload timeout')), 8000)
          );
          const httpsUrl = await Promise.race([uploadPromise, timeoutPromise]);
          // 切换为 https URL，触发底部"高清图已准备好"文案
          setReportPreview({ url: httpsUrl, isRemoteReady: true, isBlob: false });
          // 释放占位 blob
          URL.revokeObjectURL(blobUrl);
        } catch (err) {
          console.warn('[saveReport] upload failed, keeping blob url:', err);
          if (isWeChatLike) {
            toast.message('网络较慢，可截屏保存或改存 PDF', { duration: 4000 });
          }
        }
      })();
    } catch (e) {
      console.error('[saveReport] image failed:', e);
      toast.error('生成图片失败，请重试');
    } finally {
      setSavingReport(false);
    }
  };

  const handleSaveAsPdf = async () => {
    if (savingReport) return;
    // 微信内不直接下载 PDF，弹引导卡
    if (isWeChatLike) {
      setShowSaveSheet(false);
      setShowWeChatPdfGuide(true);
      return;
    }
    if (!reportCardRef.current) return;
    setSavingReport(true);
    setShowSaveSheet(false);
    try {
      const fileBase =
        template.assessment_key === 'women_competitiveness'
          ? '35+绽放报告'
          : '男人有劲状态报告';
      await exportNodeToPdf(reportCardRef.current, {
        filename: `${fileBase}_${new Date().toISOString().slice(0, 10)}`,
      });
      toast.success('PDF 已开始下载');
    } catch (e) {
      console.error('[saveReport] pdf failed:', e);
      toast.error('PDF 生成失败，请改为保存图片');
    } finally {
      setSavingReport(false);
    }
  };

  // 浏览器外跳落地：autoSavePdf=true 时,滚动到保存按钮 + 高亮脉冲 + 提示
  useEffect(() => {
    if (!autoSavePdf) return;
    const t = setTimeout(() => {
      saveButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPulseSaveBtn(true);
      toast.info('点这里保存 PDF ↓', { duration: 4000 });
      setTimeout(() => setPulseSaveBtn(false), 4000);
    }, 800);
    return () => clearTimeout(t);
  }, [autoSavePdf]);

  // Score percentage for the ring
  const scorePercent = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const isSBTI = scoringType === 'sbti';
  const isMaleMidlifeVitality = template.assessment_key === 'male_midlife_vitality';
  const isWomenCompetitiveness = template.assessment_key === 'women_competitiveness';
  const useExpandedLayout = isMaleMidlifeVitality || isWomenCompetitiveness;
  const vitalityStatusPercent = isMaleMidlifeVitality ? toVitalityStatusScore(result.totalScore, result.maxScore) : scorePercent;
  const vitalityStatusScores = useMemo(() => {
    if (!isMaleMidlifeVitality) return result.dimensionScores;
    return result.dimensionScores.map((d) => ({
      ...d,
      score: toVitalityStatusScore(d.score, d.maxScore),
      maxScore: 100,
      label: d.label === '压力内耗' ? '压力调节' : d.label === '恢复阻力' ? '行动恢复力' : d.label,
      rawScore: d.score,
      rawMaxScore: d.maxScore,
    }));
  }, [isMaleMidlifeVitality, result.dimensionScores]);
  const vitalitySummary = vitalityStatusPercent >= 80
    ? "当前阻力较低，底盘还稳。适合趁状态还在，先建立一套轻量恢复节奏。"
    : vitalityStatusPercent >= 60
      ? "整体状态还撑得住，但睡眠、压力或体能已经在提醒你：该开始恢复了。"
      : vitalityStatusPercent >= 40
        ? "你不是不行，是长期消耗让身体和信心都变紧了。建议先把恢复放到优先级前面。"
        : "当前已经接近低电量运行，不建议继续硬扛。先从睡眠、呼吸和每日小行动开始修复。";
  const competitivenessSummary = scorePercent >= 80
    ? "你已经在绽放期：底盘稳，资源、能量、关系都在你这边。可以开始把它放大成系统性影响力。"
    : scorePercent >= 60
      ? "你具备绽放底气，只是被多线消耗稀释了。重启节奏感后会快速回弹。"
      : scorePercent >= 40
        ? "你不是不行，是 35+ 的你同时在扛太多线。先把电量充回来，再谈竞争力。"
        : "当前已经在低电量运行。不建议硬撑，先把睡眠、情绪、节奏修复，再谈外部突破。";
  const sbtiGroups = isSBTI ? [
    { name: '自我模型', emoji: '🪞', keys: ['S1','S2','S3'] },
    { name: '情感模型', emoji: '💗', keys: ['E1','E2','E3'] },
    { name: '态度模型', emoji: '🌍', keys: ['A1','A2','A3'] },
    { name: '行动模型', emoji: '⚡', keys: ['Ac1','Ac2','Ac3'] },
    { name: '社交模型', emoji: '🤝', keys: ['So1','So2','So3'] },
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background pb-24">
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden pt-8 pb-6 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Decorative blurs */}
        <div className="absolute top-0 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

        <div className="relative text-center max-w-lg mx-auto">
          {isSBTI ? (
            /* SBTI: Show personality code prominently, no score ring */
            <>
              <motion.div
                className="mb-4"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <span className="text-6xl block mb-2">{result.primaryPattern?.emoji || '🎭'}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h2 className="text-2xl font-black text-foreground mb-1 tracking-wide">
                  {result.primaryPattern?.label || "测评结果"}
                </h2>
                {result.meta?.subtitle && (
                  <p className="text-sm font-medium text-primary mb-2">{result.meta.subtitle}</p>
                )}
                {result.primaryPattern?.description && (
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-3">
                    {result.primaryPattern.description}
                  </p>
                )}
                {result.meta?.quote && (
                  <p className="text-xs italic text-muted-foreground/80 max-w-xs mx-auto mb-3">
                    「{result.meta.quote}」
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Badge className="text-xs px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    匹配度 {Math.max(0, Math.round(100 - (result.meta?.matchDistance || 0) / 15 * 100))}%
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            </>
          ) : (
            /* Standard: Score ring */
            <>
              <motion.div
                className="relative inline-flex items-center justify-center mb-4"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - (isMaleMidlifeVitality ? vitalityStatusPercent : scorePercent) / 100) }}
                    transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl">{result.primaryPattern?.emoji || template.emoji}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {result.primaryPattern?.label || "测评结果"}
                </h2>
                  {isMaleMidlifeVitality ? (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-3 leading-relaxed">
                      {vitalitySummary}
                    </p>
                  ) : isWomenCompetitiveness ? (
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-3 leading-relaxed">
                      {competitivenessSummary}
                    </p>
                  ) : result.primaryPattern?.description && (
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-3">
                    {result.primaryPattern.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Badge className="text-base px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    {isMaleMidlifeVitality
                      ? `有劲状态指数 ${vitalityStatusPercent}%`
                      : isWomenCompetitiveness
                        ? `绽放指数 ${scorePercent}%`
                        : `${result.totalScore} / ${result.maxScore} 分`}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      <div className={cn(
        "mx-auto px-4",
        useExpandedLayout
          ? "max-w-lg space-y-4 lg:max-w-5xl lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:items-start lg:gap-4 lg:space-y-0"
          : "max-w-lg space-y-4"
      )}>
        {/* Radar Chart (non-SBTI only) */}
        {!isSBTI && result.dimensionScores.length >= 3 && (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className={cn(useExpandedLayout && "lg:row-span-2")}>
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden">
              <CardContent className="p-4 pt-3 sm:p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">
                    {isMaleMidlifeVitality ? '有劲状态雷达' : isWomenCompetitiveness ? '绽放力雷达' : '能力雷达'}
                  </h3>
                </div>
                {isMaleMidlifeVitality && (
                  <p className="text-[11px] text-muted-foreground mb-2">越靠外代表状态越稳，越靠内代表越需要优先恢复。</p>
                )}
                {isWomenCompetitiveness && (
                  <p className="text-[11px] text-muted-foreground mb-2">越靠外代表越绽放，越靠内代表越被消耗、需要优先恢复。</p>
                )}
                <div className={cn(useExpandedLayout ? "h-[360px] sm:h-[390px] lg:h-[430px]" : "h-[300px] sm:h-[320px]") }>
                  <DimensionRadarChart dimensionScores={isMaleMidlifeVitality ? vitalityStatusScores : result.dimensionScores} variant={useExpandedLayout ? "large" : "default"} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Clinical Factor Analysis (for SCL-90 etc.) */}
        {scoringType === "clinical" && (
          <ClinicalResultSection
            dimensionScores={result.dimensionScores}
            meta={result.meta}
          />
        )}

        {/* SBTI: Grouped H/M/L dimension display */}
        {isSBTI && result.meta?.userLevels && !isLiteMode && (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">五大模型维度</h3>
                </div>
                {sbtiGroups.map((group) => (
                  <div key={group.name}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{group.emoji} {group.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.keys.map((k) => {
                        const dim = result.dimensionScores.find((d: any) => d.key === k);
                        const level = result.meta?.userLevels?.[k] || 'M';
                        const levelColor = level === 'H' ? 'bg-green-100 text-green-700 border-green-200' : level === 'L' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200';
                        const levelLabel = level === 'H' ? '高' : level === 'L' ? '低' : '中';
                        return (
                          <span key={k} className={cn("inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border", levelColor)}>
                            {dim?.emoji} {dim?.label || k}
                            <span className="font-bold ml-0.5">{levelLabel}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Standard Dimension Scores (non-SBTI) */}
        {!isSBTI && (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-3 relative">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">{isMaleMidlifeVitality ? '六项状态' : '维度得分'}</h3>
                </div>
                <div className={cn(
                  "space-y-3",
                  isMaleMidlifeVitality && isLiteMode && "blur-[5px] select-none pointer-events-none"
                )}>
                  {(isMaleMidlifeVitality ? vitalityStatusScores : result.dimensionScores).map((d, i) => {
                    const pct = d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0;
                    const vitalityTone = isMaleMidlifeVitality ? getVitalityStatusTone(pct) : null;
                    return (
                      <motion.div
                        key={d.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">
                            {d.emoji} {d.label}
                          </span>
                          <span className={cn(
                            "tabular-nums text-xs font-medium",
                            isMaleMidlifeVitality
                              ? vitalityTone?.text
                              : pct >= 80 ? "text-emerald-600" : pct >= 50 ? "text-foreground" : "text-orange-500"
                          )}>
                            {isMaleMidlifeVitality ? `状态 ${Math.round(pct)}% · ${vitalityTone?.label}` : `${d.score}/${d.maxScore}`}
                          </span>
                        </div>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              isMaleMidlifeVitality
                                ? vitalityTone?.bar
                                : pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : "bg-orange-400"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: "easeOut" }}
                          />
                        </div>
                        {isMaleMidlifeVitality && (
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                            {vitalityDimensionTips[d.key || '']}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {isMaleMidlifeVitality && isLiteMode && (
                  <div className="absolute inset-x-0 bottom-0 top-12 flex items-end justify-center pb-4 bg-gradient-to-b from-transparent via-card/60 to-card/95 rounded-b-lg">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      <Lock className="w-3 h-3" />
                      登录查看每项详细解读
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Traits */}
        {result.primaryPattern?.traits?.length > 0 && (
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">你的特征</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.primaryPattern.traits.map((t: string, i: number) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/8 text-primary text-xs font-medium rounded-full border border-primary/15"
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* SBTI Lite Mode: Login CTA */}
        {isSBTI && isLiteMode && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10 shadow-lg overflow-hidden">
              <CardContent className="p-5 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground mb-1">
                    登录解锁完整报告
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    包含15维度深度分析、AI个性化洞察、专属训练营推荐
                  </p>
                </div>
                <Button
                  onClick={onLoginToUnlock}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                >
                  登录查看完整报告
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Male Midlife Vitality Lite Mode: Login CTA */}
        {isMaleMidlifeVitality && isLiteMode && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-amber-600/30 bg-gradient-to-br from-amber-50/60 via-card to-teal-50/40 dark:from-amber-950/20 dark:to-teal-950/20 shadow-lg overflow-hidden">
              <CardContent className="p-5 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500/15 to-teal-600/15 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber-700 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground mb-1">
                    登录解锁完整报告 + 私密 PDF
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    6 维深度诊断 · AI 私人解读 · 一键保存私密 PDF
                  </p>
                </div>
                <Button
                  onClick={onLoginToUnlock}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-700 to-amber-600 hover:from-teal-600 hover:to-amber-500 text-white shadow-md"
                >
                  一键登录,解锁完整报告
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[11px] text-muted-foreground/70">
                  全程匿名 · 登录后自动恢复你的测评结果
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tips (hidden for SBTI; women version uses dedicated bloom action list) */}
        {!isSBTI && !isLiteMode && !isWomenCompetitiveness && result.primaryPattern?.tips?.length > 0 && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">改善建议</h3>
                </div>
                <ul className="space-y-2">
                  {result.primaryPattern.tips.map((t: string, i: number) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="text-sm text-muted-foreground flex items-start gap-2.5 p-2 rounded-lg bg-amber-50/50 border border-amber-100/50"
                    >
                      <span className="text-amber-500 mt-0.5 shrink-0">💡</span>
                      <span>{t}</span>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 35+女性版：场景化「绽放行动清单」替代通用 tips */}
        {isWomenCompetitiveness && !isLiteMode && (() => {
          const bloomActions = scorePercent >= 60
            ? [
                { emoji: '🌸', title: '守住属于你的 15 分钟', body: '下班路上别接工作电话，把这段路当成你的"切换舱"——只属于你自己。' },
                { emoji: '💼', title: '把"撑着"换成"调度"', body: '本周挑 1 件家务外包出去（保洁/做饭/接送），省下的时间还给身体。' },
                { emoji: '💗', title: '给关系做一次"减负"', body: '列出 3 个最消耗你的关系，本月主动减少 1 次接触，把能量留给自己。' },
                { emoji: '✨', title: '每周一次"我说了算"', body: '挑一件别人替你做主太久的小事（穿什么/吃什么/几点睡），自己定。' },
              ]
            : scorePercent >= 40
              ? [
                  { emoji: '🛏️', title: '先把睡眠还回来', body: '今晚 11 点前放下手机，睡眠是 35+ 女性最便宜也最贵的"竞争力"。' },
                  { emoji: '🤝', title: '说出第一个"不"', body: '本周拒绝一件"本不该是你扛"的事——同事的甩锅、家人的过度索取都行。' },
                  { emoji: '📒', title: '每天写下 1 件"我做到了"', body: '不是宏大目标，是"今天没崩"也算。重建对自己的相信，从这里开始。' },
                  { emoji: '🌿', title: '找一个低门槛的"独处仪式"', body: '泡澡、散步、写 5 行字都行——35+ 的底气，从有"自己的时间"开始。' },
                ]
              : [
                  { emoji: '🚨', title: '现在不是加油，是要停下', body: '当前已经低电量运行。请允许自己这周不再加任何新承诺。' },
                  { emoji: '🩺', title: '本周做 1 件"自我照顾"', body: '一次正经体检、一次心理咨询、或一次睡到自然醒——你需要被照顾，不是再扛。' },
                  { emoji: '🗣️', title: '找一个人说真话', body: '老朋友、咨询师、AI 教练都行。把"我撑不住了"说出口，比硬撑更有力量。' },
                  { emoji: '🪟', title: '把目标砍到 1/3', body: '不是你不行，是 35+ 同时背负的太多。先卸下 2/3，剩下的才走得动。' },
                ];
          return (
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <Card className="border-rose-200/60 bg-gradient-to-br from-rose-50/80 via-card to-purple-50/60 dark:from-rose-950/20 dark:to-purple-950/20 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground">绽放行动清单</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-3 ml-8">
                    专为 35+ 女性场景设计 · 今天就能做的 4 件小事
                  </p>
                  <ul className="space-y-2">
                    {bloomActions.map((a, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-card/60 border border-rose-100/60"
                      >
                        <span className="text-base mt-0.5 shrink-0">{a.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-foreground leading-snug">{a.title}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.body}</div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}

        {/* SBTI Entertainment Disclaimer + Share CTA */}
        {isSBTI && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20"
            >
              <Share2 className="w-5 h-5" /> 📤 分享我的搞钱人格
            </Button>
            <p className="text-center text-xs text-muted-foreground/60 py-2">
              🎭 本测试仅供娱乐，请勿当真。人格远比几个字母复杂得多。
            </p>
          </motion.div>
        )}

        {isMaleMidlifeVitality && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-amber-600 hover:from-teal-600 hover:to-amber-500 text-white shadow-lg shadow-teal-700/20"
            >
              <Share2 className="w-5 h-5" /> 分享我的有劲状态报告
            </Button>
          </motion.div>
        )}

        {isWomenCompetitiveness && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-purple-600 hover:from-rose-400 hover:via-fuchsia-400 hover:to-purple-500 text-white shadow-lg shadow-rose-500/20"
            >
              <Share2 className="w-5 h-5" /> 分享我的35+绽放报告
            </Button>
          </motion.div>
        )}

        {/* AI Insight (hidden in lite mode) */}
        {!isLiteMode && (
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">AI 个性化洞察</h3>
                </div>
                {loadingInsight ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>AI 正在结合你的画像分析...</span>
                  </div>
                ) : aiInsight ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{aiInsight}</p>
                ) : insightError ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      AI 洞察生成失败，可能是网络波动。
                    </p>
                    {onRegenerateInsight && (
                      <Button size="sm" variant="outline" onClick={onRegenerateInsight} className="gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5" /> 重新生成
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isMaleMidlifeVitality ? 'AI 洞察正在生成中，你可以先查看上方状态雷达和恢复建议。' : 'AI 洞察正在生成中，请稍后查看。'}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI Coach Button (hidden in lite mode) */}
        {!isLiteMode && (template.coach_prompt || template.coach_type) && (
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <Button
              onClick={handleAICoach}
              className="w-full h-12 gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Mic className="w-5 h-5" /> AI 教练深度解读
            </Button>
          </motion.div>
        )}

        {isMaleMidlifeVitality && !isLiteMode && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
            <Card className="border-primary/25 bg-gradient-to-br from-primary/8 to-accent/8 shadow-sm overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">🔋</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground">先用 7 天，把电量充回来</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      适合压力大、睡不好、容易疲惫、关键时刻信心波动的人。先从睡眠、呼吸、身体节奏和每日小行动开始恢复。
                    </p>
                  </div>
                </div>
                <Button className="w-full h-11 rounded-xl gap-2" onClick={() => navigate('/camp-intro/emotion_stress_7')}>
                  了解 7天有劲训练营 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">🧭</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground">如果你累的不只是身体</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      当责任、身份、自我价值感长期压在心里，可能需要更深一层的身份重建与人生节奏调整。
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={() => navigate('/camp-intro/identity_bloom')}>
                  看看身份绽放训练营 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 35+女性竞争力测评 → 双训练营推荐卡 */}
        {isWomenCompetitiveness && !isLiteMode && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
            <Card className="border-0 bg-gradient-to-br from-rose-500 to-purple-600 text-white shadow-lg overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base">7天有劲训练营</h3>
                    <p className="text-xs leading-relaxed mt-1 text-white/90">
                      职场+家庭双线疲惫？每日15分钟能量练习，帮你重启节奏感、找回35+女性的竞争力底气。
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="w-full h-11 rounded-xl gap-2 bg-white text-rose-600 hover:bg-white/90"
                  onClick={() => navigate('/camp-intro/emotion_stress_7')}
                >
                  了解7天有劲训练营 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">🌸</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-foreground">如果你想从根本绽放</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      当 35+ 的身份、价值感、节奏都在重新洗牌，你需要的可能不只是充电，而是一次系统的身份绽放。
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-11 rounded-xl gap-2" onClick={() => navigate('/camp-intro/identity_bloom')}>
                  看看身份绽放训练营 <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 35+女性版：训练营卡下方的轻量复测入口 */}
        {isWomenCompetitiveness && !isLiteMode && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="text-center">
            <button
              type="button"
              onClick={onRetake}
              className="text-xs text-muted-foreground hover:text-rose-600 underline underline-offset-4 decoration-dotted py-1.5 inline-flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> 想再测一次？立即重新测评
            </button>
          </motion.div>
        )}

        {/* SBTI-specific paid assessment recommendations */}
        {isSBTI && !isLiteMode && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
            <h3 className="font-semibold text-sm px-1 flex items-center gap-2">
              🔍 想更深入了解自己？试试专业测评
            </h3>
            {SBTI_PAID_ASSESSMENTS.map((item) => (
              <Card
                key={item.route}
                className={`border-0 bg-gradient-to-br ${item.bgGradient} shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow active:scale-[0.98]`}
                onClick={() => navigate(item.route)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-xl shadow-md shrink-0`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/70 text-foreground/70 shrink-0">
                          {item.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {item.tags.map((tag) => (
                        <span key={tag} className="bg-white/50 rounded-full px-2 py-0.5">{tag}</span>
                      ))}
                    </div>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br ${item.gradient} text-white shrink-0`}>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Generic Recommended Training Camps (non-SBTI) */}
        {!isSBTI && !isMaleMidlifeVitality && recommendedCamps.length > 0 && (
          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-2">
            <h3 className="font-semibold text-sm px-1 flex items-center gap-2">
              🏕️ 推荐训练营
            </h3>
            {recommendedCamps.map((camp) => (
              <div
                key={camp.id}
                className="bg-card/90 backdrop-blur-sm rounded-xl p-4 border border-border/40 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => navigate('/training-camps')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl">{camp.icon || '🏕️'}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{camp.camp_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {camp.duration_days}天系统训练 · {camp.price === 0 ? '免费参加' : `¥${camp.price}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* QR Card */}
        <DynamicAssessmentQRCard
          qrImageUrl={template.qr_image_url}
          qrTitle={template.qr_title}
        />

        {/* Action Buttons */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3 mt-4">
          {(isMaleMidlifeVitality || isWomenCompetitiveness) && aiInsight && !isLiteMode && (
            <div ref={saveButtonRef}>
              <Button
                className={cn(
                  "w-full gap-2 rounded-xl h-12 text-base font-semibold",
                  pulseSaveBtn && "ring-4 ring-primary/40 animate-pulse"
                )}
                onClick={() => setShowSaveSheet(true)}
                disabled={savingReport}
              >
                {savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                保存完整报告
              </Button>
              <p className="text-center text-[11px] text-muted-foreground mt-1.5">
                私密报告 · 仅本人查看 · 无二维码无推广
              </p>
            </div>
          )}
          {hasHistory && onShowHistory ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="w-full gap-2 rounded-xl h-11" onClick={onShowHistory}>
                <History className="w-4 h-4" /> 查看历史记录
              </Button>
              <Button variant="outline" className="w-full gap-2 rounded-xl h-11" onClick={onRetake}>
                <RotateCcw className="w-4 h-4" /> 重新测评
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="w-full gap-2 rounded-xl h-11" onClick={onRetake}>
              <RotateCcw className="w-4 h-4" /> 重新测评
            </Button>
          )}
        </motion.div>
      </div>

      {/* 保存格式 Sheet */}
      <Sheet open={showSaveSheet} onOpenChange={setShowSaveSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">保存完整报告</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-2">
            <button
              type="button"
              onClick={handleSaveAsImage}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left min-h-[60px]"
            >
              <ImageIcon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">📷 保存为长图（推荐）</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {isWeChatLike ? '生成后长按图片保存到相册' : '一键保存到本地'}
                </div>
              </div>
            </button>

            {!showMoreFormats ? (
              <button
                type="button"
                onClick={() => setShowMoreFormats(true)}
                className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" /> 更多格式
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAsPdf}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors text-left min-h-[60px]"
              >
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">📄 保存为 PDF</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {isWeChatLike ? '微信内需跳浏览器，将引导您操作' : '适合存档 / 打印'}
                  </div>
                </div>
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* 微信内 PDF 引导 */}
      {(isMaleMidlifeVitality || isWomenCompetitiveness) && (
        <WeChatPdfGuideSheet
          open={showWeChatPdfGuide}
          onOpenChange={setShowWeChatPdfGuide}
          recordId={recordId}
          assessmentKey={template.assessment_key}
          onSwitchToImage={handleSaveAsImage}
        />
      )}

      {/* 私密报告预览（图片路径） */}
      <ShareImagePreview
        open={!!reportPreview}
        onClose={() => {
          if (reportPreview?.isBlob) URL.revokeObjectURL(reportPreview.url);
          setReportPreview(null);
        }}
        imageUrl={reportPreview?.url ?? null}
        isRemoteReady={reportPreview?.isRemoteReady}
        title="预览报告"
      />

      {/* Hidden share card */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {isSBTI ? (
          <SBTIShareCard
            ref={shareCardRef}
            personalityLabel={result.primaryPattern?.label || '未知人格'}
            personalityEmoji={result.primaryPattern?.emoji || '🎭'}
            subtitle={result.meta?.subtitle}
            quote={result.meta?.quote}
            traits={result.primaryPattern?.traits || []}
            matchPercent={Math.max(0, Math.round(100 - (result.meta?.matchDistance || 0) / 15 * 100))}
            displayName={profileData.displayName}
            avatarUrl={profileData.avatarUrl}
          />
        ) : isMaleMidlifeVitality ? (
          <MaleMidlifeVitalityShareCard
            ref={shareCardRef}
            totalScore={result.totalScore}
            maxScore={result.maxScore}
            dimensionScores={result.dimensionScores}
            primaryPattern={result.primaryPattern}
            displayName={profileData.displayName}
            avatarUrl={profileData.avatarUrl}
          />
        ) : isWomenCompetitiveness ? (
          <WomenCompetitivenessShareCard
            ref={shareCardRef}
            totalScore={result.totalScore}
            maxScore={result.maxScore}
            dimensionScores={result.dimensionScores}
            primaryPattern={result.primaryPattern}
            displayName={profileData.displayName}
            avatarUrl={profileData.avatarUrl}
          />
        ) : (
          <DynamicAssessmentShareCard
            ref={shareCardRef}
            totalScore={result.totalScore}
            maxScore={result.maxScore}
            dimensionScores={result.dimensionScores}
            primaryPattern={result.primaryPattern}
            templateEmoji={template.emoji}
            templateTitle={template.title}
            displayName={profileData.displayName}
            avatarUrl={profileData.avatarUrl}
          />
        )}
        {isMaleMidlifeVitality && (
          <MaleVitalityReportCard
            ref={reportCardRef}
            totalScorePct={vitalityStatusPercent}
            dimensionScores={vitalityStatusScores as any}
            primaryPattern={result.primaryPattern}
            aiInsight={aiInsight}
            displayName={profileData.displayName}
            testedAt={new Date().toISOString()}
          />
        )}
        {isWomenCompetitiveness && (
          <WomenCompetitivenessReportCard
            ref={reportCardRef}
            totalScorePct={scorePercent}
            dimensionScores={result.dimensionScores}
            primaryPattern={result.primaryPattern}
            aiInsight={aiInsight}
            displayName={profileData.displayName}
            testedAt={new Date().toISOString()}
          />
        )}
      </div>
      <ShareImagePreview
        open={!!sharePreviewUrl}
        onClose={() => setSharePreviewUrl(null)}
        imageUrl={sharePreviewUrl}
        onRegenerate={handleShare}
        isRegenerating={isSharing}
      />
    </div>
  );
}
