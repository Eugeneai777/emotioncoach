import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { uploadElderMoodLog } from "@/utils/elderMoodUpload";
import { useDajinQuota } from "@/hooks/useDajinQuota";
import { PurchaseOnboardingDialog } from "@/components/onboarding/PurchaseOnboardingDialog";

const MOODS = [
  { emoji: "😊", label: "开心", value: "happy", color: "hsl(45 80% 92%)" },
  { emoji: "😌", label: "平静", value: "calm", color: "hsl(150 40% 92%)" },
  { emoji: "😐", label: "一般", value: "neutral", color: "hsl(210 30% 93%)" },
  { emoji: "😔", label: "低落", value: "sad", color: "hsl(220 30% 92%)" },
  { emoji: "😟", label: "担心", value: "worried", color: "hsl(30 50% 92%)" },
  { emoji: "😴", label: "疲惫", value: "tired", color: "hsl(270 30% 93%)" },
];

interface MoodRecord {
  id: string;
  mood: string;
  note: string | null;
  recorded_date: string;
}

const ElderMoodPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [todayRecord, setTodayRecord] = useState<MoodRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<MoodRecord[]>([]);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { remaining, deduct, refresh } = useDajinQuota();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data: todayData } = await supabase
      .from("elder_mood_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("recorded_date", today)
      .maybeSingle();
    if (todayData) {
      setTodayRecord(todayData);
      setSelected(todayData.mood);
    }
    const { data: recent } = await supabase
      .from("elder_mood_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_date", { ascending: false })
      .limit(7);
    if (recent) setRecentRecords(recent);
  };

  const saveMood = async () => {
    if (!selected) return;

    // Deduct quota for mood record
    if (!deduct(1)) {
      setShowUpgrade(true);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "请先登录", variant: "destructive" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);

    if (todayRecord) {
      await supabase.from("elder_mood_records").update({
        mood: selected,
        note: note.trim() || null,
      }).eq("id", todayRecord.id);
    } else {
      await supabase.from("elder_mood_records").insert({
        user_id: user.id,
        mood: selected,
        note: note.trim() || null,
        recorded_date: today,
      });
    }

    setSaved(true);
    toast({ title: "心情已记录 💛" });

    // Upload mood log for child reference tracking
    const moodInfo = MOODS.find(m => m.value === selected);
    uploadElderMoodLog({
      moodLabel: moodInfo?.label || selected,
      intensity: 3,
      featureUsed: "mood_record",
    });

    setTimeout(() => {
      setSaved(false);
      loadRecords();
    }, 2000);
  };

  const moodInfo = (value: string) => MOODS.find((m) => m.value === value);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(30 60% 98%)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/elder-care")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold" style={{ color: "hsl(25 40% 30%)" }}>😊 今天感觉怎么样</h1>
      </div>

      <div className="px-5 py-4 max-w-md mx-auto space-y-6">
        {saved ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-12"
          >
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "hsl(150 40% 90%)" }}
            >
              <Check className="w-8 h-8" style={{ color: "hsl(150 50% 40%)" }} />
            </div>
            <p className="text-xl font-bold" style={{ color: "hsl(25 40% 30%)" }}>记录成功 💛</p>
            <p className="text-base mt-1" style={{ color: "hsl(25 30% 50%)" }}>今天也辛苦了</p>
          </motion.div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-xl font-bold mb-1" style={{ color: "hsl(25 40% 30%)" }}>
                今天感觉怎么样？
              </p>
              <p className="text-base" style={{ color: "hsl(25 30% 50%)" }}>选一个最接近的心情</p>
            </div>

            {/* Mood grid */}
            <div className="grid grid-cols-3 gap-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelected(m.value)}
                  className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all"
                  style={{
                    backgroundColor: selected === m.value ? "hsl(25 75% 55%)" : m.color,
                    transform: selected === m.value ? "scale(1.05)" : "scale(1)",
                    boxShadow: selected === m.value ? "0 4px 12px rgba(0,0,0,0.15)" : "none",
                  }}
                >
                  <span className="text-4xl">{m.emoji}</span>
                  <span
                    className="text-base font-medium"
                    style={{ color: selected === m.value ? "white" : "hsl(25 35% 30%)" }}
                  >
                    {m.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Note */}
            {selected && (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="想说点什么吗？（可以不写）"
                  className="w-full rounded-2xl px-4 py-3 text-base border-none outline-none resize-none"
                  style={{ backgroundColor: "hsl(30 40% 95%)", minHeight: 80, color: "hsl(25 35% 25%)" }}
                  maxLength={200}
                />
              </div>
            )}

            <Button
              onClick={saveMood}
              disabled={!selected}
              className="w-full text-lg font-semibold rounded-2xl"
              style={{
                backgroundColor: selected ? "hsl(25 75% 55%)" : "hsl(25 30% 80%)",
                color: "white",
                minHeight: 56,
              }}
            >
              记录今天的心情
            </Button>
          </>
        )}

        {/* Recent records */}
        {recentRecords.length > 0 && !saved && (
          <div>
            <h3 className="text-base font-bold mb-3" style={{ color: "hsl(25 40% 30%)" }}>
              最近记录
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {recentRecords.map((r) => {
                const info = moodInfo(r.mood);
                return (
                  <div
                    key={r.id}
                    className="flex-shrink-0 rounded-xl p-3 text-center min-w-[72px]"
                    style={{ backgroundColor: info?.color || "hsl(30 40% 95%)" }}
                  >
                    <span className="text-2xl block">{info?.emoji || "😐"}</span>
                    <span className="text-xs block mt-1" style={{ color: "hsl(25 30% 45%)" }}>
                      {r.recorded_date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElderMoodPage;
