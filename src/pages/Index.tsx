import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatEmotionIntensityPrompt } from "@/components/ChatEmotionIntensityPrompt";
import DailyReminder from "@/components/DailyReminder";
import StreakDisplay from "@/components/StreakDisplay";
import GoalProgressCard from "@/components/GoalProgressCard";
import TodayProgress from "@/components/TodayProgress";
import WeeklyProgress from "@/components/WeeklyProgress";
import { EmotionAlert } from "@/components/EmotionAlert";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { EmotionIntensitySelector } from "@/components/EmotionIntensitySelector";
import { IntensityReminderDialog } from "@/components/IntensityReminderDialog";
import { CoachScenarioChips } from "@/components/coach/CoachScenarioChips";
import { CoachHeader } from "@/components/coach/CoachHeader";
import { useCoachTemplate } from "@/hooks/useCoachTemplates";

import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

import CampCheckInSuccessDialog from "@/components/camp/CampCheckInSuccessDialog";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { NotificationCard } from "@/components/NotificationCard";
import { StageProgress } from "@/components/coach/StageProgress";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCamp } from "@/types/trainingCamp";
import { Send, RotateCcw, Loader2, ChevronDown, Sparkles, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getTodayInBeijing, getDaysSinceStart } from "@/utils/dateUtils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Index = () => {
  const [input, setInput] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [showIntensityReminder, setShowIntensityReminder] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [activeCamp, setActiveCamp] = useState<TrainingCamp | null>(null);
  const [showStartCamp, setShowStartCamp] = useState(false);
