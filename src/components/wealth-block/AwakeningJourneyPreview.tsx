import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Target, Sparkles, ArrowRight } from 'lucide-react';
import { getAwakeningColor } from '@/config/wealthStyleConfig';
import { cn } from '@/lib/utils';
import { fourPoorRichConfig, PoorTypeKey } from '@/config/fourPoorConfig';
import { useNavigate } from 'react-router-dom';

interface AwakeningJourneyPreviewProps {
  healthScore: number;
  dominantPoor?: PoorTypeKey;
  reactionPattern?: string;
  hasPurchased?: boolean;
  onPurchase?: () => void;
}

// 行为维度收获（按卡点类型）
const behaviorOutcomes: Record<string, string> = {
  mouth: '从"嘴穷"到"嘴富"，学会用丰盛语言表达自己的价值',
  hand: '从"手穷"到"手富"，建立给予-接收的自然流动感',
  eye: '从"眼穷"到"眼富"，打开感恩视角看见身边的富足',
  heart: '从"心穷"到"心富"，从受害者模式切换到创造者模式',
};

// 情绪维度收获（按反应模式）
const emotionOutcomes: Record<string, string> = {
  chase: '减少追逐式焦虑，建立与金钱的从容关系',
  avoid: '重建安全感，面对财富话题不再退缩',
  trauma: '调节神经系统，财富话题不再触发身心反应',
  harmony: '巩固情绪稳定，向丰盛型状态自然进化',
};

// 信念维度收获（按卡点类型）
const beliefOutcomes: Record<string, string> = {
  mouth: '植入"我值得被看见"的新信念，替换自我贬低程序',
  hand: '植入"给予即丰盛"的新信念，替换紧握匮乏程序',
  eye: '植入"我已拥有很多"的新信念，替换比较不足程序',
  heart: '植入"我有力量创造"的新信念，替换受害者程序',
};


// Pattern key normalization
const patternKeyMap: Record<string, string> = {
  chasing: 'chase', avoiding: 'avoid', freezing: 'trauma', pleasing: 'chase',
  chase: 'chase', avoid: 'avoid', trauma: 'trauma', harmony: 'harmony',
};

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
  dominantPoor,
  reactionPattern,
  hasPurchased,
  onPurchase,
}: AwakeningJourneyPreviewProps) {
  const navigate = useNavigate();
  // 觉醒起点 = 100 - 卡点分数
  const awakeningStart = 100 - healthScore;
  
  // 7天目标：起点 + 15~25（取中位数20）
  const day7Target = Math.min(awakeningStart + 20, 95);
  
  // 毕业目标：至少比7天目标高5分，且不低于85
  const graduateTarget = Math.max(day7Target + 5, 85);
  
  // 获取个性化卡点名称
  const poorConfig = dominantPoor ? fourPoorRichConfig[dominantPoor] : null;
  const poorName = poorConfig?.poorName || '财富卡点';

  // 获取匹配的见证
  const testimonial = dominantPoor ? testimonials[dominantPoor] : testimonials.mouth;

  // 生成个性化三维收获
  const poorKey = dominantPoor || 'mouth';
  const normalizedPattern = patternKeyMap[reactionPattern || ''] || 'harmony';
  const personalizedOutcomes = [
    { emoji: '🎯', label: '行为突破', text: behaviorOutcomes[poorKey] || behaviorOutcomes.mouth },
    { emoji: '💭', label: '情绪松绑', text: emotionOutcomes[normalizedPattern] || emotionOutcomes.harmony },
    { emoji: '💡', label: '信念升级', text: beliefOutcomes[poorKey] || beliefOutcomes.mouth },
  ];

  return (
    <motion.div
      initial={{ opacity: 0.01, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
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

          {/* 分隔线 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <span className="text-xs text-amber-500">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          </div>

          {/* 训练营概览 */}
          <div className="p-4 bg-white/70 dark:bg-white/10 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 xs:gap-2 mb-2">
              <span className="text-base font-bold text-foreground">财富觉醒训练营</span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full w-fit">
                7天 · 每天15分钟
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              不是教你快速赚钱，而是<span className="text-amber-600 dark:text-amber-400 font-medium">每天帮你看见卡住的位置</span>，陪你迈出一个不消耗自己的小进步。
            </p>
          </div>

          {/* 7天后的收获 - 个性化三维度 */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-sm text-foreground">✨ 7天后，你会得到：</h4>
            <div className="grid grid-cols-1 gap-2">
              {personalizedOutcomes.map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0.01, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.12 }}
                  style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                  className="flex items-start gap-2.5 p-2.5 bg-white/60 dark:bg-white/5 rounded-xl border border-white/50 dark:border-white/10"
                >
                  <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{item.label}</span>
                    <p className="text-sm text-foreground/80 leading-snug mt-0.5">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 简化的用户见证 */}
          <motion.div
            initial={{ opacity: 0.01 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="flex items-center gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg text-sm"
          >
            <span className="text-amber-500">📈</span>
            <span className="text-muted-foreground truncate flex-1">"{testimonial.quote.slice(0, 20)}..."</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{testimonial.growth}</span>
          </motion.div>

          {/* 双按钮 CTA 区域 */}
          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            {/* 了解详情按钮 */}
            <Button
              variant="outline"
              onClick={() => navigate('/wealth-camp-intro')}
              className="h-12 sm:flex-1 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 font-semibold text-sm"
            >
              了解详情
            </Button>
            
            {/* 购买/开始按钮 */}
            {hasPurchased ? (
              <Button
                onClick={onPurchase}
                className="h-12 sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 text-sm"
              >
                开始训练营
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={onPurchase}
                className="h-12 sm:flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 text-sm"
              >
                ¥299 立即加入
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
