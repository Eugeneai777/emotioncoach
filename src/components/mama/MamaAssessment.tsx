import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MamaAssessmentProps {
  onBack: () => void;
  onOpenChat: (context: string) => void;
}

const dimensions = [
  { key: "energy_body", label: "体力", emoji: "💪", desc: "身体感觉有多少能量？", low: "精疲力竭", high: "活力充沛" },
  { key: "energy_emotion", label: "情绪", emoji: "💛", desc: "情绪状态如何？", low: "很低落", high: "开心愉快" },
  { key: "energy_patience", label: "耐心", emoji: "🧘", desc: "面对孩子有多少耐心？", low: "快要爆炸", high: "非常有耐心" },
  { key: "energy_connection", label: "连接", emoji: "🤝", desc: "和家人的连接感如何？", low: "很疏离", high: "温暖连接" },
  { key: "energy_self", label: "自我", emoji: "🌸", desc: "有没有属于自己的时间？", low: "完全没有", high: "充分满足" },
];

const scoreEmojis = [
  { score: 1, emoji: "😫", label: "1" },
  { score: 2, emoji: "😞", label: "2" },
  { score: 3, emoji: "😔", label: "3" },
  { score: 4, emoji: "😐", label: "4" },
  { score: 5, emoji: "🙂", label: "5" },
  { score: 6, emoji: "😊", label: "6" },
  { score: 7, emoji: "😄", label: "7" },
  { score: 8, emoji: "😁", label: "8" },
  { score: 9, emoji: "🤩", label: "9" },
  { score: 10, emoji: "🌟", label: "10" },
];

const getEnergyLevel = (total: number) => {
  if (total >= 40) return { label: "能量满满", emoji: "🌟", color: "hsl(152 42% 49%)", advice: "今天状态很棒！保持这份好能量。" };
  if (total >= 30) return { label: "状态不错", emoji: "😊", color: "hsl(45 90% 55%)", advice: "整体状态良好，可以关注一下稍低的维度。" };
  if (total >= 20) return { label: "有点疲惫", emoji: "😩", color: "hsl(16 86% 68%)", advice: "今天需要多照顾自己，试试情绪急救或找教练聊聊。" };
  return { label: "需要充电", emoji: "🔋", color: "hsl(340 60% 68%)", advice: "能量偏低，建议先做情绪急救，再和教练聊一聊。" };
};

const getRecommendations = (scores: Record<string, number>) => {
  const recs: { title: string; desc: string; route: string; accent: string; emoji: string; urgency: "high" | "medium" | "low" }[] = [];
  
  // Sort dimensions by score to prioritize lowest
  const sorted = dimensions
    .map(d => ({ ...d, score: scores[d.key] }))
    .sort((a, b) => a.score - b.score);

  const lowest = sorted[0];
  
  if (lowest.score <= 3) {
    // Urgent recommendations for very low scores
    if (lowest.key === "energy_emotion" || lowest.key === "energy_patience") {
      recs.push({ title: "情绪急救站", desc: "30秒呼吸释放，给自己一个温柔暂停", route: "/emotion-button", accent: "hsl(340 60% 68%)", emoji: "🆘", urgency: "high" });
    }
    if (lowest.key === "energy_body") {
      recs.push({ title: "正念呼吸", desc: "3分钟身体放松，恢复能量", route: "/breathing", accent: "hsl(200 70% 55%)", emoji: "🫁", urgency: "high" });
    }
  }

  if (scores.energy_patience <= 5) {
    recs.push({ title: "亲子沟通测评", desc: "了解你的沟通模式，找到改善方向", route: "/assessment/communication_parent", accent: "hsl(16 86% 68%)", emoji: "👨‍👩‍👧", urgency: "medium" });
  }
  if (scores.energy_self <= 5) {
    recs.push({ title: "女性竞争力测评", desc: "发现你的核心优势与潜力", route: "/assessment/women_competitiveness", accent: "hsl(280 60% 65%)", emoji: "💎", urgency: "medium" });
  }
  if (scores.energy_connection <= 5) {
    recs.push({ title: "21天亲子训练营", desc: "系统提升亲子沟通与连接", route: "/parent-camp", accent: "hsl(152 42% 49%)", emoji: "🌱", urgency: "medium" });
  }
  if (scores.energy_emotion <= 5) {
    recs.push({ title: "情绪健康自评", desc: "专业量表评估，了解内在状态", route: "/assessment/emotion_health", accent: "hsl(340 60% 68%)", emoji: "📋", urgency: "low" });
  }

  if (recs.length === 0) {
    recs.push({ title: "情绪健康自评", desc: "定期检查情绪状态，保持觉察", route: "/assessment/emotion_health", accent: "hsl(152 42% 49%)", emoji: "✅", urgency: "low" });
  }

  return recs.slice(0, 3);
};

