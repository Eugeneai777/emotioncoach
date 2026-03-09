import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/PageHeader";

import MamaEmotionCheck from "@/components/mama/MamaEmotionCheck";
import MamaDailyEnergy from "@/components/mama/MamaDailyEnergy";
import MamaAssessmentEntry from "@/components/mama/MamaAssessmentEntry";
import MamaCampEntry from "@/components/mama/MamaCampEntry";
import MamaAIChat from "@/components/mama/MamaAIChat";
import MamaAssessment from "@/components/mama/MamaAssessment";
import MamaBottomInput from "@/components/mama/MamaBottomInput";

const LAST_CHAT_KEY = "mama_last_chat";

/** Time-based greeting */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 6) return { text: "夜深了，辛苦了", emoji: "🌙" };
  if (h < 11) return { text: "早上好", emoji: "☀️" };
  if (h < 14) return { text: "中午好", emoji: "🌤" };
  if (h < 18) return { text: "下午好", emoji: "🍵" };
  return { text: "晚上好", emoji: "🌙" };
};

const MamaAssistant = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [initialInput, setInitialInput] = useState<string | undefined>();
  const [showAssessment, setShowAssessment] = useState(false);
  const [lastChat, setLastChat] = useState<{ summary: string; time: number } | null>(null);

  const greeting = getGreeting();

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
    setInitialInput(undefined);
    setChatOpen(true);
  };

  const handleBottomSendText = (text: string) => {
    setInitialInput(text);
    setChatContext(undefined);
    setChatOpen(true);
  };

  const handleBottomFocus = () => {
    setInitialInput(undefined);
    setChatContext(undefined);
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
        background: "hsl(var(--mama-bg))",
        paddingBottom: "max(5rem, calc(3.5rem + env(safe-area-inset-bottom)))",
      }}
    >
      <PageHeader title="宝妈AI助手" />


      {/* Section: 今日关怀 */}
      <div className="px-4 mt-4 space-y-3">
        <MamaEmotionCheck />
        <MamaDailyEnergy
          onGratitudeSubmit={(text) =>
            openChat(`我今天记录了一件感恩的小事：${text}。请给我一个温暖的回应。`)
          }
        />
      </div>

      {/* Section: 成长工具箱 */}
      <div className="px-4 mt-5 space-y-3">
        <MamaAssessmentEntry onStartFunAssessment={() => setShowAssessment(true)} />
        <MamaCampEntry />
      </div>

      {/* Fixed bottom input bar */}
      <MamaBottomInput
        onSendText={handleBottomSendText}
        onFocusInput={handleBottomFocus}
        lastChat={lastChat}
        onContinueChat={(ctx) => openChat(ctx)}
      />

      <MamaAIChat
        open={chatOpen}
        onOpenChange={(v) => {
          setChatOpen(v);
          if (!v) {
            setChatContext(undefined);
            setInitialInput(undefined);
          }
        }}
        initialContext={chatContext}
        initialInput={initialInput}
      />
    </div>
  );
};

export default MamaAssistant;
