import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MamaAssessmentProps {
  onBack: () => void;
  onOpenChat: (context: string) => void;
}

const dimensions = [
  { key: "energy_body", label: "体力", emoji: "💪", desc: "身体感觉有多少能量？" },
  { key: "energy_emotion", label: "情绪", emoji: "💛", desc: "情绪状态如何？" },
  { key: "energy_patience", label: "耐心", emoji: "🧘", desc: "面对孩子有多少耐心？" },
  { key: "energy_connection", label: "连接", emoji: "🤝", desc: "和家人的连接感如何？" },
  { key: "energy_self", label: "自我", emoji: "🌸", desc: "有没有属于自己的时间？" },
];

const getEnergyLevel = (total: number) => {
  if (total >= 40) return { label: "能量满满", emoji: "🌟", color: "hsl(152 42% 49%)", advice: "今天状态很棒！保持这份好能量。" };
  if (total >= 30) return { label: "状态不错", emoji: "😊", color: "hsl(45 90% 55%)", advice: "整体状态良好，可以关注一下稍低的维度。" };
  if (total >= 20) return { label: "有点疲惫", emoji: "😩", color: "hsl(16 86% 68%)", advice: "今天需要多照顾自己，试试情绪急救或找教练聊聊。" };
  return { label: "需要充电", emoji: "🔋", color: "hsl(340 60% 68%)", advice: "能量偏低，建议先做情绪急救，再和教练聊一聊。" };
};

const getRecommendations = (scores: Record<string, number>) => {
  const recs: { title: string; desc: string; route: string; accent: string }[] = [];
  
  if (scores.energy_emotion <= 4) {
    recs.push({ title: "情绪急救站", desc: "30秒释放情绪，给自己一个拥抱", route: "/emotion-button", accent: "hsl(340 60% 68%)" });
  }
  if (scores.energy_patience <= 4) {
    recs.push({ title: "亲子沟通测评", desc: "了解你的沟通模式，找到改善方向", route: "/assessment/communication_parent", accent: "hsl(16 86% 68%)" });
  }
  if (scores.energy_self <= 4) {
    recs.push({ title: "女性竞争力测评", desc: "发现你的核心优势", route: "/assessment/women_competitiveness", accent: "hsl(220 80% 65%)" });
  }
  if (scores.energy_connection <= 4) {
    recs.push({ title: "21天亲子训练营", desc: "系统提升亲子沟通能力", route: "/parent-camp", accent: "hsl(152 42% 49%)" });
  }
  if (recs.length === 0) {
    recs.push({ title: "情绪健康自评", desc: "定期检查情绪状态", route: "/assessment/emotion_health", accent: "hsl(340 60% 68%)" });
  }
  return recs.slice(0, 3);
};