const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [isStepsCardExpanded, setIsStepsCardExpanded] = useState(true);
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState<any>(null);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { toast } = useToast();
  
  // 从数据库加载教练配置
  const { data: coachConfig } = useCoachTemplate('emotion');

  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const {
    messages,
    isLoading,
    sendMessage,
    resetConversation,
    removeIntensityPrompt,
    videoRecommendations,
    currentStage
  } = useStreamChat();
  const { 
    notifications, 
    loading: notificationsLoading,
    markAsRead, 
    deleteNotification,
    triggerNotification 
  } = useSmartNotification('emotion_coach');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 检查情绪四部曲卡片是否首次访问
  useEffect(() => {
    const hasSeenStepsCard = localStorage.getItem('has_seen_steps_card');
    if (hasSeenStepsCard) {
      setIsStepsCardExpanded(false);
    } else {
      localStorage.setItem('has_seen_steps_card', 'true');
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      checkOnboarding();
      loadActiveCamp();
    }
  }, [user, authLoading, navigate]);

  // Listen for check-in success events
  useEffect(() => {
    const handleCheckInSuccess = (event: any) => {
      const { campId, campName, campDay, briefingId, briefingData } = event.detail;
      setCheckInSuccessData({
        campId,
        campName,
        campDay,
        briefingId,
        emotionTheme: briefingData.emotion_theme,
        emotionIntensity: briefingData.emotion_intensity,
        insight: briefingData.insight,
        action: briefingData.action
      });
      setShowCheckInSuccess(true);
      loadActiveCamp();
    };

    window.addEventListener('camp-checkin-success', handleCheckInSuccess);
    return () => {
      window.removeEventListener('camp-checkin-success', handleCheckInSuccess);
    };
  }, []);

  // Auto dismiss reminder
  useEffect(() => {
    if (showReminder && autoDismissSeconds > 0) {
      const timer = setTimeout(() => {
        handleDismissReminder();
      }, autoDismissSeconds * 1000);

      return () => clearTimeout(timer);
    }
  }, [showReminder, autoDismissSeconds]);

  // Auto refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadActiveCamp();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const loadActiveCamp = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('camp_type', 'emotion_journal_21')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        
        // 动态计算 current_day，基于 start_date 和今天的日期
        const calculatedCurrentDay = Math.max(1, 
          getDaysSinceStart(data.start_date) + 1
        );
        // 不超过训练营总天数
        const finalCurrentDay = Math.min(calculatedCurrentDay, data.duration_days);
        
        setActiveCamp({
          ...data,
          check_in_dates: Array.isArray(data.check_in_dates) ? data.check_in_dates : [],
          current_day: finalCurrentDay
        } as TrainingCamp);
      } else {
        setActiveCamp(null);
      }
    } catch (error) {
      console.error('Error loading active camp:', error);
      setActiveCamp(null);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !activeCamp) return;

    const today = getTodayInBeijing();
    if (activeCamp.check_in_dates.includes(today)) {
      toast({
        title: "今天已打卡",
        description: "每天只能打卡一次哦"
      });
      return;
    }

    try {
      const newCheckInDates = [...activeCamp.check_in_dates, today];
      const newCompletedDays = newCheckInDates.length;
      const newCurrentDay = activeCamp.current_day + 1;

      const updates: any = {
        check_in_dates: newCheckInDates,
        completed_days: newCompletedDays,
        current_day: newCurrentDay
      };

      // Check milestones
      if (newCompletedDays >= 7 && !activeCamp.milestone_7_reached) {
        updates.milestone_7_reached = true;
        toast({
          title: "🎉 达成里程碑！",
          description: "恭喜获得「一周勇士」徽章！",
          duration: 5000
        });
      }
      if (newCompletedDays >= 14 && !activeCamp.milestone_14_reached) {
        updates.milestone_14_reached = true;
        toast({
          title: "🎉 达成里程碑！",
          description: "恭喜获得「半程达人」徽章！",
          duration: 5000
        });
      }
      if (newCompletedDays >= 21) {
        updates.milestone_21_completed = true;
        updates.status = 'completed';
        toast({
          title: "🏆 训练营毕业！",
          description: "恭喜完成21天情绪日记训练营！",
          duration: 5000
        });
      }

      const { error } = await supabase
        .from('training_camps')
        .update(updates)
        .eq('id', activeCamp.id);

      if (error) throw error;

      loadActiveCamp();
      toast({
        title: "打卡成功！",
        description: `连续打卡 ${newCompletedDays} 天`
      });
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "打卡失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  };

  const checkOnboarding = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("has_seen_onboarding")
        .eq("id", user.id)
        .single();
      if (data && !data.has_seen_onboarding) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const handleOnboardingComplete = async () => {
    if (!user) return;
    try {
      await supabase
        .from("profiles")
        .update({ has_seen_onboarding: true })
        .eq("id", user.id);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
  };

  useEffect(() => {
    if (user && messages.length === 0) {
      checkReminder();
      checkIntensityReminder();
    }
  }, [user, messages]);

  const checkReminder = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("reminder_enabled, reminder_time, last_reminder_shown, reminder_auto_dismiss_seconds")
        .eq("id", user.id)
        .single();
      if (!profile || !profile.reminder_enabled) return;
      
      // Set auto dismiss seconds
      setAutoDismissSeconds(profile.reminder_auto_dismiss_seconds ?? 10);
      
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [hours, minutes] = (profile.reminder_time || "20:00").split(":");
      const reminderTime = parseInt(hours) * 60 + parseInt(minutes);
      if (currentTime < reminderTime) return;
      const lastShown = profile.last_reminder_shown ? new Date(profile.last_reminder_shown) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!lastShown || lastShown < today) {
        const { data: todayConversations } = await supabase
          .from("conversations")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .limit(1);
        if (!todayConversations || todayConversations.length === 0) {
          setShowReminder(true);
        }
      }
    } catch (error) {
      console.error("Error checking reminder:", error);
    }
  };

  const checkIntensityReminder = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("intensity_reminder_enabled, intensity_reminder_time, last_intensity_reminder_shown")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.intensity_reminder_enabled) return;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [hours, minutes] = (profile.intensity_reminder_time || "21:00").split(":");
      const reminderTime = parseInt(hours) * 60 + parseInt(minutes);

      if (currentTime < reminderTime) return;

      const lastShown = profile.last_intensity_reminder_shown
        ? new Date(profile.last_intensity_reminder_shown)
        : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!lastShown || lastShown < today) {
        const { data: todayLogs } = await supabase
          .from("emotion_quick_logs")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", today.toISOString())
          .limit(1);

        if (!todayLogs || todayLogs.length === 0) {
          setShowIntensityReminder(true);
        }
      }
    } catch (error) {
      console.error("Error checking intensity reminder:", error);
    }
  };

  const handleDismissReminder = async () => {
    setShowReminder(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_reminder_shown: new Date().toISOString() })
        .eq("id", user.id);
    }
    if (selectedIntensity === null) {
      setShowIntensitySelector(true);
    }
  };

  const handleStartFromReminder = () => {
    setShowReminder(false);
    setShowIntensitySelector(true);
  };

  const handleIntensityReminderRecord = () => {
    setShowIntensityReminder(false);
  };

  const handleDismissIntensityReminder = async () => {
    setShowIntensityReminder(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_intensity_reminder_shown: new Date().toISOString() })
        .eq("id", user.id);
    }
  };

  const handleIntensitySelect = (intensity: number) => {
    setSelectedIntensity(intensity);
    setShowIntensitySelector(false);
    const message = `我现在的情绪强度是 ${intensity}/10`;
    setInput("");
    sendMessage(message);
  };

  const handleChatIntensitySelect = async (intensity: number) => {
    // Remove intensity prompt card from UI first
    removeIntensityPrompt();
    
    const message = `我现在的情绪强度是 ${intensity}/10`;
    await sendMessage(message);
    
    // Save to emotion_quick_logs
    if (user) {
      try {
        await supabase.from("emotion_quick_logs").insert({
          user_id: user.id,
          emotion_intensity: intensity,
          note: "从对话中记录"
        });
      } catch (error) {
        console.error("Error saving intensity log:", error);
      }
    }
  };

  const handleDismissChatIntensity = () => {
    // Remove intensity prompt card from UI first
    removeIntensityPrompt();
    // Continue conversation
    sendMessage("跳过强度记录，继续对话");
  };

  const handleSkipIntensity = () => {
    setShowIntensitySelector(false);
    setSelectedIntensity(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    resetConversation();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-green-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-green-950/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-green-50/30 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-green-950/10 flex flex-col">
      <WelcomeOnboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      <StartCampDialog
        open={showStartCamp}
        onOpenChange={setShowStartCamp}
        campTemplate={{
          camp_type: 'emotion_journal_21',
          camp_name: '21天情绪日记训练营',
          duration_days: 21,
          icon: '📝'
        }}
        onSuccess={loadActiveCamp}
      />
      
      {checkInSuccessData && (
        <CampCheckInSuccessDialog
          open={showCheckInSuccess}
          onOpenChange={setShowCheckInSuccess}
          campId={checkInSuccessData.campId}
          campName={checkInSuccessData.campName}
          campDay={checkInSuccessData.campDay}
          briefingId={checkInSuccessData.briefingId}
          emotionTheme={checkInSuccessData.emotionTheme}
          emotionIntensity={checkInSuccessData.emotionIntensity}
          insight={checkInSuccessData.insight}
          action={checkInSuccessData.action}
        />
      )}

      {showIntensityReminder && (
        <IntensityReminderDialog
          onRecord={handleIntensityReminderRecord}
          onDismiss={handleDismissIntensityReminder}
        />
      )}

      <CoachHeader
        emoji="💚"
        primaryColor="green"
        historyRoute="/history"
        historyLabel="我的情绪日记"
        historyLabelShort="日记"
        hasMessages={messages.length > 0}
        onRestart={handleRestart}
        onSignOut={handleSignOut}
        currentCoachKey="emotion"
      />

      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto overscroll-none scroll-container pb-44">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  {coachConfig?.title || '情绪觉醒教练'}
                </h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {coachConfig?.description || '劲老师陪着你，一步步梳理情绪，重新找到情绪里的力量'}
                </p>
              </div>

              {/* 情绪四部曲 / 每日提醒 - 同位置切换展示 */}
              <div className="bg-card border border-border rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                {showReminder ? (
                  <div className="animate-in fade-in-50 duration-300">
                    <div className="text-center space-y-3">
                      <p className="text-2xl">🌿</p>
                      <h3 className="font-semibold text-foreground text-base md:text-lg">
                        温柔的提醒
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        今天的情绪，想和劲老师一起梳理吗？
                      </p>
                      <p className="text-sm text-muted-foreground/80 leading-relaxed">
                        无论是什么感受，都值得被看见和理解。劲老师在这里陪着你 💫
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button onClick={handleStartFromReminder} className="flex-1">
                        开始梳理
                      </Button>
                      <Button onClick={handleDismissReminder} variant="outline" className="flex-1">
                        稍后再说
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Collapsible 
                    open={isStepsCardExpanded} 
                    onOpenChange={setIsStepsCardExpanded}
                    className="animate-in fade-in-50 duration-300"
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                          <span className="text-primary text-sm">{coachConfig?.steps_emoji || '🌱'}</span>
                          {coachConfig?.steps_title || '情绪四部曲'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span 
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/introduction");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                navigate("/introduction");
                              }
                            }}
                            className="text-xs text-primary hover:text-primary/80 cursor-pointer hover:underline"
                          >
                            了解更多 →
                          </span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isStepsCardExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-card-gap">
                      <div className="grid grid-cols-2 gap-card-gap">
                        {(coachConfig?.steps || []).map((step, index) => (
                          <Collapsible 
                            key={step.id} 
                            open={expandedStep === step.id} 
                            onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                          >
                            <CollapsibleTrigger className="w-full">
                              <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                    {step.emoji || step.id}
                                  </div>
                                  <div className="flex-1 text-left min-w-0">
                                    <h4 className="font-medium text-foreground text-sm truncate">
                                      {step.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">{step.subtitle}</p>
                                  </div>
                                  <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === step.id ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1">
                              <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                                <p className="text-xs text-foreground leading-snug">
                                  {step.description}
                                </p>
                                {step.details && (
                                  <p className="text-xs text-muted-foreground leading-snug whitespace-pre-line">
                                    {step.details}
                                  </p>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>

              {!activeCamp && (
                <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <div className="bg-card border border-border rounded-card-lg p-card-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-card-gap">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        🏕️ 21天情绪日记训练营
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-card">
                      用21天养成情绪记录习惯，获得专属徽章和成长洞察
                    </p>
                    <div className="flex gap-3">
                      <Button onClick={() => setShowStartCamp(true)} className="flex-1">
                        <Sparkles className="h-4 w-4 mr-2" />
                        开启训练营
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => navigate("/camps")}
                        className="flex-1"
                      >
                        了解详情
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeCamp && (
                <div className="w-full mt-6 space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <TrainingCampCard camp={activeCamp} onCheckIn={handleCheckIn} />
                  
                  {/* 情绪关注提醒 - 当检测到连续高强度情绪时显示 */}
                  <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                    <EmotionAlert />
                  </div>
                  
                  {/* Smart Notifications Display - 只显示未读通知，无未读时隐藏整个区域 */}
                  {(() => {
                    const unreadNotifications = notifications.filter(n => !n.is_read);
                    
                    // 加载中或无未读通知时不显示整个区域
                    if (notificationsLoading || unreadNotifications.length === 0) {
                      return null;
                    }
                    
                    const safeIndex = Math.min(currentNotificationIndex, Math.max(0, unreadNotifications.length - 1));
                    
                    return (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-card-lg p-card shadow-md animate-in fade-in-50 duration-300">
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                          <Bell className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">智能提醒</span>
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">情绪教练</span>
                        </h4>
                        
                        <div className="space-y-3">
                          <NotificationCard
                            key={unreadNotifications[safeIndex].id}
                            notification={unreadNotifications[safeIndex]}
                            onClick={() => {
                              markAsRead(unreadNotifications[safeIndex].id);
                              // 已读后重置索引，防止越界
                              if (safeIndex >= unreadNotifications.length - 1) {
                                setCurrentNotificationIndex(0);
                              }
                            }}
                            onDelete={() => {
                              deleteNotification(unreadNotifications[safeIndex].id);
                              if (safeIndex >= unreadNotifications.length - 1) {
                                setCurrentNotificationIndex(0);
                              }
                            }}
                            colorTheme="green"
                          />
                          
                          {unreadNotifications.length > 1 && (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs text-green-600/70">
                                {safeIndex + 1} / {unreadNotifications.length}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentNotificationIndex((prev) => (prev + 1) % unreadNotifications.length)}
                                className="h-7 text-xs border-green-300 text-green-600 hover:bg-green-50"
                              >
                                下一条
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  
                </div>
              )}

              {/* 有劲社区 - 瀑布流展示 */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <CommunityWaterfall />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 md:py-6 space-y-3 md:space-y-4">
            {currentStage > 0 && messages.length > 0 && (
              <StageProgress 
                currentStage={currentStage} 
                stages={["觉察", "理解", "反应", "转化"]} 
              />
            )}
            {messages.map((message, index) => {
              // Check if this is an intensity prompt message
              if (message.type === "intensity_prompt") {
                return (
                  <ChatEmotionIntensityPrompt
                    key={index}
                    onSelect={handleChatIntensitySelect}
                    onDismiss={handleDismissChatIntensity}
                  />
                );
              }
              return (
                <ChatMessage 
                  key={index} 
                  role={message.role} 
                  content={message.content}
                  onOptionClick={(option) => {
                    sendMessage(option);
                  }}
                  onOptionSelect={(option) => {
                    setInput(option);
                  }}
                  videoRecommendations={videoRecommendations}
                  isLastMessage={index === messages.length - 1}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-card-lg p-card shadow-sm">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20 safe-bottom">
        <div className="container max-w-xl mx-auto px-3 md:px-4 pt-2 pb-2">
          {/* 键盘弹出时隐藏场景标签和强度选择器 */}
          {!isInputFocused && showIntensitySelector && (
            <div className="mb-2 animate-in slide-in-from-bottom-2 duration-300">
              <EmotionIntensitySelector
                onSelect={handleIntensitySelect}
                onSkip={handleSkipIntensity}
              />
            </div>
          )}
          {!isInputFocused && messages.length === 0 && coachConfig?.enable_scenarios && coachConfig?.scenarios && (
            <div className="mb-2 animate-in slide-in-from-bottom-2 duration-300">
                <CoachScenarioChips
                  scenarios={coachConfig.scenarios as any[]}
                  onSelectScenario={(prompt) => {
                    setInput(prompt);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  primaryColor={coachConfig.primary_color}
                />
            </div>
          )}
          {/* 微信式单行输入 */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="分享你的想法..."
                className="min-h-[40px] max-h-[100px] resize-none rounded-2xl text-base py-2.5 px-3 leading-relaxed"
                style={{ fontSize: '16px' }}
                disabled={isLoading}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-10 w-10 min-w-[40px] flex-shrink-0 rounded-full shadow-md"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
