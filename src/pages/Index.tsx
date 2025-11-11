import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import DailyReminder from "@/components/DailyReminder";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Send, RotateCcw, History, LogOut, Loader2, Settings } from "lucide-react";

const Index = () => {
  const [input, setInput] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const { user, loading: authLoading, signOut } = useAuth();
  const { messages, isLoading, sendMessage, resetConversation } = useStreamChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && messages.length === 0) {
      checkReminder();
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

      const lastShown = profile.last_reminder_shown 
        ? new Date(profile.last_reminder_shown) 
        : null;
      
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

  const handleDismissReminder = async () => {
    setShowReminder(false);
    if (user) {
      await supabase
        .from("profiles")
        .update({ last_reminder_shown: new Date().toISOString() })
        .eq("id", user.id);
    }
  };

  const handleStartFromReminder = () => {
    setShowReminder(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRestart}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">重新开始</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/settings")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">设置</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/history")}
                className="gap-2"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">历史</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-xl mx-auto px-4 flex flex-col overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
            {showReminder && (
              <DailyReminder
                onStart={handleStartFromReminder}
                onDismiss={handleDismissReminder}
              />
            )}
            <div className="text-center space-y-6 w-full max-w-xl animate-in fade-in-50 duration-700">
              <div className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-bold text-foreground">
                  情绪梳理教练
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  劲老师会陪你一起走过情绪梳理4部曲的旅程
                </p>
              </div>
              <div className="bg-card border border-border rounded-3xl p-6 space-y-4 text-left shadow-lg animate-in fade-in-50 slide-in-from-bottom-6 duration-700 delay-200">
                <h3 className="font-semibold text-foreground flex items-center gap-2 text-base pb-1 border-b border-border/50">
                  <span className="text-primary">🌱</span>
                  情绪四部曲
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-3 items-center group hover:bg-accent/20 rounded-xl p-2 -m-2 transition-colors duration-200">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      1
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground text-sm">觉察 Feel it</span>
                      <span className="text-muted-foreground text-xs ml-2">停下来感受当前情绪</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center group hover:bg-accent/20 rounded-xl p-2 -m-2 transition-colors duration-200">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      2
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground text-sm">理解 Name it</span>
                      <span className="text-muted-foreground text-xs ml-2">理解情绪背后的需求</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center group hover:bg-accent/20 rounded-xl p-2 -m-2 transition-colors duration-200">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      3
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground text-sm">反应 React it</span>
                      <span className="text-muted-foreground text-xs ml-2">觉察情绪驱动的反应</span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center group hover:bg-accent/20 rounded-xl p-2 -m-2 transition-colors duration-200">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      4
                    </div>
                    <div className="flex-1">
                      <span className="font-semibold text-foreground text-sm">转化 Transform it</span>
                      <span className="text-muted-foreground text-xs ml-2">温柔回应情绪</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground px-4 animate-in fade-in-50 duration-700 delay-300">
                你愿意先一起看看你现在的感受吗？劲老师在这里陪着你 🌿
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-6">
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-card border border-border rounded-3xl px-5 py-3 shadow-sm">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce shadow-md shadow-primary/40" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary/75 rounded-full animate-bounce shadow-md shadow-primary/30" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce shadow-md shadow-primary/20" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="border-t border-border bg-card/80 backdrop-blur-md sticky bottom-0 safe-area-inset-bottom shadow-lg">
        <div className="container max-w-xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="分享你的感受..."
              className="min-h-[56px] max-h-[120px] resize-none rounded-2xl border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary shadow-sm focus-visible:shadow-md transition-all duration-300 text-base"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="rounded-2xl h-[56px] px-6 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:hover:scale-100 disabled:shadow-sm"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
