import { useState } from "react";
import MamaHero from "@/components/mama/MamaHero";
import MamaTiredEntry from "@/components/mama/MamaTiredEntry";
import MamaEmotionCheck from "@/components/mama/MamaEmotionCheck";
import MamaDailyEnergy from "@/components/mama/MamaDailyEnergy";
import MamaToolGrid from "@/components/mama/MamaToolGrid";
import MamaAssessmentEntry from "@/components/mama/MamaAssessmentEntry";
import MamaAIChat from "@/components/mama/MamaAIChat";
import MamaAssessment from "@/components/mama/MamaAssessment";

const MamaAssistant = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<string | undefined>();
  const [showAssessment, setShowAssessment] = useState(false);

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
    <div className="min-h-screen bg-[#FFF8F0] pb-10">
      <MamaHero onConcernClick={openChat} />

      <div className="space-y-5">
        <MamaTiredEntry onReasonClick={openChat} />
        <MamaEmotionCheck onEmotionClick={openChat} />
        <MamaDailyEnergy
          onGratitudeSubmit={(text) =>
            openChat(`我今天记录了一件感恩的小事：${text}。请给我一个温暖的回应。`)
          }
        />
        <MamaToolGrid onToolClick={openChat} />
        <MamaAssessmentEntry onStart={() => setShowAssessment(true)} />
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
