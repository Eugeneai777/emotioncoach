import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useMamaDailyQuote } from "@/hooks/useMamaDailyQuote";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface MamaDailyEnergyProps {
  onGratitudeSubmit: (text: string) => void;
  lastChat?: { summary: string; time: number } | null;
  onContinueChat?: (context: string) => void;
}

const GRATITUDE_COUNT_KEY = "mama_gratitude_count";

const MamaDailyEnergy = ({ onGratitudeSubmit, lastChat, onContinueChat }: MamaDailyEnergyProps) => {
  const [gratitudeText, setGratitudeText] = useState("");
  const [gratitudeCount, setGratitudeCount] = useState(0);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const { quote, loading, styleLabels } = useMamaDailyQuote();
  const { user } = useAuth();

  useEffect(() => {
    setGratitudeCount(parseInt(localStorage.getItem(GRATITUDE_COUNT_KEY) || "0", 10));
  }, []);

  const handleSubmit = async () => {
    if (!gratitudeText.trim()) return;
    const newCount = gratitudeCount + 1;
    setGratitudeCount(newCount);
    localStorage.setItem(GRATITUDE_COUNT_KEY, String(newCount));

    // Save to gratitude_entries if logged in
    if (user) {
      try {
        const { error } = await supabase
          .from("gratitude_entries")
          .insert({
            user_id: user.id,
            content: gratitudeText.trim(),
            category: "other",
            themes: [],
            date: new Date().toISOString().split("T")[0],
          });
        if (!error) {
          toast({ title: "已同步到感恩日记 📔" });
        }
      } catch (e) {
        console.warn("Failed to save gratitude entry:", e);
      }
    }

    confetti({
      particleCount: 60,
      spread: 55,
      origin: { y: 0.7 },
      colors: ["#F4845F", "#F8B4B4", "#FFE8D6", "#A7D7C5"],
    });

    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2000);

    onGratitudeSubmit(gratitudeText.trim());
    setGratitudeText("");
  };

  const styleInfo = quote?.style ? styleLabels[quote.style] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.35 }}
      className="mx-4 p-3.5 bg-white rounded-2xl shadow-[0_2px_8px_hsl(30_30%_70%/0.1)] border border-[hsl(30_50%_90%)]"
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: "hsl(25 25% 17%)" }}>💌 今天，想对你说</p>
        {styleInfo && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "hsl(30 100% 95%)", color: "hsl(16 86% 55%)" }}
          >
            {styleInfo.emoji} {styleInfo.label}
          </span>
        )}
      </div>

      <div className="rounded-xl p-2.5 mb-2.5" style={{ background: "hsl(30 100% 97%)" }}>
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-full bg-[hsl(30_50%_92%)]" />
            <Skeleton className="h-3.5 w-3/4 bg-[hsl(30_50%_92%)]" />
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-[13px] leading-relaxed italic"
            style={{ color: "hsl(30 30% 28%)" }}
          >
            "{quote?.message}"
          </motion.p>
        )}
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px]" style={{ color: "hsl(30 20% 44%)" }}>📝 记录一个让你微笑的瞬间</p>
        {gratitudeCount > 0 && (
          <span className="text-[10px]" style={{ color: "hsl(30 15% 56%)" }}>已记录 {gratitudeCount} 条 💛</span>
        )}
      </div>
      <Textarea
        value={gratitudeText}
        onChange={(e) => setGratitudeText(e.target.value)}
        placeholder="也许是孩子突然说了句暖心话..."
        className="border-[hsl(30_50%_90%)] bg-[hsl(30_100%_99%)] min-h-[44px] max-h-[80px] rounded-xl resize-none text-sm"
        style={{ color: "hsl(25 25% 17%)" }}
        rows={2}
      />
      {gratitudeText.trim() && (
        <Button
          onClick={handleSubmit}
          className="mt-2 w-full rounded-xl min-h-[44px] text-white"
          style={{ background: "hsl(16 86% 68%)", color: "white" }}
        >
          {justSubmitted ? "已记录 ✓" : "记下这份温暖 ✨"}
        </Button>
      )}
    </motion.div>
  );
};

export default MamaDailyEnergy;
