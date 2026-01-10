import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Eye, Brain, Heart } from 'lucide-react';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getAwakeningColor } from '@/config/wealthStyleConfig';

// 主导卡点类型映射
const dominantTypeLabels: Record<string, { name: string; emoji: string }> = {
  eye: { name: '眼穷 (比较/自卑)', emoji: '👁' },
  mouth: { name: '嘴穷 (抱怨/消极)', emoji: '👄' },
  hand: { name: '手穷 (吝啬/恐惧)', emoji: '✋' },
  heart: { name: '心穷 (匮乏/焦虑)', emoji: '💔' },
};

// 反应模式映射
const patternLabels: Record<string, string> = {
  avoid: '😰 回避型',
  fight: '😤 对抗型',
  freeze: '😶 冻结型',
  please: '🙂 讨好型',
};

interface Day0BaselineCardProps {
  onClick?: () => void;
}

export const Day0BaselineCard = ({ onClick }: Day0BaselineCardProps) => {
  const { progress } = useAwakeningProgress();
  const { baseline } = useAssessmentBaseline();

  // 优先使用 progress 中的基线数据，其次使用 assessment baseline
  const baselineAwakening = progress?.baseline_awakening || baseline?.awakeningStart || 0;
  const baselineBehavior = progress?.baseline_behavior || baseline?.behaviorAwakening || 0;
  const baselineEmotion = progress?.baseline_emotion || baseline?.emotionAwakening || 0;
  const baselineBelief = progress?.baseline_belief || baseline?.beliefAwakening || 0;
  const dominantType = progress?.baseline_dominant_type || baseline?.dominant_poor || null;
  const reactionPattern = progress?.baseline_reaction_pattern || baseline?.reaction_pattern || null;
  const baselineDate = progress?.baseline_created_at || baseline?.created_at || null;

  if (!baselineAwakening && !baseline) {
    return null;
  }

  const dominantInfo = dominantType ? dominantTypeLabels[dominantType] : null;
  const patternLabel = reactionPattern ? patternLabels[reactionPattern] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card 
        className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-4">
          {/* 头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-100">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <span className="font-semibold text-amber-900">我的觉醒起点</span>
            </div>
            {baselineDate && (
              <span className="text-xs text-amber-600/70">
                {format(new Date(baselineDate), 'yyyy年M月d日', { locale: zhCN })}
              </span>
            )}
          </div>

          {/* 觉醒起点分数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-700">觉醒起点</span>
              <span 
                className="text-2xl font-bold"
                style={{ color: getAwakeningColor(baselineAwakening) }}
              >
                {baselineAwakening}/100
              </span>
            </div>
            <div className="h-2 rounded-full bg-amber-100 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ 
                  backgroundColor: getAwakeningColor(baselineAwakening),
                  width: `${baselineAwakening}%`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${baselineAwakening}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* 主导卡点和反应模式 */}
          <div className="grid grid-cols-2 gap-3">
            {dominantInfo && (
              <div className="bg-white/60 rounded-lg p-2.5">
                <div className="text-xs text-amber-600 mb-1">主导卡点</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{dominantInfo.emoji}</span>
                  <span className="text-sm font-medium text-amber-900">{dominantInfo.name}</span>
                </div>
              </div>
            )}
            {patternLabel && (
              <div className="bg-white/60 rounded-lg p-2.5">
                <div className="text-xs text-amber-600 mb-1">反应模式</div>
                <div className="text-sm font-medium text-amber-900">{patternLabel}</div>
              </div>
            )}
          </div>

          {/* 三层起点 */}
          <div className="space-y-2">
            <div className="text-xs text-amber-600 font-medium">三层起点</div>
            <div className="grid grid-cols-3 gap-2">
              <LayerScore 
                icon={<Eye className="h-3 w-3" />}
                label="行为" 
                score={baselineBehavior} 
                color="text-amber-600"
              />
              <LayerScore 
                icon={<Heart className="h-3 w-3" />}
                label="情绪" 
                score={baselineEmotion} 
                color="text-pink-600"
              />
              <LayerScore 
                icon={<Brain className="h-3 w-3" />}
                label="信念" 
                score={baselineBelief} 
                color="text-violet-600"
              />
            </div>
          </div>

          {/* 提示文字 */}
          <div className="text-xs text-amber-600/70 text-center pt-2 border-t border-amber-200/50">
            💡 这是你的起点，每一步成长都在这里可见
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface LayerScoreProps {
  icon: React.ReactNode;
  label: string;
  score: number;
  color: string;
}

const LayerScore = ({ icon, label, score, color }: LayerScoreProps) => {
  // 转换为星级 (0-100 -> 1-5)
  const stars = Math.round((score / 100) * 4 + 1);
  
  return (
    <div className="bg-white/60 rounded-lg p-2 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex justify-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <span 
            key={i} 
            className={`text-xs ${i <= stars ? 'text-amber-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{score}%</div>
    </div>
  );
};
