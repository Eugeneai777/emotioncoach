import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import DailyReminder from "@/components/DailyReminder";
import StreakDisplay from "@/components/StreakDisplay";
import GoalProgressCard from "@/components/GoalProgressCard";
import TodayProgress from "@/components/TodayProgress";
import WeeklyProgress from "@/components/WeeklyProgress";
import { EmotionAlert } from "@/components/EmotionAlert";
import { VoiceControls } from "@/components/VoiceControls";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { EmotionIntensitySelector } from "@/components/EmotionIntensitySelector";
import { EmotionIntensitySlider } from "@/components/EmotionIntensitySlider";
import { IntensityReminderDialog } from "@/components/IntensityReminderDialog";
import { SmartNotificationCenter } from "@/components/SmartNotificationCenter";
import { AccountBalance } from "@/components/AccountBalance";
import { TrainingCampCard } from "@/components/camp/TrainingCampCard";
import { StartCampDialog } from "@/components/camp/StartCampDialog";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useAuth } from "@/hooks/useAuth";
import { useSmartNotification } from "@/hooks/useSmartNotification";
import { supabase } from "@/integrations/supabase/client";
import { TrainingCamp } from "@/types/trainingCamp";
import { Send, RotateCcw, History, LogOut, Loader2, Settings, Target, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [input, setInput] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [showIntensityReminder, setShowIntensityReminder] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [activeCamp, setActiveCamp] = useState<TrainingCamp | null>(null);
  const [showStartCamp, setShowStartCamp] = useState(false);
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
    resetConversation
  } = useStreamChat();
  const { triggerNotification } = useSmartNotification();
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

  const loadActiveCamp = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('training_camps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setActiveCamp({
          ...data,
          check_in_dates: Array.isArray(data.check_in_dates) ? data.check_in_dates : []
        } as TrainingCamp);
      }
    } catch (error) {
      console.error('Error loading active camp:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !activeCamp) return;

    const today = format(new Date(), 'yyyy-MM-dd');
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
        .select("reminder_enabled, reminder_time, last_reminder_shown")
        .eq("id", user.id)
        .single();
      if (!profile || !profile.reminder_enabled) return;
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
        onSuccess={loadActiveCamp}
      />

      {showIntensityReminder && (
        <IntensityReminderDialog
          onRecord={handleIntensityReminderRecord}
          onDismiss={handleDismissIntensityReminder}
        />
      )}

      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <AccountBalance />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">重新开始</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <SmartNotificationCenter />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/goals")}
                className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">目标</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/settings")}
                className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">设置</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/history")}
                className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300"
              >
                <History className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">我的情绪日记</span>
                <span className="sm:hidden font-medium">日记</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            {showReminder && (
              <DailyReminder onStart={handleStartFromReminder} onDismiss={handleDismissReminder} />
            )}

            {!activeCamp && (
              <div className="w-full mb-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🏕️ 21天情绪日记训练营
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    用21天养成情绪记录习惯，获得专属徽章和成长洞察
                  </p>
                  <Button onClick={() => setShowStartCamp(true)} className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    开启训练营
                  </Button>
                </div>
              </div>
            )}

            {activeCamp && (
              <div className="w-full mb-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <TrainingCampCard camp={activeCamp} onCheckIn={handleCheckIn} />
              </div>
            )}

            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">情绪觉醒教练</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  劲老师陪着你，一步步梳理情绪，重新找到情绪里的力量
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 md:p-6 text-left shadow-lg animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                <div className="mb-2.5 md:mb-3">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 text-base md:text-lg">
                    <span className="text-primary">🌱</span>
                    情绪四部曲
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm group">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          觉察 <span className="text-primary/70 font-medium text-xs ml-1">Feel it</span>
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">停下来感受当前情绪</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm group">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          理解 <span className="text-primary/70 font-medium text-xs ml-1">Name it</span>
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">理解情绪背后的需求</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm group">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          反应 <span className="text-primary/70 font-medium text-xs ml-1">React it</span>
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">觉察情绪驱动的反应</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-sm group">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        4
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-sm">
                          行动 <span className="text-primary/70 font-medium text-xs ml-1">Act it</span>
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">采取建设性的行动</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 md:py-6 space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <ChatMessage key={index} role={message.role} content={message.content} />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-2xl p-3 md:p-4 shadow-sm">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-primary" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          {showIntensitySelector && (
            <EmotionIntensitySelector
              onSelect={handleIntensitySelect}
              onSkip={handleSkipIntensity}
            />
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "正在聆听..." : "分享你的想法..."}
                className="min-h-[80px] md:min-h-[100px] resize-none rounded-2xl text-sm md:text-base"
                disabled={isLoading || isListening}
              />
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
                className="h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>
            </div>
          </div>
          <EmotionIntensitySlider />
        </div>
      </footer>
    </div>
  );
};

export default Index;
