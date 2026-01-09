import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Database, Heart, Sparkles, ShoppingCart, GraduationCap, Check, X, ArrowRight, TrendingUp, Users, Zap, Camera, Target, Loader2 } from "lucide-react";

interface AIInsightData {
  rootCauseAnalysis: string;
  combinedPatternInsight: string;
  breakthroughPath: string[];
  avoidPitfalls: string[];
  firstStep: string;
  encouragement: string;
  mirrorStatement?: string;
  coreStuckPoint?: string;
  unlockKey?: string;
}

interface CampConversionCardProps {
  hasPurchased: boolean;
  onPurchase: () => void;
  onStart: () => void;
  onViewDetails: () => void;
  aiInsight?: AIInsightData | null;
  isLoadingAI?: boolean;
}

const trilogy = [
  {
    icon: Clock,
    name: "成长追踪",
    englishName: "Growth Tracking",
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
    description: "21天持续追踪你的变化轨迹",
    detail: "每日行为数据化记录"
  },
  {
    icon: Database,
    name: "画像对比",
    englishName: "Profile Comparison",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    borderColor: "border-cyan-200",
    description: "Day 1 vs Day 21 活画像",
    detail: "见证你的真实蜕变"
  },
  {
    icon: Heart,
    name: "AI见证",
    englishName: "AI Witnessing",
    color: "from-rose-500 to-pink-500",
    bgColor: "bg-gradient-to-br from-rose-50 to-pink-50",
    borderColor: "border-rose-200",
    description: "每次蜕变都被看见和命名",
    detail: "嘴穷→嘴富，AI为你喝彩"
  }
];

const comparisonItems = [
  { 
    icon: TrendingUp,
    without: "信息会遗忘，行动难持续",
    with: "21天持续追踪，建立新习惯"
  },
  {
    icon: Users,
    without: "缺少反馈，不知是否进步",
    with: "每天教练对话，实时调整"
  },
  {
    icon: Zap,
    without: "孤军奋战，容易放弃",
    with: "AI见证蜕变，为你命名"
  }
];

const campFeatures = [
  "21天财富教练1对1对话",
  "每日个性化行动推荐",
  "活画像实时更新",
  "行为蜕变命名系统"
];

export function CampConversionCard({ 
  hasPurchased, 
  onPurchase, 
  onStart, 
  onViewDetails,
  aiInsight,
  isLoadingAI
}: CampConversionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl">
        {/* Header with animated gradient */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-20 h-20 bg-white/30 rounded-full blur-xl"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 40}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-6 h-6" />
              </motion.div>
              <span className="font-bold text-xl">这份报告只是开始</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              你刚刚获得的是 <span className="font-semibold bg-white/20 px-1.5 py-0.5 rounded">Day 0 快照</span>——你此刻的财富心理状态。<br/>
              但真正的改变，需要<span className="font-semibold">持续的觉察与练习</span>。
            </p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Day 0 活画像说明 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 rounded-2xl border border-amber-200/50 overflow-hidden"
          >
            <div className="absolute top-2 right-2">
              <Camera className="w-8 h-8 text-amber-300" />
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm mb-1">活画像 · Day 0 基准线</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  今天的测评结果将成为你「活画像」的起点。加入训练营后，<span className="text-amber-600 font-medium">每天的对话都会更新你的画像</span>，21天后你将清晰看见自己的成长轨迹。
                </p>
              </div>
            </div>
          </motion.div>

          {/* AI 专属诊断摘要 - 融入训练营转化 */}
          {isLoadingAI && (
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
              <div className="flex items-center justify-center gap-2 text-violet-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI正在分析你的专属突破路径...</span>
              </div>
            </div>
          )}
          
          {aiInsight && !isLoadingAI && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200"
            >
              {/* 镜像陈述 */}
              {aiInsight.mirrorStatement && (
                <p className="text-sm text-violet-800 font-medium mb-3 leading-relaxed italic">
                  "{aiInsight.mirrorStatement}"
                </p>
              )}
              
              {/* 3步突破路径 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-violet-700 flex items-center gap-1">
                  <Target className="w-3 h-3" /> 你的3步突破路径
                </p>
                {aiInsight.breakthroughPath.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-violet-700">
                    <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              
              {/* 过渡文案 */}
              <p className="mt-3 text-xs text-center text-violet-600 font-medium">
                👇 训练营将带你一步步实现这个路径
              </p>
            </motion.div>
          )}

          {/* 训练营核心价值 - 简化版 */}
          <div className="p-4 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl border border-border/50">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
              ✨ 21天训练营带给你
            </p>
            <div className="grid grid-cols-2 gap-3">
              {trilogy.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${item.color}`}>
                    <item.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">行为蜕变</p>
                  <p className="text-[10px] text-muted-foreground">嘴穷→嘴富，AI为你命名</p>
                </div>
              </div>
            </div>
          </div>

          {/* 价格和CTA - 增强版 */}
          <div className="text-center space-y-4 pt-2">
            {/* 价格展示 */}
            <div className="relative">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-lg text-muted-foreground line-through">¥399</span>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                  ¥299
                </span>
              </div>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block mt-1"
              >
                <span className="text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1 rounded-full shadow-lg">
                  🔥 限时特惠 省100元
                </span>
              </motion.div>
            </div>
            
            {/* CTA按钮 */}
            {hasPurchased ? (
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl h-14 text-lg font-bold rounded-xl"
                onClick={onStart}
              >
                <GraduationCap className="w-6 h-6 mr-2" />
                开始21天训练营
              </Button>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl blur-lg opacity-50" />
                <Button 
                  className="relative w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-2xl h-16 text-xl font-bold rounded-xl"
                  onClick={onPurchase}
                >
                  <ShoppingCart className="w-6 h-6 mr-2" />
                  ¥299 立即开始蜕变
                </Button>
              </motion.div>
            )}
            
            {/* 社会证明 */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                已有 2,847 人完成训练
              </span>
              <span>•</span>
              <span>好评率 98%</span>
            </div>
            
            <Button 
              variant="ghost" 
              className="text-muted-foreground text-sm hover:text-foreground"
              onClick={onViewDetails}
            >
              查看训练营完整介绍 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}