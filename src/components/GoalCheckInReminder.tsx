import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const GoalCheckInReminder = () => {
  const [showReminder, setShowReminder] = useState(false);
  const [daysSinceLastCheckIn, setDaysSinceLastCheckIn] = useState(0);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkLastCheckIn();
  }, []);

  const checkLastCheckIn = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 检查是否有活跃目标
      const { data: activeGoals, error: goalsError } = await supabase
        .from('emotion_goals')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (goalsError) throw goalsError;

      const goalsCount = activeGoals?.length || 0;
      setActiveGoalsCount(goalsCount);

      // 如果没有活跃目标，不显示提醒
      if (goalsCount === 0) return;

      // 检查最近的记录时间（briefings 和 quick_logs）
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: recentBriefings } = await supabase
        .from('briefings')
        .select('created_at, conversations!inner(user_id)')
        .eq('conversations.user_id', user.id)
        .gte('created_at', twoDaysAgo.toISOString())
        .limit(1);

      const { data: recentQuickLogs } = await supabase
        .from('emotion_quick_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', twoDaysAgo.toISOString())
        .limit(1);

      // 如果2天内没有任何记录，显示提醒
      const hasRecentActivity = 
        (recentBriefings && recentBriefings.length > 0) || 
        (recentQuickLogs && recentQuickLogs.length > 0);

      if (!hasRecentActivity) {
        // 计算距离上次记录的天数
        const { data: lastBriefing } = await supabase
          .from('briefings')
          .select('created_at, conversations!inner(user_id)')
          .eq('conversations.user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { data: lastQuickLog } = await supabase
          .from('emotion_quick_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        let lastCheckInDate: Date | null = null;
        
        if (lastBriefing && lastBriefing.length > 0) {
          lastCheckInDate = new Date(lastBriefing[0].created_at);
        }
        
        if (lastQuickLog && lastQuickLog.length > 0) {
          const quickLogDate = new Date(lastQuickLog[0].created_at);
          if (!lastCheckInDate || quickLogDate > lastCheckInDate) {
            lastCheckInDate = quickLogDate;
          }
        }

        if (lastCheckInDate) {
          const daysSince = Math.floor((Date.now() - lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24));
          setDaysSinceLastCheckIn(daysSince);
          setShowReminder(true);
        } else {
          // 完全没有记录
          setDaysSinceLastCheckIn(0);
          setShowReminder(true);
        }
      }
    } catch (error) {
      console.error('Error checking last check-in:', error);
    }
  };

  const handleGoToCheckIn = () => {
    navigate('/');
    setShowReminder(false);
  };

  const handleDismiss = () => {
    setShowReminder(false);
    // 可以在这里添加本地存储，避免频繁提醒
    localStorage.setItem('lastDismissedReminder', new Date().toISOString());
  };

  if (!showReminder) return null;

  return (
    <Alert className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 space-y-2">
          <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <span>📅</span>
                {daysSinceLastCheckIn > 0 
                  ? `已经 ${daysSinceLastCheckIn} 天没有记录了`
                  : '还没有开始记录情绪'}
              </p>
              <p className="text-amber-800 dark:text-amber-200">
                你有 <strong>{activeGoalsCount}</strong> 个目标正在进行中。保持记录才能准确评估目标进度哦！
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                💡 每周至少记录 3 天，目标评估会更准确
              </p>
            </div>
          </AlertDescription>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={handleGoToCheckIn}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              去记录情绪
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/20"
            >
              稍后提醒
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
};
