import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useXiaojinQuota } from "@/hooks/useXiaojinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";
import { uploadMoodLog } from "@/utils/xiaojinMoodUpload";

const moods = [
  { emoji: "😊", label: "开心", color: "from-green-100 to-emerald-50" },
  { emoji: "😐", label: "一般", color: "from-gray-100 to-slate-50" },
  { emoji: "😔", label: "有点烦", color: "from-blue-100 to-sky-50" },
  { emoji: "😤", label: "很烦", color: "from-red-100 to-rose-50" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/xiaojin-mood`;

export default function XiaojinMood() {
  const navigate = useNavigate();
  const { remaining, deduct } = useXiaojinQuota();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [step, setStep] = useState<"select" | "chat" | "breathing" | "card">("select");
  const [selectedMood, setSelectedMood] = useState("");
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [breathCount, setBreathCount] = useState(0);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    setStep("chat");
  };

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim()) return;

    // 扣费检查
    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }

    setIsStreaming(true);
    setAiResponse("");

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ mood: selectedMood, message: userInput }),
      });

      if (!resp.ok || !resp.body) {
        setAiResponse("抱歉，小劲暂时无法回应，请稍后再试 💛");
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

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
            if (content) { accumulated += content; setAiResponse(accumulated); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch {
      setAiResponse("网络好像不太好，再试一次吧 💛");
    } finally {
      setIsStreaming(false);
      // Upload mood log after interaction
      const intensityMap: Record<string, number> = { "开心": 1, "一般": 3, "有点烦": 4, "很烦": 5 };
      uploadMoodLog({
        moodLabel: selectedMood,
        intensity: intensityMap[selectedMood] ?? 3,
        featureUsed: "mood",
      });
    }
  }, [selectedMood, userInput, deduct]);

  const startBreathing = () => {
    setStep("breathing");
    setBreathCount(0);
    let count = 0;
    const timer = setInterval(() => {
      count++;
      setBreathCount(count);
      if (count >= 6) {
        clearInterval(timer);
        setTimeout(() => setStep("card"), 500);
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-white to-gray-50">
      <div className="max-w-md mx-auto px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/xiaojin")} className="flex items-center gap-1 text-gray-400 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <span className="text-xs text-gray-400">剩余 <span className={`font-bold ${remaining > 20 ? 'text-amber-500' : remaining > 0 ? 'text-orange-500' : 'text-red-500'}`}>{remaining}</span> 点</span>
        </div>

        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="text-xl font-bold text-gray-800 text-center mb-8">今天你的心情怎么样？</h1>
              <div className="grid grid-cols-2 gap-4">
                {moods.map(m => (
                  <button
                    key={m.label}
                    onClick={() => handleMoodSelect(m.label)}
                    className={`bg-gradient-to-br ${m.color} rounded-2xl p-6 text-center active:scale-95 transition-transform shadow-sm`}
                  >
                    <span className="text-4xl block mb-2">{m.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{m.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 mb-4">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🤗</span>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    今天发生了什么？<br />
                    是学习压力、朋友关系，还是家里的事情？
                  </div>
                </div>
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="随便说说..."
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm resize-none h-24 focus:outline-none focus:border-orange-300"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isStreaming || !userInput.trim()}
                  className="w-full mt-3 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {isStreaming ? "小劲在思考..." : "告诉小劲"}
                </button>
              </div>

              {aiResponse && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                  {!isStreaming && (
                    <button
                      onClick={startBreathing}
                      className="w-full mt-4 bg-white border border-orange-200 text-orange-600 rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform"
                    >
                      🌬️ 30秒呼吸练习
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {step === "breathing" && (
            <motion.div key="breathing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center pt-20">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 mx-auto flex items-center justify-center shadow-lg"
              >
                <span className="text-4xl">🌬️</span>
              </motion.div>
              <p className="text-gray-600 mt-6 text-sm">深呼吸... 吸气... 呼气...</p>
              <p className="text-gray-400 text-xs mt-2">{breathCount}/6 次</p>
            </motion.div>
          )}

          {step === "card" && (
            <motion.div key="card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="bg-gradient-to-br from-orange-100 to-amber-50 rounded-3xl p-8 shadow-md">
                <p className="text-xs text-orange-400 mb-2">今日成长卡</p>
                <span className="text-5xl block mb-4">✨</span>
                <h2 className="text-lg font-bold text-gray-800 mb-2">你今天很棒！</h2>
                <p className="text-sm text-gray-500 mb-1">心情：{selectedMood}</p>
                <p className="text-xs text-gray-400 mb-4">完成了30秒呼吸练习</p>
                <div className="text-[10px] text-gray-300">小劲AI · {new Date().toLocaleDateString()}</div>
              </div>
              <button
                onClick={() => navigate("/xiaojin")}
                className="mt-6 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-xl px-8 py-3 text-sm font-medium active:scale-[0.98] transition-transform"
              >
                回到首页
              </button>
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
