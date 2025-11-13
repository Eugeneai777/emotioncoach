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
import { useStreamChat } from "@/hooks/useStreamChat";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Send, RotateCcw, History, LogOut, Loader2, Settings, Target } from "lucide-react";
const Index = () => {
  const [input, setInput] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showIntensitySelector, setShowIntensitySelector] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<number | null>(null);
  const [voiceConfig, setVoiceConfig] = useState<{
    gender: 'male' | 'female';
    rate: number;
  }>({
    gender: 'female',
    rate: 0.9
  });
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

  // 自动将语音识别结果填入输入框
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // 自动朗读助手的新消息
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
    }
  }, [user, authLoading, navigate]);
  const checkOnboarding = async () => {
    if (!user) return;
    try {
      const {
        data
      } = await supabase.from("profiles").select("has_seen_onboarding").eq("id", user.id).single();
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
      await supabase.from("profiles").update({
        has_seen_onboarding: true
      }).eq("id", user.id);
      setShowOnboarding(false);
    } catch (error) {
      console.error("Error updating onboarding status:", error);
    }
  };
  const loadVoiceConfig = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("profiles").select("voice_gender, voice_rate").eq("id", user!.id).single();
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
    }
  }, [user, messages]);
  const checkReminder = async () => {
    if (!user) return;
    try {
      const {
        data: profile
      } = await supabase.from("profiles").select("reminder_enabled, reminder_time, last_reminder_shown").eq("id", user.id).single();
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
        const {
          data: todayConversations
        } = await supabase.from("conversations").select("id").eq("user_id", user.id).gte("created_at", today.toISOString()).limit(1);
        if (!todayConversations || todayConversations.length === 0) {
          setShowReminder(true);
        }
      }
    } catch (error) {
      console.error("Error checking reminder:", error);
    }
  };
  const handleDismissReminder = async () => {
    setShowReminder(false);
    if (user) {
      await supabase.from("profiles").update({
        last_reminder_shown: new Date().toISOString()
      }).eq("id", user.id);
    }
    // 关闭提醒后，显示情绪强度选择器
    if (selectedIntensity === null) {
      setShowIntensitySelector(true);
    }
  };
  const handleStartFromReminder = () => {
    setShowReminder(false);
    setShowIntensitySelector(true);
  };
  
  const handleIntensitySelect = (intensity: number) => {
    setSelectedIntensity(intensity);
    setShowIntensitySelector(false);
    // 自动开始对话，告诉AI用户的情绪强度
    const message = `我现在的情绪强度是 ${intensity}/10`;
    setInput("");
    sendMessage(message);
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
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="min-h-screen bg-background flex flex-col">
      <WelcomeOnboarding open={showOnboarding} onComplete={handleOnboardingComplete} />
      
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-2">
              {messages.length > 0 && <Button variant="ghost" size="sm" onClick={handleRestart} className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors">
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">重新开始</span>
                </Button>}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/goals")} 
                className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">目标</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors">
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
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto">
        {messages.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            {showReminder && <DailyReminder onStart={handleStartFromReminder} onDismiss={handleDismissReminder} />}
            
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">情绪觉醒教练</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">劲老师陪着你，一步步梳理情绪，重新找到情绪里的力量</p>
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
                          转化 <span className="text-primary/70 font-medium text-xs ml-1">Transform it</span>
                        </h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">温柔回应情绪</p>
                  </div>
                </div>
              </div>
              
              {/* Emotion Intensity Selector */}
              {selectedIntensity === null && (
                <div className="animate-in fade-in-50 duration-700 delay-250">
                  <EmotionIntensitySelector 
                    onSelect={handleIntensitySelect}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {/* Emotion Alert */}
              <div className="animate-in fade-in-50 duration-700 delay-300">
                <EmotionAlert />
              </div>

              {/* Today Progress */}
              <div className="animate-in fade-in-50 duration-700 delay-300">
                <TodayProgress />
              </div>

              {/* Weekly Progress */}
              <div className="animate-in fade-in-50 duration-700 delay-350">
                <WeeklyProgress />
              </div>

              {/* Streak Display */}
              <div className="animate-in fade-in-50 duration-700 delay-400">
                <StreakDisplay />
              </div>

              {/* Goal Progress */}
              <div className="animate-in fade-in-50 duration-700 delay-450">
                <GoalProgressCard />
              </div>
              
              <p className="text-xs md:text-sm text-muted-foreground px-3 md:px-4 animate-in fade-in-50 duration-700 delay-500 pt-1">
                你愿意先一起看看你现在的感受吗？劲老师在这里陪着你 🌿
              </p>
            </div>
          </div> : <div className="flex-1 py-4 md:py-6">
            <div className="space-y-2 md:space-y-3">
              {messages.map((msg, idx) => <ChatMessage key={idx} role={msg.role} content={msg.content} />)}
              {isLoading && <div className="flex justify-start mb-3 md:mb-4">
                  <div className="bg-card border border-border rounded-2xl md:rounded-3xl px-4 md:px-5 py-2.5 md:py-3 shadow-sm">
                    <div className="flex gap-1.5 md:gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-bounce shadow-md shadow-primary/40" style={{
                  animationDelay: "0ms"
                }} />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/75 rounded-full animate-bounce shadow-md shadow-primary/30" style={{
                  animationDelay: "150ms"
                }} />
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary/50 rounded-full animate-bounce shadow-md shadow-primary/20" style={{
                  animationDelay: "300ms"
                }} />
                    </div>
                  </div>
                </div>}
              <div ref={messagesEndRef} />
            </div>
          </div>}
      </main>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 safe-area-inset-bottom shadow-lg">
        <div className="container max-w-xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex gap-2 md:gap-3 items-end">
            <VoiceControls isListening={isListening} isSpeaking={isSpeaking} onStartListening={startListening} onStopListening={stopListening} onStopSpeaking={stopSpeaking} disabled={isLoading} voiceSupported={voiceInputSupported || voiceOutputSupported} />
            <Textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isListening ? "正在聆听..." : "分享你的感受..."} className="min-h-[48px] md:min-h-[56px] max-h-[100px] md:max-h-[120px] resize-none rounded-xl md:rounded-2xl border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary shadow-sm focus-visible:shadow-md transition-all duration-300 text-sm md:text-base" disabled={isLoading || isListening} />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="lg" className="rounded-xl md:rounded-2xl h-[48px] md:h-[56px] px-4 md:px-6 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:hover:scale-100 disabled:shadow-sm">
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default Index;