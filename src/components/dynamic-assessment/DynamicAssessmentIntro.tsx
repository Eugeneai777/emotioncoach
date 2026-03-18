import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Target, CheckCircle, History, Sparkles, BarChart3, MessageSquare } from "lucide-react";
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

export function DynamicAssessmentIntro({ template, onStart, onShowHistory, hasHistory, requirePayment, hasPurchased, price, onPayClick }: DynamicAssessmentIntroProps) {
  const needPay = requirePayment && !hasPurchased;
  const dimensions = template.dimensions || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className={`bg-gradient-to-br ${template.gradient} relative overflow-hidden`}>
        {/* Decorative circles */}
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

          {/* Quick stats pills */}
          <motion.div {...fadeUp(0.35)} className="flex items-center justify-center gap-3 mt-5">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-white text-xs sm:text-sm">
              <Target className="w-3.5 h-3.5" />
              <span>{template.question_count} 题</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3.5 py-1.5 text-white text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5" />
              <span>约 {Math.ceil(template.question_count / 5)} 分钟</span>
            </div>
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

        {/* Dimensions */}
        {dimensions.length > 0 && (
          <motion.div {...fadeUp(0.5)}>
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

        {/* Benefits */}
        <motion.div {...fadeUp(0.6)}>
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
        <motion.div {...fadeUp(0.75)} className="pt-2">
          <Button
            onClick={needPay ? (onPayClick ?? onStart) : onStart}
            className="w-full h-13 text-base gap-2 shadow-lg active:scale-[0.98] transition-transform"
            size="lg"
          >
            {needPay ? `¥${price ?? '?'} 开始测评` : '开始测评'} <ArrowRight className="w-5 h-5" />
          </Button>
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
