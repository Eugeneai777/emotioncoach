import { useState, useEffect, useRef } from "react";
import { Loader2, RotateCcw, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParentCoach } from "@/hooks/useParentCoach";
import { StageHintCard } from "@/components/coach/StageHintCard";
import { toast } from "sonner";

interface ParentCoachEmbeddedProps {
  campId: string;
  dayNumber: number;
  onCoachingComplete?: () => void;
}

export const ParentCoachEmbedded = ({
  campId,
  dayNumber,
  onCoachingComplete,
}: ParentCoachEmbeddedProps) => {
  const {
    session,
    messages,
    isLoading,
    isCreating,
    createSession,
    sendMessage,
    resetSession,
  } = useParentCoach();

  const [input, setInput] = useState("");
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Auto create session and send initial message
  useEffect(() => {
    if (!session && !isCreating && !hasAutoSent) {
      const init = async () => {
        const newSession = await createSession(campId);
        if (newSession) {
          setHasAutoSent(true);
          setTimeout(() => {
            sendMessage("我来完成今天的训练营打卡");
          }, 300);
        }
      };
      init();
    }
  }, [session, isCreating, hasAutoSent, campId]);

  // Watch for coaching completion
  useEffect(() => {
    if (session?.status === "completed") {
      onCoachingComplete?.();
    }
  }, [session?.status, onCoachingComplete]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleNewConversation = () => {
    resetSession();
    setHasAutoSent(false);
    toast.success("已开始新对话");
  };

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">劲老师 🌿</h3>
            <p className="text-xs text-muted-foreground">Day {dayNumber} · 亲子觉察</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleNewConversation} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs">新对话</span>
          </Button>
        )}
      </div>

      {/* Stage hint */}
      {session && (
        <StageHintCard currentStage={session.current_stage || 0} />
      )}

      {/* Messages */}
      <div
        ref={mainRef}
        className="h-[55vh] overflow-y-auto"
      >
        <div className="px-4 py-4">
          {messages.length === 0 && !isLoading && !isCreating ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-foreground">准备好今天的亲子觉察了吗？</p>
                <p className="text-sm text-muted-foreground">劲老师将引导你完成四部曲</p>
              </div>
              <Button
                size="lg"
                onClick={async () => {
                  const newSession = await createSession(campId);
                  if (newSession) {
                    setHasAutoSent(true);
                    sendMessage("我来完成今天的训练营打卡");
                  }
                }}
                className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 text-base px-8 animate-pulse"
              >
                <Sparkles className="w-5 h-5" />
                开始觉察对话
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <div className="max-w-[85%]">
                      <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200/50 dark:border-purple-800/50">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </Card>
                    </div>
                  ) : (
                    <Card className="p-3 bg-primary text-primary-foreground max-w-[85%]">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </Card>
                  )}
                </div>
              ))}

              {(isLoading || isCreating) && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">劲老师正在思考...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/80 backdrop-blur-sm p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说说你的想法..."
            className="resize-none text-sm"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading || isCreating}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isCreating}
            size="icon"
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
