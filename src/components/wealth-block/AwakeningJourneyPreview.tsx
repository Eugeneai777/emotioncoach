import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Check } from 'lucide-react';
import { getAwakeningColor, getAwakeningZone } from '@/config/wealthStyleConfig';
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

const behaviorOutcomes: Record<string, string> = {
  mouth: '从"嘴穷"到"嘴富"，学会用丰盛语言表达自己的价值',
  hand: '从"手穷"到"手富"，建立给予-接收的自然流动感',
  eye: '从"眼穷"到"眼富"，打开感恩视角看见身边的富足',
  heart: '从"心穷"到"心富"，从受害者模式切换到创造者模式',
};

const emotionOutcomes: Record<string, string> = {
  chase: '减少追逐式焦虑，建立与金钱的从容关系',
  avoid: '重建安全感，面对财富话题不再退缩',
  trauma: '调节神经系统，财富话题不再触发身心反应',
  harmony: '巩固情绪稳定，向丰盛型状态自然进化',
};

const beliefOutcomes: Record<string, string> = {
  mouth: '植入"我值得被看见"的新信念，替换自我贬低程序',
  hand: '植入"给予即丰盛"的新信念，替换紧握匮乏程序',
  eye: '植入"我已拥有很多"的新信念，替换比较不足程序',
  heart: '植入"我有力量创造"的新信念，替换受害者程序',
};

const patternKeyMap: Record<string, string> = {
  chasing: 'chase', avoiding: 'avoid', freezing: 'trauma', pleasing: 'chase',
  chase: 'chase', avoid: 'avoid', trauma: 'trauma', harmony: 'harmony',
};

const valueItems = [
  { text: '7天AI教练1对1对话', value: '¥700+' },
  { text: '每日定制冥想音频', value: '' },
  { text: '个性化财富简报', value: '' },
  { text: '成长轨迹全记录', value: '' },
  { text: '专属觉醒画像对比', value: '' },
];

