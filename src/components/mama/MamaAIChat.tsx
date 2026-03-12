import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Send, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MamaConversionCard from "./MamaConversionCard";
import { useMamaQuota } from "@/hooks/useMamaQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  followUps?: string[];
}

interface MamaAIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContext?: string;
  initialInput?: string;
  chatType?: "emotion" | "gratitude";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mama-ai-coach`;
const LAST_CHAT_KEY = "mama_last_chat";

const TypingDots = () => (
  <div className="flex gap-1 items-center px-3 py-2.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 bg-[#F4845F] rounded-full"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const MamaAIChat = ({ open, onOpenChange, initialContext, initialInput, chatType = "emotion" }: MamaAIChatProps) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { deduct, refresh } = useMamaQuota();

  useEffect(() => {
    if (open && initialContext && !hasStarted) {
      setHasStarted(true);
      setMessages([]);
      streamChat([], initialContext);
    }
  }, [open, initialContext]);

  // Handle initialInput from bottom bar
  useEffect(() => {
    if (open && initialInput && !hasStarted) {
      setHasStarted(true);
      setMessages([]);
      const userMsg: Message = { role: "user", content: initialInput };
      setMessages([userMsg]);
      streamChat([userMsg]);
    }
  }, [open, initialInput]);

  useEffect(() => {
    if (!open && hasStarted) {
      // Auto-save to emotion diary when closing with enough messages
      if (messages.length >= 2) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            supabase.functions.invoke('save-mama-briefing', {
              body: { messages: messages.map(m => ({ role: m.role, content: m.content })), chatType }
            }).then(({ error }) => {
              if (error) console.warn('Auto-save mama briefing failed:', error);
              else console.log('Mama briefing auto-saved, type:', chatType);
            }).catch(err => console.warn('Auto-save mama briefing error:', err));
          }
        });
      }
      setHasStarted(false);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Handle mobile keyboard - scroll into view when input focused
  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === inputRef.current) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        }, 100);
      }
    };
    
    const vv = window.visualViewport;
    vv?.addEventListener("resize", handleResize);
    return () => vv?.removeEventListener("resize", handleResize);
  }, []);

  // Save last chat summary
  useEffect(() => {
    if (messages.length > 0) {
      const lastUser = messages.filter((m) => m.role === "user").pop();
      if (lastUser) {
        localStorage.setItem(LAST_CHAT_KEY, JSON.stringify({
          summary: lastUser.content.slice(0, 30),
          time: Date.now(),
        }));
      }
    }
  }, [messages]);

  const parseFollowUps = (text: string): { clean: string; followUps: string[] } => {
    const marker = "【追问建议】";
    const idx = text.indexOf(marker);
    if (idx === -1) return { clean: text, followUps: [] };
    const clean = text.slice(0, idx).trim();
    const followUpText = text.slice(idx + marker.length).trim();
    const followUps = followUpText
      .split(/\n|[;；]/)
      .map((s) => s.replace(/^\d+[.、)\]]\s*/, "").trim())
      .filter((s) => s.length > 0 && s.length < 30);
    return { clean, followUps: followUps.slice(0, 3) };
  };

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
          messages: history.map((m) => ({ role: m.role, content: m.content })),
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
              const { clean, followUps } = parseFollowUps(assistantSoFar);
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: clean, followUps } : m
                  );
                }
                return [...prev, { role: "assistant", content: clean, followUps }];
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

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }
    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    // Blur input on send to dismiss keyboard on mobile
    inputRef.current?.blur();
    streamChat(updated);
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!deduct(8)) {
      setShowUpgrade(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript;
      if (text) setInput((prev) => prev + text);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const hasSpeechAPI = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl bg-[#FFF8F0] p-0 flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2.5 border-b border-[#F5E6D3] shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[#3D3028] text-base">💛 宝妈AI教练</SheetTitle>
              <button
                onClick={() => { onOpenChange(false); navigate("/history"); }}
                className="text-xs px-3 py-1.5 rounded-full border border-[#F4845F]/30 text-[#F4845F] bg-[#FFF3EB] hover:bg-[#FFE8D6] transition-colors"
              >
                📝 情绪日记
              </button>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-[#F4845F] text-white rounded-br-md"
                        : "bg-white text-[#3D3028] border border-[#F5E6D3] rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {msg.role === "assistant" && msg.followUps && msg.followUps.length > 0 && !isLoading && i === messages.length - 1 && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-wrap gap-1.5 mt-2 ml-1"
                    >
                      {msg.followUps.map((q, j) => (
                        <button
                          key={j}
                          onClick={() => handleSend(q)}
                          className="px-3 py-2 bg-[#FFF3EB] text-[#F4845F] text-xs rounded-full border border-[#F4845F]/20 active:bg-[#FFE8D6] transition-all min-h-[36px]"
                        >
                          {q}
                        </button>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#F5E6D3] rounded-2xl rounded-bl-md">
                  <TypingDots />
                </div>
              </div>
            )}
            {!isLoading && messages.length >= 4 && messages[messages.length - 1]?.role === "assistant" && (
              <MamaConversionCard
                context={messages.map((m) => m.content).join(" ")}
                messageCount={messages.length}
                onClose={() => onOpenChange(false)}
              />
            )}
          </div>

          <div
            className="px-3 pb-3 pt-2 border-t border-[#F5E6D3] bg-white shrink-0"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-1.5 items-end">
              {hasSpeechAPI && (
                <Button
                  onClick={toggleVoice}
                  variant="ghost"
                  size="icon"
                  className={`shrink-0 h-10 w-10 rounded-xl ${isListening ? "text-[#F4845F] bg-[#FFF3EB]" : "text-[#A89580]"}`}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="问宝妈AI教练..."
                className="border border-[#F5E6D3] bg-[#FFFCF8] text-[#3D3028] placeholder:text-[#C4B49A] min-h-[40px] max-h-[80px] rounded-xl resize-none flex-1 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#F4845F]/30"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => {
                  setTimeout(() => {
                    scrollRef.current?.scrollTo({ top: scrollRef.current!.scrollHeight, behavior: "smooth" });
                  }, 300);
                }}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="bg-[#F4845F] hover:bg-[#E5734E] text-white rounded-xl h-10 w-10 p-0 shrink-0"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        defaultPackage="member365"
        triggerFeature="宝妈AI聊天"
        onSuccess={() => {
          setShowUpgrade(false);
          refresh();
        }}
      />
    </>
  );
};

export default MamaAIChat;
