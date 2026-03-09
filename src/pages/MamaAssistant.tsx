import { useState, useEffect } from "react";
import MamaHero from "@/components/mama/MamaHero";
import MamaTiredEntry from "@/components/mama/MamaTiredEntry";
import MamaEmotionCheck from "@/components/mama/MamaEmotionCheck";
import MamaDailyEnergy from "@/components/mama/MamaDailyEnergy";
import MamaToolGrid from "@/components/mama/MamaToolGrid";
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

  const openChat = (context: string) => {
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
    <div className="min-h-screen bg-[#FFF8F0]" style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}>
      <MamaHero onConcernClick={openChat} />

      {lastChat && (
        <button
          onClick={() => openChat(`我想继续聊上次的话题：${lastChat.summary}`)}
          className="mx-4 mb-3 w-[calc(100%-2rem)] p-3 bg-white/80 backdrop-blur rounded-xl border border-[#F5E6D3] text-left text-sm text-[#8B7355] hover:bg-white transition-all"
        >
          💬 上次聊过：{lastChat.summary}...  <span className="text-[#F4845F]">继续 →</span>
        </button>
      )}

      <div className="space-y-5">
        <MamaTiredEntry onReasonClick={openChat} />
        <MamaEmotionCheck onEmotionClick={openChat} />
        <MamaDailyEnergy
          onGratitudeSubmit={(text) =>
            openChat(`我今天记录了一件感恩的小事：${text}。请给我一个温暖的回应。`)
          }
        />
        <MamaAssessmentEntry onStart={() => setShowAssessment(true)} />
        <MamaToolGrid onToolClick={openChat} />
        <MamaCampEntry />
      </div>

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