export function AwakeningJourneyPreview({ 
  healthScore, 
  dominantPoor,
  reactionPattern,
  hasPurchased,
  onPurchase,
}: AwakeningJourneyPreviewProps) {
  const navigate = useNavigate();
  const awakeningStart = 100 - healthScore;
  const day7Target = Math.min(awakeningStart + 20, 95);
  
  const poorConfig = dominantPoor ? fourPoorRichConfig[dominantPoor] : null;

  const currentZone = getAwakeningZone(awakeningStart);
  const targetZone = getAwakeningZone(day7Target);
  const day7ValueDesc = currentZone.label !== targetZone.label
    ? `从"${currentZone.label}"突破到"${targetZone.label}"`
    : `巩固"${targetZone.label}"状态`;
  const painPointText = poorConfig
    ? `你的「${poorConfig.poorName}」模式正在消耗你的财富能量`
    : '你的财富卡点正在消耗你的能量';

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
        <CardContent className="p-4 sm:p-6 space-y-5">
          
          {/* 1. 标题区 — 制造紧迫感 */}
          <div className="text-center space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
              你的觉醒刚开始，<br/>别让它停在这里
            </h3>
            <p className="text-base text-amber-700 dark:text-amber-300 font-medium">
              ⚡ {painPointText}
            </p>
          </div>

          {/* 2. 起点分数区 — 三卡片布局 */}
          <div className="space-y-3">
            {/* 当前分数卡片 */}
            <motion.div 
              className="relative bg-white dark:bg-white/10 rounded-2xl p-5 text-center border-2 border-amber-400 dark:border-amber-500 shadow-lg"
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0)', '0 0 0 10px rgba(251, 191, 36, 0.15)', '0 0 0 0 rgba(251, 191, 36, 0)']
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-white text-sm font-bold rounded-full shadow whitespace-nowrap">
                现在 · Day 0
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
              <p className="text-sm text-muted-foreground mt-1">你的觉醒起点</p>
            </motion.div>

            {/* 上升箭头 */}
            <div className="flex justify-center py-1">
              <motion.div
                animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <TrendingUp className="w-6 h-6 text-emerald-500" />
              </motion.div>
            </div>

            {/* 7天后 + 毕业 并排卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 7天后目标 */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl p-3 border-2 border-emerald-400 dark:border-emerald-500 text-center space-y-1.5">
                <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-sm font-bold rounded-full">
                  🚀 7天后
                </span>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {day7Target}+
                </div>
                <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80 leading-snug">
                  {day7ValueDesc}
                </p>
              </div>

              {/* 毕业目标 */}
              <div className="bg-violet-50/80 dark:bg-violet-950/30 rounded-xl p-3 border-2 border-dashed border-violet-400 dark:border-violet-500 text-center space-y-1.5">
                <span className="inline-block px-3 py-1 bg-violet-500 text-white text-sm font-bold rounded-full">
                  🎓 毕业
                </span>
                <div className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                  ◎ 85+
                </div>
                <p className="text-sm text-violet-700/80 dark:text-violet-300/80 leading-snug">
                  财富能量畅通
                </p>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
            <span className="text-sm text-amber-500">✦</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent" />
          </div>

          {/* 3. 训练营标题区 — 放大突出 */}
          <div className="text-center space-y-2">
            <h4 className="text-xl font-bold text-foreground">财富觉醒训练营</h4>
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-base font-bold rounded-full shadow-md">
              7天 · 每天15分钟
            </span>
            <p className="text-base text-amber-700 dark:text-amber-300 font-semibold">
              每天15分钟，AI教练1对1带你突破
            </p>
          </div>

          {/* 4. 收获区 — 放大字号 + 卡片化 */}
          <div className="space-y-3">
            <h4 className="font-bold text-base text-foreground">✨ 7天后，你会得到：</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {personalizedOutcomes.map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0.01, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.12 }}
                  style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
                  className="flex items-start gap-3 p-3 bg-white/70 dark:bg-white/5 rounded-xl border-l-4 border-amber-400 dark:border-amber-500 shadow-sm"
                >
                  <span className="text-2xl leading-none mt-0.5">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.label}</span>
                    <p className="text-base text-foreground/80 leading-snug mt-0.5">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 5. 你将获得清单 — 物超所值 */}
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/60 dark:border-emerald-700/30 space-y-2.5">
            <h4 className="text-base font-bold text-foreground">📦 包含内容：</h4>
            <div className="space-y-2">
              {valueItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-base text-foreground/90 flex-1">{item.text}</span>
                  {item.value && (
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-700/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">总价值</span>
              <span className="text-base font-bold text-muted-foreground line-through">¥700+</span>
            </div>
          </div>

          {/* 6. CTA 区 — 强化转化 */}
          <motion.div
            initial={{ opacity: 0.01, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            style={{ transform: 'translateZ(0)', willChange: 'transform, opacity' }}
            className="flex flex-col items-center gap-3"
          >
            {/* 社会证明 */}
            <p className="text-sm text-muted-foreground">
              已有 <span className="font-bold text-amber-600 dark:text-amber-400">2,847</span> 人加入
            </p>

            {/* 价格锚定 + 按钮 */}
            {hasPurchased ? (
              <Button
                onClick={onPurchase}
                className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-xl shadow-amber-500/30 text-lg rounded-xl"
              >
                开始训练营
                <ArrowRight className="w-5 h-5 ml-1.5" />
              </Button>
            ) : (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg text-muted-foreground line-through">¥700+</span>
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">¥299</span>
                </div>
                <Button
                  onClick={onPurchase}
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-xl shadow-amber-500/30 text-lg rounded-xl"
                >
                  ¥299 开启我的7天蜕变
                  <ArrowRight className="w-5 h-5 ml-1.5" />
                </Button>
              </div>
            )}


            {/* 了解详情 */}
            <Button
              variant="ghost"
              onClick={() => navigate('/wealth-camp-intro')}
              className="h-10 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 text-sm"
            >
              了解详情 →
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

