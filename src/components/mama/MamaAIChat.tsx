import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MamaAIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContext?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mama-ai-coach`;

const MamaAIChat = ({ open, onOpenChange, initialContext }: MamaAIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When opened with a new context, start the conversation
  useEffect(() => {
    if (open && initialContext && !hasStarted) {
      setHasStarted(true);
      setMessages([]);
      streamChat([], initialContext);
    }
  }, [open, initialContext]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setHasStarted(false);
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const streamChat = async (history: Message[], context?: string) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history,
          context: context || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "AI服务暂时不可用");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("mama-ai-chat error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，AI暂时忙碌中，请稍后再试 🙏" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    streamChat(updated);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-[#FFF8F0] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-[#F5E6D3]">
          <SheetTitle className="text-[#3D3028] text-lg">💛 AI妈妈教练</SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-[#F4845F] text-white rounded-br-md"
                    : "bg-white text-[#3D3028] border border-[#F5E6D3] rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#F5E6D3] rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#F4845F]" />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 pb-6 pt-3 border-t border-[#F5E6D3] bg-white">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="继续问AI妈妈教练..."
              className="border-[#F5E6D3] bg-[#FFFCF8] text-[#3D3028] placeholder:text-[#C4B49A] min-h-[44px] max-h-[100px] rounded-xl resize-none flex-1"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-[#F4845F] hover:bg-[#E5734E] text-white rounded-xl h-11 w-11 p-0 shrink-0"
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MamaAIChat;
