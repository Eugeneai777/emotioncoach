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
import { VoiceControls } from "@/components/VoiceControls";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { EmotionIntensitySelector } from "@/components/EmotionIntensitySelector";
import { IntensityReminderDialog } from "@/components/IntensityReminderDialog";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";

import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

import CampCheckInSuccessDialog from "@/components/camp/CampCheckInSuccessDialog";
import CommunityWaterfall from "@/components/community/CommunityWaterfall";
import { NotificationCard } from "@/components/NotificationCard";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCamp } from "@/types/trainingCamp";
import { Send, RotateCcw, History, LogOut, Loader2, Settings, Sparkles, ChevronDown, Bell, Video, Menu, User, Wallet, Clock, Tent, Users, Volume2, Target, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [autoDismissSeconds, setAutoDismissSeconds] = useState(10);
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [checkInSuccessData, setCheckInSuccessData] = useState<any>(null);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [voiceConfig, setVoiceConfig] = useState<{
    gender: 'male' | 'female';
    rate: number;
  }>({
    gender: 'female',
    rate: 0.9
  });
  const { toast } = useToast();

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
    videoRecommendations
  } = useStreamChat();
  const { 
    notifications, 
    loading: notificationsLoading,
    markAsRead, 
    deleteNotification,
    triggerNotification 
  } = useSmartNotification('emotion_coach');
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: voiceInputSupported
  } = useSpeechRecognition();
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: voiceOutputSupported,
    setVoiceGender,
    setVoiceRate
  } = useSpeechSynthesis(voiceConfig);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && voiceOutputSupported && !isLoading) {
        speak(lastMessage.content);
      }
      lastMessageCountRef.current = messages.length;
    }
  }, [messages, voiceOutputSupported, isLoading, speak]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      loadVoiceConfig();
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
        console.log('loadActiveCamp - Raw data:', data);
        console.log('loadActiveCamp - check_in_dates:', data.check_in_dates);
        
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

  const loadVoiceConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("voice_gender, voice_rate")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      if (data) {
        const config = {
          gender: data.voice_gender as 'male' | 'female' || 'female',
          rate: data.voice_rate || 0.9
        };
        setVoiceConfig(config);
        setVoiceGender(config.gender);
        setVoiceRate(config.rate);
      }
    } catch (error) {
      console.error("Error loading voice config:", error);
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
    // Just send a message to continue
    sendMessage("跳过强度记录，继续对话");
  };

  const handleSkipIntensity = () => {
    setShowIntensitySelector(false);
    setSelectedIntensity(null);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    stopSpeaking();
    if (isListening) {
      stopListening();
    }
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Left side - Menu & Back to home */}
            <div className="flex items-center gap-2">
              {/* Hamburger Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 md:h-9 px-2"
                  >
                    <Menu className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-card border shadow-lg z-50">
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=profile")}>
                    <User className="w-4 h-4 mr-2" />
                    个人资料
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=account")}>
                    <Wallet className="w-4 h-4 mr-2" />
                    账户
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=reminders")}>
                    <Clock className="w-4 h-4 mr-2" />
                    提醒设置
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=notifications")}>
                    <Bell className="w-4 h-4 mr-2" />
                    通知偏好
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=camp")}>
                    <Tent className="w-4 h-4 mr-2" />
                    训练营
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=companion")}>
                    <Users className="w-4 h-4 mr-2" />
                    情绪伙伴
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings?tab=voice")}>
                    <Volume2 className="w-4 h-4 mr-2" />
                    语音设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/packages")}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    全部产品
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/partner")}>
                    <Users className="w-4 h-4 mr-2" />
                    合伙人中心
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-primary hover:text-primary hover:bg-primary/10 transition-colors font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>返回主页</span>
                </Button>
              )}
            </div>

            {/* Right side - Main navigation */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* 教练空间快速切换 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                  >
                    <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                    <span className="hidden sm:inline">教练空间</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card border shadow-lg z-50">
                  <DropdownMenuItem 
                    onClick={() => navigate("/")}
                    className="gap-2"
                  >
                    <span className="text-blue-500">💙</span>
                    <div className="flex flex-col">
                      <span className="font-medium">情绪觉醒教练</span>
                      <span className="text-xs text-muted-foreground">日常情绪觉察与记录</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate("/parent-coach")}
                    className="gap-2"
                  >
                    <span className="text-purple-500">💜</span>
                    <div className="flex flex-col">
                      <span className="font-medium">家长情绪教练</span>
                      <span className="text-xs text-muted-foreground">亲子情绪四部曲</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/ai-coach")}
                    className="gap-2"
                  >
                    <span className="text-indigo-500">✨</span>
                    <div className="flex flex-col">
                      <span className="font-medium">AI 生活教练</span>
                      <span className="text-xs text-muted-foreground">四维健康分析</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/energy-studio")}
                    className="gap-2 text-primary"
                  >
                    <Target className="w-4 h-4" />
                    <span className="font-medium">查看全部教练</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/energy-studio")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">有劲生活馆</span>
                <span className="sm:hidden font-medium">生活馆</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/packages")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 border-amber-500/40 text-amber-700 hover:bg-amber-50 hover:border-amber-500/60 dark:text-amber-400 dark:hover:bg-amber-900/20 transition-all duration-300"
              >
                <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">全部产品</span>
                <span className="sm:hidden font-medium">产品</span>
              </Button>

              <Button
                size="sm"
                onClick={() => navigate("/history")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-primary text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-semibold border-0"
              >
                <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">我的情绪日记</span>
                <span className="sm:hidden font-medium">日记</span>
              </Button>

              <SmartNotificationCenter />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto pb-32">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">情绪觉醒教练</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  劲老师陪着你，一步步梳理情绪，重新找到情绪里的力量
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
                  <div className="animate-in fade-in-50 duration-300">
                    <div className="mb-card-gap flex items-center justify-between">
                      <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                        <span className="text-primary text-sm">🌱</span>
                        情绪四部曲
                      </h3>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => navigate("/introduction")}
                        className="text-xs text-primary hover:text-primary/80 p-0 h-auto"
                      >
                        了解更多 →
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-card-gap">
                      {/* Step 1: 觉察 */}
                      <Collapsible open={expandedStep === 1} onOpenChange={() => setExpandedStep(expandedStep === 1 ? null : 1)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                1
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <h4 className="font-medium text-foreground text-sm truncate">
                                  觉察
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">Feel it</p>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === 1 ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                            <p className="text-xs text-foreground leading-snug">
                              暂停活动，给自己空间感受此刻情绪
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Step 2: 理解 */}
                      <Collapsible open={expandedStep === 2} onOpenChange={() => setExpandedStep(expandedStep === 2 ? null : 2)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                2
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <h4 className="font-medium text-foreground text-sm truncate">
                                  理解
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">Name it</p>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === 2 ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                            <p className="text-xs text-foreground leading-snug">
                              探索情绪背后的需求和意义
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Step 3: 反应 */}
                      <Collapsible open={expandedStep === 3} onOpenChange={() => setExpandedStep(expandedStep === 3 ? null : 3)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                3
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <h4 className="font-medium text-foreground text-sm truncate">
                                  反应
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">React it</p>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === 3 ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                            <p className="text-xs text-foreground leading-snug">
                              觉察情绪驱动下的第一反应
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Step 4: 行动 */}
                      <Collapsible open={expandedStep === 4} onOpenChange={() => setExpandedStep(expandedStep === 4 ? null : 4)}>
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-background/50 rounded-card p-card-sm border border-border/50 hover:border-primary/30 transition-all duration-200 group cursor-pointer">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                4
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <h4 className="font-medium text-foreground text-sm truncate">
                                  行动
                                </h4>
                                <p className="text-xs text-muted-foreground truncate">Act it</p>
                              </div>
                              <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === 4 ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-1">
                          <div className="bg-background/30 rounded-card p-card-sm border border-border/30 space-y-1">
                            <p className="text-xs text-foreground leading-snug">
                              选择建设性行动满足需求
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
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
                        onClick={() => navigate("/camp-intro")}
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
                  
                  {/* Smart Notifications Display */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-card-lg p-card shadow-md">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-4">
                      <Bell className="h-4 w-4 text-green-600" />
                      <span className="text-green-700">智能提醒</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">情绪教练</span>
                    </h4>
                    
                    {notificationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        暂无新提醒
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <NotificationCard
                          key={notifications[currentNotificationIndex].id}
                          notification={notifications[currentNotificationIndex]}
                          onClick={() => markAsRead(notifications[currentNotificationIndex].id)}
                          onDelete={() => {
                            deleteNotification(notifications[currentNotificationIndex].id);
                            if (currentNotificationIndex >= notifications.length - 1) {
                              setCurrentNotificationIndex(0);
                            }
                          }}
                          colorTheme="green"
                        />
                        
                        {notifications.length > 1 && (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs text-green-600/70">
                              {currentNotificationIndex + 1} / {notifications.length}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length)}
                              className="h-7 text-xs border-green-300 text-green-600 hover:bg-green-50"
                            >
                              下一条
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
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

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20">
        <div className="container max-w-xl mx-auto px-4 py-3">
          {showIntensitySelector && (
            <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
              <EmotionIntensitySelector
                onSelect={handleIntensitySelect}
                onSkip={handleSkipIntensity}
              />
            </div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative group">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "正在聆听..." : "分享你的想法... (Enter发送，Shift+Enter换行)"}
                className="min-h-[80px] max-h-[160px] resize-none rounded-card-lg text-sm md:text-base border-border/50 focus:border-primary/50 transition-all duration-200 pr-16 shadow-sm"
                disabled={isLoading || isListening}
              />
              {input.length > 0 && (
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
                  {input.length}/2000
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <VoiceControls
                isListening={isListening}
                isSpeaking={isSpeaking}
                voiceSupported={voiceInputSupported && voiceOutputSupported}
                onStartListening={startListening}
                onStopListening={stopListening}
                onStopSpeaking={stopSpeaking}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-12 w-12 rounded-card-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
