import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain, Target, Compass, Zap, Shield, Bot, ChevronRight, Users, TrendingUp, BookOpen
} from "lucide-react";
import { personalityTypeConfig, dimensionConfig, type MidlifePersonalityType, type MidlifeDimension } from "./midlifeAwakeningData";
import { DimensionRadarChart } from "@/components/dynamic-assessment/DimensionRadarChart";

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0.01, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

interface MidlifeAwakeningStartScreenProps {
  onStart: () => void;
  onPayClick?: () => void;
  hasPurchased?: boolean;
  isLoading?: boolean;
  price?: number;
}

function PersonalityPreview() {
  const types = Object.keys(personalityTypeConfig) as MidlifePersonalityType[];
  return (
    <div className="grid grid-cols-2 gap-2">
      {types.map((key) => {
        const t = personalityTypeConfig[key];
        return (
          <div key={key} className={`p-3 rounded-xl ${t.bgColor} text-center`}>
            <span className="text-2xl block mb-1">{t.emoji}</span>
            <p className="text-xs font-semibold">{t.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t.feature}</p>
          </div>
        );
      })}
    </div>
  );
}

function DimensionPreview() {
  const dims = Object.keys(dimensionConfig) as MidlifeDimension[];
  return (
    <div className="grid grid-cols-3 gap-2">
      {dims.map((key) => {
        const d = dimensionConfig[key];
        return (
          <div key={key} className={`p-2 rounded-lg ${d.bgColor} text-center`}>
            <span className="text-lg block">{d.icon}</span>
            <p className="text-[10px] font-medium mt-1">{d.shortName}</p>
          </div>
        );
      })}
    </div>
  );
}

const painPoints = [
  { emoji: "🌀", text: "每天很忙，但不知道忙的意义是什么" },
  { emoji: "💎", text: "觉得自己还不够好，却说不清标准是谁定的" },
  { emoji: "⏳", text: "害怕10年后回头，发现一直在走别人的路" },
  { emoji: "🎭", text: "在家人面前演坚强，自己独处时却很空" },
  { emoji: "⚡", text: "有很多想法，但永远停在想的阶段" },
];

const authorityData = [
  { emoji: "📊", text: "哈佛成人发展研究：75年追踪发现，中年觉醒期是人生幸福感的关键转折点" },
  { emoji: "🧠", text: "心理学研究：35-55岁是'意义危机'高发期，超过68%的人经历过方向迷失" },
  { emoji: "🔄", text: "《中年的意义》研究：中年不是衰退，是重新定义人生主线的最佳窗口" },
];

export function MidlifeAwakeningStartScreen({ onStart, onPayClick, hasPurchased, isLoading, price }: MidlifeAwakeningStartScreenProps) {
  return (
    <div className="space-y-4 pb-8">
      {/* Hero */}
      <AnimatedSection>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-fuchsia-500 p-6 text-white text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <span className="text-5xl block mb-3">🧭</span>
            </motion.div>
            <h1 className="text-xl font-bold mb-1">中场觉醒力测评 3.0</h1>
            <p className="text-sm opacity-90">你不是迷惘，你只是卡在中场转弯处</p>
            {/* Social proof badge */}
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
              <span>2,847 人已完成测评</span>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex justify-around text-center py-2">
              <div>
                <p className="text-lg font-bold text-primary">6</p>
                <p className="text-[10px] text-muted-foreground">维度</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">30</p>
                <p className="text-[10px] text-muted-foreground">题目</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">4</p>
                <p className="text-[10px] text-muted-foreground">人格类型</p>
              </div>
              <div>
                <p className="text-lg font-bold text-primary">AI</p>
                <p className="text-[10px] text-muted-foreground">深度解读</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 痛点共鸣（强化版） */}
      <AnimatedSection delay={0.1}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-4 h-4 text-pink-500" />
              你是否正经历这些？
            </h3>
            <div className="space-y-2">
              {painPoints.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/30">
                  <span className="text-lg shrink-0">{item.emoji}</span>
                  <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 权威数据背书 */}
      <AnimatedSection delay={0.15}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              科学研究支撑
            </h3>
            <div className="space-y-2">
              {authorityData.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/40 dark:border-amber-500/10">
                  <span className="text-lg shrink-0">{item.emoji}</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 六大维度预览 + 雷达图 */}
      <AnimatedSection delay={0.2}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              6维深度扫描
            </h3>
            {/* 雷达图预览 */}
            <div className="mb-4">
              <p className="text-[10px] text-center text-muted-foreground mb-2">📊 报告示例预览</p>
              <div className="h-[220px]">
                <DimensionRadarChart dimensionScores={midlifeRadarPreviewData} />
              </div>
              <p className="text-[10px] text-center text-muted-foreground/60 mt-1">你的真实数据将在测评后生成</p>
            </div>
            <DimensionPreview />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 四种人格预览 */}
      <AnimatedSection delay={0.25}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-500" />
              你会是哪种中场人格？
            </h3>
            <PersonalityPreview />
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* AI vs 传统对比 */}
      <AnimatedSection delay={0.3}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              AI深度测评 vs 传统测试
            </h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-1">❌ 传统中年危机测试</p>
                <p className="text-xs text-muted-foreground/70">只告诉你"有没有危机" → 知道了又怎样</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/15">
                <p className="text-xs font-medium text-primary mb-1">✅ 中场觉醒力测评</p>
                <p className="text-xs text-muted-foreground">精准定位6个维度卡点 + AI教练1对1引导 → 知道怎么突破</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 三阶诊断流程 */}
      <AnimatedSection delay={0.35}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-fuchsia-500" />
              三阶诊断模型
            </h3>
            <div className="flex flex-col items-center gap-0">
              {diagnosticSteps.map((step, i) => (
                <div key={i} className="flex flex-col items-center w-full">
                  <div className={`w-full p-3 rounded-xl border ${step.borderColor} ${step.bgColor} flex items-center gap-3`}>
                    <div className={`w-10 h-10 rounded-full ${step.iconBg} flex items-center justify-center text-lg shrink-0`}>
                      {step.emoji}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                  {i < diagnosticSteps.length - 1 && (
                    <div className="w-0.5 h-6 bg-gradient-to-b from-pink-300 to-purple-400 dark:from-pink-500/40 dark:to-purple-500/40 rounded-full" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* 你将获得 */}
      <AnimatedSection delay={0.35}>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-500" />
              测评后你将获得
            </h3>
            <div className="space-y-2">
              {[
                { icon: <Target className="w-4 h-4 text-blue-500" />, text: '六维雷达图全景分析' },
                { icon: <Users className="w-4 h-4 text-purple-500" />, text: '中场人格类型报告' },
                { icon: <Bot className="w-4 h-4 text-pink-500" />, text: 'AI觉醒教练1对1对话' },
                { icon: <Shield className="w-4 h-4 text-emerald-500" />, text: '个性化突破方案推荐' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  {item.icon}
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection delay={0.4}>
        <div className="space-y-3 pt-2">
          <Button
            onClick={hasPurchased ? onStart : (onPayClick ?? onStart)}
            disabled={isLoading}
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-2xl shadow-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : hasPurchased ? (
              <>开始测评 <ChevronRight className="w-5 h-5 ml-1" /></>
            ) : (
              <>¥{price ?? '?'} 开始测评 <ChevronRight className="w-5 h-5 ml-1" /></>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            约5-8分钟完成 · 测评结果永久保存 · 含AI深度解读
          </p>
        </div>
      </AnimatedSection>
    </div>
  );
}
