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

export type ChatMode = "mama" | "emotion";

interface MamaAIChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialContext?: string;
  initialInput?: string;
  mode?: ChatMode;
}

const MAMA_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mama-ai-coach`;
const EMOTION_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emotion-coach`;
const LAST_CHAT_KEY = "mama_last_chat";

// Mode-specific config
const MODE_CONFIG = {
  mama: {
    title: "💛 宝妈AI教练",
    diaryLabel: "📔 感恩记录",
    diaryRoute: "/gratitude-journal",
    placeholder: "问宝妈AI教练...",
    bgColor: "#FFF8F0",
    borderColor: "#F5E6D3",
    accentColor: "#F4845F",
    accentBg: "#FFF3EB",
    accentBgHover: "#FFE8D6",
    inputBg: "#FFFCF8",
    textColor: "#3D3028",
    placeholderColor: "#C4B49A",
    dotColor: "#F4845F",
    triggerFeature: "宝妈AI聊天",
    userBubble: "bg-[#F4845F]",
  },
  emotion: {
    title: "💜 情绪教练",
    diaryLabel: "📔 情绪日记",
    diaryRoute: "/history",
    placeholder: "和情绪教练聊聊...",
    bgColor: "#F8F0FF",
    borderColor: "#E6D3F5",
    accentColor: "#9B59B6",
    accentBg: "#F3EBFF",
    accentBgHover: "#E8D6FF",
    inputBg: "#FCF8FF",
    textColor: "#302838",
    placeholderColor: "#B49AC4",
    dotColor: "#9B59B6",
    triggerFeature: "情绪教练",
    userBubble: "bg-[#9B59B6]",
  },
};

