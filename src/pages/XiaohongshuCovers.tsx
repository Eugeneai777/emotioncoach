import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageLayout } from "@/components/admin/shared/AdminPageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Loader2, Download, ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

const QUICK_PROMPTS = [
  "帮我生成一张「为什么你总是赚不到钱」的暗黑风海报",
  "做一张奶油温柔风的海报，文案：别让情绪毁掉你的人生",
  "红色冲击风格，标题：2025翻身计划",
  "帮我设计一张极简黑白风格的海报，主题是认知觉醒",
];

export default function XiaohongshuCovers() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Build messages for API (text only, no images)
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("generate-xiaohongshu-covers", {
        body: { messages: apiMessages },
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "生成完成",
        imageUrl: data.imageUrl,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.imageUrl) {
        toast.success("海报生成成功！");
      }
    } catch (e: any) {
      const errorMsg = e?.message || "请求失败";
      toast.error(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const downloadImage = async (url: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `xiaohongshu-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      toast.error("下载失败");
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <AdminPageLayout
      title="小红书海报 AI 设计师"
      description="告诉我你想要什么海报，我来帮你设计"
    >
      <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-400 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-bold mb-2">小红书爆款海报 AI</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                描述你想要的海报内容和风格，AI 会为你生成小红书爆款封面
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {QUICK_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-sm p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 max-w-2xl",
                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-rose-500 to-orange-400 text-white"
                )}
              >
                {msg.role === "user" ? "你" : "AI"}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%]",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.imageUrl && (
                  <div className="mt-3 space-y-2">
                    <img
                      src={msg.imageUrl}
                      alt="Generated poster"
                      className="rounded-xl max-w-[280px] w-full shadow-lg"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => downloadImage(msg.imageUrl!)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      下载海报
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-400 text-white flex items-center justify-center flex-shrink-0 text-sm">
                AI
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在设计中，请稍候...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t pt-3 mt-auto">
          <div className="flex gap-2 items-end max-w-2xl mx-auto">
            <Textarea
              ref={textareaRef}
              placeholder="描述你想要的海报，如：帮我做一张暗黑风的海报，文案是..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className="h-[44px] w-[44px] rounded-xl flex-shrink-0"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Enter 发送 · Shift+Enter 换行
          </p>
        </div>
      </div>
    </AdminPageLayout>
  );
}
