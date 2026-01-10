import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, Calendar, BookOpen, RefreshCw, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fourPoorInfo, emotionBlockInfo, beliefBlockInfo, FourPoorType, EmotionBlockType, BeliefBlockType } from './wealthBlockData';

interface AIInsightData {
  rootCauseAnalysis?: string;
  combinedPatternInsight?: string;
  breakthroughPath?: string[];
  avoidPitfalls?: string[];
  firstStep?: string;
  encouragement?: string;
  mirrorStatement?: string;
  coreStuckPoint?: string;
  unlockKey?: string;
}

interface NextStepActionCardProps {
  isSaved: boolean;
  isSaving?: boolean;
  hasPurchased: boolean;
  awakeningStart: number;
  day7Target: number;
  onSave?: () => void;
  onPurchase: () => void;
  onStartCamp?: () => void;
  dominantPoor?: FourPoorType;
  dominantEmotion?: EmotionBlockType;
  dominantBelief?: BeliefBlockType;
  aiInsight?: AIInsightData | null;
  isLoadingAI?: boolean;
  onViewDetails?: () => void;
}

export function NextStepActionCard({
  isSaved,
  isSaving,
  hasPurchased,
  awakeningStart,
  day7Target,
  onSave,
  onPurchase,
  onStartCamp,
  dominantPoor,
  dominantEmotion,
  dominantBelief,
  aiInsight,
  isLoadingAI,
  onViewDetails
}: NextStepActionCardProps) {
  
  const poorInfo = dominantPoor ? fourPoorInfo[dominantPoor] : null;
  const emotionInfo = dominantEmotion ? emotionBlockInfo[dominantEmotion] : null;
  const beliefInfo = dominantBelief ? beliefBlockInfo[dominantBelief] : null;

  const steps = [
    {
      id: 1,
      title: '完成测评',
      description: '了解你的财富卡点',
      completed: true,
      icon: Check,
    },
    {
      id: 2,
      title: '保存结果',
      description: '同步到财富档案',
      completed: isSaved,
      icon: BookOpen,
      action: !isSaved && onSave ? onSave : undefined,
      actionLabel: isSaving ? '保存中...' : '保存',
    },
    {
      id: 3,
      title: '加入训练营',
      description: `从${awakeningStart}分突破到${day7Target}分`,
      completed: hasPurchased,
      icon: Calendar,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-4 text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h3 className="font-bold text-lg">开启你的觉醒之旅</h3>
          </div>
          <p className="text-white/80 text-sm mt-1">
            从觉醒起点 <span className="font-bold">{awakeningStart}</span> 出发，7天突破至 <span className="font-bold">{day7Target}+</span>
          </p>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* 个性化卡点标签 */}
          {(poorInfo || emotionInfo || beliefInfo) && (
            <div className="flex flex-wrap gap-2">
              {poorInfo && (
                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                  {poorInfo.emoji} {poorInfo.name}
                </span>
              )}
              {emotionInfo && (
                <span className="px-2.5 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-medium">
                  {emotionInfo.emoji} {emotionInfo.name}
                </span>
              )}
              {beliefInfo && (
                <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full text-xs font-medium">
                  {beliefInfo.emoji} {beliefInfo.name}
                </span>
              )}
            </div>
          )}

          {/* AI 突破路径 - 简化版 */}
          {isLoadingAI && (
            <div className="flex items-center justify-center gap-2 p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
              <span className="text-xs text-violet-600 dark:text-violet-400">AI正在分析突破路径...</span>
            </div>
          )}
          
          {aiInsight && !isLoadingAI && aiInsight.breakthroughPath && (
            <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg space-y-2">
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1">
                <Target className="w-3 h-3" /> AI定制突破路径
              </p>
              <div className="space-y-1.5">
                {aiInsight.breakthroughPath.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-violet-700 dark:text-violet-300">
                    <span className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 步骤进度 - 水平紧凑版 */}
          <div className="flex items-center justify-between py-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      step.completed 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step.completed ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className={cn(
                    "text-[10px] mt-1 font-medium",
                    step.completed ? "text-emerald-600" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                  {/* 保存按钮 */}
                  {step.action && !step.completed && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={step.action}
                      disabled={isSaving}
                      className="h-6 text-[10px] mt-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2"
                    >
                      {step.actionLabel}
                    </Button>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    steps[index + 1].completed || step.completed ? "bg-emerald-300" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* 同步状态 */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
            <RefreshCw className={cn("w-3.5 h-3.5", isSaved ? "text-emerald-500" : "text-muted-foreground")} />
            <p className="text-[11px] text-muted-foreground">
              {isSaved 
                ? "✓ 测评数据已同步到财富日记 Day 0" 
                : "保存后自动同步到财富日记"}
            </p>
          </div>

          {/* 主CTA按钮 */}
          {hasPurchased ? (
            <Button
              onClick={onStartCamp}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg font-bold text-base"
            >
              开始7天训练营
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onPurchase}
              className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-lg font-bold text-base"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              ¥299 立即加入训练营
            </Button>
          )}

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>2,847人已参与 · 7天无效全额退款</span>
            {onViewDetails && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
                onClick={onViewDetails}
              >
                了解详情 <ArrowRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
