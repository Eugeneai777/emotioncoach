import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xiaojin-future`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const initialQuestion = "如果未来没有任何限制，你最想尝试的事情是什么？";

export default function XiaojinFuture() {
  const navigate = useNavigate();
  const { remaining, deduct } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: initialQuestion }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultCard, setResultCard] = useState({ keywords: ["创造", "探索", "科技"], directions: ["产品设计", "AI工程", "创业"] });
  const userMsgCount = messages.filter(m => m.role === "user").length;

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;

    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }

    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    if (userMsgCount + 1 >= 5) {
      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages, generateResult: true }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.keywords) setResultCard({ keywords: data.keywords, directions: data.directions });
        }
      } catch { /* use defaults */ }
      setIsStreaming(false);
      setShowResult(true);
      return;
    }

    let accumulated = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        setMessages(prev => [...prev, { role: "assistant", content: "小劲暂时想不出来，再试试？💛" }]);
        setIsStreaming(false);
        return;
      }

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated };
                return copy;
              });
            }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "网络不太好，再试一次吧 💛" }]);
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, userMsgCount, deduct]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/80 via-white to-gray-50 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate("/xiaojin")} className="flex items-center gap-1 text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <span className="text-xs text-gray-400">剩余 <span className={`font-bold ${remaining > 20 ? 'text-amber-500' : remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>{remaining}</span> 点</span>
        </div>

        <h1 className="text-lg font-bold text-gray-800 mb-1">AI帮你发现未来方向</h1>
        <p className="text-xs text-gray-400 mb-4">和小劲聊聊，{5 - userMsgCount > 0 ? `还有${5 - userMsgCount}轮对话` : "即将生成结果"}</p>

        <AnimatePresence mode="wait">
          {!showResult ? (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-purple-400 to-violet-400 text-white"
                        : "bg-white border border-purple-100 text-gray-700"
                    }`}>
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none"><ReactMarkdown>{m.content || "..."}</ReactMarkdown></div>
                      ) : m.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="说说你的想法..."
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-purple-300"
                />
                <button
                  onClick={sendMessage}
                  disabled={isStreaming || !input.trim()}
                  className="bg-gradient-to-r from-purple-400 to-violet-400 text-white rounded-xl px-4 disabled:opacity-50 active:scale-95 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-gradient-to-br from-purple-100 via-violet-50 to-white rounded-3xl p-8 shadow-md text-center w-full">
                <p className="text-xs text-purple-400 mb-3">你的未来方向卡</p>
                <span className="text-5xl block mb-4">🚀</span>
                <h2 className="text-lg font-bold text-gray-800 mb-4">你的未来关键词</h2>
                <div className="flex justify-center gap-2 mb-5">
                  {resultCard.keywords.map(k => (
                    <span key={k} className="bg-purple-100 text-purple-600 text-sm px-4 py-1.5 rounded-full font-medium">{k}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mb-3">推荐尝试方向</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {resultCard.directions.map(d => (
                    <span key={d} className="bg-violet-50 text-violet-500 text-xs px-3 py-1 rounded-full">{d}</span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-300 mt-5">小劲AI · {new Date().toLocaleDateString()}</p>
              </div>

              <div className="flex gap-3 mt-6 w-full">
                <button onClick={() => navigate("/xiaojin")} className="flex-1 bg-white border border-gray-200 rounded-xl py-3 text-sm text-gray-600 active:scale-[0.98] transition-transform">
                  回到首页
                </button>
                <button className="flex-1 bg-gradient-to-r from-purple-400 to-violet-400 text-white rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform">
                  保存未来卡
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PurchaseOnboardingDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        defaultPackage="member365"
        triggerFeature="免费体验点数已用完"
        onSuccess={() => setShowUpgrade(false)}
      />
    </div>
  );
}
