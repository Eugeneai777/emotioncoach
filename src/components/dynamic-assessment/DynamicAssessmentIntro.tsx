import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Target, History, Sparkles, BarChart3, MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { setPostAuthRedirect } from "@/lib/postAuthRedirect";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DimensionRadarChart } from "./DimensionRadarChart";
import midlifeSceneImage from "@/assets/audience/midlife.webp";

interface DynamicAssessmentIntroProps {
  template: {
    emoji: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    gradient: string;
    dimensions: any[];
    question_count: number;
    assessment_key?: string;
  };
  onStart: () => void;
  onShowHistory?: () => void;
  hasHistory?: boolean;
  requireAuth?: boolean;
  requirePayment?: boolean;
  hasPurchased?: boolean;
  price?: number;
  onPayClick?: () => void;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
});

const benefitItems = [
  { icon: BarChart3, text: "专业维度分析报告" },
  { icon: Sparkles, text: "AI 个性化解读" },
  { icon: MessageSquare, text: "改善建议与行动方案" },
];

const maleMidlifeBenefitItems = [
  { icon: BarChart3, text: "一份只给你看的私密状态报告" },
  { icon: Target, text: "看清最该先调整的是睡眠、压力还是关系" },
  { icon: Sparkles, text: "AI 给出可执行的恢复建议" },
];

// Enrichment content keyed by assessment_key
const enrichmentData: Record<string, {
  painPoints: { emoji: string; text: string }[];
  authority: { emoji: string; text: string }[];
  comparison: { traditional: string; ours: string };
  radarPreview?: { score: number; maxScore: number; label: string; emoji: string }[];
  scene?: { image: string; title: string; subtitle: string; tags: string[] };
}> = {
  women_competitiveness: {
    painPoints: [
      { emoji: "👩‍💼", text: "35岁以后，简历上的经验反而成了'年龄大'的证据" },
      { emoji: "🔍", text: "明明能力不差，却总在面试中输给更年轻的人" },
      { emoji: "💭", text: "不知道自己的核心竞争力到底是什么" },
      { emoji: "🏃‍♀️", text: "想转型，但不知道从哪里开始" },
    ],
    authority: [
      { emoji: "📈", text: "麦肯锡研究：35+女性在领导力、判断力、共情力三项核心维度上显著领先" },
      { emoji: "🧠", text: "脑科学研究：女性35岁后进入'整合智慧期'，综合决策能力达到峰值" },
    ],
    comparison: {
      traditional: "通用模板，千人一面，看完也不知道优势在哪",
      ours: "针对35+女性设计维度 + AI深度洞察你的独特优势",
    },
    radarPreview: [
      { score: 68, maxScore: 100, label: "职场生命力", emoji: "🔥" },
      { score: 52, maxScore: 100, label: "个人品牌力", emoji: "👑" },
      { score: 75, maxScore: 100, label: "情绪韧性", emoji: "💪" },
      { score: 40, maxScore: 100, label: "财务掌控力", emoji: "💰" },
      { score: 82, maxScore: 100, label: "关系经营力", emoji: "🤝" },
    ],
  },
  male_midlife_vitality: {
    painPoints: [
      { emoji: "🔋", text: "白天靠硬撑，晚上却睡不深，像一直充不上电" },
      { emoji: "🧠", text: "工作、家庭、身体指标都要扛，但不想让别人看出来" },
      { emoji: "🤐", text: "有些变化不好开口，只能自己反复琢磨" },
      { emoji: "🏠", text: "不是不在乎家人，是最近连照顾自己的余力都变少了" },
    ],
    authority: [
      { emoji: "🔒", text: "私密完成：结果只给你自己看，不需要向任何人解释" },
      { emoji: "🧭", text: "有依据：围绕精力、睡眠、压力、关系和信心做状态盘点" },
      { emoji: "🛡️", text: "非诊断：不贴标签；如有明显身体不适，建议及时咨询专业医生" },
    ],
    comparison: {
      traditional: "题目太医学化，越看越紧张；或者太娱乐化，看完还是不知道该怎么办。",
      ours: "用真实生活场景提问，帮你看清精力、睡眠、压力、关系和关键时刻信心之间的关系。",
    },
    scene: {
      image: midlifeSceneImage,
      title: "很多变化，不是突然发生的",
      subtitle: "先看清状态，再决定从哪里开始恢复。",
      tags: ["晚上睡不深", "白天靠硬撑", "有些话不好开口"],
    },
    radarPreview: [
      { score: 46, maxScore: 100, label: "精力续航", emoji: "🔋" },
      { score: 39, maxScore: 100, label: "睡眠修复", emoji: "🌙" },
      { score: 72, maxScore: 100, label: "压力内耗", emoji: "🧠" },
      { score: 58, maxScore: 100, label: "关键时刻信心", emoji: "🛡️" },
      { score: 51, maxScore: 100, label: "关系温度", emoji: "🏠" },
      { score: 64, maxScore: 100, label: "行动恢复力", emoji: "🏃" },
    ],
  },
};

