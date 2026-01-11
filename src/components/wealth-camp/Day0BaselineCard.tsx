import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ExternalLink, FileText } from 'lucide-react';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useAssessmentBaseline } from '@/hooks/useAssessmentBaseline';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getAwakeningColor } from '@/config/wealthStyleConfig';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cardBaseStyles } from '@/config/cardStyleConfig';

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
  showReportLink?: boolean;
}

export const Day0BaselineCard = ({ onClick, showReportLink = true }: Day0BaselineCardProps) => {
  const navigate = useNavigate();
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
        className={cn(
          cardBaseStyles.container,
          "bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/40 cursor-pointer"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-4">
          {/* 头部 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-amber-100">
                <MapPin className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <span className="font-semibold text-amber-900">我的觉醒起点</span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-200/60 text-amber-700 rounded-full">
                  来自财富测评
                </span>
              </div>
            </div>
            {baselineDate && (
              <span className="text-xs text-amber-600/70">
                {format(new Date(baselineDate), 'yyyy年M月d日', { locale: zhCN })}
              </span>
            )}
          </div>

          {/* 核心信息 - 简化展示 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              {dominantInfo && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{dominantInfo.emoji}</span>
                  <span className="text-sm text-amber-800">{dominantInfo.name}</span>
                </div>
              )}
              {patternLabel && (
                <div className="text-sm text-amber-700">{patternLabel}</div>
              )}
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-600/70">觉醒起点</span>
              <span 
                className="ml-2 text-lg font-bold"
                style={{ color: getAwakeningColor(baselineAwakening) }}
              >
                {baselineAwakening}
              </span>
              <span className="text-xs text-amber-600/50">分</span>
            </div>
          </div>

          {/* 提示文字 + 查看报告链接 */}
          <div className="pt-2 border-t border-amber-200/50 space-y-2">
            <div className="text-xs text-amber-600/70 text-center">
              💡 这是你的起点，每一步成长都在这里可见
            </div>
            
            {showReportLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/wealth-block?view=history');
                }}
                className="w-full h-7 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/50"
              >
                <FileText className="w-3 h-3 mr-1.5" />
                查看完整测评报告
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
