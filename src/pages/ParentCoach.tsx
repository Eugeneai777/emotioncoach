import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { useParentCoach } from "@/hooks/useParentCoach";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { VoiceControls } from "@/components/VoiceControls";
import { ParentJourneySummary } from "@/components/coach/ParentJourneySummary";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Send, 
  RotateCcw, 
  History, 
  LogOut, 
  Loader2, 
  Settings, 
  Sparkles, 
  ChevronDown, 
  Bell, 
  Video, 
  Menu, 
  User, 
  Wallet, 
  Clock, 
  Tent, 
  Users, 
  Volume2,
  Heart
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const parentStages = [
  { 
    id: 1, 
    name: "觉察", 
    subtitle: "Feel it", 
    description: "暂停，觉察自己的第一反应是什么" 
  },
  { 
    id: 2, 
    name: "看见", 
    subtitle: "See it", 
    description: "观察孩子当下的反应和可能的需求" 
  },
  { 
    id: 3, 
    name: "卡点", 
    subtitle: "Sense it", 
    description: "发现自己反复被卡住的模式" 
  },
  { 
    id: 4, 
    name: "转化", 
    subtitle: "Transform it", 
    description: "选择一个不带压力的小行动" 
  }
];

export default function ParentCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    session,
    messages,
    isLoading,
    createSession,
    sendMessage
  } = useParentCoach();

  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
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
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const initSession = async () => {
      if (!session && user && !isLoading) {
        await createSession(campId || undefined);
      }
    };
    
    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, session, isLoading]);

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

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(message);
    
    if (response?.completed && response?.briefingId) {
      setShowSummary(true);
      setBriefing(response.toolCall?.args);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    stopSpeaking();
    if (isListening) {
      stopListening();
    }
    await handleSendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    setShowSummary(false);
    setBriefing(null);
    createSession(campId || undefined);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleShare = () => {
    toast({
      title: "分享功能开发中",
      description: "即将上线社区分享功能"
    });
  };

  const handleDownload = () => {
    toast({
      title: "导出功能开发中",
      description: "即将支持导出简报为图片"
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white flex flex-col">
      {/* Header */}
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
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {messages.length > 0 && !showSummary && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 text-purple-600 hover:text-purple-600 hover:bg-purple-100 transition-colors font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>返回主页</span>
                </Button>
              )}
            </div>

            {/* Right side - Main navigation */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <Button
                size="sm"
                onClick={() => navigate("/parent-diary")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Heart className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">我的亲子日记</span>
                <span className="sm:hidden font-medium">日记</span>
              </Button>

              <Button
                size="sm"
                onClick={() => navigate("/energy-studio")}
                className="gap-1.5 text-xs md:text-sm h-8 md:h-9 px-3 md:px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline font-medium">有劲生活馆</span>
                <span className="sm:hidden font-medium">生活馆</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-xl mx-auto px-3 md:px-4 flex flex-col overflow-y-auto pb-32">
        {messages.length === 0 && !showSummary ? (
          <div className="flex-1 flex flex-col items-center justify-center py-6 md:py-8 px-3 md:px-4">
            <div className="text-center space-y-3 md:space-y-4 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-1.5 md:space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">家长情绪教练</h2>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  劲老师陪着你，用四部曲化解亲子情绪困扰
                </p>
              </div>

              {/* 亲子情绪四部曲 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-card-lg p-card text-left shadow-md hover:shadow-lg transition-shadow duration-300 animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                <div className="mb-card-gap flex items-center justify-between">
                  <h3 className="font-medium text-foreground flex items-center gap-1.5 text-sm">
                    <span className="text-purple-600 text-sm">💜</span>
                    亲子情绪四部曲
                  </h3>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => navigate("/parent-camp-landing")}
                    className="text-xs text-purple-600 hover:text-purple-700 p-0 h-auto"
                  >
                    了解更多 →
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-card-gap">
                  {parentStages.map((stage) => (
                    <Collapsible 
                      key={stage.id}
                      open={expandedStep === stage.id} 
                      onOpenChange={() => setExpandedStep(expandedStep === stage.id ? null : stage.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="bg-white/70 rounded-card p-card-sm border border-purple-200/50 hover:border-purple-400/50 transition-all duration-200 group cursor-pointer">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold text-xs group-hover:bg-purple-500 group-hover:text-white transition-all">
                              {stage.id}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">
                                {stage.name}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">{stage.subtitle}</p>
                            </div>
                            <ChevronDown className={`w-3 h-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${expandedStep === stage.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1">
                        <div className="bg-white/50 rounded-card p-card-sm border border-purple-200/30 space-y-1">
                          <p className="text-xs text-foreground leading-snug">
                            {stage.description}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>

              {/* 家长情绪训练营 */}
              <div className="w-full mt-6 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-card-lg p-card-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-card-gap">
                    <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      🏕️ 家长情绪训练营
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-card">
                    用21天养成亲子情绪觉察习惯，建立更和谐的亲子关系
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => navigate("/camps")} 
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Heart className="h-4 w-4 mr-2" />
                      查看训练营
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/parent-camp-landing")}
                      className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                    >
                      了解详情
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : showSummary ? (
          <div className="flex-1 py-6 space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">🎉 完成四部曲旅程</h2>
              <p className="text-muted-foreground">
                恭喜你完成了今天的情绪觉察之旅
              </p>
            </div>
            
            {briefing && (
              <ParentJourneySummary
                briefing={briefing}
                onShare={handleShare}
                onDownload={handleDownload}
              />
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50"
                onClick={() => navigate('/camps')}
              >
                返回训练营
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                onClick={handleRestart}
              >
                开始新的对话
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 md:py-6 space-y-3 md:space-y-4">
            {messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                role={message.role as "user" | "assistant"} 
                content={message.content}
                onOptionClick={(option) => {
                  handleSendMessage(option);
                }}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-card rounded-card-lg p-card shadow-sm">
                  <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-purple-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Footer - Fixed bottom input */}
      {!showSummary && (
        <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/98 backdrop-blur-xl shadow-2xl z-20">
          <div className="container max-w-xl mx-auto px-4 py-3">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative group">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isListening ? "正在聆听..." : "分享一件亲子互动中的小事... (Enter发送，Shift+Enter换行)"}
                  className="min-h-[80px] max-h-[160px] resize-none rounded-card-lg text-sm md:text-base border-purple-200 focus:border-purple-400 transition-all duration-200 pr-16 shadow-sm"
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
                  className="h-12 w-12 rounded-card-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
      )}
    </div>
  );
}
