import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RotateCcw, History, Mic, ArrowRight, Share2, Sparkles, TrendingUp, Lightbulb, Target, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { DynamicAssessmentQRCard } from "./DynamicAssessmentQRCard";
import { ClinicalResultSection } from "./ClinicalResultSection";
import { DimensionRadarChart } from "./DimensionRadarChart";
import DynamicAssessmentShareCard from "./DynamicAssessmentShareCard";
import SBTIShareCard from "./SBTIShareCard";
import ShareImagePreview from "@/components/ui/share-image-preview";
import { executeOneClickShare } from "@/utils/oneClickShare";
import { useAuth } from "@/hooks/useAuth";
import { getProxiedAvatarUrl } from "@/utils/avatarUtils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DimensionScore {
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
  onRetake: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  recommendedCampTypes?: string[];
  isLiteMode?: boolean;
  onLoginToUnlock?: () => void;
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

export function DynamicAssessmentResult({
  result,
  template,
  scoringType,
  aiInsight,
  loadingInsight,
  onRetake,
  onShowHistory,
  hasHistory,
  recommendedCampTypes,
  isLiteMode = false,
  onLoginToUnlock,
}: DynamicAssessmentResultProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recommendedCamps, setRecommendedCamps] = useState<CampInfo[]>([]);
  const [coachRoute, setCoachRoute] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [sharePreviewUrl, setSharePreviewUrl] = useState<string | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [profileData, setProfileData] = useState<{ displayName?: string; avatarUrl?: string }>({});

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
      const { data } = await sb.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single();
      setProfileData({
        displayName: data?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0],
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

  // Score percentage for the ring
  const scorePercent = result.maxScore > 0 ? Math.round((result.totalScore / result.maxScore) * 100) : 0;
  const isSBTI = scoringType === 'sbti';
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
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - scorePercent / 100) }}
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
                {result.primaryPattern?.description && (
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-3">
                    {result.primaryPattern.description}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2">
                  <Badge className="text-base px-4 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
                    {result.totalScore} / {result.maxScore} 分
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

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* Radar Chart (non-SBTI only) */}
        {!isSBTI && result.dimensionScores.length >= 3 && (
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="border-border/40 bg-card/90 backdrop-blur-sm shadow-sm overflow-hidden">
              <CardContent className="p-4 pt-3">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">能力雷达</h3>
                </div>
                <DimensionRadarChart dimensionScores={result.dimensionScores} />
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
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">维度得分</h3>
                </div>
                {result.dimensionScores.map((d, i) => {
                  const pct = d.maxScore > 0 ? (d.score / d.maxScore) * 100 : 0;
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
                          pct >= 80 ? "text-green-600" : pct >= 50 ? "text-foreground" : "text-orange-500"
                        )}>
                          {d.score}/{d.maxScore}
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-primary" : "bg-orange-400"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.06, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
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

        {/* Tips (hidden for SBTI) */}
        {!isSBTI && result.primaryPattern?.tips?.length > 0 && (
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

        {/* SBTI Entertainment Disclaimer */}
        {isSBTI && (
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <p className="text-center text-xs text-muted-foreground/60 py-2">
              🎭 本测试仅供娱乐，请勿当真。人格远比几个字母复杂得多。
            </p>
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
                    <span>AI 正在分析你的结果...</span>
                  </div>
                ) : aiInsight ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{aiInsight}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无</p>
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
        {!isSBTI && recommendedCamps.length > 0 && (
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
          {hasHistory && onShowHistory && (
            <Button variant="outline" className="w-full gap-2 rounded-xl h-11" onClick={onShowHistory}>
              <History className="w-4 h-4" /> 查看历史记录
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2 rounded-xl h-11" onClick={onRetake}>
            <RotateCcw className="w-4 h-4" /> 重新测评
          </Button>
        </motion.div>
      </div>

      {/* Hidden share card */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
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
      </div>

      {/* Share image preview */}
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
