import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
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
    <div
      className="min-h-screen"
      style={{
        background: "hsl(30 100% 97%)",
        paddingBottom: "max(5rem, calc(3.5rem + env(safe-area-inset-bottom)))",
      }}
    >
      <PageHeader title="宝妈AI助手" />
      <MamaHero />

      <div className="space-y-3 mt-3">
        <MamaEmotionCheck />
        <MamaDailyEnergy
          lastChat={lastChat}
          onContinueChat={(ctx) => openChat(ctx)}
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
        transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 18 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => openChat()}
        className="fixed right-4 z-40 flex items-center gap-2 px-5 py-3 text-white rounded-full min-h-[48px] active:opacity-90 transition-opacity"
        style={{
          bottom: "max(1.5rem, env(safe-area-inset-bottom))",
          background: "linear-gradient(135deg, hsl(16 86% 68%) 0%, hsl(16 86% 58%) 100%)",
          boxShadow: "0 4px 16px hsl(16 86% 68% / 0.35), 0 2px 4px hsl(16 86% 68% / 0.2)",
        }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm font-medium">想找人说说话</span>
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
