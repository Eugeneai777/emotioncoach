import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { WealthMeditationPlayer } from '@/components/wealth-camp/WealthMeditationPlayer';
import { WealthProgressChart } from '@/components/wealth-camp/WealthProgressChart';
import { WealthJournalCard } from '@/components/wealth-camp/WealthJournalCard';
import { WealthCampInviteCard } from '@/components/wealth-camp/WealthCampInviteCard';
import { CheckInCelebrationDialog } from '@/components/wealth-camp/CheckInCelebrationDialog';
import CampShareDialog from '@/components/camp/CampShareDialog';
import { cn } from '@/lib/utils';

interface DailyTask {
  id: string;
  title: string;
  icon: string;
  completed: boolean;
  action?: () => void;
  locked?: boolean;
}

export default function WealthCampCheckIn() {
  const { campId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [meditationCompleted, setMeditationCompleted] = useState(false);
  const [coachingCompleted, setCoachingCompleted] = useState(false);

  // Fetch camp data - if no campId, find user's active wealth camp
  const { data: camp, isLoading: campLoading } = useQuery({
    queryKey: ['wealth-camp', campId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // If campId is provided, fetch that specific camp
      if (campId) {
        const { data, error } = await supabase
          .from('training_camps')
          .select('*')
          .eq('id', campId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        return data;
      }

      // Otherwise, find the user's active wealth_block_21 camp
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('camp_type', 'wealth_block_21')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch current day meditation
  const { data: meditation } = useQuery({
    queryKey: ['wealth-meditation', camp?.current_day],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('*')
        .eq('day_number', camp?.current_day || 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!camp?.current_day,
  });

  // Fetch journal entries
  const { data: journalEntries = [] } = useQuery({
    queryKey: ['wealth-journal-entries', campId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('camp_id', campId)
        .eq('user_id', user.id)
        .order('day_number', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!campId,
  });

  // Fetch user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    },
  });

  // Check today's progress
  useEffect(() => {
    if (journalEntries.length > 0 && camp) {
      const todayEntry = journalEntries.find(e => e.day_number === camp.current_day);
      if (todayEntry) {
        setMeditationCompleted(todayEntry.meditation_completed || false);
        setCoachingCompleted(!!todayEntry.behavior_block);
      }
    }
  }, [journalEntries, camp]);

  const handleMeditationComplete = async (reflection: string) => {
    if (!userId || !campId || !camp) return;

    // Save meditation completion
    const { error } = await supabase
      .from('wealth_journal_entries')
      .upsert({
        user_id: userId,
        camp_id: campId,
        day_number: camp.current_day,
        meditation_completed: true,
        meditation_reflection: reflection,
      }, {
        onConflict: 'user_id,camp_id,day_number',
      });

    if (!error) {
      setMeditationCompleted(true);
    }
  };

  // 检查今日打卡是否全部完成，触发祝贺弹窗
  const checkAndShowCelebration = () => {
    if (meditationCompleted && coachingCompleted) {
      setShowCelebration(true);
    }
  };

  // 当教练梳理完成时触发祝贺
  useEffect(() => {
    if (coachingCompleted && meditationCompleted) {
      // 延迟显示，让用户看到状态更新
      const timer = setTimeout(() => {
        setShowCelebration(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [coachingCompleted, meditationCompleted]);

  const handleStartCoaching = () => {
    navigate('/wealth-coach-4');
  };

  const scrollToInvite = () => {
    document.getElementById('invite-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMeditation = () => {
    document.getElementById('meditation-player')?.scrollIntoView({ behavior: 'smooth' });
  };

  const dailyTasks: DailyTask[] = [
    {
      id: 'meditation',
      title: '冥想课程',
      icon: '🧘',
      completed: meditationCompleted,
      action: scrollToMeditation,
    },
    {
      id: 'coaching',
      title: '教练梳理',
      icon: '💬',
      completed: coachingCompleted,
      action: handleStartCoaching,
      locked: !meditationCompleted,
    },
    {
      id: 'share',
      title: '打卡分享',
      icon: '📢',
      completed: false,
      action: () => setShowShareDialog(true),
      locked: !coachingCompleted,
    },
    {
      id: 'invite',
      title: '邀请好友',
      icon: '🎁',
      completed: false,
      action: scrollToInvite,
    },
  ];

  if (campLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">训练营不存在</p>
        <Button onClick={() => navigate('/training-camps')}>返回训练营列表</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">💰 突破财富卡点</h1>
            <p className="text-xs text-muted-foreground">Day {camp.current_day} / {camp.duration_days}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-amber-600">{camp.completed_days}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">今日打卡</TabsTrigger>
            <TabsTrigger value="calendar">日历</TabsTrigger>
            <TabsTrigger value="journal">日记回顾</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6 mt-6">
            {/* Meditation Player */}
            <div id="meditation-player">
              {meditation && (
                <WealthMeditationPlayer
                  dayNumber={camp.current_day}
                  title={meditation.title}
                  description={meditation.description}
                  audioUrl={meditation.audio_url}
                  durationSeconds={meditation.duration_seconds}
                  reflectionPrompts={meditation.reflection_prompts as string[] || []}
                  onComplete={handleMeditationComplete}
                  isCompleted={meditationCompleted}
                />
              )}
            </div>

            {/* Daily Tasks */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <span>📋</span> 今日打卡任务
                </h3>
                {dailyTasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      task.completed 
                        ? "bg-green-50 dark:bg-green-950/20" 
                        : task.locked
                          ? "bg-muted/30 opacity-50"
                          : "bg-muted/50 cursor-pointer hover:bg-muted"
                    )}
                    onClick={task.locked ? undefined : task.action}
                  >
                    <span className="text-xl">{task.icon}</span>
                    <span className="flex-1">{task.title}</span>
                    {task.completed ? (
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : task.locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">去完成 →</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Progress Chart */}
            <WealthProgressChart entries={journalEntries} />

            {/* Invite Card */}
            {userId && (
              <div id="invite-card">
                <WealthCampInviteCard
                  campId={campId}
                  dayNumber={camp.current_day}
                  userId={userId}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            {/* Simple calendar view */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                    <div key={day} className="text-xs text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 21 }, (_, i) => {
                    const day = i + 1;
                    const checkInDates = Array.isArray(camp.check_in_dates) ? camp.check_in_dates : [];
                    const dateStr = new Date(new Date(camp.start_date).getTime() + i * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split('T')[0];
                    const isCompleted = checkInDates.includes(dateStr);
                    const isCurrent = day === camp.current_day;
                    const isFuture = day > camp.current_day;

                    return (
                      <div
                        key={day}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg text-sm",
                          isCompleted && "bg-amber-500 text-white",
                          isCurrent && !isCompleted && "ring-2 ring-amber-500",
                          isFuture && "text-muted-foreground/50"
                        )}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="mt-6 space-y-4">
            {journalEntries.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>还没有财富日记</p>
                <p className="text-sm">完成财富梳理后自动生成</p>
              </div>
            ) : (
              journalEntries.map((entry) => (
                <WealthJournalCard
                  key={entry.id}
                  entry={entry}
                  onClick={() => navigate(`/wealth-journal/${entry.id}`)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <CampShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        campId={campId || ''}
        campName="21天突破财富卡点"
        campDay={camp.current_day}
      />

      {/* Celebration Dialog */}
      <CheckInCelebrationDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        consecutiveDays={camp.completed_days || 1}
        totalDays={camp.duration_days || 21}
        onShare={() => setShowShareDialog(true)}
        onInvite={scrollToInvite}
      />
    </div>
  );
}
