import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, MessageCircle, Sparkles, TrendingUp, Clock, Target, ArrowRight } from "lucide-react";
import { fourPoorInfo, emotionBlockInfo, beliefBlockInfo, FourPoorType, EmotionBlockType, BeliefBlockType } from "./wealthBlockData";

interface CampPersonalizedCardProps {
  dominantPoor: FourPoorType;
  dominantEmotion: EmotionBlockType;
  dominantBelief: BeliefBlockType;
  healthScore: number;
  onPurchase: () => void;
  onViewDetails: () => void;
  hasPurchased?: boolean;
}

// 基于诊断结果生成个性化标题
const getPersonalizedTitle = (dominantPoor: FourPoorType, healthScore: number): string => {
  const poorInfo = fourPoorInfo[dominantPoor];
  
  if (healthScore <= 40) {
    return `你的财富能量很健康！训练营帮你更进一步`;
  } else if (healthScore <= 70) {
    return `你的「${poorInfo.name}」模式，21天可以这样突破 ↓`;
  } else {
    return `别担心，你的「${poorInfo.name}」卡点，我们一起化解 ↓`;
  }
};

// 每日训练流程
const dailyFlow = [
  { icon: Brain, label: "冥想", time: "5min", color: "from-purple-500 to-violet-500" },
  { icon: MessageCircle, label: "教练对话", time: "5min", color: "from-amber-500 to-orange-500" },
  { icon: TrendingUp, label: "行动打卡", time: "1句话", color: "from-teal-500 to-emerald-500" },
];

// 用户见证
const testimonials = [
  { name: "小米", tag: "嘴穷→嘴富", quote: "终于敢主动谈价格了", days: 7, score: "+32" },
  { name: "阿杰", tag: "手穷→手富", quote: "开始主动投资自己了", days: 14, score: "+45" },
  { name: "晓雯", tag: "心穷→心富", quote: "不再觉得自己不配", days: 21, score: "+58" },
];

export function CampPersonalizedCard({
  dominantPoor,
  dominantEmotion,
  dominantBelief,
  healthScore,
  onPurchase,
  onViewDetails,
  hasPurchased
}: CampPersonalizedCardProps) {
  const poorInfo = fourPoorInfo[dominantPoor];
  const emotionInfo = emotionBlockInfo[dominantEmotion];
  const beliefInfo = beliefBlockInfo[dominantBelief];
  
  const personalizedTitle = getPersonalizedTitle(dominantPoor, healthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        {/* 个性化标题区 */}
        <div className="p-4 border-b border-amber-200/50">
          <div className="flex items-start gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-xs text-amber-600 font-medium mb-1">🎯 针对你的诊断结果</p>
              <h3 className="text-base font-bold text-foreground leading-snug">
                {personalizedTitle}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* 卡点 → 训练对应表 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" /> 你的卡点 → 训练营解法
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-amber-100/80 rounded-xl text-center">
                <span className="text-lg">{poorInfo.emoji}</span>
                <p className="text-[10px] font-medium text-amber-700 mt-1">{poorInfo.name}</p>
                <p className="text-[9px] text-amber-600/80">行为转化</p>
              </div>
              <div className="p-2.5 bg-pink-100/80 rounded-xl text-center">
                <span className="text-lg">{emotionInfo.emoji}</span>
                <p className="text-[10px] font-medium text-pink-700 mt-1">{emotionInfo.name}</p>
                <p className="text-[9px] text-pink-600/80">情绪觉察</p>
              </div>
              <div className="p-2.5 bg-violet-100/80 rounded-xl text-center">
                <span className="text-lg">{beliefInfo.emoji}</span>
                <p className="text-[10px] font-medium text-violet-700 mt-1">{beliefInfo.name}</p>
                <p className="text-[9px] text-violet-600/80">信念重塑</p>
              </div>
            </div>
          </div>

          {/* 价值密度数据 */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-white/80 rounded-xl text-center shadow-sm">
              <p className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">21</p>
              <p className="text-[10px] text-muted-foreground">天集中突破</p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl text-center shadow-sm">
              <p className="text-xl font-bold bg-gradient-to-r from-purple-500 to-violet-500 bg-clip-text text-transparent">15</p>
              <p className="text-[10px] text-muted-foreground">分钟/天</p>
            </div>
            <div className="p-3 bg-white/80 rounded-xl text-center shadow-sm">
              <p className="text-xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">1v1</p>
              <p className="text-[10px] text-muted-foreground">AI教练</p>
            </div>
          </div>

          {/* 每日训练流程 */}
          <div className="p-3 bg-white/60 rounded-xl">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 每日15分钟训练流程
            </p>
            <div className="flex items-center justify-between">
              {dailyFlow.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} shadow-sm`}>
                      <step.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[10px] font-medium text-foreground">{step.label}</p>
                    <p className="text-[9px] text-muted-foreground">{step.time}</p>
                  </div>
                  {idx < dailyFlow.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 用户见证轮播 */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">💬 学员真实反馈</p>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-2 w-max">
                {testimonials.map((t, idx) => (
                  <div
                    key={idx}
                    className="w-[140px] p-2.5 bg-white/80 rounded-xl border border-amber-200/50 flex-shrink-0"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-[10px] text-white font-medium">
                        {t.name[0]}
                      </div>
                      <span className="text-[10px] font-medium text-foreground">{t.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full ml-auto">
                        {t.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">"{t.quote}"</p>
                    <div className="flex items-center justify-between mt-1.5 text-[9px]">
                      <span className="text-muted-foreground">Day {t.days}</span>
                      <span className="text-emerald-600 font-medium">觉醒 {t.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA区 */}
          <div className="pt-2 space-y-2">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-sm text-muted-foreground line-through">¥399</span>
              <span className="text-2xl font-bold text-amber-600">¥299</span>
              <span className="text-xs text-muted-foreground">省¥100</span>
            </div>
            
            {!hasPurchased && (
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg h-11 text-base font-semibold"
                onClick={onPurchase}
              >
                ¥299 立即加入训练营
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              className="w-full text-muted-foreground text-xs"
              onClick={onViewDetails}
            >
              查看完整训练营介绍 <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            
            <p className="text-center text-[10px] text-muted-foreground">2,847人已参与 · 7天无效全额退款</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
