import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Target, Eye, Heart, Brain, Sparkles, MessageCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { getAwakeningColor } from '@/config/wealthStyleConfig';
import { cn } from '@/lib/utils';
import { fourPoorRichConfig, PoorTypeKey } from '@/config/fourPoorConfig';

interface AwakeningJourneyPreviewProps {
  healthScore: number;
  behaviorScore: number;
  emotionScore: number;
  beliefScore: number;
  dominantPoor?: PoorTypeKey;
  hasPurchased?: boolean;
  onPurchase?: () => void;
}

// 训练营价值点配置
const campValuePoints = [
  {
    icon: Sparkles,
    title: '每日冥想',
    description: '5分钟觉察情绪根源',
    color: 'bg-violet-500',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  {
    icon: MessageCircle,
    title: '1v1 教练对话',
    description: '针对你的卡点定制突破',
    color: 'bg-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    icon: CheckCircle,
    title: '行动打卡',
    description: '小步突破，AI见证蜕变',
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
];

// 用户见证数据（按卡点类型匹配）
const testimonials: Record<PoorTypeKey, { quote: string; name: string; growth: string }> = {
  mouth: {
    quote: '终于敢主动谈价格了，不再觉得开口要钱很丢人',
    name: '小米',
    growth: '+28',
  },
  hand: {
    quote: '从舍不得花钱到懂得投资自己，心态完全不一样了',
    name: '阿杰',
    growth: '+35',
  },
  eye: {
    quote: '开始看到别人的价值，人际关系明显变好了',
    name: '晓晓',
    growth: '+32',
  },
  heart: {
    quote: '不再觉得自己是受害者，找到了内心的力量',
    name: '小雨',
    growth: '+30',
  },
};

export function AwakeningJourneyPreview({ 
  healthScore, 
  behaviorScore, 
  emotionScore, 
  beliefScore,
  dominantPoor,
  hasPurchased,
  onPurchase,
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

  // 获取个性化卡点名称
  const poorConfig = dominantPoor ? fourPoorRichConfig[dominantPoor] : null;
  const poorName = poorConfig?.poorName || '财富卡点';

  // 获取匹配的见证
  const testimonial = dominantPoor ? testimonials[dominantPoor] : testimonials.mouth;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/40 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/10">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* 头部 */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/50">
              <MapPin className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base sm:text-lg">📍 你的财富觉醒起点</h3>
              <p className="text-xs text-muted-foreground mt-0.5">测评已为你定位起点</p>
            </div>
          </div>

          {/* 觉醒旅程：移动端两行布局 */}
          <div className="space-y-3">
            {/* 第一行：突出起点 */}
            <motion.div 
              className="relative bg-white dark:bg-white/10 rounded-2xl p-5 sm:p-6 text-center border-2 border-amber-400 dark:border-amber-500 shadow-lg"
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0)', '0 0 0 10px rgba(251, 191, 36, 0.15)', '0 0 0 0 rgba(251, 191, 36, 0)']
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-full shadow whitespace-nowrap">
                🎯 现在 · Day 0
              </div>
              <motion.div 
                className="text-5xl sm:text-6xl font-bold tabular-nums mt-2"
                style={{ color: getAwakeningColor(awakeningStart) }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.03, 1],
                  opacity: 1,
                  textShadow: [
                    '0 0 0px rgba(251, 191, 36, 0)',
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                    '0 0 0px rgba(251, 191, 36, 0)'
                  ]
                }}
                transition={{ 
                  scale: { delay: 0.3, duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                  textShadow: { delay: 0.3, duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
                  opacity: { delay: 0.3, duration: 0.5 }
                }}
              >
                {awakeningStart}
              </motion.div>
              <div className="text-base text-muted-foreground font-semibold mt-2">你的觉醒起点</div>
            </motion.div>
            
            {/* 第二行：目标并排 */}
            <div className="flex items-stretch gap-3">
              {/* 7天目标 */}
              <div className="relative flex-1 bg-white/50 dark:bg-white/5 rounded-xl p-4 text-center border border-dashed border-emerald-400 dark:border-emerald-600/50">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500/80 text-white text-xs font-medium rounded-full whitespace-nowrap">
                  7天后
                </div>
                <div className="text-2xl font-bold text-emerald-600/80 mt-2">{day7Target}+</div>
                <div className="text-sm text-muted-foreground/70 mt-1">短期目标</div>
              </div>
              
              {/* 毕业目标 */}
              <div className="relative flex-1 bg-white/40 dark:bg-white/5 rounded-xl p-4 text-center border border-dashed border-violet-400/60 dark:border-violet-600/30">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-500/70 text-white text-xs font-medium rounded-full whitespace-nowrap">
                  毕业
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  <span className="text-2xl font-bold text-violet-500/70">{graduateTarget}+</span>
                </div>
                <div className="text-sm text-muted-foreground/60 mt-1">高觉醒</div>
              </div>
            </div>
          </div>

          {/* 三层基线 - 进度条 */}
          <div className="space-y-3">
            {layers.map((layer) => (
              <div key={layer.name} className="flex items-center gap-2.5">
                <div className={cn("p-1.5 rounded-lg", layer.bgColor, "dark:bg-opacity-30")}>
                  <layer.icon className="w-4 h-4 text-foreground/70" />
                </div>
                <span className="text-sm font-medium text-muted-foreground w-10">{layer.name}</span>
                <div className="flex-1 h-2.5 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", layer.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${layer.value}%` }}
                    transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground/70 w-12 text-right">{layer.value}%</span>
              </div>
            ))}
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <span className="text-xs text-amber-500">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          </div>

          {/* 训练营价值说明 */}
          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              💡 训练营如何帮你突破「{poorName}」？
            </h4>
            
            {/* 三项核心价值 */}
            <div className="grid grid-cols-1 gap-2.5">
              {campValuePoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-white/50 dark:border-white/10"
                >
                  <div className={cn("p-2 rounded-lg", point.bgColor)}>
                    <point.icon className={cn("w-4 h-4 text-white", point.color.replace('bg-', 'text-').replace('-500', '-600'))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{point.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {index === 1 && dominantPoor 
                        ? `针对你的「${poorName}」定制突破`
                        : point.description
                      }
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 用户见证 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200/50 dark:border-amber-700/30"
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">📈</span>
              <div className="flex-1">
                <p className="text-sm text-foreground/90 leading-relaxed">
                  "{testimonial.quote}"
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  — {testimonial.name}，7天觉醒 <span className="font-semibold text-emerald-600">{testimonial.growth}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA 按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            {hasPurchased ? (
              <Button
                onClick={onPurchase}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-amber-500/25"
              >
                开始训练营
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={onPurchase}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-lg shadow-amber-500/25"
              >
                <span className="mr-2">¥299</span>
                开始7天突破之旅
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
