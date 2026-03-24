import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Flame, Check, Sparkles, Trash2, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";
import confetti from "canvas-confetti";

interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  target_days_per_week: number;
  is_active: boolean;
  display_order: number;
}

interface Checkin {
  id: string;
  habit_id: string;
  checkin_date: string;
  ai_encouragement: string | null;
}

const defaultEmojis = ["✅", "💪", "📚", "🏃", "🧘", "💧", "🍎", "😴", "✍️", "🎯"];

export default function YoujinLifeHabits() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formEmoji, setFormEmoji] = useState("✅");
  const [submitting, setSubmitting] = useState(false);
  const [encouragement, setEncouragement] = useState<{ text: string; habitId: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  // Last 7 days for the week view
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: format(d, "yyyy-MM-dd"), dayLabel: format(d, "EEE", { locale: zhCN }), dayNum: format(d, "d") };
    });
  }, []);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);
    await Promise.all([fetchHabits(user.id), fetchCheckins(user.id)]);
    setLoading(false);
  };

  const fetchHabits = async (userId: string) => {
    const { data } = await supabase
      .from("daily_habits")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("display_order");
    setHabits((data as Habit[]) || []);
  };

  const fetchCheckins = async (userId: string) => {
    const weekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");
    const { data } = await supabase
      .from("daily_habit_checkins")
      .select("*")
      .eq("user_id", userId)
      .gte("checkin_date", weekStart);
    setCheckins((data as Checkin[]) || []);
  };

  const addHabit = async () => {
    if (!formTitle.trim() || !currentUserId) return;
    setSubmitting(true);
    const { error } = await supabase.from("daily_habits").insert({
      user_id: currentUserId,
      title: formTitle.trim(),
      emoji: formEmoji,
      display_order: habits.length,
    });
    if (error) { toast.error("添加失败"); setSubmitting(false); return; }
    toast.success("习惯已添加！");
    setShowForm(false);
    setFormTitle("");
    setFormEmoji("✅");
    setSubmitting(false);
    await fetchHabits(currentUserId);
  };

  const deleteHabit = async (id: string) => {
    if (!currentUserId) return;
    await supabase.from("daily_habits").update({ is_active: false }).eq("id", id);
    toast.success("已删除");
    await fetchHabits(currentUserId);
  };

  const isCheckedIn = (habitId: string, date: string) => {
    return checkins.some(c => c.habit_id === habitId && c.checkin_date === date);
  };

  const getStreak = (habitId: string) => {
    let streak = 0;
    let d = new Date();
    while (true) {
      const dateStr = format(d, "yyyy-MM-dd");
      if (checkins.some(c => c.habit_id === habitId && c.checkin_date === dateStr)) {
        streak++;
        d = subDays(d, 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const handleCheckin = async (habit: Habit) => {
    if (!currentUserId) return;
    if (isCheckedIn(habit.id, today)) {
      // Undo checkin
      const checkin = checkins.find(c => c.habit_id === habit.id && c.checkin_date === today);
      if (checkin) {
        await supabase.from("daily_habit_checkins").delete().eq("id", checkin.id);
        await fetchCheckins(currentUserId);
      }
      return;
    }

    // Do checkin
    const { data, error } = await supabase.from("daily_habit_checkins").insert({
      habit_id: habit.id,
      user_id: currentUserId,
      checkin_date: today,
    }).select().single();

    if (error) {
      if (error.code === "23505") toast.info("今天已经打卡了");
      else toast.error("打卡失败");
      return;
    }

    await fetchCheckins(currentUserId);

    // Confetti effect
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ["#10b981", "#f59e0b", "#3b82f6"] });

    // Get AI encouragement
    try {
      const streak = getStreak(habit.id) + 1;
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/habit-encouragement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            habit_title: habit.title,
            streak,
            checkin_id: data?.id,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        if (result.encouragement) {
          setEncouragement({ text: result.encouragement, habitId: habit.id });
          // Update checkin with AI encouragement
          if (data?.id) {
            await supabase.from("daily_habit_checkins")
              .update({ ai_encouragement: result.encouragement })
              .eq("id", data.id);
          }
          setTimeout(() => setEncouragement(null), 4000);
        }
      }
    } catch (e) {
      console.error("AI encouragement error:", e);
    }
  };

  const todayProgress = habits.length > 0
    ? Math.round((habits.filter(h => isCheckedIn(h.id, today)).length / habits.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/youjin-life")} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1">🎯 习惯打卡</h1>
          <button
            onClick={() => currentUserId ? setShowForm(true) : toast.error("请先登录")}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-foreground text-background font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            新习惯
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Today progress */}
        <div className="px-4 pt-4 pb-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100/50 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">今日完成</p>
                <p className="text-2xl font-bold text-foreground">
                  {habits.filter(h => isCheckedIn(h.id, today)).length}/{habits.length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Flame className={`w-7 h-7 ${todayProgress === 100 ? "text-orange-500" : "text-amber-400"}`} />
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${todayProgress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
              />
            </div>
            {todayProgress === 100 && habits.length > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> 今日全部完成！太棒了！
              </p>
            )}
          </motion.div>
        </div>

        {/* Week calendar */}
        <div className="px-4 mb-4">
          <div className="flex justify-between">
            {weekDays.map(d => (
              <div key={d.date} className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{d.dayLabel}</span>
                <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                  d.date === today ? "bg-foreground text-background" : "text-foreground"
                }`}>
                  {d.dayNum}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Habits list */}
        <div className="px-4 pb-8 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">加载中...</div>
          ) : habits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-sm text-muted-foreground">还没有习惯，添加第一个吧</p>
              <button
                onClick={() => currentUserId ? setShowForm(true) : toast.error("请先登录")}
                className="mt-3 text-xs text-foreground font-medium underline"
              >
                添加习惯
              </button>
            </div>
          ) : (
            habits.map((habit, i) => {
              const checked = isCheckedIn(habit.id, today);
              const streak = getStreak(habit.id);
              return (
                <motion.div
                  key={habit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden"
                >
                  <div className="p-3.5 flex items-center gap-3">
                    {/* Checkin button */}
                    <button
                      onClick={() => handleCheckin(habit)}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
                        checked
                          ? "bg-green-100 ring-2 ring-green-300 scale-105"
                          : "bg-muted/50 active:scale-95"
                      }`}
                    >
                      {checked ? <Check className="w-5 h-5 text-green-600" /> : <span>{habit.emoji}</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {habit.title}
                      </p>
                      {streak > 0 && (
                        <p className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5 mt-0.5">
                          <Flame className="w-3 h-3" /> 连续 {streak} 天
                        </p>
                      )}
                    </div>

                    {/* Week dots */}
                    <div className="flex gap-1 shrink-0">
                      {weekDays.map(d => (
                        <div
                          key={d.date}
                          className={`w-2 h-2 rounded-full ${
                            isCheckedIn(habit.id, d.date) ? "bg-green-400" : "bg-muted/50"
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="p-1 text-muted-foreground/30 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* AI encouragement */}
                  <AnimatePresence>
                    {encouragement?.habitId === habit.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 pb-3 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700 leading-relaxed">{encouragement.text}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ===== Add Habit Form ===== */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-background w-full max-w-lg rounded-t-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">添加新习惯</h2>
                <button onClick={() => setShowForm(false)} className="p-1">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Emoji picker */}
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">选择图标</p>
                <div className="flex gap-2 flex-wrap">
                  {defaultEmojis.map(e => (
                    <button
                      key={e}
                      onClick={() => setFormEmoji(e)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all ${
                        formEmoji === e ? "bg-foreground/10 ring-2 ring-foreground/20 scale-110" : "bg-muted/50"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="习惯名称，如：早起、阅读30分钟"
                className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/50 mb-4"
                maxLength={30}
              />

              <button
                onClick={addHabit}
                disabled={submitting || !formTitle.trim()}
                className="w-full py-3 rounded-2xl bg-foreground text-background text-sm font-bold disabled:opacity-50 active:opacity-80 transition-opacity"
              >
                {submitting ? "添加中..." : "添加习惯"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
