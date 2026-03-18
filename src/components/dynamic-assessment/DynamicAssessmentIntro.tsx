import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Target, History, Sparkles, BarChart3, MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

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

// Enrichment content keyed by assessment_key
const enrichmentData: Record<string, {
  painPoints: { emoji: string; text: string }[];
  authority: { emoji: string; text: string }[];
  comparison: { traditional: string; ours: string };
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
  },
};

export function DynamicAssessmentIntro({ template, onStart, onShowHistory, hasHistory, requirePayment, hasPurchased, price, onPayClick }: DynamicAssessmentIntroProps) {
  const needPay = requirePayment && !hasPurchased;
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

        {/* Authority Data (enrichment) */}
        {enrichment && (
          <motion.div {...fadeUp(0.5)}>
            <Card className="border-border/40 bg-card/95 backdrop-blur-md shadow-lg">
              <CardContent className="p-5">
                <h2 className="font-semibold text-foreground mb-3 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  科学研究支撑
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
                  AI深度测评 vs 传统测试
                </h2>
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-1">❌ 传统职场测评</p>
                    <p className="text-xs text-muted-foreground/70">{enrichment.comparison.traditional}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                    <p className="text-xs font-medium text-primary mb-1">✅ {template.title}</p>
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
                {benefitItems.map(({ icon: Icon, text }, i) => (
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
            onClick={needPay ? (onPayClick ?? onStart) : onStart}
            className="w-full h-13 text-base gap-2 shadow-lg active:scale-[0.98] transition-transform"
            size="lg"
          >
            {needPay ? `¥${price ?? '?'} 开始测评` : '开始测评'} <ArrowRight className="w-5 h-5" />
          </Button>
          {needPay && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              测评结果永久保存 · 含AI深度解读
            </p>
          )}
        </motion.div>

        {hasHistory && onShowHistory && (
          <motion.div {...fadeUp(0.8)}>
            <Button variant="outline" onClick={onShowHistory} className="w-full gap-2">
              <History className="w-4 h-4" /> 查看历史记录
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
