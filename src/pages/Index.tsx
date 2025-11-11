import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { StageIndicator } from "@/components/StageIndicator";
import { useStreamChat } from "@/hooks/useStreamChat";
import { Send, Sparkles, RotateCcw } from "lucide-react";

const Index = () => {
  const [input, setInput] = useState("");
  const [currentStage, setCurrentStage] = useState(0);
  const { messages, isLoading, sendMessage } = useStreamChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput("");
    
    // 简单的阶段推进逻辑（可以根据实际对话内容优化）
    if (messages.length > 0 && messages.length % 4 === 0) {
      setCurrentStage((prev) => Math.min(prev + 1, 3));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 flex flex-col overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
            <div className="text-center space-y-4 w-full">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  情绪梳理教练
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  劲老师会陪你一起走过情绪梳理4部曲的旅程
                </p>
              </div>
              <div className="bg-card border border-border rounded-3xl p-8 space-y-4 text-left shadow-sm">
                <h3 className="font-medium text-foreground flex items-center gap-2 text-base">
                  <span className="text-primary">🌱</span>
                  情绪四部曲
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">觉察 Feel it</span> - 停下来感受当前情绪</p>
                  <p><span className="font-medium text-foreground">理解 Name it</span> - 理解情绪背后的需求</p>
                  <p><span className="font-medium text-foreground">反应 React it</span> - 觉察情绪驱动的反应</p>
                  <p><span className="font-medium text-foreground">转化 Transform it</span> - 温柔回应情绪</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground px-4">
                你愿意先一起看看你现在的感受吗？劲老师在这里陪着你 🌿
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-6">
            <StageIndicator currentStage={currentStage} />
            <div className="space-y-3 mt-6">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} role={msg.role} content={msg.content} />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-card border border-border rounded-3xl px-5 py-3">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
      <div className="border-t border-border bg-card/50 backdrop-blur-sm sticky bottom-0 safe-area-inset-bottom">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="分享你的感受..."
              className="min-h-[50px] max-h-[120px] resize-none rounded-2xl border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary shadow-sm focus-visible:shadow-md transition-all duration-300 text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="lg"
              className="rounded-2xl h-[50px] px-5 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:hover:scale-100 disabled:shadow-sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
