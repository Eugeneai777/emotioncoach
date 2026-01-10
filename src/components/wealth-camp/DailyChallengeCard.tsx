import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDailyChallenges, DailyChallenge } from '@/hooks/useDailyChallenges';
import { useAwakeningProgress } from '@/hooks/useAwakeningProgress';
import { challengeTypes, challengeDifficulties } from '@/config/awakeningLevelConfig';
import { Target, Zap, Check, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DailyChallengeCardProps {
  onPointsEarned?: (points: number) => void;
}

export const DailyChallengeCard = ({ onPointsEarned }: DailyChallengeCardProps) => {
  const { challenges, isLoading, completedCount, totalPoints, earnedPoints, completeChallenge } = useDailyChallenges();
  const { addPoints } = useAwakeningProgress();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [completing, setCompleting] = useState(false);

  const handleComplete = async (challenge: DailyChallenge) => {
    if (completing) return;
    setCompleting(true);

    try {
      await completeChallenge.mutateAsync({
        challengeId: challenge.id,
        reflection: reflection || undefined,
      });

      // 添加积分
      const result = await addPoints.mutateAsync({
        points: challenge.points_reward,
        action: `完成挑战: ${challenge.challenge_title}`,
      });

      toast.success(`+${challenge.points_reward} 积分！`, {
        description: result.leveledUp ? `🎉 升级到 ${result.newLevel.name}！` : '继续加油！',
      });

      onPointsEarned?.(challenge.points_reward);
      setExpandedId(null);
      setReflection('');
    } catch (error) {
      toast.error('完成失败，请重试');
    } finally {
      setCompleting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenges || challenges.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-muted-foreground">今日暂无挑战</p>
          <p className="text-xs text-muted-foreground mt-1">完成训练营后解锁每日AI挑战</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <span>今日觉醒挑战</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white">
              {completedCount}/{challenges.length}
            </Badge>
            <Badge className="bg-amber-500">
              <Zap className="h-3 w-3 mr-1" />
              {earnedPoints}/{totalPoints}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <AnimatePresence>
          {challenges.map((challenge, index) => {
            const typeInfo = challengeTypes[challenge.challenge_type as keyof typeof challengeTypes] || {
              name: '挑战',
              icon: '🎯',
              color: 'text-gray-500',
            };
            const difficultyInfo = challengeDifficulties[challenge.difficulty as keyof typeof challengeDifficulties] || challengeDifficulties.medium;
            const isExpanded = expandedId === challenge.id;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  border rounded-lg overflow-hidden transition-all
                  ${challenge.is_completed 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-white border-slate-200 hover:border-amber-300'
                  }
                `}
              >
                <div
                  className="p-3 cursor-pointer"
                  onClick={() => !challenge.is_completed && setExpandedId(isExpanded ? null : challenge.id)}
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
                      <h4 className={`font-medium ${challenge.is_completed ? 'text-emerald-700' : ''}`}>
                        {challenge.challenge_title}
                      </h4>
                      {challenge.challenge_description && !isExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {challenge.challenge_description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0">
                        +{challenge.points_reward}分
                      </Badge>
                      {!challenge.is_completed && (
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 展开的详情和完成按钮 */}
                <AnimatePresence>
                  {isExpanded && !challenge.is_completed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-3 space-y-3 bg-slate-50/50">
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
                            onChange={(e) => setReflection(e.target.value)}
                            rows={2}
                            className="resize-none"
                          />
                        </div>

                        <Button 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          onClick={() => handleComplete(challenge)}
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
          })}
        </AnimatePresence>

        {/* 全部完成提示 */}
        {completedCount === challenges.length && challenges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg"
          >
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-emerald-700 font-medium">今日挑战全部完成！</p>
            <p className="text-xs text-emerald-600">获得 {earnedPoints} 积分</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