export function DynamicAssessmentIntro({ template, onStart, onShowHistory, hasHistory, requireAuth = true, requirePayment, hasPurchased, price, onPayClick }: DynamicAssessmentIntroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const needPay = requirePayment && !hasPurchased;
  const isMaleMidlifeVitality = template.assessment_key === 'male_midlife_vitality';
  const dimensions = template.dimensions || [];
  const enrichment = template.assessment_key ? enrichmentData[template.assessment_key] : undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className={`bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10 px-6 pt-12 pb-16 text-center max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const }}
            className="text-6xl mb-5 drop-shadow-lg"
          >
            {template.emoji}
          </motion.div>
          <motion.h1
            {...fadeUp(0.15)}
            className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight"
          >
            {template.title}
          </motion.h1>
          {template.subtitle && (
            <motion.p {...fadeUp(0.25)} className="text-white/80 text-sm sm:text-base">
              {template.subtitle}
            </motion.p>
          )}

          {/* Quick stats pills + social proof */}
          <motion.div {...fadeUp(0.35)} className="flex items-center justify-center gap-3 mt-5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-white text-xs sm:text-sm">
              <Target className="w-3.5 h-3.5" />
              <span>{template.question_count} 题</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-white text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>约 {Math.ceil(template.question_count / 5)} 分钟</span>
            </div>
            {enrichment && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-white text-xs sm:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                <span>1,523 人已测</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-4 pb-8 relative z-20">
        {/* Description */}
        {template.description && (
          <motion.div {...fadeUp(0.4)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <p className="text-muted-foreground text-sm leading-relaxed">{template.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Pain Points (enrichment) */}
        {enrichment && (
          <motion.div {...fadeUp(0.45)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 text-sm">💡 你是否正经历这些？</h2>
                <div className="space-y-2">
                  {enrichment.painPoints.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/30">
                      <span className="text-lg shrink-0">{item.emoji}</span>
                      <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Scene visual (male midlife only) */}
        {enrichment?.scene && (
          <motion.div {...fadeUp(0.48)}>
            <div className="relative overflow-hidden rounded-2xl shadow-lg border border-border/40 min-h-[210px]">
              <img
                src={enrichment.scene.image}
                alt="中年男性独处思考状态场景"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/35 to-transparent" />
              <div className="relative z-10 flex min-h-[210px] flex-col justify-end p-5 text-background">
                <p className="text-lg font-bold leading-snug mb-1">{enrichment.scene.title}</p>
                <p className="text-xs text-background/80 mb-4">{enrichment.scene.subtitle}</p>
                <div className="flex flex-wrap gap-2">
                  {enrichment.scene.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-background/15 px-3 py-1 text-[11px] backdrop-blur-sm border border-background/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Authority Data (enrichment) */}
        {enrichment && (
          <motion.div {...fadeUp(0.5)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  {isMaleMidlifeVitality ? '放心测：私密、非诊断、有依据' : '科学研究支撑'}
                </h2>
                <div className="space-y-2">
                  {enrichment.authority.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/40 dark:border-amber-500/10">
                      <span className="text-lg shrink-0">{item.emoji}</span>
                      <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Radar Preview (enrichment) */}
        {enrichment?.radarPreview && (
          <motion.div {...fadeUp(0.52)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <p className="text-[10px] text-center text-muted-foreground mb-3">📊 报告预览 · 示例数据</p>
                <div className="h-[300px] sm:h-[320px]">
                  <DimensionRadarChart dimensionScores={enrichment.radarPreview} />
                </div>
                <p className="text-[10px] text-center text-muted-foreground/60 mt-3">你的真实数据将在测评后生成</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Dimensions */}
        {dimensions.length > 0 && (
          <motion.div {...fadeUp(enrichment ? 0.55 : 0.5)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 text-sm">📊 测评维度</h2>
                <div className="grid grid-cols-2 gap-2">
                  {dimensions.map((d: any, i: number) => (
                    <motion.div
                      key={d.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + i * 0.06, duration: 0.35 }}
                      className="flex items-center gap-2.5 p-2.5 bg-muted/40 rounded-xl border border-border/30 hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-xl">{d.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{d.label}</p>
                        {d.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">{d.description}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* AI vs Traditional (enrichment) */}
        {enrichment && (
          <motion.div {...fadeUp(0.6)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                  <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  {isMaleMidlifeVitality ? '这不是给你贴标签，而是帮你看清状态' : 'AI深度测评 vs 传统测试'}
                </h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">❌ {isMaleMidlifeVitality ? '让人紧张的测试' : '传统测试'}</p>
                    <p className="text-xs text-muted-foreground/70">{enrichment.comparison.traditional}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                    <p className="text-xs font-medium text-primary mb-1">✅ {isMaleMidlifeVitality ? '更适合你的评估' : template.title}</p>
                    <p className="text-xs text-muted-foreground">{enrichment.comparison.ours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div {...fadeUp(enrichment ? 0.65 : 0.6)}>
          <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
            <CardContent className="p-5">
              <h2 className="font-semibold text-foreground mb-3 text-sm">✨ 你将获得</h2>
              <div className="space-y-3">
                {(isMaleMidlifeVitality ? maleMidlifeBenefitItems : benefitItems).map(({ icon: Icon, text }, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.65 + i * 0.08, duration: 0.35 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{text}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(enrichment ? 0.75 : 0.7)} className="pt-2">
          <Button
            onClick={() => {
              if (requireAuth && !user) {
                toast.info("请先登录后开始测评");
                setPostAuthRedirect(window.location.pathname + window.location.search);
                navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                return;
              }
              needPay ? (onPayClick ?? onStart)() : onStart();
            }}
            className={cn(
              "w-full h-13 text-base gap-2 shadow-lg active:scale-[0.98] transition-transform",
              !needPay && template.assessment_key === 'sbti_personality' && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0"
            )}
            size="lg"
          >
            {needPay
              ? <>{`¥${price ?? '?'} 开始测评`} <ArrowRight className="w-5 h-5" /></>
              : isMaleMidlifeVitality
                ? <>🔥 限时免费开始评估 <ArrowRight className="w-5 h-5" /></>
              : template.assessment_key === 'sbti_personality'
                ? <>🔥 限时免费测评 <ArrowRight className="w-5 h-5" /></>
                : <>开始测评 <ArrowRight className="w-5 h-5" /></>
            }
          </Button>
          {needPay && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              测评结果永久保存 · 含AI深度解读
            </p>
          )}
          {!needPay && template.assessment_key === 'sbti_personality' && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              <span className="line-through opacity-60">原价 ¥9.9</span> · 限时免费开放
            </p>
          )}
          {!needPay && isMaleMidlifeVitality && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              <span className="line-through opacity-60">原价 ¥29.9</span> · 限时免费开放 · 测完生成 AI 私密报告
            </p>
          )}
        </motion.div>

        {hasHistory && onShowHistory ? (
          <motion.div {...fadeUp(0.8)}>
            <Button variant="outline" onClick={onShowHistory} className="w-full gap-2">
              <History className="w-4 h-4" /> 查看历史记录
            </Button>
          </motion.div>
        ) : !hasHistory && !requirePayment ? (
          <motion.div {...fadeUp(0.8)}>
            <p className="text-center text-xs text-muted-foreground">
              💡 <button
                onClick={() => { window.location.href = `/auth?returnUrl=${encodeURIComponent(window.location.pathname)}`; }}
                className="text-primary underline underline-offset-2"
              >登录</button> 后可保存测评记录
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
