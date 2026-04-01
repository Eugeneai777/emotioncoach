import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Mic, MicOff, Loader2, Phone } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
import { useGlobalVoice } from "@/components/voice/GlobalVoiceProvider";
import { toast } from "sonner";
import { ChatBubble } from "@/components/youjin-life/ChatBubble";
import { YoujinBottomNav } from "@/components/youjin-life/YoujinBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { getTodayRangeUTC } from "@/utils/dateUtils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youjin-life-chat`;

type Msg = { role: "user" | "assistant"; content: string };
type ExpenseReport = { month: string; totalAmount: number; categories: { category: string; total: number; count: number }[] };

export default function YoujinLifeChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startVoice } = useGlobalVoice();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [expenseReport, setExpenseReport] = useState<ExpenseReport | null>(null);
  const expenseSavedRef = useRef<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Handle initial query from URL
  useEffect(() => {
    const q = searchParams.get("q");
    const voice = searchParams.get("voice");
    if (q) {
      sendMessage(q);
    }
    if (voice === "1") {
      startListening();
    }
  }, []); // eslint-disable-line

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Msg = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (resp.status === 429) {
        toast.error("请求太频繁，请稍后再试");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("AI 额度已用完，请联系管理员");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("请求失败，请重试");
        setIsLoading(false);
        return;
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
      console.error(e);
      toast.error("网络错误，请检查连接");
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("您的浏览器不支持语音输入");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("语音识别失败，请重试");
    };
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleExpense = useCallback(async (data: { amount: number; category: string; note: string }) => {
    const key = `${data.amount}-${data.category}-${data.note}`;
    if (expenseSavedRef.current.has(key)) return;
    expenseSavedRef.current.add(key);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error } = await supabase.from("finance_records").insert({
      user_id: user.id,
      amount: data.amount,
      category: data.category,
      type: "expense",
      note: data.note || null,
    });
    if (error) {
      console.error("Save expense error:", error);
      toast.error("记账保存失败");
    }
  }, []);

  const handleExpenseQuery = useCallback(async (data: { type: string; month?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const month = data.month || new Date().toISOString().slice(0, 7);
    const startDate = `${month}-01T00:00:00+08:00`;
    const endMonth = parseInt(month.split("-")[1]);
    const endYear = parseInt(month.split("-")[0]);
    const nextMonth = endMonth === 12 ? `${endYear + 1}-01` : `${endYear}-${String(endMonth + 1).padStart(2, "0")}`;
    const endDate = `${nextMonth}-01T00:00:00+08:00`;

    const { data: records, error } = await supabase
      .from("finance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("created_at", new Date(startDate).toISOString())
      .lt("created_at", new Date(endDate).toISOString());

    if (error) {
      console.error("Query expense error:", error);
      return;
    }

    const catMap: Record<string, { total: number; count: number }> = {};
    let totalAmount = 0;
    (records || []).forEach((r) => {
      totalAmount += r.amount;
      if (!catMap[r.category]) catMap[r.category] = { total: 0, count: 0 };
      catMap[r.category].total += r.amount;
      catMap[r.category].count += 1;
    });

    setExpenseReport({
      month: `${month}月`,
      totalAmount,
      categories: Object.entries(catMap).map(([category, v]) => ({ category, ...v })),
    });
  }, []);

  const handleSubmit = () => {
    sendMessage(input);
  };

  const handleVoiceClick = () => {
    if (!user) {
      navigate('/auth?redirect=/youjin-life/chat');
      return;
    }
    setShowVoice(true);
  };

  if (showVoice && user) {
    return (
      <CoachVoiceChat
        onClose={() => setShowVoice(false)}
        coachEmoji="❤️"
        coachTitle="有劲AI生活教练"
        primaryColor="rose"
        tokenEndpoint="vibrant-life-realtime-token"
        userId={user.id}
        mode="general"
        featureKey="realtime_voice"
        voiceType={getSavedVoiceType()}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white/95 backdrop-blur sticky top-0 z-10">
        <button onClick={() => navigate('/mini-app')} className="p-1 -ml-1 active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">有劲AI</p>
          <p className="text-[10px] text-gray-400">一句话帮你搞定</p>
        </div>
        <button
          onClick={handleVoiceClick}
          className="p-2 rounded-full bg-rose-50 text-rose-500 active:scale-95 transition-transform"
          title="语音通话"
        >
          <Phone className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-4xl mb-3">👋</div>
            <p className="text-gray-900 font-medium">你好，我是有劲AI</p>
            <p className="text-sm text-gray-400 mt-1">告诉我你想做什么，我来帮你搞定</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble
            key={i}
            role={msg.role}
            content={msg.content}
            isStreaming={isLoading && i === messages.length - 1 && msg.role === "assistant"}
            onExpense={handleExpense}
            onExpenseQuery={handleExpenseQuery}
            expenseReport={expenseReport}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-gray-50 border border-gray-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-sm text-gray-400">思考中...</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2.5 border border-gray-100 focus-within:border-gray-300 transition-colors">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
              placeholder="说点什么..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-300"
            />
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isListening ? "bg-red-100 text-red-500" : "hover:bg-gray-200 text-gray-400"
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
