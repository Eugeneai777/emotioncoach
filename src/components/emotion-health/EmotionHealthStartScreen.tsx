import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Heart, Brain, TrendingUp, Clock, Shield, Sparkles, ChevronRight, 
  Zap, Bot, ChevronDown, Activity, Target, Check, ArrowRight,
  Flame
} from "lucide-react";
import { ThreeLayerDiagram } from "./ThreeLayerDiagram";
import { 
  introStatistics, 
  authorityData,
  upgradedPainPoints, 
  comparisonWithTraditional, 
  patternConfig, 
  assessmentOutcomes,
  pricingIncludes,
  PatternType 
} from "./emotionHealthData";

interface EmotionHealthStartScreenProps {
  onStart: () => void;
  isLoading?: boolean;
}

// Icon mapping for outcomes
const outcomeIcons = {
  Activity: Activity,
  Brain: Brain,
  Target: Target,
  Bot: Bot,
};

const outcomeColors = {
  cyan: { text: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  purple: { text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  rose: { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
};

// 四大人格类型预览卡片（简化版）
function PatternPreviewGrid() {
  const patterns = Object.keys(patternConfig) as PatternType[];
  
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {patterns.map((key, index) => {
        const pattern = patternConfig[key];
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.08 }}
            className={`p-3 rounded-xl ${pattern.bgColor} border border-black/5`}
          >
            <div className="text-2xl mb-2">{pattern.emoji}</div>
            <div className="text-sm font-medium text-foreground mb-0.5">{pattern.name}</div>
            <div className="text-[10px] text-muted-foreground mb-2">{pattern.tagline}</div>
            <Badge variant="outline" className="text-[10px] h-5 bg-white/50">
              {pattern.targetAudience}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
}

// 四大模式详情可折叠卡片
function PatternDetailCard({ pattern }: { pattern: typeof patternConfig[PatternType] }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${pattern.bgColor} overflow-hidden`}>
        <CollapsibleTrigger asChild>
          <div className="p-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{pattern.emoji}</span>
                <div>
                  <div className="text-xs font-medium">{pattern.name}</div>
                  <div className="text-[10px] text-muted-foreground">{pattern.tagline} · {pattern.targetAudience}</div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-black/10 dark:border-white/10 pt-3">
            <p className="text-xs leading-relaxed text-foreground font-medium">
              "{pattern.headline}"
            </p>
            <ul className="space-y-1 pl-4">
              {pattern.symptoms.slice(0, 3).map((symptom, i) => (
                <li key={i} className="text-[10px] text-muted-foreground leading-relaxed list-disc">
                  {symptom}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-1.5 text-[10px]">
              <ChevronRight className="w-3 h-3 text-primary" />
              <span className="text-muted-foreground">推荐：</span>
              <span className="text-foreground font-medium">{pattern.recommendedCoachLabel}</span>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// 与传统量表对比卡片
function ComparisonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">与传统量表的本质区别</h3>
        </div>
        
        <div className="space-y-2">
          {comparisonWithTraditional.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 text-right">
                <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                  {item.traditional}
                </span>
              </div>
              <div className="w-6 flex justify-center">
                <ChevronRight className="w-3 h-3 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-primary">
                  {item.ours}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmotionHealthStartScreen({ onStart, isLoading }: EmotionHealthStartScreenProps) {
  return (
    <div className="space-y-4">
      {/* ===== 模块1：品牌 + 痛点开场 ===== */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <h1 className="text-lg font-bold">情绪健康测评</h1>
            </div>
            <p className="text-[10px] text-white/70">Powered by 有劲AI</p>
          </div>
          
          {/* 社交证明 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <Flame className="w-3 h-3 mr-1" />
              {introStatistics.totalAssessments.toLocaleString()} 人已找到答案
            </Badge>
          </motion.div>

          {/* 共鸣式提问 */}
          <div className="text-center space-y-2 mb-4">
            <p className="text-white/80 text-sm">你有没有这种感觉？</p>
            <motion.div 
              className="space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-lg">明明没什么大事</p>
              <p className="text-xl font-bold">
                就是 <span className="text-amber-200 animate-pulse">「怎么都提不起劲」</span>
              </p>
            </motion.div>
          </div>

          {/* 接纳式副文案 */}
          <motion.div 
            className="text-center text-white/90 text-sm space-y-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p>不是你不够努力</p>
            <p>是有个东西一直在 <span className="text-amber-200 font-medium">暗中消耗你的能量</span></p>
          </motion.div>
        </div>

        {/* 首屏CTA */}
        <CardContent className="p-4">
          <Button 
            size="lg" 
            className="w-full h-12 text-base bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
            onClick={onStart}
            disabled={isLoading}
          >
            {isLoading ? "加载中..." : "¥9.9 开始测评"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>约5-8分钟</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>结果仅自己可见</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 模块2：痛点共鸣区 ===== */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            这些感受是不是很熟悉？
          </h3>
          <div className="space-y-2">
            {upgradedPainPoints.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/50"
              >
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{item.text}</p>
              </motion.div>
            ))}
          </div>

          {/* 损失警告 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-4 p-3 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800"
          >
            <p className="text-xs text-red-600 dark:text-red-400 text-center leading-relaxed">
              如果不解决这些卡点，你可能会继续这样 <span className="font-bold">3-5年</span><br />
              反复陷入「内耗→自责→更内耗」的死循环
            </p>
          </motion.div>
        </CardContent>
      </Card>

      {/* ===== 模块3：权威背书区 ===== */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">研究数据显示</h3>
          <div className="grid gap-3">
            {authorityData.map((item, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start gap-3"
              >
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                      {item.stat}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{item.source}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== 模块4：AI对比传统 ===== */}
      <ComparisonCard />

      {/* ===== 模块5：四大人格类型预览 ===== */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            找到你的情绪反应模式
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            点击了解更多，看看哪个最像你
          </p>
          <div className="space-y-2">
            {(Object.keys(patternConfig) as PatternType[]).map((key) => (
              <PatternDetailCard key={key} pattern={patternConfig[key]} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== 模块6：三层洋葱模型 ===== */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-500" />
            三层诊断 · 层层深入
          </h3>
          <div className="flex flex-col items-center py-2">
            <ThreeLayerDiagram size={160} />
            <p className="text-xs text-muted-foreground text-center mt-3">
              由外向内 · 层层剥离 · 直达情绪卡点
            </p>
          </div>
          
          {/* 简化的三层说明 */}
          <div className="grid gap-2 mt-4">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-medium">第一层</span>
                <span className="text-muted-foreground ml-2">状态筛查（12题）</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-medium">第二层</span>
                <span className="text-muted-foreground ml-2">反应模式（16题）</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-medium">第三层</span>
                <span className="text-muted-foreground ml-2">行动路径（4题）</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== 模块7：价值交付区 ===== */}
      <Card className="bg-gradient-to-br from-indigo-50 via-violet-50 to-white dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-background border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            测评完成后，你将获得
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {assessmentOutcomes.map((item, idx) => {
              const IconComponent = outcomeIcons[item.icon as keyof typeof outcomeIcons];
              const colors = outcomeColors[item.color as keyof typeof outcomeColors];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08 }}
                  className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}
                >
                  <IconComponent className={`w-5 h-5 ${colors.text} mb-2`} />
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">{item.title}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== 模块8：定价模块 ===== */}
      <Card className="bg-gradient-to-br from-rose-50 via-pink-50 to-white dark:from-rose-900/20 dark:via-pink-900/20 dark:to-background border-rose-300 dark:border-rose-800">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-center mb-4">开启你的情绪修复之旅</h3>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl font-bold text-rose-600">¥9.9</span>
            <span className="px-2 py-0.5 bg-red-500 rounded text-xs text-white font-medium animate-pulse">限时</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {pricingIncludes.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <Button 
            size="lg" 
            className="w-full h-14 text-base bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
            onClick={onStart}
            disabled={isLoading}
          >
            {isLoading ? "加载中..." : "¥9.9 开始测评"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-center text-muted-foreground mt-3">
            共32道题目，请根据最近两周的真实感受作答
          </p>
        </CardContent>
      </Card>

      {/* ===== 模块9：合规声明 ===== */}
      <p className="text-[10px] text-muted-foreground text-center px-4 pb-[calc(20px+env(safe-area-inset-bottom))]">
        本测评为情绪状态与成长卡点觉察工具，不用于任何医学诊断或治疗判断。
        如你感到持续严重不适，建议联系专业心理机构。
      </p>
    </div>
  );
}