const MamaAssessment = ({ onBack, onOpenChat }: MamaAssessmentProps) => {
  const navigate = useNavigate();
  const [scores, setScores] = useState<Record<string, number>>({
    energy_body: 5,
    energy_emotion: 5,
    energy_patience: 5,
    energy_connection: 5,
    energy_self: 5,
  });
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

    // Refresh history
    const { data: logs } = await supabase
      .from("mama_energy_logs")
      .select("log_date, total_score")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(7);
    if (logs) setHistory(logs.reverse());
  };

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const level = getEnergyLevel(total);
  const recs = getRecommendations(scores);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(30 100% 97%)" }}>
        <p style={{ color: "hsl(30 20% 44%)" }}>加载中...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen px-4 pt-4 pb-8" style={{ background: "hsl(30 100% 97%)" }}>
        <button onClick={onBack} className="flex items-center text-sm mb-4 min-h-[44px]" style={{ color: "hsl(30 20% 44%)" }}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回
        </button>

        {/* Score overview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-5 rounded-2xl border border-[hsl(30_50%_90%)] shadow-[0_2px_12px_hsl(30_30%_70%/0.1)] bg-white mb-4"
        >
          <span className="text-5xl">{level.emoji}</span>
          <p className="text-lg font-bold mt-2" style={{ color: "hsl(25 25% 17%)" }}>今日能量：{total}/50</p>
          <p className="text-sm font-medium mt-1" style={{ color: level.color }}>{level.label}</p>
          <p className="text-xs mt-2" style={{ color: "hsl(30 20% 44%)" }}>{level.advice}</p>
        </motion.div>

        {/* Dimension breakdown */}
        <div className="space-y-2 mb-4">
          {dimensions.map((d) => (
            <div key={d.key} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[hsl(30_50%_90%)]">
              <span className="text-sm">{d.emoji}</span>
              <span className="text-xs font-medium w-8" style={{ color: "hsl(25 25% 17%)" }}>{d.label}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "hsl(30 50% 93%)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(scores[d.key] / 10) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: scores[d.key] <= 4 ? "hsl(340 60% 68%)" : scores[d.key] <= 6 ? "hsl(45 90% 55%)" : "hsl(152 42% 49%)" }}
                />
              </div>
              <span className="text-xs font-medium w-5 text-right" style={{ color: "hsl(30 20% 44%)" }}>{scores[d.key]}</span>
            </div>
          ))}
        </div>

        {/* 7-day history */}
        {history.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-3.5 bg-white rounded-2xl border border-[hsl(30_50%_90%)] mb-4"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "hsl(16 86% 68%)" }} />
              <p className="text-xs font-medium" style={{ color: "hsl(25 25% 17%)" }}>近7天能量趋势</p>
            </div>
            <div className="flex items-end gap-1 h-16">
              {history.map((h, i) => {
                const pct = (h.total_score / 50) * 100;
                const color = h.total_score >= 40 ? "hsl(152 42% 49%)" : h.total_score >= 30 ? "hsl(45 90% 55%)" : h.total_score >= 20 ? "hsl(16 86% 68%)" : "hsl(340 60% 68%)";
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                      className="w-full rounded-t-sm min-h-[4px]"
                      style={{ background: color }}
                    />
                    <span className="text-[9px]" style={{ color: "hsl(30 15% 56%)" }}>
                      {new Date(h.log_date).getDate()}日
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Recommendations */}
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium" style={{ color: "hsl(30 20% 44%)" }}>💡 为你推荐</p>
          {recs.map((r) => (
            <motion.button
              key={r.route}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(r.route)}
              className="w-full flex items-center gap-2.5 p-3 bg-white rounded-xl border border-[hsl(30_50%_90%)] text-left min-h-[48px]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: "hsl(25 25% 17%)" }}>{r.title}</p>
                <p className="text-[10px]" style={{ color: "hsl(30 15% 56%)" }}>{r.desc}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: r.accent }} />
            </motion.button>
          ))}
        </div>

        {/* Chat & back actions */}
        <Button
          onClick={() => {
            const lowDims = dimensions.filter(d => scores[d.key] <= 4).map(d => d.label);
            const ctx = lowDims.length > 0
              ? `我今天做了能量测评，总分${total}/50（${level.label}），其中${lowDims.join("、")}比较低。请根据我的状态给出具体建议。`
              : `我今天做了能量测评，总分${total}/50（${level.label}）。请给我一些鼓励和保持好状态的建议。`;
            onOpenChat(ctx);
          }}
          className="w-full rounded-xl min-h-[44px] text-white mb-2"
          style={{ background: "hsl(16 86% 68%)" }}
        >
          💬 找教练聊聊
        </Button>
        <Button onClick={onBack} variant="ghost" className="w-full rounded-xl" style={{ color: "hsl(30 20% 44%)" }}>
          返回首页
        </Button>
      </div>
    );
  }

  // Slider input view
  return (
    <div className="min-h-screen px-4 pt-4 pb-8" style={{ background: "hsl(30 100% 97%)" }}>
      <button onClick={onBack} className="flex items-center text-sm mb-4 min-h-[44px]" style={{ color: "hsl(30 20% 44%)" }}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回
      </button>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Calendar className="w-4 h-4" style={{ color: "hsl(16 86% 68%)" }} />
          <p className="text-sm font-semibold" style={{ color: "hsl(25 25% 17%)" }}>今日能量检测</p>
        </div>
        <p className="text-xs" style={{ color: "hsl(30 20% 44%)" }}>为5个维度打分（1-10），了解当下状态</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="sliders"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 mb-6"
        >
          {dimensions.map((d) => (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium" style={{ color: "hsl(25 25% 17%)" }}>
                  {d.emoji} {d.label}
                </span>
                <span className="text-lg font-bold" style={{ color: scores[d.key] <= 3 ? "hsl(340 60% 68%)" : scores[d.key] <= 6 ? "hsl(45 90% 55%)" : "hsl(152 42% 49%)" }}>
                  {scores[d.key]}
                </span>
              </div>
              <p className="text-[11px] mb-2" style={{ color: "hsl(30 15% 56%)" }}>{d.desc}</p>
              <input
                type="range"
                min={1}
                max={10}
                value={scores[d.key]}
                onChange={(e) => setScores({ ...scores, [d.key]: parseInt(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer mama-slider"
                style={{
                  background: `linear-gradient(to right, hsl(16 86% 68%) 0%, hsl(16 86% 68%) ${((scores[d.key] - 1) / 9) * 100}%, hsl(30 50% 90%) ${((scores[d.key] - 1) / 9) * 100}%, hsl(30 50% 90%) 100%)`,
                }}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Live total */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold" style={{ color: level.color }}>{level.emoji} {total}/50</p>
        <p className="text-xs mt-0.5" style={{ color: "hsl(30 20% 44%)" }}>{level.label}</p>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full rounded-xl min-h-[48px] text-white text-sm font-medium"
        style={{ background: "hsl(16 86% 68%)" }}
      >
        记录今日能量 ✨
      </Button>
    </div>
  );
};

export default MamaAssessment;