const TypingDots = ({ color }: { color: string }) => (
  <div className="flex gap-1 items-center px-3 py-2.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

const MamaAIChat = ({ open, onOpenChange, initialContext, initialInput, mode = "mama" }: MamaAIChatProps) => {
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

  // Emotion mode session tracking
  const [emotionSessionId, setEmotionSessionId] = useState<string | null>(null);

  const cfg = MODE_CONFIG[mode];
  const isEmotion = mode === "emotion";

  // Reset session when mode changes or dialog closes
  useEffect(() => {
    if (!open) {
      setHasStarted(false);
      setEmotionSessionId(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && initialContext && !hasStarted) {
      setHasStarted(true);
      setMessages([]);
      if (isEmotion) {
        sendEmotionMessage(initialContext, []);
      } else {
        streamChat([], initialContext);
      }
    }
  }, [open, initialContext]);

  useEffect(() => {
    if (open && initialInput && !hasStarted) {
      setHasStarted(true);
      setMessages([]);
      const userMsg: Message = { role: "user", content: initialInput };
      setMessages([userMsg]);
      if (isEmotion) {
        sendEmotionMessage(initialInput, []);
      } else {
        streamChat([userMsg]);
      }
    }
  }, [open, initialInput]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

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

  useEffect(() => {
    if (messages.length > 0 && !isEmotion) {
      const lastUser = messages.filter((m) => m.role === "user").pop();
      if (lastUser) {
        localStorage.setItem(LAST_CHAT_KEY, JSON.stringify({
          summary: lastUser.content.slice(0, 30),
          time: Date.now(),
        }));
      }
    }
  }, [messages, isEmotion]);

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

  // ========== Emotion Coach (non-streaming JSON) ==========
  const createEmotionSession = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: "宝妈情绪梳理" })
        .select()
        .single();
      if (convError) throw convError;

      const { data: sessionData, error: sessionError } = await supabase
        .from("emotion_coaching_sessions")
        .insert({
          user_id: user.id,
          conversation_id: convData.id,
          current_stage: 0,
          status: "active",
        })
        .select()
        .single();
      if (sessionError) throw sessionError;

      setEmotionSessionId(sessionData.id);
      return sessionData.id;
    } catch (error) {
      console.error("Error creating emotion session:", error);
      return null;
    }
  };

  const sendEmotionMessage = async (text: string, currentMessages: Message[]) => {
    setIsLoading(true);
    try {
      let sid = emotionSessionId;
      if (!sid) {
        sid = await createEmotionSession();
        if (!sid) {
          setMessages((prev) => [...prev, { role: "assistant", content: "请先登录后再使用情绪教练 🙏" }]);
          setIsLoading(false);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(EMOTION_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ sessionId: sid, message: text }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        if (resp.status === 402) {
          setShowUpgrade(true);
          setIsLoading(false);
          return;
        }
        throw new Error(errorData.error || "AI服务暂时不可用");
      }

      const data = await resp.json();
      const content = data.content || "让我们继续聊聊 🌿";

      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (e) {
      console.error("emotion-chat error:", e);
      setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，AI暂时忙碌中，请稍后再试 🙏" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Mama Coach (SSE streaming) ==========
  const streamChat = async (history: Message[], context?: string) => {
    setIsLoading(true);
    let assistantSoFar = "";

    try {
      const resp = await fetch(MAMA_CHAT_URL, {
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
    if (!isEmotion && !deduct(1)) {
      setShowUpgrade(true);
      return;
    }
    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    inputRef.current?.blur();

    if (isEmotion) {
      sendEmotionMessage(msg, updated);
    } else {
      streamChat(updated);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!isEmotion && !deduct(8)) {
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
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl p-0 flex flex-col"
          style={{ backgroundColor: cfg.bgColor }}
        >
          <SheetHeader
            className="px-4 pt-4 pb-2.5 shrink-0"
            style={{ borderBottom: `1px solid ${cfg.borderColor}` }}
          >
            <div className="flex items-center justify-between">
              <SheetTitle style={{ color: cfg.textColor }} className="text-base">
                {cfg.title}
              </SheetTitle>
              <button
                onClick={() => { onOpenChange(false); navigate(cfg.diaryRoute); }}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors"
                style={{
                  borderColor: `${cfg.accentColor}4D`,
                  color: cfg.accentColor,
                  backgroundColor: cfg.accentBg,
                }}
              >
                {cfg.diaryLabel}
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
                        ? `${cfg.userBubble} text-white rounded-br-md`
                        : "bg-white rounded-bl-md"
                    }`}
                    style={msg.role === "assistant" ? { color: cfg.textColor, border: `1px solid ${cfg.borderColor}` } : undefined}
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
                          className="px-3 py-2 text-xs rounded-full border transition-all min-h-[36px]"
                          style={{
                            backgroundColor: cfg.accentBg,
                            color: cfg.accentColor,
                            borderColor: `${cfg.accentColor}33`,
                          }}
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
                <div className="bg-white rounded-2xl rounded-bl-md" style={{ border: `1px solid ${cfg.borderColor}` }}>
                  <TypingDots color={cfg.dotColor} />
                </div>
              </div>
            )}
            {!isEmotion && !isLoading && messages.length >= 4 && messages[messages.length - 1]?.role === "assistant" && (
              <MamaConversionCard
                context={messages.map((m) => m.content).join(" ")}
                messageCount={messages.length}
                onClose={() => onOpenChange(false)}
              />
            )}
          </div>

          <div
            className="px-3 pb-3 pt-2 bg-white shrink-0"
            style={{ borderTop: `1px solid ${cfg.borderColor}`, paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-1.5 items-end">
              {hasSpeechAPI && (
                <Button
                  onClick={toggleVoice}
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-10 w-10 rounded-xl"
                  style={{
                    color: isListening ? cfg.accentColor : "#A89580",
                    backgroundColor: isListening ? cfg.accentBg : undefined,
                  }}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={cfg.placeholder}
                className="min-h-[40px] max-h-[80px] rounded-xl resize-none flex-1 px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{
                  border: `1px solid ${cfg.borderColor}`,
                  backgroundColor: cfg.inputBg,
                  color: cfg.textColor,
                  // @ts-ignore
                  "--tw-ring-color": `${cfg.accentColor}4D`,
                }}
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
                className="text-white rounded-xl h-10 w-10 p-0 shrink-0"
                style={{ backgroundColor: cfg.accentColor }}
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
        triggerFeature={cfg.triggerFeature}
        onSuccess={() => {
          setShowUpgrade(false);
          refresh();
        }}
      />
    </>
  );
};

export default MamaAIChat;
