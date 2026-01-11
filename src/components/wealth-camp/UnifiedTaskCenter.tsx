import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDailyChallenges, DailyChallenge } from '@/hooks/useDailyChallenges';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { useSmartAchievementRecommendation } from '@/hooks/useSmartAchievementRecommendation';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { challengeTypes, challengeDifficulties } from '@/config/awakeningLevelConfig';
import { fourPoorRichConfig, PoorTypeKey } from '@/config/fourPoorConfig';
import { 
  Target, Zap, Check, ChevronRight, Sparkles, Loader2, 
  Lightbulb, Trophy, ArrowRight, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { taskCardStyles, cardBaseStyles } from '@/config/cardStyleConfig';

export type UserMode = 'active' | 'graduate' | 'partner';

interface BaseTask {
  id: string;
  title: string;
  description?: string;
  icon: string;
  completed: boolean;
  locked?: boolean;
  lockReason?: string;
  points: number;
  action?: () => void;
  highlight?: boolean;
  optional?: boolean;
  category: 'required' | 'challenge' | 'optional';
}

interface UnifiedTaskCenterProps {
  // Base task states
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  actionCompleted?: boolean;
  hasAction?: boolean;
  // Actions
  onMeditationClick: () => void;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  onActionClick?: () => void;
  onGraduationClick?: () => void;
  // Mode props
  userMode?: UserMode;
  cycleWeek?: number;
  cycleMeditationDay?: number;
  currentDay?: number;
  hasGraduationReport?: boolean;
  graduationReportViewed?: boolean;
  // Challenge props
  campId?: string;
  focusAreas?: string[];
  reminderBeliefs?: string[];
  weekNumber?: number;
  onChallengeCompleted?: () => void;
  className?: string;
}

export function UnifiedTaskCenter({
  meditationCompleted,
  coachingCompleted,
  shareCompleted,
  inviteCompleted,
  actionCompleted = false,
  hasAction = false,
  onMeditationClick,
  onCoachingClick,
  onShareClick,
  onInviteClick,
  onActionClick,
  onGraduationClick,
  userMode = 'active',
  cycleWeek = 1,
  cycleMeditationDay = 1,
  currentDay = 1,
  hasGraduationReport = false,
  graduationReportViewed = false,
  campId,
  focusAreas = [],
  reminderBeliefs = [],
  weekNumber = 1,
  onChallengeCompleted,
  className,
}: UnifiedTaskCenterProps) {
  const queryClient = useQueryClient();
  const isPostCampMode = userMode === 'graduate' || userMode === 'partner';
  
  // Only fetch challenges for post-camp users
  const { 
    challenges, 
    isLoading: challengesLoading, 
    completedCount: challengeCompletedCount, 
    totalPoints: challengeTotalPoints, 
    earnedPoints: challengeEarnedPoints, 
    completeChallenge 
  } = useDailyChallenges();
  
  const { addPoints } = useAwakeningProgress();
  const { topRecommendation } = useSmartAchievementRecommendation({
    campId,
    currentDay,
    maxRecommendations: 1,
  });
  const { checkAndAwardAchievements } = useAchievementChecker();
  
  const [expandedChallengeId, setExpandedChallengeId] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [completing, setCompleting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Auto-generate challenges for post-camp users
  useEffect(() => {
    if (!isPostCampMode) return;
    
    const generateChallenges = async () => {
      if (challengesLoading || generating) return;
      if (challenges && challenges.length > 0) return;

      setGenerating(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await supabase.functions.invoke('generate-daily-challenges', {
          body: { 
            targetDate: format(new Date(), 'yyyy-MM-dd'),
            focusAreas,
            weekNumber,
          },
        });

        if (response.error) {
          console.error('Error generating challenges:', response.error);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
      } catch (error) {
        console.error('Failed to generate challenges:', error);
      } finally {
        setGenerating(false);
      }
    };

    generateChallenges();
  }, [isPostCampMode, challengesLoading, challenges, generating, queryClient, focusAreas, weekNumber]);

  const handleCompleteChallenge = async (challenge: DailyChallenge) => {
    if (completing) return;
    setCompleting(true);

    try {
      await completeChallenge.mutateAsync({
        challengeId: challenge.id,
        reflection: reflection || undefined,
      });

      const result = await addPoints.mutateAsync({
        points: challenge.points_reward,
        action: `完成挑战: ${challenge.challenge_title}`,
      });

      queryClient.invalidateQueries({ queryKey: ['challenge-poor-progress'] });
      queryClient.invalidateQueries({ queryKey: ['four-poor-progress'] });
      await checkAndAwardAchievements(true);
      queryClient.invalidateQueries({ queryKey: ['smart-achievement-recommendations'] });

      const poorTypeInfo = challenge.target_poor_type 
        ? fourPoorRichConfig[challenge.target_poor_type]
        : null;

      toast.success(`+${challenge.points_reward} 积分！`, {
        description: result.leveledUp 
          ? `🎉 升级到 ${result.newLevel.name}！` 
          : poorTypeInfo 
            ? `${poorTypeInfo.poorEmoji} ${poorTypeInfo.poorName} 觉察 +1` 
            : '继续加油！',
      });

      onChallengeCompleted?.();
      setExpandedChallengeId(null);
      setReflection('');
    } catch (error) {
      toast.error('完成失败，请重试');
    } finally {
      setCompleting(false);
    }
  };

  // Build base tasks
  const baseTasks = buildBaseTasks({
    userMode,
    meditationCompleted,
    coachingCompleted,
    shareCompleted,
    inviteCompleted,
    actionCompleted,
    hasAction,
    onMeditationClick,
    onCoachingClick,
    onShareClick,
    onInviteClick,
    onActionClick,
    onGraduationClick,
    cycleWeek,
    cycleMeditationDay,
    currentDay,
    hasGraduationReport,
    graduationReportViewed,
  });

  // Calculate totals
  const requiredTasks = baseTasks.filter(t => t.category === 'required');
  const optionalTasks = baseTasks.filter(t => t.category === 'optional');
  
  const baseCompletedCount = baseTasks.filter(t => t.completed).length;
  const baseEarnedPoints = baseTasks.filter(t => t.completed).reduce((sum, t) => sum + t.points, 0);
  const baseTotalPoints = baseTasks.reduce((sum, t) => sum + t.points, 0);
  
  const totalCompletedCount = baseCompletedCount + (isPostCampMode ? challengeCompletedCount : 0);
  const totalTasks = baseTasks.length + (isPostCampMode ? (challenges?.length || 0) : 0);
  const totalEarnedPoints = baseEarnedPoints + (isPostCampMode ? challengeEarnedPoints : 0);
  const totalPoints = baseTotalPoints + (isPostCampMode ? challengeTotalPoints : 0);
  
  const allCompleted = totalCompletedCount === totalTasks && totalTasks > 0;
  const allChallengesCompleted = isPostCampMode && challenges && challengeCompletedCount === challenges.length;

  const getModeLabel = () => {
    switch (userMode) {
      case 'graduate': return '毕业生模式';
      case 'partner': return '合伙人模式';
      default: return null;
    }
  };

  const modeLabel = getModeLabel();

  return (
    <Card className={cn(
      cardBaseStyles.container,
      taskCardStyles.primary.container,
      className
    )}>
      {/* Header */}
      <CardHeader className={cn(
        "pb-2",
        taskCardStyles.primary.header,
        taskCardStyles.primary.headerBorder
      )}>
        <CardTitle className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", taskCardStyles.primary.headerText)}>
            <span>📋</span>
            <span>今日任务</span>
            <span className="text-sm opacity-70">
              ({totalCompletedCount}/{totalTasks})
            </span>
            {modeLabel && (
              <Badge variant="secondary" className={cn(
                "text-xs",
                userMode === 'partner' 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" 
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              )}>
                {modeLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-amber-600 dark:text-amber-400 font-medium">+{totalEarnedPoints}</span>
            <span className="text-muted-foreground">/{totalPoints}分</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Weekly Focus Hint - for post-camp users */}
        {isPostCampMode && focusAreas.length > 0 && !allCompleted && (
          <div className="px-3 py-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>本周重点：</span>
              {focusAreas.slice(0, 2).map((area, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Required Tasks Section */}
        {requiredTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground px-1">
              ── 必做任务 ──
            </div>
            {requiredTasks.map((task, index) => (
              <TaskItem key={task.id} task={task} index={index} />
            ))}
          </div>
        )}

        {/* AI Challenges Section - Only for post-camp users */}
        {isPostCampMode && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground px-1 flex items-center justify-between">
              <span>── AI 挑战 ──</span>
              {challenges && challenges.length > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {challengeCompletedCount}/{challenges.length}
                </Badge>
              )}
            </div>
            
            {(challengesLoading || generating) ? (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{generating ? '正在生成...' : '加载中...'}</span>
              </div>
            ) : challenges && challenges.length > 0 ? (
              <AnimatePresence>
                {challenges.map((challenge, index) => (
                  <ChallengeItem
                    key={challenge.id}
                    challenge={challenge}
                    index={index}
                    isExpanded={expandedChallengeId === challenge.id}
                    onExpand={() => setExpandedChallengeId(expandedChallengeId === challenge.id ? null : challenge.id)}
                    reflection={reflection}
                    onReflectionChange={setReflection}
                    onComplete={() => handleCompleteChallenge(challenge)}
                    completing={completing}
                  />
                ))}
              </AnimatePresence>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                今日暂无挑战
              </div>
            )}
          </div>
        )}

        {/* Optional Tasks Section */}
        {optionalTasks.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground px-1">
              ── 可选任务 ──
            </div>
            {optionalTasks.map((task, index) => (
              <TaskItem key={task.id} task={task} index={index} />
            ))}
          </div>
        )}

        {/* Belief Reminders */}
        {reminderBeliefs.length > 0 && !allCompleted && (
          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
            <div className="flex items-start gap-2 text-xs">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium text-amber-700 dark:text-amber-300">信念提醒</span>
                {reminderBeliefs.slice(0, 2).map((belief, i) => (
                  <p key={i} className="text-amber-600/80 dark:text-amber-400/80 italic">
                    "{belief}"
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* All Completed Message */}
        {allCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 rounded-lg bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-700 text-center"
          >
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
              🎉 今日任务全部完成！获得 {totalEarnedPoints} 积分
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Task Item Component
function TaskItem({ task, index }: { task: BaseTask; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        task.completed 
          ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" 
          : task.locked
            ? "bg-muted/30 opacity-60"
            : task.highlight
              ? "bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 cursor-pointer hover:bg-amber-100/80 dark:hover:bg-amber-950/50"
              : "bg-muted/50 cursor-pointer hover:bg-muted"
      )}
      onClick={task.locked ? undefined : task.action}
    >
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center text-lg",
        task.completed 
          ? "bg-emerald-100 dark:bg-emerald-900/50" 
          : task.highlight
            ? "bg-amber-100 dark:bg-amber-900/50"
            : "bg-background"
      )}>
        {task.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{task.title}</span>
          {task.optional && (
            <span className="text-xs text-muted-foreground">(可选)</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {task.locked ? task.lockReason : task.description}
        </div>
      </div>

      <div className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        task.completed 
          ? "bg-emerald-200/50 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
      )}>
        +{task.points}分
      </div>

      {task.completed ? (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      ) : task.locked ? (
        <Lock className="w-4 h-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </motion.div>
  );
}

// Challenge Item Component
function ChallengeItem({
  challenge,
  index,
  isExpanded,
  onExpand,
  reflection,
  onReflectionChange,
  onComplete,
  completing,
}: {
  challenge: DailyChallenge;
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  reflection: string;
  onReflectionChange: (val: string) => void;
  onComplete: () => void;
  completing: boolean;
}) {
  const typeInfo = challengeTypes[challenge.challenge_type as keyof typeof challengeTypes] || {
    name: '挑战',
    icon: '🎯',
    color: 'text-gray-500',
  };
  const difficultyInfo = challengeDifficulties[challenge.difficulty as keyof typeof challengeDifficulties] || challengeDifficulties.medium;
  const poorTypeInfo = challenge.target_poor_type 
    ? fourPoorRichConfig[challenge.target_poor_type as PoorTypeKey]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "border rounded-lg overflow-hidden transition-all",
        challenge.is_completed 
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" 
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700"
      )}
    >
      <div
        className="p-3 cursor-pointer"
        onClick={() => !challenge.is_completed && onExpand()}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${challenge.is_completed ? 'text-emerald-500' : ''}`}>
            {challenge.is_completed ? (
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            ) : (
              <Checkbox checked={false} disabled className="mt-0.5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{typeInfo.icon}</span>
              <span className={`text-xs ${typeInfo.color}`}>{typeInfo.name}</span>
              <Badge className={`text-xs ${difficultyInfo.color}`}>
                {difficultyInfo.name}
              </Badge>
            </div>
            <h4 className={cn(
              "font-medium",
              challenge.is_completed ? 'text-emerald-700 dark:text-emerald-300' : ''
            )}>
              {challenge.challenge_title}
            </h4>
            {challenge.challenge_description && !isExpanded && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                {challenge.challenge_description}
              </p>
            )}
            {/* AI Recommendation Reason */}
            {challenge.recommendation_reason && !challenge.is_completed && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className={cn(
                  "text-xs",
                  challenge.ai_insight_source === 'keyword' && "text-rose-600 dark:text-rose-400",
                  challenge.ai_insight_source === 'belief' && "text-violet-600 dark:text-violet-400",
                  challenge.ai_insight_source === 'focus' && "text-blue-600 dark:text-blue-400",
                  challenge.ai_insight_source === 'pattern' && "text-emerald-600 dark:text-emerald-400",
                  (!challenge.ai_insight_source || challenge.ai_insight_source === 'layer') && "text-amber-600 dark:text-amber-400"
                )}>
                  {challenge.recommendation_reason}
                </span>
                {challenge.linked_belief && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800">
                    💎 信念
                  </Badge>
                )}
              </div>
            )}
            {/* Target Poor Type */}
            {poorTypeInfo && !challenge.is_completed && !challenge.recommendation_reason && (
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-xs text-muted-foreground">🎯 目标：</span>
                <Badge variant="outline" className="text-xs py-0 h-5">
                  {poorTypeInfo.poorEmoji} {poorTypeInfo.poorName} → {poorTypeInfo.richEmoji} {poorTypeInfo.richName}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="shrink-0">
              +{challenge.points_reward}分
            </Badge>
            {!challenge.is_completed && (
              <ChevronRight 
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isExpanded && "rotate-90"
                )}
              />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && !challenge.is_completed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-100 dark:border-slate-800"
          >
            <div className="p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
              {challenge.challenge_description && (
                <p className="text-sm text-muted-foreground">
                  {challenge.challenge_description}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  完成感想 (可选)
                </label>
                <Textarea
                  placeholder="记录你的体验..."
                  value={reflection}
                  onChange={(e) => onReflectionChange(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={onComplete}
                disabled={completing}
              >
                {completing ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    完成挑战 +{challenge.points_reward}分
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper function to build base task list
function buildBaseTasks({
  userMode,
  meditationCompleted,
  coachingCompleted,
  shareCompleted,
  inviteCompleted,
  actionCompleted,
  hasAction,
  onMeditationClick,
  onCoachingClick,
  onShareClick,
  onInviteClick,
  onActionClick,
  onGraduationClick,
  cycleWeek,
  cycleMeditationDay,
  currentDay,
  hasGraduationReport,
  graduationReportViewed,
}: {
  userMode: UserMode;
  meditationCompleted: boolean;
  coachingCompleted: boolean;
  shareCompleted: boolean;
  inviteCompleted: boolean;
  actionCompleted: boolean;
  hasAction: boolean;
  onMeditationClick: () => void;
  onCoachingClick: () => void;
  onShareClick: () => void;
  onInviteClick: () => void;
  onActionClick?: () => void;
  onGraduationClick?: () => void;
  cycleWeek: number;
  cycleMeditationDay: number;
  currentDay: number;
  hasGraduationReport: boolean;
  graduationReportViewed: boolean;
}): BaseTask[] {
  const tasks: BaseTask[] = [];

  // Active mode (7-day training camp)
  if (userMode === 'active') {
    // Graduation task at top when Day >= 7
    if (currentDay >= 7 && onGraduationClick) {
      tasks.push({
        id: 'graduation',
        title: hasGraduationReport ? '查看毕业报告' : '🎓 生成毕业报告',
        description: hasGraduationReport ? '查看你的7天成长总结' : '完成训练营，生成专属成长报告',
        icon: '🎓',
        completed: graduationReportViewed,
        points: hasGraduationReport ? 0 : 30,
        action: onGraduationClick,
        highlight: !hasGraduationReport,
        category: 'required',
      });
    }

    // 1. Meditation - Required first
    tasks.push({
      id: 'meditation',
      title: '冥想课程',
      description: '开启今日觉醒',
      icon: '🧘',
      completed: meditationCompleted,
      points: 10,
      action: onMeditationClick,
      category: 'required',
    });

    // 2. Share - Second priority
    tasks.push({
      id: 'share',
      title: '打卡分享',
      description: '记录成长时刻',
      icon: '📢',
      completed: shareCompleted,
      locked: !meditationCompleted,
      lockReason: '完成冥想后解锁',
      points: 5,
      action: onShareClick,
      category: 'required',
    });

    // 3. AI Challenges are shown in the UI section between required and optional

    // 4. Invite - After AI challenges
    tasks.push({
      id: 'invite',
      title: '邀请好友',
      description: '分享成长之旅',
      icon: '🎁',
      completed: inviteCompleted,
      points: 5,
      action: onInviteClick,
      category: 'optional',
    });

    // Optional action task (if has giving action from coaching)
    if (hasAction) {
      tasks.push({
        id: 'action',
        title: '给予行动',
        description: '践行财富能量',
        icon: '💝',
        completed: actionCompleted,
        locked: !coachingCompleted,
        lockReason: '待教练梳理生成',
        points: 10,
        action: onActionClick,
        category: 'optional',
      });
    }

    // Coaching task - moved to optional since AI challenges are now primary
    tasks.push({
      id: 'coaching',
      title: '教练梳理',
      description: '深度财富对话',
      icon: '💬',
      completed: coachingCompleted,
      locked: !meditationCompleted,
      lockReason: '完成冥想后解锁',
      points: 20,
      action: onCoachingClick,
      highlight: meditationCompleted && !coachingCompleted,
      category: 'optional',
    });

    return tasks;
  }

  // Graduate mode - Order: 1.冥想 2.打卡分享 3.AI挑战(UI) 4.邀请好友
  if (userMode === 'graduate') {
    // 1. Meditation
    tasks.push({
      id: 'meditation',
      title: `循环冥想 Day ${cycleMeditationDay}`,
      description: `第${cycleWeek}周 · 第${cycleWeek}次聆听`,
      icon: '🧘',
      completed: meditationCompleted,
      points: 5,
      action: onMeditationClick,
      category: 'required',
    });

    // 2. Share
    tasks.push({
      id: 'share',
      title: '打卡分享',
      description: '记录持续成长',
      icon: '📢',
      completed: shareCompleted,
      points: 5,
      action: onShareClick,
      category: 'required',
    });

    // 3. AI Challenges shown in UI section

    // 4. Invite
    tasks.push({
      id: 'invite',
      title: '邀请好友',
      description: '分享觉醒之旅',
      icon: '🎁',
      completed: inviteCompleted,
      points: 5,
      action: onInviteClick,
      category: 'optional',
    });

    return tasks;
  }

  // Partner mode - Order: 1.冥想 2.打卡分享 3.AI挑战(UI) 4.邀请好友
  // 1. Meditation
  tasks.push({
    id: 'meditation',
    title: `循环冥想 Day ${cycleMeditationDay}`,
    description: `第${cycleWeek}周 · 第${cycleWeek}次聆听`,
    icon: '🧘',
    completed: meditationCompleted,
    points: 5,
    action: onMeditationClick,
    category: 'required',
  });

  // 2. Share
  tasks.push({
    id: 'share',
    title: '打卡分享',
    description: '影响更多人',
    icon: '📢',
    completed: shareCompleted,
    points: 5,
    action: onShareClick,
    category: 'required',
  });

  // 3. AI Challenges shown in UI section

  // 4. Invite
  tasks.push({
    id: 'invite',
    title: '邀请好友',
    description: '发展你的团队',
    icon: '🎁',
    completed: inviteCompleted,
    points: 10,
    action: onInviteClick,
    category: 'optional',
  });

  // Optional: Giving action (for partners)
  if (hasAction) {
    tasks.push({
      id: 'action',
      title: '给予行动',
      description: '践行财富能量',
      icon: '💝',
      completed: actionCompleted,
      points: 10,
      action: onActionClick,
      category: 'optional',
    });
  }

  return tasks;
}
