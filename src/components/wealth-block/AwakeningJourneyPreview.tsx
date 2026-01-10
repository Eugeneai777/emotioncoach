import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ArrowRight, Target, Eye, Heart, Brain } from 'lucide-react';
import { getAwakeningColor } from '@/config/wealthStyleConfig';
import { cn } from '@/lib/utils';

interface AwakeningJourneyPreviewProps {
  healthScore: number;
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
  
  // 三层觉醒百分比计算 (0-50分 -> 0-100%觉醒)
  const getAwakeningPercent = (score: number, max: number = 50) => {
    return Math.round(100 - (score / max * 100));
  };
  
  const behaviorAwakening = getAwakeningPercent(behaviorScore);
  const emotionAwakening = getAwakeningPercent(emotionScore);
  const beliefAwakening = getAwakeningPercent(beliefScore);

  const layers = [
    { name: '行为', icon: Eye, color: 'bg-amber-500', bgColor: 'bg-amber-100', value: behaviorAwakening },
    { name: '情绪', icon: Heart, color: 'bg-pink-500', bgColor: 'bg-pink-100', value: emotionAwakening },
    { name: '信念', icon: Brain, color: 'bg-violet-500', bgColor: 'bg-violet-100', value: beliefAwakening },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/10">
        <CardContent className="p-4 space-y-4">
          {/* 头部 - 简化 */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <MapPin className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-foreground text-sm">📍 你的财富觉醒起点</h3>
          </div>

          {/* 觉醒旅程：起点突出 + 目标虚化 */}
          <div className="flex items-center gap-3">
            {/* 起点 - 突出强调 */}
            <motion.div 
              className="relative flex-1 bg-white dark:bg-white/10 rounded-2xl p-4 text-center border-2 border-amber-400 dark:border-amber-500 shadow-lg"
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0)', '0 0 0 8px rgba(251, 191, 36, 0.15)', '0 0 0 0 rgba(251, 191, 36, 0)']
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow">
                现在
              </div>
              <motion.div 
                className="text-4xl font-bold tabular-nums"
                style={{ color: getAwakeningColor(awakeningStart) }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                {awakeningStart}
              </motion.div>
              <div className="text-xs text-muted-foreground font-medium">觉醒起点</div>
            </motion.div>
            
            {/* 箭头 */}
            <ArrowRight className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
            
            {/* 7天目标 - 虚化 */}
            <div className="relative bg-white/40 dark:bg-white/5 rounded-xl p-3 text-center border border-dashed border-emerald-300 dark:border-emerald-600/50">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500/80 text-white text-[9px] font-medium rounded-full">
                7天后
              </div>
              <div className="text-xl font-bold text-emerald-600/80 mt-1">{day7Target}+</div>
              <div className="text-[10px] text-muted-foreground/70">目标</div>
            </div>
            
            {/* 毕业目标 - 更虚化 */}
            <div className="relative bg-white/30 dark:bg-white/5 rounded-xl p-3 text-center border border-dashed border-violet-300/60 dark:border-violet-600/30">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-violet-500/60 text-white text-[9px] font-medium rounded-full whitespace-nowrap">
                毕业
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Target className="w-3 h-3 text-violet-400" />
                <span className="text-lg font-bold text-violet-500/70">{graduateTarget}+</span>
              </div>
              <div className="text-[10px] text-muted-foreground/60">高觉醒</div>
            </div>
          </div>

          {/* 三层基线 - 进度条简洁版 */}
          <div className="space-y-2">
            {layers.map((layer) => (
              <div key={layer.name} className="flex items-center gap-2">
                <div className={cn("p-1 rounded", layer.bgColor, "dark:bg-opacity-30")}>
                  <layer.icon className="w-3 h-3 text-foreground/70" />
                </div>
                <span className="text-xs text-muted-foreground w-8">{layer.name}</span>
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", layer.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${layer.value}%` }}
                    transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground/70 w-8 text-right">{layer.value}%</span>
              </div>
            ))}
          </div>

          {/* 底部提示 - 极简 */}
          <p className="text-[10px] text-muted-foreground/70 text-center">
            💡 分数越高=觉醒越深，7天训练营助你突破卡点
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
