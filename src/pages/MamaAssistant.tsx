import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import MamaHero from "@/components/mama/MamaHero";
import MamaEmotionCheck from "@/components/mama/MamaEmotionCheck";
import MamaDailyEnergy from "@/components/mama/MamaDailyEnergy";
import MamaAssessmentEntry from "@/components/mama/MamaAssessmentEntry";
import MamaCampEntry from "@/components/mama/MamaCampEntry";
import MamaAIChat from "@/components/mama/MamaAIChat";
import MamaAssessment from "@/components/mama/MamaAssessment";

const LAST_CHAT_KEY = "mama_last_chat";

const MamaAssistant = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [showAssessment, setShowAssessment] = useState(false);
  const [lastChat, setLastChat] = useState<{ summary: string; time: number } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_CHAT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.time < 24 * 60 * 60 * 1000) {
          setLastChat(parsed);
        }
      }
    } catch {}
  }, []);

  const openChat = (context?: string) => {
    setChatContext(context);
    setChatOpen(true);
  };

  if (showAssessment) {
    return (
      <MamaAssessment
        onBack={() => setShowAssessment(false)}
        onOpenChat={(ctx) => {
          setShowAssessment(false);
          openChat(ctx);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] pb-24" style={{ paddingBottom: "max(6rem, calc(4rem + env(safe-area-inset-bottom)))" }}>
      <MamaHero />

      {lastChat && (
        <button
          onClick={() => openChat(`我想继续聊上次的话题：${lastChat.summary}`)}
          className="mx-3 mt-2 w-[calc(100%-1.5rem)] p-2.5 bg-white/80 backdrop-blur rounded-xl border border-[#F5E6D3] text-left text-xs text-[#8B7355] active:bg-white transition-all min-h-[44px] flex items-center"
        >
          <span className="truncate flex-1">💬 上次聊过：{lastChat.summary}...</span>
          <span className="text-[#F4845F] shrink-0 ml-2">继续 →</span>
        </button>
      )}

      <div className="space-y-3 mt-3">
        <MamaEmotionCheck />
        <MamaDailyEnergy
          onGratitudeSubmit={(text) =>
            openChat(`我今天记录了一件感恩的小事：${text}。请给我一个温暖的回应。`)
          }
        />
        <MamaAssessmentEntry onStartFunAssessment={() => setShowAssessment(true)} />
        <MamaCampEntry />
      </div>

      {/* Floating coach button — sole AI chat entry */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => openChat()}
        className="fixed right-4 bottom-6 z-40 flex items-center gap-2 px-5 py-3.5 bg-[#F4845F] text-white rounded-full shadow-lg shadow-[#F4845F]/30 active:bg-[#E5734E] transition-colors min-h-[52px]"
        style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">找教练聊聊</span>
      </motion.button>

      <MamaAIChat
        open={chatOpen}
        onOpenChange={(v) => {
          setChatOpen(v);
          if (!v) setChatContext(undefined);
        }}
        initialContext={chatContext}
      />
    </div>
  );
};

export default MamaAssistant;