const MamaAssessment = ({ onBack, onOpenChat }: MamaAssessmentProps) => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Record<string, number>>({
    energy_body: 0,
    energy_emotion: 0,
    energy_patience: 0,
    energy_connection: 0,
    energy_self: 0,
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [todayAlreadyDone, setTodayAlreadyDone] = useState(false);
  const [history, setHistory] = useState<{ log_date: string; total_score: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToday = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      
      const today = new Date().toISOString().split("T")[0];
      const { data: todayLog } = await supabase
        .from("mama_energy_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("log_date", today)
        .maybeSingle();

      if (todayLog) {
        setScores({
          energy_body: todayLog.energy_body,
          energy_emotion: todayLog.energy_emotion,
          energy_patience: todayLog.energy_patience,
          energy_connection: todayLog.energy_connection,
          energy_self: todayLog.energy_self,
        });
        setTodayAlreadyDone(true);
        setSubmitted(true);
      }

      const { data: logs } = await supabase
        .from("mama_energy_logs")
        .select("log_date, total_score")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(7);
      
      if (logs) setHistory(logs.reverse());
      setLoading(false);
    };
    checkToday();
  }, []);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("请先登录后再测评");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("mama_energy_logs").upsert({
      user_id: user.id,
      log_date: today,
      ...scores,
    }, { onConflict: "user_id,log_date" });

    if (error) {
      toast.error("保存失败，请稍后重试");
      return;
    }

    setSubmitted(true);
    setTodayAlreadyDone(true);
    toast.success("今日能量已记录 ✨");

    const { data: logs } = await supabase
      .from("mama_energy_logs")
      .select("log_date, total_score")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(7);
    if (logs) setHistory(logs.reverse());
  };

  const handleScoreSelect = (score: number) => {
    const dim = dimensions[currentStep];
    setScores(prev => ({ ...prev, [dim.key]: score }));
    
    // Auto-advance after a brief delay
    if (currentStep < dimensions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const level = getEnergyLevel(total);
  const recs = getRecommendations(scores);
  const allScored = Object.values(scores).every(s => s > 0);
  const currentDim = dimensions[currentStep];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(30 100% 97%)" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(16 86% 68%)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "hsl(30 20% 44%)" }}>加载中...</p>
        </motion.div>
      </div>
    );
  }

  // ========== RESULT VIEW ==========
  if (submitted) {
    return (
      <div className="min-h-screen px-4 pt-4 pb-8" style={{ background: "hsl(30 100% 97%)" }}>
        <button onClick={onBack} className="flex items-center text-sm mb-4 min-h-[44px]" style={{ color: "hsl(30 20% 44%)" }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </button>

        {/* Hero Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="relative text-center p-6 rounded-3xl border shadow-lg bg-white mb-5 overflow-hidden"
          style={{ borderColor: "hsl(30 50% 90%)" }}
        >
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            background: `radial-gradient(circle at 20% 80%, hsl(16 86% 68%), transparent 50%), radial-gradient(circle at 80% 20%, hsl(45 90% 55%), transparent 50%)`
          }} />
          <div className="relative">
            <motion.span 
              className="text-6xl block mb-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              {level.emoji}
            </motion.span>
            <motion.p 
              className="text-2xl font-bold"
              style={{ color: "hsl(25 25% 17%)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {total}<span className="text-base font-normal" style={{ color: "hsl(30 20% 44%)" }}>/50</span>
            </motion.p>
            <motion.p 
              className="text-base font-semibold mt-1"
              style={{ color: level.color }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {level.label}
            </motion.p>
            <motion.p 
              className="text-xs mt-2 max-w-[240px] mx-auto"
              style={{ color: "hsl(30 20% 44%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {level.advice}
            </motion.p>
          </div>
        </motion.div>

        {/* Radar-like dimension cards */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {dimensions.map((d, i) => {
            const s = scores[d.key];
            const pct = (s / 10) * 100;
            const color = s <= 3 ? "hsl(340 60% 68%)" : s <= 6 ? "hsl(45 90% 55%)" : "hsl(152 42% 49%)";
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex flex-col items-center p-2 bg-white rounded-xl border"
                style={{ borderColor: "hsl(30 50% 90%)" }}
              >
                <span className="text-xl mb-1">{d.emoji}</span>
                {/* Mini ring */}
                <div className="relative w-10 h-10 mb-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(30 50% 93%)" strokeWidth="3" />
                    <motion.circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={color}
                      strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${pct * 0.88} 88`}
                      initial={{ strokeDasharray: "0 88" }}
                      animate={{ strokeDasharray: `${pct * 0.88} 88` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.08 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{s}</span>
                </div>
                <span className="text-[10px] font-medium" style={{ color: "hsl(25 25% 17%)" }}>{d.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* 7-day trend */}
        {history.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 bg-white rounded-2xl border mb-5"
            style={{ borderColor: "hsl(30 50% 90%)" }}
          >
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(16 86% 68%)" }} />
              <p className="text-xs font-semibold" style={{ color: "hsl(25 25% 17%)" }}>近7天趋势</p>
            </div>
            <div className="flex items-end gap-1.5 h-20">
              {history.map((h, i) => {
                const pct = (h.total_score / 50) * 100;
                const color = h.total_score >= 40 ? "hsl(152 42% 49%)" : h.total_score >= 30 ? "hsl(45 90% 55%)" : h.total_score >= 20 ? "hsl(16 86% 68%)" : "hsl(340 60% 68%)";
                const isToday = i === history.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {isToday && <span className="text-[8px] font-medium" style={{ color: "hsl(16 86% 68%)" }}>今天</span>}
                    <div className="w-full flex flex-col items-center" style={{ height: "48px" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
                        className="w-full rounded-md min-h-[4px]"
                        style={{ 
                          background: color,
                          opacity: isToday ? 1 : 0.6,
                        }}
                      />
                    </div>
                    <span className="text-[9px]" style={{ color: "hsl(30 15% 56%)" }}>
                      {new Date(h.log_date).getDate()}日
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recommendations - redesigned as prominent cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-5"
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(16 86% 68%)" }} />
            <p className="text-xs font-semibold" style={{ color: "hsl(25 25% 17%)" }}>为你推荐</p>
          </div>
          <div className="space-y-2.5">
            {recs.map((r, i) => (
              <motion.button
                key={r.route}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(r.route)}
                className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border text-left min-h-[56px] shadow-sm"
                style={{ borderColor: r.urgency === "high" ? r.accent : "hsl(30 50% 90%)" }}
              >
                <span className="text-2xl shrink-0">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: "hsl(25 25% 17%)" }}>{r.title}</p>
                    {r.urgency === "high" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{ background: r.accent }}>推荐</span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "hsl(30 15% 56%)" }}>{r.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 shrink-0" style={{ color: r.accent }} />
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <Button
          onClick={() => {
            const lowDims = dimensions.filter(d => scores[d.key] <= 4).map(d => d.label);
            const ctx = lowDims.length > 0
              ? `我今天做了能量测评，总分${total}/50（${level.label}），其中${lowDims.join("、")}比较低。请根据我的状态给出具体建议。`
              : `我今天做了能量测评，总分${total}/50（${level.label}）。请给我一些鼓励和保持好状态的建议。`;
            onOpenChat(ctx);
          }}
          className="w-full rounded-2xl min-h-[48px] text-white mb-2 font-medium shadow-md"
          style={{ background: "hsl(16 86% 68%)" }}
        >
          💬 找教练聊聊
        </Button>
        <Button onClick={onBack} variant="ghost" className="w-full rounded-2xl" style={{ color: "hsl(30 20% 44%)" }}>
          返回首页
        </Button>
      </div>
    );
  }

  // ========== STEP-BY-STEP SCORING VIEW ==========
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(30 100% 97%)" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center text-sm min-h-[44px]" style={{ color: "hsl(30 20% 44%)" }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 px-4 mb-4">
        {dimensions.map((d, i) => (
          <button
            key={d.key}
            onClick={() => i <= currentStep && setCurrentStep(i)}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                background: scores[d.key] > 0 ? (i === currentStep ? "hsl(16 86% 68%)" : "hsl(16 86% 88%)") : "hsl(30 50% 93%)",
                color: scores[d.key] > 0 ? (i === currentStep ? "white" : "hsl(16 86% 55%)") : "hsl(30 20% 60%)",
              }}
              animate={{ scale: i === currentStep ? 1.1 : 1 }}
            >
              {scores[d.key] > 0 ? d.emoji : (i + 1)}
            </motion.div>
            <span className="text-[9px]" style={{ color: i === currentStep ? "hsl(16 86% 55%)" : "hsl(30 15% 56%)" }}>{d.label}</span>
          </button>
        ))}
      </div>

      {/* Main scoring area */}
      <div className="flex-1 px-4 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Question card */}
            <div className="text-center mb-6 mt-2">
              <span className="text-5xl block mb-3">{currentDim.emoji}</span>
              <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(25 25% 17%)" }}>{currentDim.label}</h2>
              <p className="text-sm" style={{ color: "hsl(30 20% 44%)" }}>{currentDim.desc}</p>
            </div>

            {/* Score hints */}
            <div className="flex justify-between px-2 mb-2">
              <span className="text-[10px]" style={{ color: "hsl(340 60% 68%)" }}>{currentDim.low}</span>
              <span className="text-[10px]" style={{ color: "hsl(152 42% 49%)" }}>{currentDim.high}</span>
            </div>

            {/* Emoji score selector - 2 rows of 5 */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              {scoreEmojis.map((item) => {
                const isSelected = scores[currentDim.key] === item.score;
                return (
                  <motion.button
                    key={item.score}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleScoreSelect(item.score)}
                    className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl border-2 transition-all min-h-[60px]"
                    style={{
                      borderColor: isSelected ? "hsl(16 86% 68%)" : "hsl(30 50% 90%)",
                      background: isSelected ? "hsl(16 86% 95%)" : "white",
                    }}
                  >
                    <span className={isSelected ? "text-2xl" : "text-xl"}>{item.emoji}</span>
                    <span className="text-[10px] font-semibold" style={{ 
                      color: isSelected ? "hsl(16 86% 55%)" : "hsl(30 20% 44%)" 
                    }}>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Current selection feedback */}
            {scores[currentDim.key] > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-4"
              >
                <span className="text-3xl">{scoreEmojis[scores[currentDim.key] - 1].emoji}</span>
                <p className="text-sm font-medium mt-1" style={{
                  color: scores[currentDim.key] <= 3 ? "hsl(340 60% 68%)" : scores[currentDim.key] <= 6 ? "hsl(45 90% 55%)" : "hsl(152 42% 49%)"
                }}>
                  {currentDim.label}：{scores[currentDim.key]} 分
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="pb-6 pt-2 flex gap-2">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="rounded-2xl min-h-[48px] flex-1 border-[hsl(30_50%_90%)]"
              style={{ color: "hsl(30 20% 44%)" }}
            >
              上一题
            </Button>
          )}
          {currentStep < dimensions.length - 1 ? (
            <Button
              onClick={() => scores[currentDim.key] > 0 && setCurrentStep(prev => prev + 1)}
              disabled={scores[currentDim.key] === 0}
              className="rounded-2xl min-h-[48px] flex-1 text-white font-medium disabled:opacity-40"
              style={{ background: "hsl(16 86% 68%)" }}
            >
              下一题 →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allScored}
              className="rounded-2xl min-h-[48px] flex-1 text-white font-medium disabled:opacity-40"
              style={{ background: "hsl(16 86% 68%)" }}
            >
              提交记录 ✨
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MamaAssessment;
