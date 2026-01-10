import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Database, Heart, Sparkles, ShoppingCart, GraduationCap, Check, X, ArrowRight, TrendingUp, Users, Zap, Camera, Target, Loader2 } from "lucide-react";

// 倒计时 Hook
function useCountdown(targetMinutes: number = 30) {
  const [timeLeft, setTimeLeft] = useState(() => {
    // 从 sessionStorage 读取或初始化
    const saved = sessionStorage.getItem('camp_countdown_end');
    if (saved) {
      const endTime = parseInt(saved, 10);
      const remaining = Math.max(0, endTime - Date.now());
      return Math.floor(remaining / 1000);
    }
    // 首次访问，设置倒计时结束时间
    const endTime = Date.now() + targetMinutes * 60 * 1000;
    sessionStorage.setItem('camp_countdown_end', endTime.toString());
    return targetMinutes * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  return { minutes, seconds, isExpired: timeLeft <= 0 };
}

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
    description: "7天持续追踪你的变化轨迹",
    detail: "每日行为数据化记录"
  },
  {
    icon: Database,
    name: "画像对比",
    englishName: "Profile Comparison",
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
    borderColor: "border-cyan-200",
    description: "Day 1 vs Day 7 活画像",
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
    with: "7天持续追踪，建立新习惯"
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
  "7天财富教练1对1对话",
  "每日个性化行动推荐",
  "活画像实时更新",
  "行为蜕变命名系统"
];

// 价格区域组件（包含倒计时）
function PricingSection({ 
  hasPurchased, 
  onPurchase, 
  onStart, 
  onViewDetails 
}: { 
  hasPurchased: boolean; 
  onPurchase: () => void; 
  onStart: () => void; 
  onViewDetails: () => void;
}) {
  const { minutes, seconds, isExpired } = useCountdown(30);
  
  return (
    <div className="text-center space-y-2 pt-2">
      {/* 价格展示 - 一行式 */}
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-sm text-muted-foreground">
          原价 <span className="line-through">¥399</span>
        </span>
        <span className="text-2xl font-bold text-amber-600">¥299</span>
        <span className="text-xs text-muted-foreground">省¥100</span>
      </div>
      
      {/* 微妙倒计时 - 仅在未过期时显示 */}
      {!isExpired && !hasPurchased && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>优惠剩余</span>
          <span className="font-mono tabular-nums text-amber-600 font-medium">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      )}
      
      {/* CTA按钮 - 简洁版 */}
      {hasPurchased ? (
        <Button 
          className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 text-base font-semibold rounded-lg"
          onClick={onStart}
        >
          开始财富觉醒训练营
        </Button>
      ) : (
        <Button 
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg h-12 text-base font-semibold rounded-lg"
          onClick={onPurchase}
        >
          ¥299 立即加入
        </Button>
      )}
      
      {/* 社会证明 - 极简 */}
      <p className="text-xs text-muted-foreground">2,847人已参与</p>
      
      <Button 
        variant="ghost" 
        className="text-muted-foreground text-xs hover:text-foreground"
        onClick={onViewDetails}
      >
        查看完整介绍 <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}

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
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-4 text-white overflow-hidden">
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

        <div className="p-4 space-y-4">
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
                  今天的测评结果将成为你「活画像」的起点。加入训练营后，<span className="text-amber-600 font-medium">每天的对话都会更新你的画像</span>，7天后你将清晰看见自己的成长轨迹。
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
              ✨ 财富觉醒训练营带给你
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

          {/* 价格和CTA - 简化版 */}
          <PricingSection 
            hasPurchased={hasPurchased}
            onPurchase={onPurchase}
            onStart={onStart}
            onViewDetails={onViewDetails}
          />
        </div>
      </Card>
    </motion.div>
  );
}