import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight, Target, Eye, Heart, Brain, Sparkles } from 'lucide-react';
import { getAwakeningColor } from '@/config/wealthStyleConfig';

interface AwakeningJourneyPreviewProps {
  healthScore: number; // 卡点分数 (0-100)
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
}

export function AwakeningJourneyPreview({ 
  healthScore, 
  behaviorScore, 
  emotionScore, 
  beliefScore 
}: AwakeningJourneyPreviewProps) {
  // 觉醒起点 = 100 - 卡点分数
  const awakeningStart = 100 - healthScore;
  
  // 7天目标：起点 + 15~25（取中位数20）
  const day7Target = Math.min(awakeningStart + 20, 95);
  
  // 毕业目标：80+ 高度觉醒
  const graduateTarget = 80;
  
  // 三层星级计算 (0-50 -> 1-5星)
  const getStars = (score: number, max: number = 50) => {
    const awakening = 100 - (score / max * 100);
    return Math.round((awakening / 100) * 4 + 1);
  };
  
  const behaviorStars = getStars(behaviorScore);
  const emotionStars = getStars(emotionScore);
  const beliefStars = getStars(beliefScore);

  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < count ? 'text-amber-400' : 'text-muted/30'}>
        ⭐
      </span>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-rose-950/30">
        <CardContent className="p-4 space-y-4">
          {/* 头部 */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">📍 你的财富觉醒起点</h3>
              <p className="text-xs text-muted-foreground">这组数据将同步到财富日记，成为你的 Day 0</p>
            </div>
          </div>

          {/* 觉醒旅程：起点 → 7天 → 毕业 */}
          <div className="grid grid-cols-3 gap-2">
            {/* 起点 */}
            <div className="relative bg-white/60 dark:bg-white/10 rounded-xl p-3 text-center border-2 border-amber-300 dark:border-amber-600">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                现在
              </div>
              <div 
                className="text-2xl font-bold mt-1"
                style={{ color: getAwakeningColor(awakeningStart) }}
              >
                {awakeningStart}
              </div>
              <div className="text-xs text-muted-foreground">觉醒起点</div>
            </div>
            
            {/* 7天目标 */}
            <div className="relative bg-white/40 dark:bg-white/5 rounded-xl p-3 text-center">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                7天后
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <ArrowRight className="w-3 h-3 text-emerald-500" />
                <span 
                  className="text-2xl font-bold"
                  style={{ color: getAwakeningColor(day7Target) }}
                >
                  {day7Target}+
                </span>
              </div>
              <div className="text-xs text-muted-foreground">中期目标</div>
            </div>
            
            {/* 毕业目标 */}
            <div className="relative bg-white/40 dark:bg-white/5 rounded-xl p-3 text-center">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                持续觉醒
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Target className="w-3 h-3 text-violet-500" />
                <span 
                  className="text-2xl font-bold"
                  style={{ color: getAwakeningColor(graduateTarget) }}
                >
                  {graduateTarget}+
                </span>
              </div>
              <div className="text-xs text-muted-foreground">毕业目标</div>
            </div>
          </div>

          {/* 进度箭头装饰 */}
          <div className="flex items-center justify-center gap-2 -my-2">
            <div className="flex-1 h-0.5 bg-gradient-to-r from-amber-300 via-emerald-300 to-violet-300 rounded-full" />
          </div>

          {/* 三层基线对标 */}
          <div className="bg-white/70 dark:bg-white/10 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">三层基线（与日记同步）</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* 行为层 */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-amber-600">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs font-medium">行为</span>
                </div>
                <div className="flex justify-center gap-0.5 text-[10px]">
                  {renderStars(behaviorStars)}
                </div>
              </div>
              
              {/* 情绪层 */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-pink-600">
                  <Heart className="w-3 h-3" />
                  <span className="text-xs font-medium">情绪</span>
                </div>
                <div className="flex justify-center gap-0.5 text-[10px]">
                  {renderStars(emotionStars)}
                </div>
              </div>
              
              {/* 信念层 */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-violet-600">
                  <Brain className="w-3 h-3" />
                  <span className="text-xs font-medium">信念</span>
                </div>
                <div className="flex justify-center gap-0.5 text-[10px]">
                  {renderStars(beliefStars)}
                </div>
              </div>
            </div>
          </div>

          {/* 公式说明 */}
          <div className="text-center p-2 bg-white/50 dark:bg-white/5 rounded-lg">
            <p className="text-[11px] text-muted-foreground">
              💡 觉醒起点 = 100 - 卡点分数（{healthScore}）= <span className="font-bold text-amber-600">{awakeningStart}</span>
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">
              分数越高代表财富意识越觉醒，7天训练营帮你突破卡点
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
